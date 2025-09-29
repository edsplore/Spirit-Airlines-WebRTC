import React, { useState } from "react";
import { Mic, PhoneOff, Loader2 } from "lucide-react";
import { RetellWebClient } from "retell-client-js-sdk";

const Everise = () => {
  const [callStatus, setCallStatus] = useState("not-started");
  const [callInProgress, setCallInProgress] = useState(false);
  const [currentCallId, setCurrentCallId] = useState("");
  const [callDetails, setCallDetails] = useState<any>(null);
  const [webClient, setWebClient] = useState<any>(null);

  const apiKey = "key_2747254ddf6a6cdeea3935f67a5d";
  const agentId = "agent_4a045daa982ec3cce0388501fa";

  const startCall = async () => {
    setCallInProgress(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const client = new RetellWebClient();
      setWebClient(client);

      const resp = await fetch("https://api.retellai.com/v2/create-web-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          agent_id: agentId,
          data_storage_setting: "everything",
        }),
      });

      const data = await resp.json();
      setCurrentCallId(data.call_id);

      await client.startCall({
        accessToken: data.access_token,
        callId: data.call_id,
        sampleRate: 16000,
      });

      setCallStatus("active");
    } catch (err) {
      console.error(err);
    } finally {
      setCallInProgress(false);
    }
  };

const endCall = async () => {
  if (!webClient) return;
  setCallInProgress(true);
  try {
    await webClient.stopCall();
    setWebClient(null);
    setCallStatus("ended");

    if (currentCallId) {
      // Poll until Retell finishes analysis
      let details = null;
      for (let i = 0; i < 5; i++) {
        const resp = await fetch(`https://api.retellai.com/v2/get-call/${currentCallId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        details = await resp.json();

        if (details.call_status === "completed" && details.transcript) break;
        await new Promise((r) => setTimeout(r, 3000)); // wait 3s
      }
      setCallDetails(details);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setCallInProgress(false);
  }
};


  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-10 py-4 shadow-md">
        <img src="/everise.png" alt="Everise Logo" className="h-12" />
        <ul className="hidden md:flex space-x-8 font-medium text-gray-700">
          <li className="hover:text-orange-500 cursor-pointer">Healthcare Industry</li>
          <li className="hover:text-orange-500 cursor-pointer">Services</li>
          <li className="hover:text-orange-500 cursor-pointer">Powering Customer Experience</li>
          <li className="hover:text-orange-500 cursor-pointer">Industries</li>
          <li className="hover:text-orange-500 cursor-pointer">About Us</li>
          <li className="hover:text-orange-500 cursor-pointer">Work for Us</li>
        </ul>
        <button className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-orange-600">
          Contact Us
        </button>
      </nav>

      {/* Hero Section as image with smaller height */}
      <section className="w-full h-74 overflow-hidden">
        <img src="/everise-home.png" alt="Hero Banner" className="w-full h-full object-cover" />
      </section>

      {/* Content Section */}
      <section className="flex-1 flex flex-col items-center justify-center p-8">
        {callStatus !== "active" ? (
          <button
            onClick={startCall}
            disabled={callInProgress}
            className="flex flex-col items-center justify-center w-36 h-36 bg-cyan-700 text-white rounded-full shadow-lg hover:bg-cyan-800 transition"
          >
            {callInProgress ? <Loader2 className="w-10 h-10 animate-spin" /> : <Mic className="w-12 h-12 mb-2" />}
            <span className="text-base font-bold">Click to Talk</span>
          </button>
        ) : (
          <button
            onClick={endCall}
            disabled={callInProgress}
            className="flex flex-col items-center justify-center w-36 h-36 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition"
          >
            {callInProgress ? <Loader2 className="w-10 h-10 animate-spin" /> : <PhoneOff className="w-12 h-12 mb-2" />}
            <span className="text-base font-bold">End Call</span>
          </button>
        )}

        {/* Call Summary */}
        {callStatus === "ended" && callDetails && (
          <div className="mt-10 w-full max-w-4xl transform transition-all duration-500 ease-in-out opacity-100">
            <h2 className="text-2xl font-bold text-cyan-700 mb-4 text-center">Call Summary</h2>
            <table className="w-full border border-gray-300 text-sm rounded-lg overflow-hidden shadow-md">
              <tbody>
                <tr className="bg-gray-100">
                  <td className="p-3 font-semibold border w-1/4">Transcript</td>
                  <td className="p-3 border whitespace-pre-wrap">{callDetails.transcript || "No transcript available."}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold border">Summary</td>
                  <td className="p-3 border">{callDetails.call_analysis?.call_summary || "No summary generated."}</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="p-3 font-semibold border">Sentiment</td>
                  <td className="p-3 border">{callDetails.call_analysis?.user_sentiment || "N/A"}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold border">Duration</td>
                  <td className="p-3 border">{Math.floor((callDetails.duration_ms || 0) / 1000)}s</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Everise;
