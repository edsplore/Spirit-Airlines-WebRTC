"use client"

import { useEffect, useState, useCallback } from "react"
import { MessageCircle, X, Phone, MoreVertical } from 'lucide-react'
import { RetellWebClient } from "retell-client-js-sdk"
import QRCode from "react-qr-code"

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

const getOrderDate = () => {
  const today = new Date()
  const d = new Date(today)
  d.setDate(today.getDate() - 7)
  const day = d.getDate()
  const month = d.toLocaleString("default", { month: "short" })
  const year = d.getFullYear().toString().slice(-2)
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
  const [showPostCallPanel, setShowPostCallPanel] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "Jennifer",
    orderNumber: "100RUN23W5",
    orderDate: getOrderDate(),
    email: "jennifer1234@gmail.com",
    useCase: "",
  })
  const [selectedUseCase, setSelectedUseCase] = useState<string>("")
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [callInProgress, setCallInProgress] = useState(false)
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)
  const [callSummary, setCallSummary] = useState<CallSummary | null>(null)
  const [showCallSummary, setShowCallSummary] = useState(false)

  const initializeChatWidget = useCallback(() => {
    if (window.voiceflow?.chat) {
      try { window.voiceflow.chat.destroy() } catch {}
    }
    document.querySelector('script[src*="voiceflow.com"]')?.remove()
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
            launch: { event: { type: "launch", payload: {
              customer_name: "${userDetails.name}",
              order_number: "${userDetails.orderNumber}",
              order_date: "${userDetails.orderDate}",
              email: "${userDetails.email}",
              use_case: "${userDetails.useCase}"
            } } },
          });
        }
        v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";
        s.parentNode.insertBefore(v, s);
      })(document, 'script');
    `
    document.body.appendChild(script)
    return script
  }, [userDetails])

  const openChatWidget = useCallback(() => {
    const tryOpen = () => {
      try { window.voiceflow?.chat.open(); return true }
      catch { return false }
    }
    if (tryOpen()) return
    const scr = initializeChatWidget()
    const id = setInterval(() => { if (tryOpen()) clearInterval(id) }, 500)
    setTimeout(() => clearInterval(id), 10000)
    return () => scr.parentNode?.removeChild(scr)
  }, [initializeChatWidget])

  useEffect(() => {
    if (formSubmitted) {
      const scr = initializeChatWidget()
      return () => scr.parentNode?.removeChild(scr)
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
      setShowFormPanel(false)
      setShowPostCallPanel(true)
    })
    webClient.on("error", () => {
      setCallStatus("inactive")
      setCallInProgress(false)
      setShowFormPanel(false)
      setShowPostCallPanel(true)
    })
    return () => {
      webClient.off("conversationStarted")
      webClient.off("conversationEnded")
      webClient.off("error")
      if (window.voiceflow?.chat) window.voiceflow.chat.destroy()
    }
  }, [])

  const registerCall = async (agentId: string): Promise<RegisterCallResponse> => {
    const resp = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer key_2747254ddf6a6cdeea3935f67a5d`,
      },
      body: JSON.stringify({
        agent_id: agentId,
        retell_llm_dynamic_variables: {
          customer_name: userDetails.name,
          order_number: userDetails.orderNumber,
          order_date: userDetails.orderDate,
          email: userDetails.email,
          use_case: userDetails.useCase,
        },
      }),
    })
    if (!resp.ok) throw new Error()
    const data = await resp.json()
    return {
      access_token: data.access_token,
      callId: data.call_id,
      sampleRate: Number.parseInt(process.env.REACT_APP_RETELL_SAMPLE_RATE || "16000", 10),
    }
  }

  const initiateConversation = async () => {
    const { access_token, callId, sampleRate } = await registerCall("agent_f2c6614fdd0ac4727823d04a4a")
    if (callId && access_token) {
      setCurrentCallId(callId)
      setCallSummary(null)
      await webClient.startCall({ accessToken: access_token, callId, sampleRate, enableUpdate: true })
      setCallStatus("active")
    }
    setCallInProgress(false)
  }

  const toggleConversation = async () => {
    if (callInProgress) return
    setCallInProgress(true)

    if (callStatus === "active") {
      try {
        const res = webClient.stopCall()
        if (res instanceof Promise) await res
      } catch {}
      setCallStatus("inactive")
      setCallInProgress(false)
      setShowFormPanel(false)
      setShowPostCallPanel(true)
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        await initiateConversation()
      } catch {
        setCallInProgress(false)
      }
    }
  }

  const fetchCallSummary = async (callId: string) => {
    try {
      const resp = await fetch(`https://api.retellai.com/v2/get-call/${callId}`, {
        headers: { Authorization: `Bearer key_2747254ddf6a6cdeea3935f67a5d` },
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

  const resetForNewCall = () => {
    setFormSubmitted(false)
    setShowFormPanel(true)
    setShowPostCallPanel(false)
    setCallStatus("not-started")
    setCurrentCallId(null)
    setCallSummary(null)
    setShowCallSummary(false)
    setSelectedUseCase("")
    setUserDetails({
      name: "Jennifer",
      orderNumber: "100RUN23W5",
      orderDate: getOrderDate(),
      email: "jennifer1234@gmail.com",
      useCase: "",
    })
  }

  const handleFormSubmit = () => {
    const form = document.getElementById("callForm") as HTMLFormElement
    if (!form) return
    const fd = new FormData(form)
    const raw = fd.get("useCase") as string
    const stripped = raw.replace(/^\d+\.\s*/, "")
    setUserDetails({
      name: "Jennifer",
      orderNumber: fd.get("orderNumber") as string,
      orderDate: fd.get("orderDate") as string,
      email: fd.get("email") as string,
      useCase: stripped,
    })
    setFormSubmitted(true)
    toggleConversation()
  }

  const closeAllPanels = () => {
    setShowSupportWidget(false)
    setShowFormPanel(false)
    setShowPostCallPanel(false)
    setCallStatus("not-started")
    setCurrentCallId(null)
    setCallSummary(null)
    setShowCallSummary(false)
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <img src="/arlo/bkgArlo.jpeg" alt="Arlo Hero" className="w-full h-screen object-fit" />

      <div className="fixed bottom-4 right-6 z-40">
        {!showSupportWidget && !showFormPanel && !showPostCallPanel && callStatus === "not-started" && (
          <button
            onClick={() => setShowSupportWidget(true)}
            className="w-16 h-16 bg-[#115292] rounded-full flex items-center justify-center text-white shadow-lg"
          >
            <MoreVertical className="w-8 h-8" />
          </button>
        )}

        {showSupportWidget && (
          <div className="bg-transparent rounded-2xl shadow-2xl border-none p-2 space-y-2 min-w-72">
            <button
              onClick={() => { setShowSupportWidget(false); setShowFormPanel(true) }}
              className="w-full bg-[#115292] text-white p-4 rounded-xl flex items-center justify-between"
            >
              <span>Click to Call</span>
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setShowSupportWidget(false); openChatWidget() }}
              className="w-full bg-[#115292] text-white p-4 rounded-xl flex items-center justify-between"
            >
              <span>Click to Chat</span>
              <MessageCircle className="w-5 h-5" />
            </button>
            <div className="w-full bg-[#115292] text-white p-4 rounded-xl flex flex-col items-center gap-2">
              <div className="font-medium">Scan to WhatsApp</div>
              <QRCode
                value="https://wa.me/15551234567"
                size={60}
                bgColor="#115292"
                fgColor="#ffffff"
              />
            </div>
          </div>
        )}



        {showFormPanel && (
          <div className="bg-[#115292] rounded-2xl shadow-2xl w-80 min-h-96 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <img src="/arlo/ARLO.png" alt="Company Logo" className="w-6 h-6" />
              <span className="text-white font-medium flex items-center gap-2">
              Arlo Support
              </span>
              <X onClick={closeAllPanels} className="w-5 h-5 text-white cursor-pointer" />
            </div>

            <form id="callForm" className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Order#</label>
                <input
                  name="orderNumber"
                  defaultValue={userDetails.orderNumber}
                  readOnly
                  className="w-full p-2 bg-gray-200 border border-gray-300 text-gray-600 text-sm rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Order Date</label>
                <input
                  name="orderDate"
                  defaultValue={userDetails.orderDate}
                  readOnly
                  className="w-full p-2 bg-gray-200 border border-gray-300 text-gray-600 text-sm rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Email id:</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={userDetails.email}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-600 text-sm rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">Select Use Case</label>
                <select
                  name="useCase"
                  value={selectedUseCase}
                  onChange={e => setSelectedUseCase(e.target.value)}
                  disabled={callStatus === "active"}
                  className={`w-full p-2 text-sm rounded ${
                    callStatus === "active"
                      ? "bg-gray-200 text-gray-600 border border-gray-300"
                      : "bg-[#115292] text-white border border-white"
                  }`}
                >
                  <option value="" disabled>Select a use case</option>
                  {useCaseOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center mb-4">
                {callStatus === "not-started" && (
                  <button
                    type="button"
                    onClick={handleFormSubmit}
                    disabled={!selectedUseCase}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center disabled:opacity-50"
                  >
                    <Phone className="w-8 h-8 text-[#115292]" />
                  </button>
                )}
                {callStatus === "active" && (
                  <button
                    onClick={toggleConversation}
                    disabled={callInProgress}
                    className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center disabled:bg-red-400 border-4 border-white"
                  >
                    <Phone className="w-10 h-10 text-white transform rotate-[135deg]" />
                  </button>
                )}
              </div>

              <div className="flex flex-col items-center">
                <span className="text-white font-medium">
                  {callStatus === "active" ? "Call in progress..." : "Click to call"}
                </span>
              </div>
            </form>

            <div className="mt-auto pt-4 border-t border-white text-xs text-gray-200">
              <div className="font-medium mb-2">Disclaimer:</div>
              <ul className="space-y-1">
                <li>■ The platform isn't integrated with company systems, so it requires authentication details.</li>
                <li>■ An email ID is needed for instant messages and confirmation.</li>
              </ul>
            </div>
          </div>
        )}

        {showPostCallPanel && (
  <div className="bg-[#115292] rounded-2xl shadow-2xl w-80 h-[39rem] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                            <img src="/arlo/ARLO.png" alt="Company Logo" className="w-6 h-6" />

              <span className="text-white font-medium flex items-center gap-2">
              Arlo Support
              </span>
              <X onClick={closeAllPanels} className="w-5 h-5 text-white cursor-pointer" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="text-white text-lg font-medium">Click to call</div>
              <button
                onClick={resetForNewCall}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center"
              >
                <Phone className="w-8 h-8 text-[#115292]" />
              </button>
            </div>

            <div className="pt-4 border-t border-white text-sm text-white">
              <button
                onClick={() => {
                  currentCallId && fetchCallSummary(currentCallId)
                  setShowCallSummary(v => !v)
                }}
                className="font-medium mb-3 hover:underline"
              >
                View call Summary
              </button>
              {showCallSummary && (
                <div className="space-y-3">
                  {callSummary ? (
                    <div className="mt-1">{callSummary.call_summary}</div>
                  ) : (
                    <div>Loading call summary...</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}