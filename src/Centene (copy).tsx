import React, { useEffect, useState } from 'react'
import "./App.css";
import { Mic, MessageCircle } from 'lucide-react'
import { RetellWebClient } from "retell-client-js-sdk"
import { addDays, format } from 'date-fns';

interface RegisterCallResponse {
    access_token?: string
    callId?: string
    sampleRate: number
}

interface UserDetails {
    name: string;
    dob: string;
    email: string;
    address: string; // added address
    medicalCode: string; // added medicalCode as non-editable
}


const webClient = new RetellWebClient()

const notes = [
    "The platform is not integrated into the company systems, therefore asking for specific details for authentication and verification",
    <span>Please enter the name that the Virtual Assistant want to address you as.</span>,
    "Upon authentication request by Virtual Assistant please mention confirmation code # and full name as shown on the top right side of the bar for reference upon this form submission.",
    "Phone# and Email id is required to send instant messages and confirmation"
]

export default function Centene() {
    const [showVerificationForm, setShowVerificationForm] = useState(true)
    const [userDetails, setUserDetails] = useState<UserDetails>({
        name: '',
        dob: '',
        email: '',
        address: '', // hardcoded address
        medicalCode: '' // hardcoded medicalCode
    });


    const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
    const [callInProgress, setCallInProgress] = useState(false)

    useEffect(() => {
        webClient.on("conversationStarted", () => {
            console.log("Conversation started successfully")
            setCallStatus("active")
            setCallInProgress(false)
        })

        webClient.on("conversationEnded", ({ code, reason }) => {
            console.log("Conversation ended with code:", code, "reason:", reason)
            setCallStatus("inactive")
            setCallInProgress(false)
        })

        webClient.on("error", (error) => {
            console.error("An error occurred:", error)
            setCallStatus("inactive")
            setCallInProgress(false)
        })

        webClient.on("update", (update) => {
            console.log("Update received", update)
        })

        // Add chatbot script
        const addChatbotScript = () => {
            const script = document.createElement('script')
            const projectId = "67900940c6f7a86d23b3de98";
            script.type = 'text/javascript'
            script.innerHTML = `
        (function(d, t) {
          var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
          v.onload = function() {
            window.voiceflow.chat.load({
              verify: { projectID: '${projectId}' },
              url: 'https://general-runtime.voiceflow.com',
              versionID: 'production',
              launch: {
                event: {
                  type: "launch",
                  payload: {
                    customer_name: "${userDetails.name}",
                    email: "${userDetails.email}",
                    confirmation_code: "${userDetails.medicalCode}",                    
                  }
                }
              },
            });
          }
          v.src = "https://cdn.voiceflow.com/widget/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
        })(document, 'script');
      `
            document.body.appendChild(script)
            return script;
        }

        const chatbotScript = addChatbotScript();

        return () => {
            webClient.off("conversationStarted")
            webClient.off("conversationEnded")
            webClient.off("error")
            webClient.off("update")
            if (chatbotScript && chatbotScript.parentNode) {
                chatbotScript.parentNode.removeChild(chatbotScript)
            }
        }
    }, [userDetails])

    const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newUserDetails = {
            name: formData.get('name') as string,
            dob: formData.get('dob') as string,
            email: formData.get('email') as string,
            address: formData.get('address') as string,
            medicalCode: formData.get('confirmationCode') as string,
        };
        setUserDetails(newUserDetails);
        setShowVerificationForm(false);

        // Reload the chatbot script with new user details
        const existingScript = document.querySelector('script[src="https://cdn.voiceflow.com/widget/bundle.mjs"]');
        if (existingScript && existingScript.parentNode) {
            existingScript.parentNode.removeChild(existingScript);
        }
        const addChatbotScript = () => {
            const script = document.createElement('script');
            const projectId = "67900940c6f7a86d23b3de98";
            script.type = 'text/javascript';
            script.innerHTML = `
            (function(d, t) {
              var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
              v.onload = function() {
                window.voiceflow.chat.load({
                  verify: { projectID: '${projectId}' },
                  url: 'https://general-runtime.voiceflow.com',
                  versionID: 'production',
                  launch: {
                    event: {
                      type: "launch",
                      payload: {
                        customer_name: "${newUserDetails.name}",
                        email: "${newUserDetails.email}",
                        confirmation_code: "${newUserDetails.medicalCode}",
                        address: "${newUserDetails.address}",
                        medical_code: "${newUserDetails.medicalCode}"
                      }
                    }
                  },
                });
              }
              v.src = "https://cdn.voiceflow.com/widget/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
            })(document, 'script');
          `;
            document.body.appendChild(script);
        };
        addChatbotScript();
    };


    const toggleConversation = async () => {
        if (callInProgress) return

        setCallInProgress(true)

        if (callStatus === "active") {
            try {
                await webClient.stopCall()
                setCallStatus("inactive")
            } catch (error) {
                console.error("Error stopping the call:", error)
            } finally {
                setCallInProgress(false)
            }
        } else {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true })
                await initiateConversation()
            } catch (error) {
                console.error("Microphone permission denied or error occurred:", error)
            } finally {
                setCallInProgress(false)
            }
        }
    }

    const initiateConversation = async () => {
        const agentId = "agent_3ad7f48e10b9c6a45ffaf0cfac";  // Single agent ID
        try {
            const registerCallResponse = await registerCall(agentId)
            if (registerCallResponse.callId) {
                await webClient.startCall({
                    accessToken: registerCallResponse.access_token,
                    callId: registerCallResponse.callId,
                    sampleRate: registerCallResponse.sampleRate,
                    enableUpdate: true,
                })
                setCallStatus("active")
            }
        } catch (error) {
            console.error("Error in registering or starting the call:", error)
        }
    }


    async function registerCall(agentId: string): Promise<RegisterCallResponse> {
        console.log("Registering call for agent:", agentId)

        const apiKey = "53b76c26-bd21-4509-98d7-c5cc62f93b59"
        const sampleRate = parseInt(process.env.REACT_APP_RETELL_SAMPLE_RATE || "16000", 10)
        const policy_date = format(addDays(new Date(), 15), 'dd MMM yyyy');

        try {
            const formattedConfirmationCode = userDetails.medicalCode.split('').join(' - ');
            const response = await fetch("https://api.retellai.com/v2/create-web-call", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    agent_id: agentId,
                    retell_llm_dynamic_variables: {
                        member_name: userDetails.name,
                        email: userDetails.email,
                        confirmation_code: formattedConfirmationCode,
                        address: userDetails.address,
                        DOB: userDetails.dob,
                        policy_date: policy_date
                    },
                }),
            })

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`)
            }

            const data = await response.json()
            console.log("Call registered successfully:", data)

            return {
                access_token: data.access_token,
                callId: data.call_id,
                sampleRate: sampleRate,
            }
        } catch (err) {
            console.error("Error registering call:", err)
            throw err
        }
    }





    return (
        <div className="min-h-screen bg-white relative">
            <style>
                {`
          @media (max-width: 640px) {
            .decorative-triangle {
              display: none;
            }
          }
        `}
            </style>

            {showVerificationForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e81b0] rounded-[40px] p-4 sm:p-6 w-full max-w-xl mx-auto border-2 border-black shadow-lg overflow-y-auto max-h-[90vh] sm:max-h-none">
                        <h2 className="text-base sm:text-xl font-medium text-white mb-4 sm:mb-6">
                            Customer details required for verification and authentication
                        </h2>
                        <form onSubmit={handleSubmitDetails} className="space-y-4">
                            <div className="grid gap-4 max-w-lg mx-auto">
                                <div className="grid gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <label htmlFor="name" className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
                                            Member Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                                            defaultValue="John Smith"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <label htmlFor="dob" className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
                                            Choose DOB
                                        </label>
                                        <input
                                            type="date"
                                            id="dob"
                                            name="dob"
                                            required
                                            className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                                            defaultValue="1990-12-12"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <label htmlFor="address" className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            id="address"
                                            name="address"
                                            required
                                            className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                                            defaultValue="1234, Plainview, 79072 " // hardcoded
                                            readOnly

                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <label htmlFor="email" className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
                                            Email id
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                                            defaultValue="Kevingrant@gmail.com"

                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <label htmlFor="confirmationCode" className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
                                            Medical Code#
                                        </label>
                                        <input
                                            type="text"
                                            id="confirmationCode"
                                            name="confirmationCode"
                                            defaultValue="C1234567890" // hardcoded
                                            readOnly
                                            className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-center mt-6">
                                <button
                                    type="submit"
                                    className="px-10 py-1.5 bg-black  text-[#1e81b0] text-base rounded-full hover:bg-gray-800 transition-colors font-bold"
                                >
                                    Submit
                                </button>
                            </div>
                            <div className="mt-4 bg-white p-3 rounded-lg">
                                <p className="font-medium text-[#8B0000] mb-1">Note</p> {/* Dark Red for Note */}
                                <ul className="space-y-1 text-black text-sm">
                                    {notes.map((note, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-black">➤</span>
                                            {index === 1 ? (
                                                <span>
                                                    <span className="text-red-500">*</span>
                                                    {note}
                                                </span>
                                            ) : (
                                                <span>{note}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </form>
                    </div>
                </div>
            )}





            <nav className="bg-[#2E5388]">
                <div className="flex items-center justify-between px-20 py-2 mr-16" style={{ zIndex: 12 }}>
                    {/* Logo */}
                    <img
                        src="/centene_logo.png"
                        alt="Spirit"
                        className="h-12 bg-transparent ml-0"
                    />

                    {/* Right-side links */}
                    <div className="flex items-center gap-8 text-white text-lg font-bold">
                        <span className="cursor-pointer">Who are we</span>
                        <span className="cursor-pointer">Why we are different</span>
                        <span className="cursor-pointer">Products and Services</span>
                        <span className="cursor-pointer">Careers</span>
                        <span className="cursor-pointer">Investors</span>
                        <span className="cursor-pointer">News</span>
                    </div>
                </div>
            </nav>


            <div className="relative w-full ">
                {/* Full-width Image */}
                <img
                    src="/centene-hero2.png"
                    alt="Centene Hero"
                    className="w-full object-cover rounded-lg shadow-md"
                />

                {/* Wrapper div to stack the elements one below the other */}
                <div className="absolute bottom-1 left-0 w-full flex flex-col items-center justify-center p-3">

                    {/* Wrapper to align heading and text container */}
                    <div className="w-full md:w-4/5 flex flex-col">

                        {/* "Who we are" heading aligned to the left */}
                        <div className="text-white text-5xl md:text-5xl font-extrabold">
                            <span>Who we are</span>
                        </div>

                        {/* Full-width Text Container with white transparent background, padding, margin, and width set to 60% */}
                        <div className="bg-white bg-opacity-70 text-black p-4 rounded-3xl shadow-md mt-4">
                            <p className="text-lg md:text-2xl font-bold text-black" style={{ display: 'inline-block', width: '100%', wordSpacing: '0.2rem' }}>
                                Centene is committed to helping people live healthier lives. We provide access to high-quality 
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-black" style={{ display: 'inline-block', width: '100%', wordSpacing: '0.3rem' }}>
                                healthcare, innovative programs and health solutions that help families and individuals
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-black" style={{ display: 'inline-block', width: '100%', wordSpacing: '0.1rem' }}>
                                 get well, stay well and be well.
                            </p>
                        </div>

                    </div>
                </div>

            </div>





            <div className="flex justify-between gap-12 mt-0.5">
                <div className="w-full md:w-1/3 bg-white pt-8 pl-8 pr-8 pb-8 rounded-lg">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 text-sm border border-gray-300">
                            <div className="font-semibold bg-[#2E5388] text-white p-2 border-r border-b border-gray-300">Medical ID #</div>
                            <div className="bg-[#2E5388] text-white p-2 border-b border-gray-300">{userDetails.medicalCode}</div>

                            <div className="font-semibold p-2 border-r border-b border-gray-300">Member Name</div>
                            <div className="p-2 border-b border-gray-300">{userDetails.name}</div>

                            <div className="font-semibold p-2 border-r border-b border-gray-300">Email ID</div>
                            <div className="p-2 border-b border-gray-300">{userDetails.email}</div>

                            <div className="font-semibold p-2 border-r border-b border-gray-300">Status</div>
                            <div className="p-2 border-b border-gray-300">Enrolled</div>

                            <div className="font-semibold p-2 border-r border-b border-gray-300">DOB</div>
                            <div className="p-2 border-b border-gray-300">{userDetails.dob}</div>

                            <div className="font-semibold p-2 border-r border-b border-gray-300">Address</div>
                            <div className="p-2 border-b border-gray-300">{userDetails.address}</div>

                            <div className="font-semibold p-2 border-r border-b border-gray-300">Policy Active Date</div>
                            <div className="p-2 border-b border-gray-300">{format(addDays(new Date(), 15), 'dd MMM yyyy')}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white pt-2 px-2 w-full md:w-1/2 mt-4">
                    <div className="flex flex-col sm:flex-row justify-around gap-2 sm:gap-10">
                        <button
                            onClick={toggleConversation}
                            className="flex flex-col items-center group"
                        >
                            <div className={`p-10 md:p-16 bg-black rounded-full transition-all duration-300 group-hover:scale-105 ${callStatus === "active" ? "ring-4 ring-[#ffdc00] animate-pulse" : ""
                                }`}>
                                <Mic className={`w-16 h-16 md:w-20 md:h-20 text-[#1e81b0] ${callStatus === "active" ? "animate-bounce" : ""
                                    }`} />
                            </div>
                            <span className="mt-6 text-[#1e81b0] md:text-4xl font-bold">
                                {callStatus === "active"
                                    ? <span className="text-[#1e81b0]">Click to Disconnect</span>
                                    : "Let's Talk"
                                }
                            </span>
                        </button>

                        <button
                            onClick={() => (window as any).voiceflow?.chat?.open()}
                            className="flex flex-col items-center group">
                            <div className="p-10 md:p-16 bg-black rounded-full transition-all duration-300 group-hover:scale-105">
                                <MessageCircle className="w-16 h-16 md:w-20 md:h-20 text-[#1e81b0]" />
                            </div>
                            <span className="mt-6 text-[#1e81b0] md:text-4xl font-bold">Let's Chat</span>
                        </button>
                    </div>
                </div>

            </div>

            <div className="bg-[#2E5388] text-white py-2.5">
                <div className="container mx-auto px-4 sm:px-8 max-w-full flex flex-col sm:flex-row justify-between items-center sm:items-start">
                    <div className="flex flex-col items-start gap-2">
                        <img src="/centene_logo.png" alt="Centene" className="h-16 mb-2 sm:mb-0" />
                        <p className="text-sm sm:text-lg font-normal italic">
                            Transform the health of the communities, <br />
                            we serve one person at a time.
                        </p>
                    </div>

                    <div className="flex flex-col items-left gap-1 mt-8">
                        <h2 className="text-2xl sm:text-1xl font-bold uppercase">
                            Healthcare IS BEST DELIVERED LOCALLY
                        </h2>
                        <p className="text-sm sm:text-lg font-normal text-left">
                            Our unique local approach allows us to help members helpers take out you from there, <br />
                            access high-quality, culturally sensitive healthcare services
                        </p>
                    </div>

                    <div className="flex flex-col items-start gap-2">
                        <ul className="text-sm sm:text-lg font-normal">
                            <li>Contact</li>
                            <li>Equal Opportunity Employer</li>
                            <li>Privacy Policy</li>
                            <li>Terms & Conditions</li>
                            <li>Purchase Order Terms & Conditions</li>
                        </ul>
                    </div>
                </div>
            </div>





        </div>
    )
}

