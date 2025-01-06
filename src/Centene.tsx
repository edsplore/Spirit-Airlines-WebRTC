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
            const projectId = "669833f4ca2c7886e6638f93";
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
            const projectId = "669833f4ca2c7886e6638f93";
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
                        DOB: userDetails.dob
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

            <div
                className="absolute decorative-triangle"
                style={{
                    bottom: 0,
                    left: 0,
                    width: 0,
                    height: 0,
                    borderLeft: '50px solid #1e81b0',
                    borderRight: '20px solid transparent',
                    borderTop: '50vw solid transparent',
                    borderBottom: '0 solid transparent',
                    zIndex: 10,
                }}
            ></div>

            <div
                className="absolute decorative-triangle"
                style={{
                    bottom: 0,
                    right: 0,
                    width: 0,
                    height: 0,
                    borderRight: '50px solid #1e81b0',
                    borderLeft: '20px solid transparent',
                    borderTop: '50vw solid transparent',
                    borderBottom: '0 solid transparent',
                    zIndex: 10,
                }}
            ></div>

            <div
                className="absolute decorative-triangle"
                style={{
                    top: 63,
                    right: 0,
                    width: 0,
                    height: 0,
                    borderRight: '700px solid #1e81b0',
                    borderLeft: '100px solid transparent',
                    borderBottom: '4vw solid transparent',
                    borderTop: '0 solid transparent',
                    zIndex: 10,
                }}
            ></div>

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





            <nav className="bg-[#1e81b0] mb-4">
                <div className="container mx-auto px-4 py-2" style={{ zIndex: 12 }}>
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                        <img src="/centene_logo.png" alt="Spirit" className="h-12 mb-3 sm:mb-0" />
                        {userDetails.name && (
                            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-white">
                                <span className="font-bold">DOB#:</span>
                                <span>{userDetails.dob}</span> {/* Displaying Date of Birth */}

                                <span className="font-bold">Address:</span>
                                <span>{userDetails.address}</span> {/* Displaying Address */}
                            </div>
                        )}
                    </div>
                </div>
            </nav>



            <div className="relative w-full">
                <div className="flex flex-col md:flex-row">

                    <div className="w-full md:w-2/3 relative p-4">
                        <img
                            src="/centene_Hero.png"
                            alt="Spirit Airlines beach scene"
                            className="w-full h-auto md:h-[350px] object-contain md:object-cover rounded-lg shadow-md"
                        />
                    </div>


                    <div className="w-full md:w-1/3 bg-white pt-8 pl-8 pr-8 pb-8 rounded-lg mt-8">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 text-sm border border-gray-300">
                                <div className="font-semibold bg-[#1e81b0] text-white p-2 border-r border-b border-gray-300">Medical ID #</div>
                                <div className="bg-[#1e81b0] text-white p-2 border-b border-gray-300">{userDetails.medicalCode}</div>

                                <div className="font-semibold p-2 border-r border-b border-gray-300">Member Name</div>
                                <div className="p-2 border-b border-gray-300">{userDetails.name}</div>

                                <div className="font-semibold p-2 border-r border-b border-gray-300">Email ID</div>
                                <div className="p-2 border-b border-gray-300">{userDetails.email}</div>

                                <div className="font-semibold p-2 border-r border-b border-gray-300">Status</div>
                                <div className="p-2 border-b border-gray-300">Enrolled</div>

                                <div className="font-semibold p-2 border-r border-b border-gray-300">Policy Active Date</div>
                                <div className="p-2 border-b border-gray-300">{format(addDays(new Date(), 15), 'dd MMM yyyy')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            <div className="text-center pt-2 bg-white md:w-2/3">
                <p className="text-base md:text-lg text-[#1e81b0] font-bold mb-2">
                    Centene is committed to helping people live healthier lives. We provide access to high-quality healthcare,
                </p>
                <p className="text-base md:text-lg text-[#1e81b0] font-bold mb-2">
                innovative programs and health solutions that help families and individuals get well, stay well and be well.
                </p>
            </div>



            <div className="bg-white pt-2 px-2">
                <div className="flex flex-col sm:flex-row justify-center gap-12 sm:gap-24">
                    <button
                        onClick={toggleConversation}
                        className="flex flex-col items-center group"
                    >
                        <div className={`p-8 md:p-12 bg-black rounded-full transition-all duration-300 group-hover:scale-105 ${callStatus === "active" ? "ring-4 ring-[#ffdc00] animate-pulse" : ""
                            }`}>
                            <Mic className={`w-12 h-12 md:w-16 md:h-16  text-[#1e81b0] ${callStatus === "active" ? "animate-bounce" : ""
                                }`} />
                        </div>
                        <span className="mt-4 text-lg md:text-xl font-medium">
                            {callStatus === "active"
                                ? <span className="text-brown-500">Click to Disconnect</span>
                                : "Let's Talk"
                            }
                        </span>
                    </button>

                    <button
                        onClick={() => (window as any).voiceflow?.chat?.open()}
                        className="flex flex-col items-center group">
                        <div className="p-8 md:p-12 bg-black rounded-full transition-all duration-300 group-hover:scale-105">
                            <MessageCircle className="w-12 h-12 md:w-16 md:h-16  text-[#1e81b0]" />
                        </div>
                        <span className="mt-4 text-lg md:text-xl font-medium">Let's Chat</span>
                    </button>


                </div>
            </div>

        </div>
    )
}

