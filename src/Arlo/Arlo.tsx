"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Mic, MessageCircle, History, ArrowLeft, Calendar, Play } from "lucide-react"
import { RetellWebClient } from "retell-client-js-sdk"

interface UserDetails {
  name: string
  orderNumber: string
  orderDate: string
  email: string
  useCase: string
}

interface CallRecord {
  call_id: string
  call_status: string
  start_timestamp: number
  end_timestamp: number
  duration_ms: number
  transcript: string
  retell_llm_dynamic_variables: {
    customer_name?: string
    order_number?: string
    email?: string
    use_case?: string
  }
  call_analysis?: {
    call_summary?: string
    user_sentiment?: string
    call_successful?: boolean
  }
  recording_url?: string
  disconnection_reason?: string
}

const webClient = new RetellWebClient()

const useCaseOptions = [
  "Enquired about the Order Delivery of Item Purchases Online",
  "Installation help for the newly purchased camera",
  "Jennifer is having internet connectivity issues",
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

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

const formatDuration = (durationMs: number) => {
  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export default function ArloDemo() {
  const [showVerificationForm, setShowVerificationForm] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState("")
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "Jennifer",
    orderNumber: "100RUN23W5",
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

  const fetchCallHistory = async (useFilter = false) => {
    setLoading(true)
    const apiKey = "key_2747254ddf6a6cdeea3935f67a5d"
    const agentId = "agent_f2c6614fdd0ac4727823d04a4a"

    try {
      // First API call - List calls
      const listCallsResponse = await fetch("https://api.retellai.com/v2/list-calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          filter_criteria: {
            agent_id: [agentId],
          },
        }),
      })

      if (!listCallsResponse.ok) {
        throw new Error(`Error fetching call list: ${listCallsResponse.status}`)
      }

      const callsList = await listCallsResponse.json()
      console.log("Calls list:", callsList)

      // Filter by date if provided and useFilter is true
      let filteredCalls = callsList
      if (useFilter && dateFilter) {
        const filterDate = new Date(dateFilter)
        filteredCalls = callsList.filter((call: any) => {
          const callDate = new Date(call.start_timestamp)
          return callDate.toDateString() === filterDate.toDateString()
        })
      }

      setCallHistory(filteredCalls)
    } catch (error) {
      console.error("Error fetching call history:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCallDetails = async (callId: string) => {
    const apiKey = "53b76c26-bd21-4509-98d7-c5cc62f93b59"

    try {
      // Second API call - Get specific call details
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
      console.log("Call details:", callDetails)
      setSelectedCall(callDetails)
    } catch (error) {
      console.error("Error fetching call details:", error)
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
    console.log("User details for call:", userDetails)

    const apiKey = "53b76c26-bd21-4509-98d7-c5cc62f93b59"
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

  // History Screen Component
  if (showHistory) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setShowHistory(false)
                  setSelectedCall(null)
                }}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Main
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Call History</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto p-4 flex-grow">
          {!selectedCall ? (
            // Call History List
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <button
                  onClick={() => fetchCallHistory(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Filter Calls"}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left">Call ID</th>
                      <th className="border border-gray-300 p-3 text-left">Customer</th>
                      <th className="border border-gray-300 p-3 text-left">Start Time</th>
                      <th className="border border-gray-300 p-3 text-left">Duration</th>
                      <th className="border border-gray-300 p-3 text-left">Status</th>
                      <th className="border border-gray-300 p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callHistory.map((call) => (
                      <tr key={call.call_id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3 font-mono text-sm">
                          {call.call_id.substring(0, 8)}...
                        </td>
                        <td className="border border-gray-300 p-3">
                          {call.retell_llm_dynamic_variables?.customer_name || "Unknown"}
                        </td>
                        <td className="border border-gray-300 p-3">{formatTimestamp(call.start_timestamp)}</td>
                        <td className="border border-gray-300 p-3">{formatDuration(call.duration_ms)}</td>
                        <td className="border border-gray-300 p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              call.call_status === "completed"
                                ? "bg-green-100 text-green-800"
                                : call.call_status === "registered"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {call.call_status}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-3">
                          <button
                            onClick={() => fetchCallDetails(call.call_id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {callHistory.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    No calls found. Click "Filter Calls" to load call history.
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Call Details View
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setSelectedCall(null)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to List
                </button>
                <h2 className="text-xl font-bold">Call Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Call Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Call Information</h3>
                  <div className="space-y-2">
                    <div>
                      <strong>Call ID:</strong> {selectedCall.call_id}
                    </div>
                    <div>
                      <strong>Status:</strong> {selectedCall.call_status}
                    </div>
                    <div>
                      <strong>Start Time:</strong> {formatTimestamp(selectedCall.start_timestamp)}
                    </div>
                    <div>
                      <strong>End Time:</strong> {formatTimestamp(selectedCall.end_timestamp)}
                    </div>
                    <div>
                      <strong>Duration:</strong> {formatDuration(selectedCall.duration_ms)}
                    </div>
                    <div>
                      <strong>Disconnection Reason:</strong> {selectedCall.disconnection_reason || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Customer Information</h3>
                  <div className="space-y-2">
                    <div>
                      <strong>Name:</strong> {selectedCall.retell_llm_dynamic_variables?.customer_name || "N/A"}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedCall.retell_llm_dynamic_variables?.email || "N/A"}
                    </div>
                    <div>
                      <strong>Order Number:</strong> {selectedCall.retell_llm_dynamic_variables?.order_number || "N/A"}
                    </div>
                    <div>
                      <strong>Use Case:</strong> {selectedCall.retell_llm_dynamic_variables?.use_case || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Call Analysis */}
                {selectedCall.call_analysis && (
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800">Call Analysis</h3>
                    <div className="space-y-2">
                      <div>
                        <strong>Summary:</strong> {selectedCall.call_analysis.call_summary || "N/A"}
                      </div>
                      <div>
                        <strong>User Sentiment:</strong> {selectedCall.call_analysis.user_sentiment || "N/A"}
                      </div>
                      <div>
                        <strong>Call Successful:</strong> {selectedCall.call_analysis.call_successful ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Transcript */}
                <div className="space-y-4 md:col-span-2">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-800">Transcript</h3>
                    {selectedCall.recording_url && (
                      <a
                        href={selectedCall.recording_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <Play className="w-4 h-4" />
                        Play Recording
                      </a>
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 rounded border max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {selectedCall.transcript || "No transcript available"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
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
                  defaultValue="100RUN23W5"
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
                    defaultValue="Installation help for the newly purchased camera"
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

      {/* Main Content */}
      <div className="w-full">
        <img src="/arlo/nav.png" alt="Arlo Navigation" className="w-full h-auto" />
      </div>

      {/* Hero Section */}
      <div className="relative">
        <img src="/arlo/home.png" alt="Arlo Hero Section" className="w-full h-96 object-cover" />
        {/* Vision Statement Overlay */}
        <div className="absolute top-8 left-8">
          <img src="/arlo/homeStyle.png" alt="Our vision statement" className="max-w-md h-auto" />
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
                    <td className="py-3 font-medium text-blue-700 text-lg">Order Date</td>
                    <td className="py-3 text-lg">
                      {!showVerificationForm && userDetails.orderDate ? userDetails.orderDate : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-blue-700 text-lg">Email ID</td>
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
            <div className="flex gap-8">
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

              {/* Watch History Button */}
              <button
                onClick={() => {
                  setShowHistory(true)
                  fetchCallHistory()
                }}
                className="flex flex-col items-center group"
              >
                <div className="w-24 h-24 rounded-full border-4 border-gray-300 bg-white flex items-center justify-center group-hover:border-blue-600 transition-all duration-300">
                  <History className="w-8 h-8 text-blue-600" />
                </div>
                <span className="mt-3 text-blue-600 font-medium">Watch History</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <img src="/arlo/footer.png" alt="Arlo Footer" className="w-full h-auto" />
      </div>
    </div>
  )
}

interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}
