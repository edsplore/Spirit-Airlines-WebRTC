"use client";

import React, { useEffect, useState } from "react";
import { Mic, MessageCircle } from "lucide-react";
import { customers } from "./data/customer.ts";
import { RetellWebClient } from "retell-client-js-sdk";

const SGSientificGames = () => {
  const [showPopup, setShowPopup] = useState(true);
  const [useCase, setUseCase] = useState("Unlock Account and Reset Password");
  const [formData, setFormData] = useState(customers[0]);
  const [showTable, setShowTable] = useState(false);
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started");
  const [callInProgress, setCallInProgress] = useState(false);

  // eslint-disable-next-line
  const webClient = new RetellWebClient();

  useEffect(() => {
    webClient.on("conversationStarted", () => {
      setCallStatus("active");
      setCallInProgress(false);
    });

    webClient.on("conversationEnded", () => {
      setCallStatus("inactive");
      setCallInProgress(false);
    });

    webClient.on("error", (error) => {
      console.error("Call error:", error);
      setCallInProgress(false);
    });

    webClient.on("update", (update) => {
      console.log("Update received:", update);
    });

    const script = document.createElement("script");
    const projectId = "67900940c6f7a86d23b3de98";
    script.type = "text/javascript";
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
                  member_name: "${formData.memberName}",
                  email: "${formData.email}",
                  account_number: "${formData.accountNumber}",
                  dob: "${formData.dob}",
                  phone: "${formData.phone}",
                  scenario: "${useCase}",
                  security_1: "${formData.security1 || ''}",
                  security_2: "${formData.security2 || ''}"
                }
              }
            }
          });
        };
        v.src = "https://cdn.voiceflow.com/widget/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
      })(document, 'script');
    `;
    document.body.appendChild(script);

    return () => {
      webClient.off("conversationStarted");
      webClient.off("conversationEnded");
      webClient.off("error");
      webClient.off("update");
    };
    // eslint-disable-next-line
  }, [formData, useCase, webClient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPopup(false);
    setShowTable(true);
  };

  const toggleConversation = async () => {
    if (callInProgress) return;
    setCallInProgress(true);

    if (callStatus === "active") {
      try {
        await webClient.stopCall();
        setCallStatus("inactive");
      } catch (error) {
        console.error("Error stopping call:", error);
      } finally {
        setCallInProgress(false);
      }
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await initiateConversation();
      } catch (error) {
        console.error("Microphone permission denied:", error);
      }
    }
  };

  const initiateConversation = async () => {
    const agentId = "agent_3ad7f48e10b9c6a45ffaf0cfac";
    const apiKey = "53b76c26-bd21-4509-98d7-c5cc62f93b59";

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
            member_name: formData.memberName,
            email: formData.email,
            account_number: formData.accountNumber,
            phone: formData.phone,
            dob: formData.dob,
            scenario: useCase,
            security_1: formData.security1 || '',
            security_2: formData.security2 || ''
          }
        })
      });

      const data = await response.json();

      await webClient.startCall({
        accessToken: data.access_token,
        callId: data.call_id,
        sampleRate: 16000,
        enableUpdate: true
      });

      setCallStatus("active");
    } catch (err) {
      console.error("Call registration failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <img src="/sg-nav.png" alt="Navbar" className="w-full" />
      <div className="flex flex-col md:flex-row justify-between px-8 py-6 gap-6">
        <div className="w-full md:w-1/2">
          <div className="border border-blue-500 bg-[#e6f2fb] text-black text-xl font-bold p-3 text-center mb-4">
            <span className="text-blue-700">Use Case:</span> {useCase}
          </div>
          <table className="w-full border-collapse text-sm border border-blue-400">
            <thead>
              <tr className="bg-gray-300 text-black font-bold">
                <th className="border border-blue-400 p-2">Authentication Parameter</th>
                <th className="border border-blue-400 p-2">Customer Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-blue-400 text-[#800080] font-bold p-2">Account #</td>
                <td className="border border-blue-400 p-2">{showTable ? formData.accountNumber : ''}</td>
              </tr>
              <tr>
                <td className="border border-blue-400 text-[#800080] font-bold p-2">Member Name</td>
                <td className="border border-blue-400 p-2">{showTable ? formData.memberName : ''}</td>
              </tr>
              <tr>
                <td className="border border-blue-400 text-[#800080] font-bold p-2">DOB</td>
                <td className="border border-blue-400 p-2">{showTable ? new Date(formData.dob).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }) : ''}</td>
              </tr>
              <tr>
                <td className="border border-blue-400 text-[#800080] font-bold p-2">Email ID</td>
                <td className="border border-blue-400 p-2">{showTable ? formData.email : ''}</td>
              </tr>
              <tr>
                <td className="border border-blue-400 text-[#800080] font-bold p-2">Phonen No</td>
                <td className="border border-blue-400 p-2">{showTable ? formData.phone : ''}</td>
              </tr>
              <tr className="bg-[#009fe3] text-white font-bold">
                <td className="border border-blue-400 p-2" colSpan={2}>Security Questions</td>
              </tr>
              <tr>
                <td className="border border-blue-400 font-bold p-2">Mother’s Maiden Name ?</td>
                <td className="border border-blue-400 p-2"></td>
              </tr>
              <tr>
                <td className="border border-blue-400 font-bold p-2">Favourite Team ?</td>
                <td className="border border-blue-400 p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="w-full md:w-1/2 flex flex-col items-center justify-between">
          <img src="/sg-about.png" alt="About Our Company" className="w-full mb-6" />
          <div className="flex flex-row justify-center gap-10">
            <div className="flex flex-col items-center">
              <div className="w-36 h-36 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center cursor-pointer" onClick={toggleConversation}>
                <Mic className="w-16 h-16 text-[#004785]" />
              </div>
              <span className="mt-4 text-[#004785] text-xl font-bold">Start Call</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-36 h-36 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center cursor-pointer" onClick={() => (window as any).voiceflow?.chat?.open()}>
                <MessageCircle className="w-16 h-16 text-[#004785]" />
              </div>
              <span className="mt-4 text-[#004785] text-xl font-bold">Click to Chat</span>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-6">
          <form onSubmit={handleSubmit} className="bg-white border-2 border-purple-800 p-6 pt-2 rounded shadow-lg max-w-md w-full">
            <img src="/sg-logo.png" alt="Game Gallery Logo" className="h-24 mx-auto mb-2" />
            <h2 className="text-center text-purple-800 font-bold text-md mb-2 border-b border-purple-800 pb-2">
              Customer details required for verification and authentication
            </h2>
            <div className="text-sm text-black space-y-3 mt-4">
              <div><strong>Member Name :</strong> <input type="text" name="memberName" value={formData.memberName} onChange={handleChange} className="w-full p-1.5 border" /></div>
              <div><strong>Choose DOB :</strong> <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full p-1.5 border" /></div>
              <div><strong>Email id :</strong> <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-1.5 border" /></div>
              <div><strong>Phone No :</strong> <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-1.5 border" /></div>
              <div><strong>Account # :</strong> <input type="text" name="accountNumber" value={formData.accountNumber} readOnly className="w-full p-1.5 bg-gray-200 border font-bold" /></div>
              <div><strong>Select Use Case :</strong>
                <select value={useCase} onChange={(e) => setUseCase(e.target.value)} className="w-full p-1.5 border font-semibold">
                  <option>Unlock Account and Reset Password</option>
                  <option>Update Phone Number</option>
                </select>
              </div>
              <button type="submit" className="w-full mt-4 bg-white text-purple-800 border-2 border-purple-800 font-bold p-2 hover:bg-purple-800 hover:text-white">Submit</button>
              <div className="text-sm text-red-700 mt-3">
                <p className="font-bold">Disclaimer :</p>
                <ul className="list-disc ml-5">
                  <li>The platform isn’t integrated with company systems, so it requires authentication details.</li>
                  <li>Enter the name the Virtual Assistant should use.</li>
                  <li><strong>An email ID is needed to send a secure email to reset the password.</strong></li>
                </ul>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SGSientificGames;
