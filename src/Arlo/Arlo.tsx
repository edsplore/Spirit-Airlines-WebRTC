"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Phone } from "lucide-react";
import { RetellWebClient } from "retell-client-js-sdk";
import QRCode from "react-qr-code";

interface UserDetails {
  name: string;
  orderNumber: string;
  orderDate: string;
  email: string;
  useCase: string;
  phoneNumber?: string;
}

interface CallSummary {
  call_id: string;
  call_summary?: string;
  user_sentiment?: string;
  call_successful?: boolean;
  duration_ms?: number;
  transcript?: string;
}

interface RegisterCallResponse {
  access_token?: string;
  callId?: string;
  sampleRate: number;
}

const webClient = new RetellWebClient();

const useCaseOptions = [
  "1. Tracked an online order",
  "2. Requested help with camera setup",
  "3. Reported internet issues",
];

const getOrderDate = () => {
  const today = new Date();
  const d = new Date(today);
  d.setDate(today.getDate() - 7);
  const day = d.getDate();
  const month = d.toLocaleString("default", { month: "short" });
  const year = d.getFullYear().toString().slice(-2);
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
      ? "nd"
      : day === 3 || day === 23
      ? "rd"
      : "th";
  return `${day}${suffix} ${month}'${year}`;
};

export default function ArloDemo() {
  // panel toggles
  // eslint-disable-next-line
  const [showSupportWidget, setShowSupportWidget] = useState(false);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [showPostCallPanel, setShowPostCallPanel] = useState(false);
  // eslint-disable-next-line
  const [formSubmitted, setFormSubmitted] = useState(false);

  // user + call state
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "Jennifer",
    orderNumber: "123RUN56V7",
    orderDate: getOrderDate(),
    email: "jennifer1234@gmail.com",
    useCase: "",
    phoneNumber: "",
  });
  const [selectedUseCase, setSelectedUseCase] = useState<string>("");
  const [callStatus, setCallStatus] = useState<
    "not-started" | "active" | "inactive"
  >("not-started");
  const [callInProgress, setCallInProgress] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [callSummary, setCallSummary] = useState<CallSummary | null>(null);
  const [showCallSummary, setShowCallSummary] = useState(false);

  // load voiceflow chat widget immediately (independent of call)
  const initializeChatWidget = useCallback(() => {
    if (window.voiceflow?.chat) {
      try {
        window.voiceflow.chat.destroy();
      } catch {}
    }
    document.querySelector('script[src*="voiceflow.com"]')?.remove();
    const script = document.createElement("script");
    const projectId = "685e60329036e9e5b907027b";
    script.type = "text/javascript";
    script.innerHTML = `
      (function(d, t) {
        var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
        v.onload = function() {
          window.voiceflow.chat.load({
            verify: { projectID: '${projectId}' },
            url: 'https://general-runtime.voiceflow.com',
            versionID: 'production',
            voice: { url: "https://runtime-api.voiceflow.com" },
            // no automatic launch event here; user clicks default bubble
          });
        }
        v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";
        s.parentNode.insertBefore(v, s);
      })(document, 'script');
    `;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
      if (window.voiceflow?.chat) window.voiceflow.chat.destroy();
    };
  }, []);

  useEffect(() => {
    initializeChatWidget();
  }, [initializeChatWidget]);

  // Retell call event handlers
  useEffect(() => {
    webClient.on("conversationStarted", () => {
      setCallStatus("active");
      setCallInProgress(false);
    });
    webClient.on("conversationEnded", () => {
      setCallStatus("inactive");
      setCallInProgress(false);
      setShowFormPanel(false);
      setShowPostCallPanel(true);
    });
    webClient.on("error", () => {
      setCallStatus("inactive");
      setCallInProgress(false);
      setShowFormPanel(false);
      setShowPostCallPanel(true);
    });
    return () => {
      webClient.off("conversationStarted");
      webClient.off("conversationEnded");
      webClient.off("error");
    };
  }, []);

  const registerCall = async (
    agentId: string,
    details: UserDetails
  ): Promise<RegisterCallResponse> => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer key_2747254ddf6a6cdeea3935f67a5d`,
    };

    let resp, data;
    if (details.phoneNumber) {
      // Phone call
      resp = await fetch("https://api.retellai.com/v2/create-phone-call", {
        method: "POST",
        headers,
        body: JSON.stringify({
          agent_id: agentId,
          from_number: "+16073899157",
          to_number: details.phoneNumber,
          retell_llm_dynamic_variables: {
            customer_name: details.name,
            order_number: details.orderNumber,
            order_date: details.orderDate,
            email: details.email,
            use_case: details.useCase,
          },
        }),
      });
      if (!resp.ok) throw new Error("Failed to create phone call");
      data = await resp.json();
    } else {
      // Web call
      resp = await fetch("https://api.retellai.com/v2/create-web-call", {
        method: "POST",
        headers,
        body: JSON.stringify({
          agent_id: agentId,
          retell_llm_dynamic_variables: {
            customer_name: details.name,
            order_number: details.orderNumber,
            order_date: details.orderDate,
            email: details.email,
            use_case: details.useCase,
          },
        }),
      });
      if (!resp.ok) throw new Error("Failed to create web call");
      data = await resp.json();
    }

    return {
      access_token: data.access_token,
      callId: data.call_id,
      sampleRate: parseInt(
        process.env.REACT_APP_RETELL_SAMPLE_RATE || "16000",
        10
      ),
    };
  };

  const initiateConversation = async (
    overrideDetails?: Partial<UserDetails>
  ) => {
    const details: UserDetails = {
      ...userDetails,
      ...overrideDetails!,
    };
    setUserDetails(details);

    const { access_token, callId, sampleRate } = await registerCall(
      "agent_f2c6614fdd0ac4727823d04a4a",
      details
    );

    if (callId && access_token) {
      setCurrentCallId(callId);
      setCallSummary(null);
      await webClient.startCall({
        accessToken: access_token,
        callId,
        sampleRate,
        enableUpdate: true,
      });
      setCallStatus("active");
    }
    setCallInProgress(false);
  };

  const toggleConversation = async () => {
    if (callInProgress) return;
    setCallInProgress(true);

    if (callStatus === "active") {
      try {
        const res = webClient.stopCall();
        if (res instanceof Promise) await res;
      } catch {}
      setCallStatus("inactive");
      setCallInProgress(false);
      setShowFormPanel(false);
      setShowPostCallPanel(true);
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await initiateConversation();
      } catch {
        setCallInProgress(false);
      }
    }
  };

  const fetchCallSummary = async (callId: string) => {
    try {
      const resp = await fetch(
        `https://api.retellai.com/v2/get-call/${callId}`,
        {
          headers: { Authorization: `Bearer key_2747254ddf6a6cdeea3935f67a5d` },
        }
      );
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setCallSummary({
        call_id: data.call_id,
        call_summary: data.call_analysis.call_summary,
        user_sentiment: data.call_analysis.user_sentiment,
        call_successful: data.call_analysis.call_successful,
        duration_ms: data.duration_ms,
        transcript: data.transcript,
      });
    } catch {
      setCallSummary({
        call_id: callId,
        call_summary: "Call completed successfully",
        user_sentiment: "Neutral",
        call_successful: true,
        duration_ms: 0,
        transcript: "Transcript not available",
      });
    }
  };

  const resetForNewCall = () => {
    setFormSubmitted(false);
    setShowFormPanel(true);
    setShowPostCallPanel(false);
    setCallStatus("not-started");
    setCurrentCallId(null);
    setCallSummary(null);
    setShowCallSummary(false);
    setSelectedUseCase("");
    setUserDetails({
      name: "Jennifer",
      orderNumber: "123RUN56V7",
      orderDate: getOrderDate(),
      email: "jennifer1234@gmail.com",
      useCase: "",
      phoneNumber: "",
    });
  };

  const handleFormSubmit = () => {
    const form = document.getElementById("callForm") as HTMLFormElement;
    if (!form) return;
    const fd = new FormData(form);
    const raw = fd.get("useCase") as string;
    const stripped = raw.replace(/^\d+\.\s*/, "");

    const overrideDetails: Partial<UserDetails> = {
      orderNumber: fd.get("orderNumber") as string,
      orderDate: fd.get("orderDate") as string,
      email: fd.get("email") as string,
      useCase: stripped,
      phoneNumber: (fd.get("phoneNumber") as string) || "",
    };

    setFormSubmitted(true);
    initiateConversation(overrideDetails);
  };

  const closeAllPanels = () => {
    setShowSupportWidget(false);
    setShowFormPanel(false);
    setShowPostCallPanel(false);
    setCallStatus("not-started");
    setCurrentCallId(null);
    setCallSummary(null);
    setShowCallSummary(false);
  };

  // New state for QR modal
  const [showQRExpanded, setShowQRExpanded] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative">
      <img
        src="/arlo/bkgArlo.jpeg"
        alt="Arlo Hero"
        className="w-full h-screen object-fit"
      />

      <div className="fixed bottom-16 right-6 z-40">
        {/* support toggle */}
        {!showFormPanel &&
          !showPostCallPanel &&
          callStatus === "not-started" && (
            <div className="flex flex-col items-end space-y-2">
              {/* — inline expanded QR panel */}
              {showQRExpanded && (
                <div className="bg-white rounded-2xl p-4 shadow-lg w-36 text-center">
                  <QRCode
                    value="https://wa.me/16508008958"
                    size={120}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    className="mx-auto"
                  />
                </div>
              )}

              {/* — Scan to WhatsApp bubble */}
              <button
                onClick={() => setShowQRExpanded((v) => !v)}
                className="
                flex items-center space-x-2
                bg-[#115292] text-white
                rounded-[18px] px-3.5 py-2
                shadow-lg
              "
              >
                <QRCode
                  value="https://wa.me/16508008958"
                  size={23}
                  bgColor="#115292"
                  fgColor="#ffffff"
                />
                <span className="text-sm">To WhatsApp</span>
              </button>

              {/* — Click to Call bubble */}
              <button
                onClick={() => {
                  setShowFormPanel(true);
                  setShowQRExpanded(false);
                }}
                className="flex items-center space-x-3 bg-[#115292] text-white rounded-full px-5 py-2.5 shadow-lg"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">Click to Call</span>
              </button>
            </div>
          )}

        {/* form panel */}
        {showFormPanel && (
          <div   className="
    bg-[#115292]
    rounded-2xl
    shadow-2xl
    w-80
    max-h-50
    p-4
    flex flex-col
    overflow-y-auto
  "
>
            <div className="flex items-center justify-between mb-4">
              <img
                src="/arlo/ARLO.png"
                alt="Company Logo"
                className="w-6 h-6"
              />
              <span className="text-white font-medium">Arlo Support</span>
              <X
                onClick={closeAllPanels}
                className="w-5 h-5 text-white cursor-pointer"
              />
            </div>

            <form id="callForm" className="flex-1 space-y-4">
              {/* order#, date, email */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Order#
                </label>
                <input
                  name="orderNumber"
                  defaultValue={userDetails.orderNumber}
                  readOnly
                  className="w-full p-2 bg-gray-200 border border-gray-300 text-gray-600 text-sm rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Order Date
                </label>
                <input
                  name="orderDate"
                  defaultValue={userDetails.orderDate}
                  readOnly
                  className="w-full p-2 bg-gray-200 border border-gray-300 text-gray-600 text-sm rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Email:
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={userDetails.email}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-600 text-sm rounded"
                />
              </div>

              {/* phone number */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Phone Number
                </label>
                <input
                  name="phoneNumber"
                  type="tel"
                  placeholder="+11234567890"
                  defaultValue={userDetails.phoneNumber}
                  className="w-full p-2 bg-white border border-gray-300 text-gray-600 text-sm rounded"
                />
              </div>

              {/* use case */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Select Use Case
                </label>
                <select
                  name="useCase"
                  value={selectedUseCase}
                  onChange={(e) => setSelectedUseCase(e.target.value)}
                  disabled={callStatus === "active"}
                  className={`w-full p-2 text-sm rounded ${
                    callStatus === "active"
                      ? "bg-gray-200 text-gray-600 border border-gray-300"
                      : "bg-[#115292] text-white border border-white"
                  }`}
                >
                  <option value="" disabled>
                    Select a use case
                  </option>
                  {useCaseOptions.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* call button */}
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
                  {callStatus === "active"
                    ? "Call in progress..."
                    : "Click to call"}
                </span>
              </div>
            </form>

            {/* disclaimer */}
            <div className="mt-auto pt-4 border-t border-white text-xs text-gray-200">
              <div className="font-medium mb-2">Disclaimer:</div>
              <ul className="space-y-1">
                <li>
                  ■ Platform isn't integrated, so requires authentication.
                </li>
                <li>■ Email ID needed for confirmations.</li>
              </ul>
            </div>
          </div>
        )}

        {/* post-call panel */}
        {showPostCallPanel && (
          <div className="bg-[#115292] rounded-2xl shadow-2xl w-80 h-[39rem] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <img
                src="/arlo/ARLO.png"
                alt="Company Logo"
                className="w-6 h-6"
              />
              <span className="text-white font-medium">Arlo Support</span>
              <X
                onClick={closeAllPanels}
                className="w-5 h-5 text-white cursor-pointer"
              />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="text-white text-lg font-medium">
                Click to call
              </div>
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
                  currentCallId && fetchCallSummary(currentCallId);
                  setShowCallSummary((v) => !v);
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
  );
}
