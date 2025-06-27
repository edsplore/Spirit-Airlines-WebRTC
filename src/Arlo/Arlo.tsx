"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { MessageCircle, QrCode, X, Phone, MoreVertical } from "lucide-react"
import { RetellWebClient } from "retell-client-js-sdk"

interface UserDetails {
  name: string
  orderNumber: string
  orderDate: string
  email: string
  useCase: string
}

interface CallSummary {
  call_id: string
  call_summary?: string
  user_sentiment?: string
  call_successful?: boolean
  duration_ms?: number
  transcript?: string
}

const webClient = new RetellWebClient()

const useCaseOptions = [
  "1. Tracked an online order",
  "2. Requested help with camera setup",
  "3. Reported internet issues",
]

// Function to get current date - 7 days
const getOrderDate = () => {
  const today = new Date()
  const orderDate = new Date(today)
  orderDate.setDate(today.getDate() - 7)

  const day = orderDate.getDate()
  const month = orderDate.toLocaleString("default", { month: "short" })
  const year = orderDate.getFullYear().toString().slice(-2)

  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
          ? "rd"
          : "th"

  return `${day}${suffix} ${month}'${year}`
}

// const formatDuration = (durationMs: number) => {
//   const seconds = Math.floor(durationMs / 1000)
//   const minutes = Math.floor(seconds / 60)
//   const remainingSeconds = seconds % 60
//   return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
// }

export default function ArloDemo() {
  const [showVerificationForm, setShowVerificationForm] = useState(true)
  const [showSupportWidget, setShowSupportWidget] = useState(false)
  const [callSummary, setCallSummary] = useState<CallSummary | null>(null)
  const [showCallSummary, setShowCallSummary] = useState(false)
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "Jennifer",
<<<<<<< HEAD
    orderNumber: "100RUN23W5",
=======
    orderNumber: "100RUN27134F",
>>>>>>> df1dfaa8c4acc4837fec7fcb2584b6197f15fd06
    orderDate: getOrderDate(),
    email: "jennifer1234@gmail.com",
    useCase: "Installation help for the newly purchased camera",
  })
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [callInProgress, setCallInProgress] = useState(false)

  useEffect(() => {
    // Add chatbot script only after form submission
    if (!showVerificationForm) {
      const addChatbotScript = () => {
        const script = document.createElement("script")
        const projectId = "685e60329036e9e5b907027b"
        script.type = "text/javascript"
        script.innerHTML = `
          (function(d, t) {
            var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
            v.onload = function() {
              window.voiceflow.chat.load({
                verify: { projectID: '${projectId}' },
                url: 'https://general-runtime.voiceflow.com',
                versionID: 'production',
                voice: {
                  url: "https://runtime-api.voiceflow.com"
                },
                launch: {
                  event: {
                    type: "launch",
                    payload: {
                      customer_name: "${userDetails.name}",
                      order_number: "${userDetails.orderNumber}",
                      order_date: "${userDetails.orderDate}",
                      email: "${userDetails.email}",
                      use_case: "${userDetails.useCase}"
                    }
                  }
                },
              });
            }
            v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
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
    }
  }, [userDetails, showVerificationForm])

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
      // Remove the automatic fetching - only fetch when user clicks
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
  }, [currentCallId])

  const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newUserDetails = {
      name: "Jennifer", // Keep the default name
      orderNumber: formData.get("orderNumber") as string,
      orderDate: getOrderDate(), // Always use current date - 7
      email: formData.get("email") as string,
      useCase: formData.get("useCase") as string,
    }

    console.log("Form submitted with details:", newUserDetails)
    setUserDetails(newUserDetails)
    setShowVerificationForm(false)
  }

  const fetchCallSummary = async (callId: string) => {
    const apiKey = "key_2747254ddf6a6cdeea3935f67a5d"

    try {
      console.log("Fetching call summary for:", callId)
      const callDetailsResponse = await fetch(`https://api.retellai.com/v2/get-call/${callId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!callDetailsResponse.ok) {
        throw new Error(`Error fetching call details: ${callDetailsResponse.status}`)
      }

      const callDetails = await callDetailsResponse.json()
      console.log("Call details received:", callDetails)

      const summary = {
        call_id: callDetails.call_id,
        call_summary: callDetails.call_analysis?.call_summary,
        user_sentiment: callDetails.call_analysis?.user_sentiment,
        call_successful: callDetails.call_analysis?.call_successful,
        duration_ms: callDetails.duration_ms,
        transcript: callDetails.transcript,
      }

      console.log("Setting call summary:", summary)
      setCallSummary(summary)
    } catch (error) {
      console.error("Error fetching call summary:", error)
      // Set a basic summary even if API fails
      setCallSummary({
        call_id: callId,
        call_summary: "Call completed successfully",
        user_sentiment: "Neutral",
        call_successful: true,
        duration_ms: 0,
        transcript: "Transcript not available",
      })
    }
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
    const agentId = "agent_f2c6614fdd0ac4727823d04a4a"
    try {
      const registerCallResponse = await registerCall(agentId)
      if (registerCallResponse.callId) {
        setCurrentCallId(registerCallResponse.callId)
        // Clear previous call summary data when starting a new call
        setCallSummary(null)
        setShowCallSummary(false)
        console.log("Starting call with ID:", registerCallResponse.callId)
        await webClient.startCall({
          accessToken: registerCallResponse.access_token,
          callId: registerCallResponse.callId,
          sampleRate: registerCallResponse.sampleRate,
          enableUpdate: true,
        })
        setCallStatus("active")
        setShowSupportWidget(false) // Close the menu when call starts
      }
    } catch (error) {
      console.error("Error in registering or starting the call:", error)
      setCallInProgress(false)
    }
  }

  async function registerCall(agentId: string): Promise<RegisterCallResponse> {
    console.log("Registering call for agent:", agentId)
    console.log("User details for call:", userDetails)

    const apiKey = "key_2747254ddf6a6cdeea3935f67a5d"
    const sampleRate = Number.parseInt(process.env.REACT_APP_RETELL_SAMPLE_RATE || "16000", 10)

    const payload = {
      agent_id: agentId,
      retell_llm_dynamic_variables: {
        customer_name: userDetails.name,
        order_number: userDetails.orderNumber,
        order_date: userDetails.orderDate,
        email: userDetails.email,
        use_case: userDetails.useCase,
      },
    }

    console.log("Complete Retell API payload being sent:", JSON.stringify(payload, null, 2))

    try {
      const response = await fetch("https://api.retellai.com/v2/create-web-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
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
    <div className="min-h-screen flex flex-col relative">
      {/* Popup Form */}
      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-auto border shadow-lg">
            {/* Arlo Logo */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">arlo</span>
                <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-blue-600 text-center mb-4">
              Enter Order Number for verification
            </h2>

            <form onSubmit={handleSubmitDetails} className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="w-28 text-sm font-medium text-gray-700">Order Number:</label>
                <input
                  type="text"
                  name="orderNumber"
<<<<<<< HEAD
                  defaultValue="100RUN23W5"
=======
                  defaultValue="100RUN27134F"
>>>>>>> df1dfaa8c4acc4837fec7fcb2584b6197f15fd06
                  className="flex-1 p-2 bg-gray-200 border border-gray-300 rounded text-sm font-medium"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="w-28 text-sm font-medium text-gray-700">Email id:</label>
                <input
                  type="email"
                  name="email"
                  defaultValue="jennifer1234@gmail.com"
                  className="flex-1 p-2 border border-gray-300 rounded text-sm underline text-blue-600"
                  required
                />
              </div>

              <div className="flex items-start gap-3">
                <label className="w-28 text-sm font-medium text-gray-700 mt-2">Select Use Case:</label>
                <div className="flex-1">
                  <select
                    name="useCase"
                    defaultValue=" "
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    required
                  >
                    <option value="">Select a use case</option>
                    {useCaseOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 p-2 bg-gray-50 border rounded text-xs">
                    <div className="font-medium text-blue-600 mb-1">Select Use case</div>
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

              <div className="flex justify-center mt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>

            <div className="mt-4 text-xs text-gray-600">
              <div className="font-medium text-red-600 mb-1">Disclaimer:</div>
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

      {/* Hero Section with Overlaid Table */}
    <div className="w-full h-screen relative">
  <img
    src="/arlo/bkgArlo.png"
    alt="Arlo Hero Section"
    className="w-full h-full object-cover"
  />

  {/* Customer Details Table Overlay - Bottom Left/Middle */}
  {!showVerificationForm && (
    <div className="absolute bottom-3 left-1/4 -translate-x-[52%] w-[580px]">
      <div className="bg-blue-50/95 backdrop-blur-sm border border-blue-200 rounded-lg p-4 shadow-lg">
        <div className="text-lg font-medium text-blue-800 mb-3">
          Use Case: {userDetails.useCase || "Not selected"}
        </div>
        <table className="w-full text-base">
          <tbody>
            <tr className="border-b border-blue-200">
              <td className="py-1 font-medium text-blue-700 text-lg">
                Order Number #
              </td>
              <td className="py-1 text-lg">
                {userDetails.orderNumber || "N/A"}
              </td>
            </tr>
            <tr className="border-b border-blue-200">
              <td className="py-1 font-medium text-blue-700 text-lg">
                Order Date
              </td>
              <td className="py-1 text-lg">
                {userDetails.orderDate || "N/A"}
              </td>
            </tr>
            <tr>
              <td className="py-1 font-medium text-blue-700 text-lg">
                Email ID
              </td>
              <td className="py-1 text-lg">
                {userDetails.email ? (
                  <a
                    href={`mailto:${userDetails.email}`}
                    className="text-blue-600 underline"
                  >
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
  )}
</div>


      {/* Support Widget - Bottom Right - Positioned higher to avoid chat widget overlap */}
      {!showVerificationForm && (
        <div className="fixed bottom-24 right-6 z-40">
          {/* Main Support Button - Only show when no call is active and widget is closed */}
          {!showSupportWidget && callStatus === "not-started" && (
            <button
              onClick={() => setShowSupportWidget(true)}
              className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors"
            >
              <MoreVertical className="w-8 h-8" />
            </button>
          )}

          {/* Support Options Popup - Improved Design */}
          {showSupportWidget && callStatus === "not-started" && (
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden min-w-72">
              <div className="space-y-1 p-2">
                {/* Click to Call */}
                <button
                  onClick={() => {
                    setShowSupportWidget(false)
                    toggleConversation()
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex items-center gap-4 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Click to Call</span>
                </button>

                {/* Click to Chat */}
                <button
                  onClick={() => {
                    setShowSupportWidget(false)
                    ;(window as any).voiceflow?.chat?.open()
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex items-center gap-4 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Click to Chat</span>
                </button>

                {/* Scan to Chat */}
                <div className="w-full bg-blue-600 text-white p-4 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-2">Scan to Chat</div>
                    <div className="bg-white p-2 rounded-lg">
                      <div className="w-16 h-16 bg-black flex items-center justify-center text-white text-xs font-mono">
                        QR CODE
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Call Interface - Corrected Layout */}
          {callStatus === "active" && (
            <div className="bg-blue-600 rounded-2xl shadow-2xl w-80 h-96">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <MoreVertical className="w-5 h-5 text-white" />
                    <Phone className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">Arlo Support</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log("Close button clicked")
                      setCallStatus("not-started")
                      setCurrentCallId(null)
                      setCallSummary(null)
                    }}
                    className="text-white hover:text-gray-200 p-1 z-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                  <div className="text-white text-xl font-medium text-center">Call in Progress...</div>

                  <button
                    onClick={toggleConversation}
                    disabled={callInProgress}
                    className="w-20 h-20 bg-red-500 hover:bg-red-600 disabled:bg-red-400 rounded-full flex items-center justify-center transition-colors shadow-lg border-4 border-white"
                  >
                    <Phone className="w-10 h-10 text-white transform rotate-[135deg]" />
                  </button>

                  <div className="text-white text-sm font-medium">Tap to end call</div>
                </div>
              </div>
            </div>
          )}

          {/* Post Call Interface with Inline Summary */}
          {callStatus === "inactive" && (
            <div className="bg-blue-600 rounded-2xl shadow-2xl w-80 min-h-96 max-h-[500px] overflow-y-auto">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <MoreVertical className="w-5 h-5 text-white" />
                    <Phone className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">Arlo Support</span>
                  </div>
                  <button
                    onClick={() => {
                      setCallStatus("not-started")
                      setCurrentCallId(null)
                      setCallSummary(null)
                    }}
                    className="text-white hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col space-y-4">
                  {/* Click to call button */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-white text-lg font-medium">Click to call</div>
                    <button
                      onClick={() => {
                        setCallStatus("not-started")
                        toggleConversation()
                      }}
                      className="w-16 h-16 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Phone className="w-8 h-8 text-blue-600" />
                    </button>
                  </div>

                  {/* Call Summary Section */}
                  <div className="border-t border-blue-500 pt-4 mt-4">
                    <button
                      onClick={() => {
                        if (currentCallId) {
                          // Always fetch fresh summary for current call
                          fetchCallSummary(currentCallId)
                        }
                        setShowCallSummary(!showCallSummary)
                      }}
                      className="text-white font-medium mb-3 hover:text-blue-200 transition-colors"
                    >
                      View call Summary
                    </button>

                    {showCallSummary && (
                      <div className="space-y-3 text-white text-sm">
                        {callSummary ? (
                          <div>
                            <span className="text-blue-200">Customer had a concern on:</span>
                            <div className="mt-1 text-white">
                              {callSummary.call_summary || "Call completed successfully"}
                            </div>
                          </div>
                        ) : currentCallId ? (
                          <div className="text-white text-sm">
                            <div className="text-blue-200">Loading call summary...</div>
                            <div className="mt-2 flex space-x-1">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-100"></div>
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-200"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-blue-200 text-sm">No recent call to summarize</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}
