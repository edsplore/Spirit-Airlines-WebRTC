import "./App.css";
import React, { useEffect, useState } from "react";
import { RetellWebClient } from "retell-client-js-sdk";
import { Mic, X, Phone, MapPin, Clock, Wifi, Smartphone, Globe } from 'lucide-react';

interface RegisterCallResponse {
  access_token?: string;
  callId?: string;
  sampleRate: number;
}

const webClient = new RetellWebClient();

const GradientBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff9e1b] via-[#ff9e1b] to-white opacity-10"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const M1Limited: React.FC = () => {
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started");
  const [callInProgress, setCallInProgress] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    webClient.on("conversationStarted", () => {
      console.log("Conversation started successfully");
      setCallStatus("active");
      setCallInProgress(false);
    });

    webClient.on("conversationEnded", ({ code, reason }) => {
      console.log("Conversation ended with code:", code, "reason:", reason);
      setCallStatus("inactive");
      setCallInProgress(false);
    });

    webClient.on("error", (error) => {
      console.error("An error occurred:", error);
      setCallStatus("inactive");
      setCallInProgress(false);
    });

    webClient.on("update", (update) => {
      console.log("Update received", update);
    });

    return () => {
      webClient.off("conversationStarted");
      webClient.off("conversationEnded");
      webClient.off("error");
      webClient.off("update");
    };
  }, []);

  const toggleConversation = async () => {
    if (callInProgress) {
      return;
    }

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
    const agentId = "agent_a5f400ead1ed28ad6343fed790";
    try {
      const registerCallResponse = await registerCall(agentId);
      if (registerCallResponse.callId) {
        await webClient.startCall({
          accessToken: registerCallResponse.access_token,
          callId: registerCallResponse.callId,
          sampleRate: registerCallResponse.sampleRate,
          enableUpdate: true,
        });
        setCallStatus("active");
      }
    } catch (error) {
      console.error("Error in registering or starting the call:", error);
    }
  };

  async function registerCall(agentId: string): Promise<RegisterCallResponse> {
    console.log("Registering call for agent:", agentId);

    const apiKey = "02e501b4-1b05-40f4-af3e-351f0819e13f";
    const sampleRate = parseInt(process.env.REACT_APP_RETELL_SAMPLE_RATE || "16000", 10);

    try {
      const response = await fetch("https://api.retellai.com/v2/create-web-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          agent_id: agentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Call registered successfully:", data);

      return {
        access_token: data.access_token,
        callId: data.call_id,
        sampleRate: sampleRate,
      };
    } catch (err) {
      console.error("Error registering call:", err);
      throw err;
    }
  }

  return (
    <GradientBackground>
      <div className="min-h-screen flex flex-col font-sans">
        <nav className="w-full px-6 py-4 flex justify-between items-center absolute top-0 left-0 z-20 bg-white shadow-md">
          <div className="flex items-center">
            <img src="/m1-logo.svg" alt="M1 Limited Logo" className="h-12 mr-2" />
            {/* <div className="text-2xl font-bold text-[#ff9e1b]"></div> */}
          </div>
          <div className="flex space-x-6 text-[#ff9e1b]">
            <button onClick={() => setShowServices(true)} className="hover:text-[#ff7c1b] transition">Our Services</button>
            <button onClick={() => setShowContact(true)} className="hover:text-[#ff7c1b] transition">Contact Us</button>
          </div>
        </nav>

        <main className="flex-grow flex flex-col items-center justify-center p-4 text-center relative">
          <div className="max-w-4xl mx-auto px-4 pt-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[#ff9e1b]">M1 Limited</h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-700 font-light max-w-2xl mx-auto">
              Empowering digital transformation. Experience cutting-edge connectivity, innovative solutions, and exceptional service.
            </p>

            <div className="flex justify-center items-center mb-12">
              <div
                className={`relative z-10 bg-[#ff9e1b] rounded-full p-6 w-24 h-24 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 ${
                  callStatus === "active" ? "bg-[#ff9e1b] ring-4 ring-[#ff9e1b] ring-opacity-50 animate-pulse" : ""
                }`}
                onClick={toggleConversation}
              >
                <Mic className={`w-12 h-12 text-white ${callStatus === "active" ? "animate-bounce" : ""}`} />
              </div>
            </div>

            <p className="text-[#ff9e1b] mb-8">Talk to our Virtual Assistant</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white p-6 rounded-lg border border-[#ff9e1b] shadow-lg">
                <Wifi className="w-12 h-12 text-[#ff9e1b] mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-[#ff9e1b] mb-2">5G Network</h3>
                <p className="text-gray-700">Experience ultra-fast 5G connectivity across Singapore</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-[#ff9e1b] shadow-lg">
                <Smartphone className="w-12 h-12 text-[#ff9e1b] mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-[#ff9e1b] mb-2">Bespoke Plans</h3>
                <p className="text-gray-700">Customizable mobile plans to fit your unique needs</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-[#ff9e1b] shadow-lg">
                <Globe className="w-12 h-12 text-[#ff9e1b] mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-[#ff9e1b] mb-2">Digital Solutions</h3>
                <p className="text-gray-700">Comprehensive digital services for businesses and consumers</p>
              </div>
            </div>
          </div>

          {showServices && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="relative bg-white rounded-lg shadow-xl p-8 m-4 max-w-4xl w-full h-5/6 overflow-hidden flex flex-col">
                <button
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowServices(false)}
                >
                  <X className="h-6 w-6" />
                </button>
                <h2 className="text-3xl font-bold text-[#ff9e1b] mb-6">Our Services</h2>
                <div className="overflow-y-auto flex-grow">
                  <M1Services />
                </div>
              </div>
            </div>
          )}

          {showContact && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="relative bg-white rounded-lg shadow-xl p-8 m-4 max-w-md w-full">
                <button
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowContact(false)}
                >
                  <X className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-[#ff9e1b] mb-6">Contact M1 Limited</h2>
                <div className="space-y-6 text-left">
                  <div className="flex items-center">
                    <Phone className="text-[#ff9e1b] mr-4" />
                    <p className="text-gray-700">1627 (from M1 mobile)</p>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="text-[#ff9e1b] mr-4" />
                    <p className="text-gray-700">10 International Business Park, Singapore 609928</p>
                  </div>
                  <div className="flex items-center">
                    <Clock className="text-[#ff9e1b] mr-4" />
                    <p className="text-gray-700">
                      Mon-Fri: 9AM-6PM<br />
                      Sat: 10AM-6PM<br />
                      Sun & Public Holidays: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </GradientBackground>
  );
};

const M1Services: React.FC = () => (
  <div className="text-left space-y-8 text-gray-700">
    <section>
      <h3 className="text-2xl font-bold text-[#ff9e1b] mb-4">Mobile Services</h3>
      <div className="grid gap-6">
        <div className="border-b border-[#ff9e1b] pb-4">
          <h4 className="font-semibold mb-2">5G Plans</h4>
          <p className="text-sm">Experience ultra-fast 5G connectivity with our cutting-edge network</p>
        </div>
        <div className="border-b border-[#ff9e1b] pb-4">
          <h4 className="font-semibold mb-2">Bespoke Plans</h4>
          <p className="text-sm">Customize your mobile plan to fit your unique usage patterns</p>
        </div>
        <div className="border-b border-[#ff9e1b] pb-4">
          <h4 className="font-semibold mb-2">Data Passport</h4>
          <p className="text-sm">Use your local data bundle while roaming internationally</p>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-2xl font-bold text-[#ff9e1b] mb-4">Broadband & Fiber</h3>
      <div className="grid gap-6">
        <div className="border-b border-[#ff9e1b] pb-4">
          <h4 className="font-semibold mb-2">Home Broadband</h4>
          <p className="text-sm">High-speed fiber internet for your home with flexible plans</p>
        </div>
        <div className="border-b border-[#ff9e1b] pb-4">
          <h4 className="font-semibold mb-2">Business Fiber</h4>
          <p className="text-sm">Reliable and fast internet solutions for businesses of all sizes</p>
        </div>
        <div className="border-b border-[#ff9e1b] pb-4">
          <h4 className="font-semibold mb-2">Wireless Broadband</h4>
          <p className="text-sm">Portable internet solutions for on-the-go connectivity</p>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-2xl font-bold text-[#ff9e1b] mb-4">Digital Solutions</h3>
      <div className="grid gap-6">
        <div className="border-b border-[#ff9e1b] pb-4">
          <h4 className="font-semibold mb-2">Cloud Services</h4>
          <p className="text-sm">Scalable cloud solutions to power your business operations</p>
        </div>
        <div className="border-b border-[#ff9e1b] pb-4">
          <h4 className="font-semibold mb-2">Cybersecurity</h4>
          <p className="text-sm">Comprehensive security solutions to protect your digital assets</p>
        </div>
        <div className="border-b border-[#ff9e1b] pb-4">
          <h4 className="font-semibold mb-2">IoT Solutions</h4>
          <p className="text-sm">Innovative Internet of Things services for smart homes and businesses</p>
        </div>
      </div>
    </section>
  </div>
);

export default M1Limited;