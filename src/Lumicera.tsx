import "./App.css";
import type React from "react"
import { useEffect, useState } from "react"
import { Mic, MessageCircle, ChevronDown, Linkedin, Facebook, Youtube } from "lucide-react"
import { RetellWebClient } from "retell-client-js-sdk"
import { addDays, format } from "date-fns"
import { } from "lucide-react";

interface RegisterCallResponse {
    access_token?: string
    callId?: string
    sampleRate: number
}

interface UserDetails {
    name: string
    dob: string
    email: string
    shippingAddress: string
    pharmacy: string
}

const webClient = new RetellWebClient()

const notes = [
    "The platform is not integrated into the company systems, therefore asking for specific details for authentication and verification",
    <span key="1">Please enter the name that the Virtual Assistant want to shippingAddress you as.</span>,
    "Upon authentication request by Virtual Assistant please mention confirmation code # and full name as shown on the top right side of the bar for reference upon this form submission.",
    "Phone# and Email id is required to send instant messages and confirmation",
]

export default function Lumicera() {
    const [showVerificationForm, setShowVerificationForm] = useState(true)
    const [userDetails, setUserDetails] = useState<UserDetails>({
        name: "",
        dob: "",
        email: "",
        shippingAddress: "",
        pharmacy: ""
    })

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

        const addChatbotScript = () => {
            const script = document.createElement("script")
            const projectId = "67900940c6f7a86d23b3de98"
            script.type = "text/javascript"
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
                    DOB: "${userDetails.dob}",
                    shippingAddress: "${userDetails.shippingAddress}",
                    pharmacy: "${userDetails.pharmacy}"
                    }
                }
              }
            });
          }
          v.src = "https://cdn.voiceflow.com/widget/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
        })(document, 'script');
      `
            document.body.appendChild(script)
            return script
        }

        const chatbotScript = addChatbotScript()

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
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const newUserDetails = {
            name: formData.get("name") as string,
            dob: formData.get("dob") as string,
            email: formData.get("email") as string,
            shippingAddress: formData.get("shippingAddress") as string,
            pharmacy: formData.get("pharmacy") as string,
        }
        setUserDetails(newUserDetails)
        setShowVerificationForm(false)

        const existingScript = document.querySelector('script[src="https://cdn.voiceflow.com/widget/bundle.mjs"]')
        if (existingScript && existingScript.parentNode) {
            existingScript.parentNode.removeChild(existingScript)
        }
        const addChatbotScript = () => {
            const script = document.createElement("script")
            const projectId = "67900940c6f7a86d23b3de98"
            script.type = "text/javascript"
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
                        shippingAddress: "${newUserDetails.shippingAddress}",
                        DOB: "${newUserDetails.dob}",
                        pharmacy: "${newUserDetails.pharmacy}"
                      }
                    }
                  },
                });
              }
              v.src = "https://cdn.voiceflow.com/widget/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
            })(document, 'script');
          `
            document.body.appendChild(script)
        }
        addChatbotScript()
    }

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
        const agentId = "agent_1ecd510a6f5bd6f164e23adf10"
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
        const sampleRate = Number.parseInt(process.env.REACT_APP_RETELL_SAMPLE_RATE || "16000", 10)
        

        try {
            
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
                        shippingAddress: userDetails.shippingAddress,
                        DOB: userDetails.dob,                    
                        pharmacy: userDetails.pharmacy,
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
                    <div className="bg-[#1e81b0] rounded-[40px] p-4 sm:p-6 w-full max-w-xl mx-auto border-4 border-gray-600 shadow-lg overflow-y-auto max-h-[90vh] sm:max-h-none">
                        <div className="flex items-center justify-center">
                            <h2 className="text-base sm:text-xl font-medium text-white mb-4 sm:mb-6 text-center">
                                Customer details required for verification and authentication
                            </h2>
                        </div>

                        <form onSubmit={handleSubmitDetails} className="space-y-4">
                            <div className="grid gap-4 max-w-lg mx-auto">
                                <div className="grid gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <label
                                            htmlFor="name"
                                            className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                                        >
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
                                        <label
                                            htmlFor="dob"
                                            className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                                        >
                                            Choose DOB
                                        </label>
                                        <input
                                            type="date"
                                            id="dob"
                                            name="dob"
                                            required
                                            className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                                            defaultValue="1984-05-29"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <label
                                            htmlFor="shippingAddress"
                                            className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                                        >
                                            Shipping Address
                                        </label>
                                        <input
                                            type="text"
                                            id="shippingAddress"
                                            name="shippingAddress"
                                            required
                                            className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                                            defaultValue="115, Washington Avenue, Lodi 53555"
                                            readOnly
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <label
                                            htmlFor="email"
                                            className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                                        >
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

                                    {/*  pharmacy */}
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <label
                                            htmlFor="pharmacy"
                                            className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                                        >
                                            Pharmacy
                                        </label>

                                        <input
                                            type="pharmacy"
                                            id="pharmacy"
                                            name="pharmacy"
                                            required
                                            className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                                            defaultValue="Speciality Pharmacy"
                                            readOnly
                                        />

                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-center mt-6">
                                <button
                                    type="submit"
                                    className="px-10 py-1.5 bg-black text-[#1e81b0] text-base rounded-full hover:bg-gray-800 transition-colors font-bold"
                                >
                                    Submit
                                </button>
                            </div>
                            <div className="mt-4 bg-white p-3 rounded-lg">
                                <p className="font-medium text-[#8B0000] mb-1">Note</p>
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

            <nav className="bg-[#FFFFFFF] w-full">
                <div className="flex flex-col md:flex-row items-center justify-around px-4 md:px-20 py-2">
                    <img src="/Lumicera_Logo.png" alt="Centene" className="h-12 bg-transparent mb-4 md:mb-0" />
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-black text-sm md:text-lg font-bold">
                        {[
                            "Patients",
                            "Prescribers",
                            "Health Systems",
                            "Manufacturers",
                            "Residency Programs",
                        ].map((item) => (
                            <span key={item} className="cursor-pointer whitespace-nowrap flex items-center gap-1">
                                {item}
                                <ChevronDown size={18} className="text-gray-500 mt-3" />
                            </span>
                        ))}
                    </div>
                </div>
            </nav>

            <div className="relative w-full h-64 md:h-80">
                <img
                    src="/Lumicera_Hero.png"
                    alt="Lumicera Hero"
                    className="w-full h-full object-fit rounded-lg shadow-md"
                />
            </div>

            <div className="flex flex-col md:flex-row justify-around gap-4 md:gap-6 mt-2 md:mt-0.5 px-4 md:px-0">
                <div className="w-full md:w-1/3 bg-white pt-4 md:pt-2 pl-4 md:pl-8 pr-4 md:pr-8 pb-4 md:pb-8 rounded-lg">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 text-xs md:text-sm border border-gray-300">

                            <div className=" bg-[#2E5388] text-white p-2 border-r border-b border-gray-300">
                                Member Name
                            </div>
                            <div className="p-2   bg-[#2E5388] font-semibold border-b text-white border-gray-300">{userDetails.name}</div>
                            <div className=" p-2 border-r border-b border-gray-300">Email ID</div>
                            <div className="p-2 border-b font-semibold border-gray-300">{userDetails.email}</div>
                            <div className=" p-2 border-r border-b border-gray-300">DOB</div>
                            <div className="p-2  font-semibold border-b border-gray-300">{userDetails.dob}</div>
                            <div className=" p-2 border-r border-b border-gray-300">Address</div>
                            <div className="p-2 border-b font-semibold border-gray-300">{userDetails.shippingAddress}</div>
                            <div className=" p-2 border-r border-b border-gray-300">Pharmacy</div>
                            <div className="p-2 border-b font-semibold border-gray-300">{userDetails.pharmacy}</div>
                            <div className=" p-2 border-r border-b border-gray-300">Medicines</div>
                            <div className="p-2 border-b font-semibold border-gray-300 ">Prednisone and Abiraterone</div>


                        </div>
                    </div>
                </div>

                <div className="bg-white pt-0 px-2 w-full md:w-1/2 mt-4">
                    <div className="flex flex-col sm:flex-row justify-around gap-2 sm:gap-5">
                        <button onClick={toggleConversation} className="flex flex-col items-center group">
                            <div
                                className={`p-8 md:p-12 bg-black rounded-full transition-all duration-300 group-hover:scale-105 ${callStatus === "active" ? "ring-4 ring-[#ffdc00] animate-pulse" : ""
                                    }`}
                            >
                                <Mic
                                    className={`w-12 h-12 md:w-20 md:h-20 text-[#F9EE4D] ${callStatus === "active" ? "animate-bounce" : ""
                                        }`}
                                />
                            </div>
                            <span className="mt-6 text-[#000000] text-2xl md:text-4xl font-bold">
                                {callStatus === "active" ? <span className="text-[#000000]">Click to Disconnect</span> : "Let's Talk"}
                            </span>
                        </button>

                        <button
                            onClick={() => (window as any).voiceflow?.chat?.open()}
                            className="flex flex-col items-center group"
                        >
                            <div className="p-8 md:p-12 bg-black rounded-full transition-all duration-300 group-hover:scale-105">
                                <MessageCircle className="w-12 h-12 md:w-20 md:h-20 text-[#F9EE4D]" />
                            </div>
                            <span className="mt-6 text-[#000000] text-2xl md:text-4xl font-bold">Let's Chat</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-[#023C61] via-[#1B577C] to-[#336C97] text-white py-3 w-full">
                <div className="container mx-auto px-2 sm:px-4 max-w-screen-xl flex flex-col sm:flex-row justify-between items-center">
                    {/* Navigation Links */}
                    <ul className="flex flex-wrap justify-center sm:justify-start gap-8 text-sm sm:text-base font-medium">
                        {[
                            "About Us",
                            "Accessibility",
                            "Careers",
                            "HIPAA Notice",
                            "Privacy",
                            "Partners",
                            "Terms and Conditions",
                            "Contact Us",
                        ].map((item) => (
                            <li key={item} className="cursor-pointer hover:underline">
                                {item}
                            </li>
                        ))}
                    </ul>

                    {/* Social Media Icons */}
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        {[Linkedin, Facebook, Youtube].map((Icon, index) => (
                            <div key={index} className="w-8 h-8 flex items-center justify-center bg-white rounded-full">
                                <Icon size={20} className="text-[#023C61]" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-6 px-2 sm:px-4 container mx-auto max-w-screen-xl flex justify-between items-center">
                    {/* Left Side: Logo & Reserved Text */}
                    <div className="flex-row items-center gap-12">
                        <img src="/Lumicera_Logo.png" alt="Lumicera Logo" className="h-12 bg-transparent" />
                        <p className="text-sm sm:text-base font-bold text-white mt-2">
                            © {new Date().getFullYear()} Company Name. All rights reserved | Sitemap
                        </p>
                    </div>

                    {/* Right Side: Additional Image */}
                    <div>
                        <img src="/Lumicera_Footer_Right.png" alt="Additional Lumicera" className="h-18 sm:h-26" />
                    </div>
                </div>
            </div>



        </div>
    )
}
