"use client"

import { useEffect, useState, useCallback } from "react"
import { MessageCircle, QrCode, X, Phone, MoreVertical } from 'lucide-react'
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

interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}

const webClient = new RetellWebClient()

const useCaseOptions = [
  "1. Tracked an online order",
  "2. Requested help with camera setup",
  "3. Reported internet issues",
]

// Function to get current date minus 7 days
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

export default function ArloDemo() {
  const [showSupportWidget, setShowSupportWidget] = useState(false)
  const [showFormPanel, setShowFormPanel] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "Jennifer",
    orderNumber: "",
    orderDate: getOrderDate(),
    email: "",
    useCase: "",
  })
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [callInProgress, setCallInProgress] = useState(false)
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)
  const [callSummary, setCallSummary] = useState<CallSummary | null>(null)
  const [showCallSummary, setShowCallSummary] = useState(false)
   // eslint-disable-next-line
  const [chatWidgetLoaded, setChatWidgetLoaded] = useState(false)

  const initializeChatWidget = useCallback(() => {
    if (window.voiceflow && window.voiceflow.chat) {
      try {
        window.voiceflow.chat.destroy()
      } catch {}
    }

    const existingScript = document.querySelector('script[src*="voiceflow.com"]')
    if (existingScript) existingScript.remove()

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
            voice: { url: "https://runtime-api.voiceflow.com" },
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
          setTimeout(() => { window.chatWidgetLoaded = true }, 1000);
        }
        v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";
        s.parentNode.insertBefore(v, s);
      })(document, 'script');
    `
    document.body.appendChild(script)
    setTimeout(() => setChatWidgetLoaded(true), 2000)
    return script
  }, [userDetails])

  const openChatWidget = useCallback(() => {
    const attemptOpen = () => {
      if (window.voiceflow && window.voiceflow.chat) {
        try {
          window.voiceflow.chat.open()
          return true
        } catch {
          return false
        }
      }
      return false
    }

    if (attemptOpen()) return

    setChatWidgetLoaded(false)
    initializeChatWidget()

    const checkAndOpen = setInterval(() => {
      if (attemptOpen()) clearInterval(checkAndOpen)
    }, 500)

    setTimeout(() => clearInterval(checkAndOpen), 10000)
  }, [initializeChatWidget])

  useEffect(() => {
    if (formSubmitted) {
      const scr = initializeChatWidget()
      return () => {
        if (scr.parentNode) scr.parentNode.removeChild(scr)
      }
    }
  }, [formSubmitted, initializeChatWidget])

  useEffect(() => {
    webClient.on("conversationStarted", () => {
      setCallStatus("active")
      setCallInProgress(false)
    })

    webClient.on("conversationEnded", () => {
      setCallStatus("inactive")
      setCallInProgress(false)
      setTimeout(() => initializeChatWidget(), 1000)
    })

    webClient.on("error", () => {
      setCallStatus("inactive")
      setCallInProgress(false)
    })

    return () => {
      webClient.off("conversationStarted")
      webClient.off("conversationEnded")
      webClient.off("error")
      if (window.voiceflow && window.voiceflow.chat) {
        window.voiceflow.chat.destroy()
      }
    }
  }, [initializeChatWidget])

  const fetchCallSummary = async (callId: string) => {
    const apiKey = "key_2747254ddf6a6cdeea3935f67a5d"
    try {
      const resp = await fetch(`https://api.retellai.com/v2/get-call/${callId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (!resp.ok) throw new Error()
      const data = await resp.json()
      setCallSummary({
        call_id: data.call_id,
        call_summary: data.call_analysis.call_summary,
        user_sentiment: data.call_analysis.user_sentiment,
        call_successful: data.call_analysis.call_successful,
        duration_ms: data.duration_ms,
        transcript: data.transcript,
      })
    } catch {
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

  // Reset all states to allow starting a new call
  const resetForNewCall = () => {
    setFormSubmitted(false)
    setShowFormPanel(true)
    setCallStatus("not-started")
    setCurrentCallId(null)
    setCallSummary(null)
    setShowCallSummary(false)
    setUserDetails({
      name: "Jennifer",
      orderNumber: "",
      orderDate: getOrderDate(),
      email: "",
      useCase: "",
    })
  }

  const toggleConversation = async () => {
    if (callInProgress) return

    setCallInProgress(true)

    if (callStatus === "active") {
      // Ending an active call
      try {
        const result = webClient.stopCall()
        if (result instanceof Promise) {
          await result
        }
      } catch (err) {
        console.error("Failed to stop call:", err)
      } finally {
        setCallInProgress(false)
        setCallStatus("inactive")
      }
    } else {
      // Starting a new call
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        await initiateConversation()
      } catch (err) {
        console.error("Could not start call:", err)
        setCallInProgress(false)
      }
    }
  }

  const initiateConversation = async () => {
    const agentId = "agent_f2c6614fdd0ac4727823d04a4a"
    const { access_token, callId, sampleRate } = await registerCall(agentId)

    if (callId && access_token) {
      setCurrentCallId(callId)
      setCallSummary(null)

      await webClient.startCall({
        accessToken: access_token,
        callId,
        sampleRate,
        enableUpdate: true,
      })

      setCallStatus("active")
      setShowFormPanel(false)
    }
    setCallInProgress(false)
  }

  const registerCall = async (agentId: string): Promise<RegisterCallResponse> => {
    const apiKey = "key_2747254ddf6a6cdeea3935f67a5d"
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

    const resp = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) throw new Error()

    const data = await resp.json()
    return {
      access_token: data.access_token,
      callId: data.call_id,
      sampleRate: Number.parseInt(process.env.REACT_APP_RETELL_SAMPLE_RATE || "16000", 10),
    }
  }

  const handleFormSubmit = () => {
    const form = document.getElementById("callForm") as HTMLFormElement
    if (!form) return

    const fd = new FormData(form)
    const newDetails: UserDetails = {
      name: "Jennifer",
      orderNumber: fd.get("orderNumber") as string,
      orderDate: fd.get("orderDate") as string,
      email: fd.get("email") as string,
      useCase: fd.get("useCase") as string,
    }

    setUserDetails(newDetails)
    setFormSubmitted(true)
    setShowFormPanel(false)
    toggleConversation()
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="w-full h-screen relative">
        <img src="/arlo/bkgArlo.jpeg" alt="Arlo Hero" className="w-full h-full object-fit" />
      </div>

      <div className="fixed bottom-4 right-6 z-40">
        {!showSupportWidget && !showFormPanel && callStatus === "not-started" && (
          <button
            onClick={() => setShowSupportWidget(true)}
            className="w-16 h-16 bg-[#115292] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#115292] transition-colors"
          >
            <MoreVertical className="w-8 h-8" />
          </button>
        )}

        {showSupportWidget && callStatus === "not-started" && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden min-w-72">
            <div className="space-y-1 p-2">
              <button
                onClick={() => {
                  setShowSupportWidget(false)
                  setShowFormPanel(true)
                }}
                className="w-full bg-[#115292] hover:bg-[#115292] text-white p-4 rounded-xl flex items-center gap-4 transition-colors"
              >
                <div className="w-10 h-10 bg-[#115292] rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <span className="font-medium">Click to Call</span>
              </button>

              <button
                onClick={() => {
                  setShowSupportWidget(false)
                  openChatWidget()
                }}
                className="w-full bg-[#115292] hover:bg-[#115292] text-white p-4 rounded-xl flex items-center gap-4 transition-colors"
              >
                <div className="w-10 h-10 bg-[#115292] rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="font-medium">Click to Chat</span>
              </button>

              <div className="w-full bg-[#115292] text-white p-4 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 bg-[#115292] rounded-full flex items-center justify-center">
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

        {showFormPanel && callStatus === "not-started" && (
          <div className="bg-[#115292] rounded-2xl shadow-2xl w-80 min-h-96">
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img src="/arlo/ARLO.png" alt="Company Logo" className="w-6 h-6" />
                  <span className="text-white font-medium">Arlo Support</span>
                </div>
                <button onClick={() => setShowFormPanel(false)} className="text-white hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form id="callForm" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Order#</label>
                  <input
                    type="text"
                    name="orderNumber"
                    defaultValue="100RUN23W5"
                    className="w-full p-2 bg-[#115292] border border-white text-white placeholder-white text-sm focus:outline-none focus:ring-2 focus:ring-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">Order Date</label>
                  <input
                    type="text"
                    name="orderDate"
                    defaultValue={userDetails.orderDate}
                    className="w-full p-2 bg-[#115292] border border-white text-white placeholder-white text-sm focus:outline-none focus:ring-2 focus:ring-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">Email id:</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue="jennifer1234@gmail.com"
                    className="w-full p-2 bg-[#115292] border border-white text-white placeholder-white text-sm focus:outline-none focus:ring-2 focus:ring-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">Select Use Case</label>
                  <select
                    name="useCase"
                    defaultValue=""
                    className="w-full p-2 bg-[#115292] border border-white text-white text-sm focus:outline-none focus:ring-2 focus:ring-white rounded"
                    required
                  >
                    <option value="" disabled>
                      Select a use case
                    </option>
                    {useCaseOptions.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center mb-6">
                  <button
                    type="button"
                    onClick={handleFormSubmit}
                    className="w-16 h-16 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Phone className="w-8 h-8 text-[#115292]" />
                  </button>
                </div>

                <div className="flex flex-col items-center mb-4">
                  <span className="text-white mt-2 font-medium">Click to call</span>
                </div>
              </form>

              <div className="mt-4 pt-4 border-t border-white">
                <div className="font-medium text-white mb-2 text-sm">Disclaimer:</div>
                <ul className="space-y-1 text-xs text-white">
                  <li className="flex items-start">
                    <span className="mr-2 font-bold text-white">■</span>
                    <span className="text-white">
                      The platform isn't integrated with company systems, so it requires authentication details.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 font-bold text-white">■</span>
                    <span className="text-white">An email ID is needed for instant messages and confirmation.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Active Call Panel */}
        {callStatus === "active" && (
          <div className="bg-[#115292] rounded-2xl shadow-2xl w-80 min-h-96">
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img src="/arlo/ARLO.png" alt="Company Logo" className="w-6 h-6" />
                  <span className="text-white font-medium">Arlo Support</span>
                </div>
                <button
                  onClick={() => {
                    setCallStatus("not-started")
                    setCurrentCallId(null)
                    setCallSummary(null)
                  }}
                  className="text-white hover:text-gray-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-white text-center mb-4">Click to end call</div>

              <div className="flex justify-center mb-6">
                <button
                  onClick={toggleConversation}
                  disabled={callInProgress}
                  className="w-20 h-20 bg-red-500 hover:bg-red-600 disabled:bg-red-400 rounded-full flex items-center justify-center transition-colors shadow-lg border-4 border-white"
                >
                  <Phone className="w-10 h-10 text-white transform rotate-[135deg]" />
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-white">
                <div className="font-medium text-white mb-2 text-sm">Disclaimer:</div>
                <ul className="space-y-1 text-xs text-white">
                  <li className="flex items-start">
                    <span className="mr-2 font-bold text-white">■</span>
                    <span>
                      The platform isn't integrated with company systems, so it requires authentication details.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 font-bold text-white">■</span>
                    <span>An email ID is needed for instant messages and confirmation.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Post-Call Panel */}
        {callStatus === "inactive" && (
          <div className="bg-[#115292] rounded-2xl shadow-2xl w-80 max-h-[500px] overflow-y-auto">
            <div className="p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
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

              <div className="flex flex-col items-center space-y-4 mb-6">
                <div className="text-white text-lg font-medium">Click to call</div>
                <button
                  onClick={resetForNewCall}
                  className="w-16 h-16 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
                >
                  <Phone className="w-8 h-8 text-[#115292]" />
                </button>
              </div>

              <div className="border-t border-white pt-4 mt-4">
                <button
                  onClick={() => {
                    if (currentCallId) fetchCallSummary(currentCallId)
                    setShowCallSummary(!showCallSummary)
                  }}
                  className="text-white font-medium mb-3 hover:text-white transition-colors"
                >
                  View call Summary
                </button>
                {showCallSummary && (
                  <div className="space-y-3 text-white text-sm">
                    {callSummary ? (
                      <div>
                        <div className="text-white">Customer had a concern on:</div>
                        <div className="mt-1">{callSummary.call_summary}</div>
                      </div>
                    ) : currentCallId ? (
                      <div>
                        <div className="text-white">Loading call summary...</div>
                        <div className="mt-2 flex space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-100" />
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-200" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-white">No recent call to summarize</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
