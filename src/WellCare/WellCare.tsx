import type React from "react";
import { useEffect, useState } from "react";
import { Mic } from "lucide-react";
import { RetellWebClient } from "retell-client-js-sdk";

const webClient = new RetellWebClient();

export default function WellCareBasic() {
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started");
  const [callInProgress, setCallInProgress] = useState(false);

  // --- Your keys ---
  const RETELL_API_KEY = "53b76c26-bd21-4509-98d7-c5cc62f93b59";
  const RETELL_AGENT_ID = "agent_3ad7f48e10b9c6a45ffaf0cfac";
  // ------------------

  useEffect(() => {
    webClient.on("conversationStarted", () => {
      setCallStatus("active");
      setCallInProgress(false);
    });

    webClient.on("conversationEnded", () => {
      setCallStatus("inactive");
      setCallInProgress(false);
    });

    webClient.on("error", () => {
      setCallStatus("inactive");
      setCallInProgress(false);
    });

    return () => {
      webClient.off("conversationStarted");
      webClient.off("conversationEnded");
      webClient.off("error");
    };
  }, []);

  const toggleConversation = async () => {
    if (callInProgress) return;
    setCallInProgress(true);

    if (callStatus === "active") {
      try {
        await webClient.stopCall();
        setCallStatus("inactive");
      } catch (error) {
        console.error("Error stopping the call:", error);
      } finally {
        setCallInProgress(false);
      }
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await initiateConversation();
      } catch (error) {
        console.error("Microphone permission denied or error occurred:", error);
      } finally {
        setCallInProgress(false);
      }
    }
  };

  const initiateConversation = async () => {
    try {
      const response = await fetch("https://api.retellai.com/v2/create-web-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RETELL_API_KEY}`,
        },
        body: JSON.stringify({
          agent_id: RETELL_AGENT_ID,
        }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();

      await webClient.startCall({
        accessToken: data.access_token,
        callId: data.call_id,
        sampleRate: 16000,
        enableUpdate: true,
      });
      setCallStatus("active");
    } catch (err) {
      console.error("Error registering/starting call:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* White navbar with logo */}
      <nav className="bg-white shadow-sm p-4">
        <img src="/wellcarelogo180.png" alt="WellCare" className="h-12" />
      </nav>

      {/* Blue background with centered button */}
      <div className="flex-1 bg-[#0072CE] flex flex-col items-center justify-center gap-6 relative">
        <button
          onClick={toggleConversation}
          disabled={callInProgress}
          className="relative flex flex-col items-center focus:outline-none"
        >
          {/* Pulsing waves when active */}
          {callStatus === "active" && (
            <>
              <span className="absolute w-[220px] h-[220px] rounded-full bg-red-400/30 animate-ping"></span>
              <span className="absolute w-[300px] h-[300px] rounded-full bg-red-400/20 animate-ping delay-150"></span>
            </>
          )}

          {/* Main button */}
          <div
            className={`relative p-16 rounded-full shadow-2xl border transition-all duration-500 backdrop-blur-xl 
              ${callStatus === "active"
                ? "bg-red-500/90 border-red-400 shadow-red-500/50 animate-bounce-slow"
                : "bg-white/70 border-white/40 hover:shadow-lg hover:scale-105"}
            `}
          >
            <Mic
              className={`w-20 h-20 transition-transform duration-500 ${
                callStatus === "active" ? "text-white scale-110" : "text-[#0072CE]"
              }`}
            />
          </div>

          {/* Label */}
          <span className="mt-6 text-3xl font-semibold text-white/90 tracking-wide">
            {callStatus === "active" ? "Call End" : "Call Start"}
          </span>
        </button>
      </div>

      {/* Extra animation styles */}
      <style>{`
        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }
      `}</style>
    </div>
  );
}
