import { useEffect, useState } from "react";
import { Mic, X, Shuffle } from "lucide-react";
import { RetellWebClient } from "retell-client-js-sdk";
import { wellCareCustomers, WellCareCustomer } from "./data.ts";

const webClient = new RetellWebClient();

export default function WellCareBasic() {
  const [callStatus, setCallStatus] =
    useState<"not-started" | "active" | "inactive">("not-started");
  const [callInProgress, setCallInProgress] = useState(false);

  // modal state + selected customer
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [customer, setCustomer] = useState<WellCareCustomer>(() => {
    const i = Math.floor(Math.random() * wellCareCustomers.length);
    return { ...wellCareCustomers[i] };
  });

  // --- Your keys ---
  const RETELL_API_KEY = "02e501b4-1b05-40f4-af3e-351f0819e13f";
  const RETELL_AGENT_ID = "agent_29b3bf98f7e4b26a4b6b58e88a";
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

  const shuffleCustomer = () => {
    const i = Math.floor(Math.random() * wellCareCustomers.length);
    setCustomer({ ...wellCareCustomers[i] });
  };

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

  // eslint-disable-next-line
  const assembleVariables = () => {
    const current_time = new Date().toISOString();
    return {
      ...customer,
      current_time,
    };
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
          retell_llm_dynamic_variables: {
            call_center_script_name: customer.call_center_script_name,
            health_plan: customer.health_plan,
            practitioner_name: customer.practitioner_name,
            office_phone: customer.office_phone,
            address: customer.address,
            practice_name: customer.practice_name,
            speciality: customer.speciality, // <-- ADDED
            current_time: new Date().toISOString(), // runtime
          },
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Well Care - Directory Audit</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-6">
              <LabeledInput
                label="Script Name"
                value={customer.call_center_script_name}
                onChange={(v) => setCustomer((c) => ({ ...c, call_center_script_name: v }))}
                required
              />
              <LabeledInput
                label="Health Plan"
                value={customer.health_plan}
                onChange={(v) => setCustomer((c) => ({ ...c, health_plan: v }))}
                required
              />
              <LabeledInput
                label="Practitioner Name"
                value={customer.practitioner_name}
                onChange={(v) => setCustomer((c) => ({ ...c, practitioner_name: v }))}
                required
              />
              <LabeledInput
                label="Office Phone"
                value={customer.office_phone}
                onChange={(v) => setCustomer((c) => ({ ...c, office_phone: v }))}
                required
              />
              <LabeledInput
                label="Address"
                value={customer.address}
                onChange={(v) => setCustomer((c) => ({ ...c, address: v }))}
                required
              />
              <LabeledInput
                label="Practice Name"
                value={customer.practice_name}
                onChange={(v) => setCustomer((c) => ({ ...c, practice_name: v }))}
                required
              />
              {/* NEW FIELD */}
              <LabeledInput
                label="Speciality"
                value={customer.speciality ?? ""}
                onChange={(v) => setCustomer((c) => ({ ...c, speciality: v }))}
                required
              />
              {/* current_time note */}
              <div className="col-span-1 md:col-span-2 text-sm text-gray-500">
                <span className="font-medium">current_time</span> is auto-filled when the call starts.
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
              <button
                onClick={shuffleCustomer}
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                <Shuffle className="w-4 h-4" /> Randomize
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg bg-[#0072CE] px-4 py-2 font-medium text-white hover:opacity-90"
              >
                Initiate Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blue page with the big mic button */}
      <div className="flex-1 bg-[#0072CE] flex flex-col items-center justify-center gap-6 relative">
        <button
          onClick={toggleConversation}
          disabled={callInProgress}
          className="relative flex flex-col items-center focus:outline-none"
        >
          {/* Pulsing waves when active */}
          {callStatus === "active" && (
            <>
              <span className="absolute w-[220px] h-[220px] rounded-full bg-red-400/30 animate-ping" />
              <span className="absolute w-[300px] h-[300px] rounded-full bg-red-400/20 animate-ping delay-150" />
            </>
          )}

          {/* Main button */}
          <div
            className={`relative p-16 rounded-full shadow-2xl border transition-all duration-500 backdrop-blur-xl 
              ${
                callStatus === "active"
                  ? "bg-red-500/90 border-red-400 shadow-red-500/50 animate-bounce-slow"
                  : "bg-white/70 border-white/40 hover:shadow-lg hover:scale-105"
              }
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

      <style>{`.animate-bounce-slow{animation:bounce 2s infinite}`}</style>
    </div>
  );
}

/** small input component */
function LabeledInput({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
      />
    </label>
  );
}
