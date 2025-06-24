"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Mic, MessageCircle } from "lucide-react"
import { RetellWebClient } from "retell-client-js-sdk"

interface UserDetails {
  orderNumber: string
  email: string
  useCase: string
}

const webClient = new RetellWebClient()

const useCaseOptions = [
  "Enquired about the Order Delivery of Item Purchases Online",
  "Installation help for the newly purchased camera",
  "Jennifer is having internet connectivity issues",
]

export default function ArloDemo() {
  const [showVerificationForm, setShowVerificationForm] = useState(true)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    orderNumber: "",
    email: "",
    useCase: "",
  })
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [callInProgress, setCallInProgress] = useState(false)

  useEffect(() => {
    // Add chatbot script
    const addChatbotScript = () => {
      const script = document.createElement("script")
      const projectId = "675e58a4bdfd5f757cea0976"
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
                    order_number: "${userDetails.orderNumber}",
                    email: "${userDetails.email}",
                    use_case: "${userDetails.useCase}"
                  }
                }
              },
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
      if (chatbotScript && chatbotScript.parentNode) {
        chatbotScript.parentNode.removeChild(chatbotScript)
      }
    }
  }, [userDetails])

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

    return () => {
      webClient.off("conversationStarted")
      webClient.off("conversationEnded")
      webClient.off("error")
      webClient.off("update")
      if (window.voiceflow && window.voiceflow.chat) {
        window.voiceflow.chat.destroy()
      }
    }
  }, [])

  const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newUserDetails = {
      orderNumber: formData.get("orderNumber") as string,
      email: formData.get("email") as string,
      useCase: formData.get("useCase") as string,
    }
    setUserDetails(newUserDetails)
    setShowVerificationForm(false)

    // Reload the chatbot script with new user details
    const existingScript = document.querySelector('script[src="https://cdn.voiceflow.com/widget/bundle.mjs"]')
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript)
    }
    const addChatbotScript = () => {
      const script = document.createElement("script")
      const projectId = "675e58a4bdfd5f757cea0976"
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
                    order_number: "${newUserDetails.orderNumber}",
                    email: "${newUserDetails.email}",
                    use_case: "${newUserDetails.useCase}"
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
    const agentId = "agent_c53c273bda8beda64317da5bc9"
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
            order_number: userDetails.orderNumber,
            email: userDetails.email,
            use_case: userDetails.useCase,
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
    <div className="min-h-screen flex flex-col">
      {/* Popup Form */}
      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl mx-auto border shadow-lg">
            {/* Arlo Logo */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">arlo</span>
                <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-blue-600 text-center mb-6">
              Enter Order Number for verification
            </h2>

            <form onSubmit={handleSubmitDetails} className="space-y-6">
              <div className="flex items-center gap-6">
                <label className="w-40 text-base font-medium text-gray-700">Order Number:</label>
                <input
                  type="text"
                  name="orderNumber"
                  defaultValue="1WA1057270A28"
                  className="flex-1 p-3 bg-gray-200 border border-gray-300 rounded text-base font-medium"
                  required
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="w-40 text-base font-medium text-gray-700">Email id:</label>
                <input
                  type="email"
                  name="email"
                  defaultValue="jennifer1234@gmail.com"
                  className="flex-1 p-3 border border-gray-300 rounded text-base underline text-blue-600"
                  required
                />
              </div>

              <div className="flex items-start gap-6">
                <label className="w-40 text-base font-medium text-gray-700 mt-2">Select Use Case:</label>
                <div className="flex-1">
                  <select
                    name="useCase"
                    defaultValue="Installation help for the newly purchased camera"
                    className="w-full p-3 border border-gray-300 rounded text-base"
                    required
                  >
                    <option value="">Select a use case</option>
                    {useCaseOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 p-3 bg-gray-50 border rounded text-xs">
                    <div className="font-medium text-blue-600 mb-2">Select Use case</div>
                    <div className="space-y-1 text-gray-600">
                      {useCaseOptions.map((option, index) => (
                        <div key={index}>
                          {index + 1}. {option}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>

            <div className="mt-6 text-xs text-gray-600">
              <div className="font-medium text-red-600 mb-2">Disclaimer:</div>
              <ul className="space-y-1">
                <li>• The platform isn't integrated with company systems, so it requires authentication details.</li>
                <li>
                  • <strong>An email ID is needed to send a secure email to reset the password.</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full">
        <img
          src="/arlo/nav.png"
          alt="Arlo Navigation"
          className="w-full h-auto"
        />
      </div>

      {/* Hero Section */}
      <div className="relative">
        <img
          src="/arlo/home.png"
          alt="Arlo Hero Section"
          className="w-full h-96 object-cover"
        />
        {/* Vision Statement Overlay */}
        <div className="absolute top-8 left-8">
          <img
            src="/arlo/homeStyle.png"
            alt="Our vision statement"
            className="max-w-md h-auto"
          />
        </div>
      </div>

      {/* Main Content Area - flex-grow to push footer down */}
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Data Table */}
          <div className="lg:w-1/2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-lg font-medium text-blue-800 mb-4">
                Use Case: {!showVerificationForm && userDetails.useCase ? userDetails.useCase : "Not selected"}
              </div>
              <table className="w-full text-base">
                <tbody className="space-y-3">
                  <tr className="border-b">
                    <td className="py-3 font-medium text-blue-700 text-lg">Order Number #</td>
                    <td className="py-3 text-lg">
                      {!showVerificationForm && userDetails.orderNumber ? userDetails.orderNumber : "N/A"}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 font-medium text-blue-700 text-lg">Order Date :</td>
                    <td className="py-3 text-lg">
                      {!showVerificationForm && userDetails.orderNumber ? "[Current Date -7]" : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-blue-700 text-lg">Email ID :</td>
                    <td className="py-3 text-lg">
                      {!showVerificationForm && userDetails.email ? (
                        <a href={`mailto:${userDetails.email}`} className="text-blue-600 underline">
                          {userDetails.email}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="lg:w-1/2 flex justify-center items-center">
            <div className="flex gap-16">
              {/* Start Call Button */}
              <button onClick={toggleConversation} className="flex flex-col items-center group">
                <div
                  className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                    callStatus === "active"
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-300 group-hover:border-blue-600"
                  }`}
                >
                  <Mic className={`w-8 h-8 ${callStatus === "active" ? "text-white" : "text-blue-600"}`} />
                </div>
                <span className="mt-3 text-blue-600 font-medium">
                  {callStatus === "active" ? "End Call" : "Start Call"}
                </span>
              </button>

              {/* Click to Chat Button */}
              <button
                onClick={() => (window as any).voiceflow?.chat?.open()}
                className="flex flex-col items-center group"
              >
                <div className="w-24 h-24 rounded-full border-4 border-gray-300 bg-white flex items-center justify-center group-hover:border-blue-600 transition-all duration-300">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
                <span className="mt-3 text-blue-600 font-medium">Click to Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <img
          src="/arlo/footer.png"
          alt="Arlo Footer"
          className="w-full h-auto"
        />
      </div>
    </div>
  )
}

interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}
