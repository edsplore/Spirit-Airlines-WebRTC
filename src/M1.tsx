import React from 'react';
import "./App.css";
import { useEffect, useState } from 'react'
import { Mic, Wifi, Tv, Globe, User, Video } from 'lucide-react';
import { RetellWebClient } from "retell-client-js-sdk"

interface RegisterCallResponse {
    access_token?: string
    callId?: string
    sampleRate: number
}

interface UserDetails {
    name: string
    accountNumber: string
    address: string
    selectedAgent: string
}

const webClient = new RetellWebClient()

const notes = [
    "The platform is not integrated into the company systems, therefore asking for specific detail for authentication and verification",
    <span>Please enter the name that you want the Virtual Assistant to address you as.</span>,
    "Upon authentication request by Virtual Assistant, please mention the account# and address.",
    "Personal details will be shown on the top right side of the bar for reference upon this form submission.",
    "Account# and Address fields are pre-filled and cannot be edited."
]

export default function Component() {
    const [showVerificationForm, setShowVerificationForm] = useState(true)
    const [userDetails, setUserDetails] = useState<UserDetails>({
        name: '',
        accountNumber: '',
        address: '',
        selectedAgent: 'Mindy', // Default agent

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

        // Add chatbot script
        const addChatbotScript = () => {
            const script = document.createElement('script')
            const projectId = "678056572812e20e7c68a0f1";
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
                        accountNumber: "${userDetails.accountNumber}",
                        address: "${userDetails.address}",
                        selectedAgent: "${userDetails.selectedAgent}",                  
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
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setUserDetails({
            name: formData.get('name') as string,
            accountNumber: formData.get('accountNumber') as string,
            address: formData.get('address') as string,
            selectedAgent: formData.get('selectedAgent') as string,

        })
        setShowVerificationForm(false)

        // Reload the chatbot script with new user details
        const existingScript = document.querySelector('script[src="https://cdn.voiceflow.com/widget/bundle.mjs"]');
        if (existingScript && existingScript.parentNode) {
            existingScript.parentNode.removeChild(existingScript);
        }
        const addChatbotScript = () => {
            const script = document.createElement('script')
            const projectId = "678056572812e20e7c68a0f1";
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
                        accountNumber: "${userDetails.accountNumber}",
                        address: "${userDetails.address}",
                        selectedAgent: "${userDetails.selectedAgent}"
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
        addChatbotScript();
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
        const agentId = userDetails.selectedAgent === 'Mindy'
            ? 'agent_5af48d3a44ac25dd5c949db973'
            : 'agent_a6075c48f5a298374c1c314357'

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
                        account_number: userDetails.accountNumber,
                        address: userDetails.address
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
        <div className="min-h-screen bg-white">
            {showVerificationForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#e68818] rounded-3xl p-4 sm:p-8 w-full max-w-[90%] sm:max-w-2xl max-h-[90vh] sm:max-h-none overflow-y-auto">
                        <h2 className="text-2xl font-bold text-black mb-6">
                            Customer details required for verification and authentication
                        </h2>
                        <form onSubmit={handleSubmitDetails} className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr,2fr] gap-2 sm:gap-4 items-center">
                                <label htmlFor="name" className="text-white text-base sm:text-lg font-bold sm:text-right">
                                    Enter Name<span className="text-black-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    className="p-2 rounded bg-[#fff2e3] text-black w-full font-bold"
                                />
                                <label htmlFor="accountNumber" className="text-white text-base sm:text-lg font-bold sm:text-right">
                                    Account#
                                </label>
                                <input
                                    type="text"
                                    id="accountNumber"
                                    name="accountNumber"
                                    defaultValue="604299478"
                                    readOnly
                                    className="p-2 rounded bg-[#BFBFBF] text-gray-700 w-full font-bold"
                                />
                                <label htmlFor="address" className="text-white text-base sm:text-lg font-bold sm:text-right">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    defaultValue="64 Tanamerah 465534"
                                    readOnly
                                    className="p-2 rounded bg-[#BFBFBF] text-gray-700 w-full font-bold"
                                />
                                <label htmlFor="selectedAgent" className="text-white text-base sm:text-lg font-bold sm:text-right">
                                    Select Agent
                                </label>
                                <select
                                    id="selectedAgent"
                                    name="selectedAgent"
                                    required
                                    defaultValue="Mindy"
                                    className="p-2 rounded bg-[#fff2e3] text-black w-full font-bold"
                                >
                                    <option value="Mindy">Mindy</option>
                                    <option value="Kevin">Kevin</option>
                                </select>
                            </div>

                            <div className="flex justify-center mt-4 sm:mt-6">
                                <button
                                    type="submit"
                                    className="px-6 sm:px-8 bg-[#703d01] text-white py-2 text-base sm:text-lg rounded-full hover:bg-[#bd6602] transition-colors font-bold"
                                >
                                    Submit
                                </button>
                            </div>
                            <div className="mt-4 sm:mt-6 bg-[#fff2e3] p-3 sm:p-4 rounded-lg">
                                <p className="font-bold mb-1 sm:mb-2 text-red-500 text-sm sm:text-base">Note:</p>
                                <ul className="space-y-1 text-black text-xs sm:text-sm">
                                    {notes.map((note, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="text-[#000000] mr-1 sm:mr-2">➤</span>
                                            {index === 1 ? (
                                                <>
                                                    <span className="text-red-500 mr-1 font-bold">*</span>
                                                    {note}
                                                </>
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

            <nav className="bg-[#ffffff] mb-6">
                <div className="container mx-auto px-2 py-1">
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                        <img src="/m1-logo.svg" alt="M1" className="h-12 mb-2 sm:mb-0" />
                        {userDetails.name && (
                            <div className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm text-black">
                                <div className="flex items-center">
                                    <User className="w-5 h-5 sm:w-7 sm:h-7 text-black mr-1" />
                                    <span>{userDetails.name}</span>
                                </div>
                                <div className="flex flex-wrap justify-center sm:justify-start">
                                    <span className="font-bold mr-1">Account#</span>
                                    <span className="mr-2">{userDetails.accountNumber}</span>
                                    <span className="font-bold mr-1">Address:</span>
                                    <span>{userDetails.address}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="relative w-full">
                {/* Image Section */}
                <div className="w-full h-[200px] sm:h-[400px] relative">
                    <img
                        src="/m1_Aboutus.png"
                        alt="M1 family"
                        className="w-full h-full object-cover object-bottom"
                    />
                    {/* Text Section */}
                    <div className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-white bg-opacity-75 p-4 sm:p-8 rounded-md">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-6">
                            about us
                        </h1>
                        <div className="w-auto h-1 bg-[#ff9e1b] mb-2 sm:mb-6" style={{ width: 'auto' }}></div>
                        <p className="text-base sm:text-lg text-gray-600">
                            <span className="font-bold text-black text-xl sm:text-2xl">Singapore's most vibrant and</span>
                            <br />
                            <span className="font-bold text-black text-xl sm:text-2xl">dynamic communications company</span>
                        </p>

                    </div>

                </div>
            </div>


            <main className="container mx-auto px-4 pb-4 sm:px-6 pt-8 sm:pt-16">
                {/* Action Buttons Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div className="text-center">
                        <button
                            onClick={toggleConversation}
                            className={`relative bg-[#ff9e1b] rounded-full p-6 sm:p-8 transition-all duration-300 hover:scale-105 ${callStatus === 'active' ? 'ring-4 ring-[#ff9e1b]/50 animate-pulse' : ''
                                }`}
                        >
                            <Mic
                                className={`w-8 h-8 sm:w-12 sm:h-12 text-white ${callStatus === 'active' ? 'animate-bounce' : ''
                                    }`}
                            />
                        </button>
                        <p
                            className={`mt-4 text-base sm:text-lg ${callStatus === 'active' ? 'text-red-500' : 'text-[#ff9e1b]'
                                }`}
                        >
                            {callStatus === 'active'
                                ? 'Click  disconnect the call'
                                : 'Click  to start the call'}
                        </p>
                    </div>

                    <div className="text-center">
                        <button className="relative bg-[#ff9e1b] rounded-full p-6 sm:p-8 transition-all duration-300 hover:scale-105">
                            <User className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                        </button>
                        <p className="mt-4 text-base sm:text-lg text-[#ff9e1b]">
                            Click to start chatting
                        </p>
                    </div>

                    <div className="text-center">
                        <button className="relative bg-[#ff9e1b] rounded-full p-6 sm:p-8 transition-all duration-300 hover:scale-105">
                            <Video className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                        </button>
                        <p className="mt-4 text-base sm:text-lg text-[#ff9e1b]">
                            Click to start a video call
                        </p>
                    </div>
                </div>

                {/* Additional Feature Section */}
                <div className="text-center mt-20 mb-8">
                    <h2 className="mb-20 text-2xl sm:text-3xl font-bold text-black">Our Services</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    <div className="p-4 border border-[#ff9e1b] rounded-lg flex flex-col items-center">
                        <User className="w-6 h-6 text-[#ff9e1b] mb-2" />
                        <h3 className="text-lg font-semibold text-[#ff9e1b] mb-1">Mobile</h3>
                        <p className="text-gray-600 text-sm text-center">
                            Reliable mobile plans for individuals and businesses.
                        </p>
                    </div>
                    <div className="p-4 border border-[#ff9e1b] rounded-lg flex flex-col items-center">
                        <Wifi className="w-6 h-6 text-[#ff9e1b] mb-2" />
                        <h3 className="text-lg font-semibold text-[#ff9e1b] mb-1">Home Broadband</h3>
                        <p className="text-gray-600 text-sm text-center">
                            Fast and secure broadband services for your home.
                        </p>
                    </div>
                    <div className="p-4 border border-[#ff9e1b] rounded-lg flex flex-col items-center">
                        <Globe className="w-6 h-6 text-[#ff9e1b] mb-2" />
                        <h3 className="text-lg font-semibold text-[#ff9e1b] mb-1">Travel</h3>
                        <p className="text-gray-600 text-sm text-center">
                            Seamless connectivity while traveling abroad.
                        </p>
                    </div>
                    <div className="p-4 border border-[#ff9e1b] rounded-lg flex flex-col items-center">
                        <Tv className="w-6 h-6 text-[#ff9e1b] mb-2" />
                        <h3 className="text-lg font-semibold text-[#ff9e1b] mb-1">Digital Services</h3>
                        <p className="text-gray-600 text-sm text-center">
                            Advanced digital solutions for your modern needs.
                        </p>
                    </div>
                </div>

                {/* New Section */}
                <div className="text-center">
                    <h2 className="mt-20 mb-20 text-2xl sm:text-3xl font-bold text-black">Save the hassle, sign up online here</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
                    <div className="flex flex-col items-center text-center">
                        <img
                            src="/m1first.jpg"
                            alt="Service 1"
                            className="w-62 h-62 object-cover rounded-lg"
                        />
                        <h3 className="text-lg font-semibold text-black mt-4">SIM-Only</h3>
                        <p className="text-gray-600 text-sm mt-2">No Contract</p>
                        <button
                            className="mt-4 px-10 py-2 bg-[#ff9e1b] text-black rounded-md hover:bg-[#e68818] transition-colors font-semibold"
                        >
                            Create My Plan
                        </button>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <img
                            src="/m1second.jpg"
                            alt="Service 2"
                            className="w-62 h-62 object-cover rounded-lg"
                        />
                        <h3 className="text-lg font-semibold text-black mt-4">Phone</h3>
                        <p className="text-gray-600 text-sm mt-2">Get the phone on your terms</p>
                        <button
                            className="mt-4 px-10 py-2 bg-[#ff9e1b] text-black rounded-md hover:bg-[#e68818] transition-colors font-semibold"
                        >
                            Browse Devices
                        </button>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <img
                            src="/m1third.jpg"
                            alt="Service 3"
                            className="w-62 h-62 object-cover rounded-lg"
                        />
                        <h3 className="text-lg font-semibold text-black mt-4">Home Broadband</h3>
                        <p className="text-gray-600 text-sm mt-2">Get your home connected with the speed that best suits your need</p>
                        <button
                            className="mt-4 px-10 py-2 bg-[#ff9e1b] text-black rounded-md hover:bg-[#e68818] transition-colors font-semibold"
                        >
                            Signup Now
                        </button>

                    </div>
                </div>

            </main>

            <footer className="bg-gray-200 py-8 mt-20">
                <div className="container mx-auto px-4 sm:px-6 flex justify-center">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-screen-xl">
                        {/* About Section */}
                        <div className="flex flex-col items-center sm:items-start">
                            <h3 className="text-xl font-bold text-black mb-4">About M1</h3>
                            <p className="text-black text-sm text-center sm:text-left">
                                Singapore's most vibrant and dynamic communications company
                            </p>
                        </div>

                        {/* Quick Links Section */}
                        <div className="flex flex-col items-center sm:items-start">
                            <h3 className="text-xl font-bold text-black mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-center sm:text-left">
                                <li>
                                    <a href="https://voicebot.everailabs.com/demo/telecom/m1" className="text-black text-sm hover:underline">
                                        Careers
                                    </a>
                                </li>
                                <li>
                                    <a href="https://voicebot.everailabs.com/demo/telecom/m1" className="text-black text-sm hover:underline">
                                        Investor Relations
                                    </a>
                                </li>
                                <li>
                                    <a href="https://voicebot.everailabs.com/demo/telecom/m1" className="text-black text-sm hover:underline">
                                        News & Media
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Legal Section */}
                        <div className="flex flex-col items-center sm:items-start">
                            <h3 className="text-xl font-bold text-black mb-4">Legal</h3>
                            <ul className="space-y-2 text-center sm:text-left">
                                <li>
                                    <a href="https://voicebot.everailabs.com/demo/telecom/m1" className="text-black text-sm hover:underline">
                                        Terms of Service
                                    </a>
                                </li>
                                <li>
                                    <a href="https://voicebot.everailabs.com/demo/telecom/m1" className="text-black text-sm hover:underline">
                                        Privacy Policy
                                    </a>
                                </li>
                                <li>
                                    <a href="https://voicebot.everailabs.com/demo/telecom/m1" className="text-black text-sm hover:underline">
                                        Cookie Policy
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>



        </div>
    )
}