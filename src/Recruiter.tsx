import "./App.css";
import React, { useState, useEffect } from 'react';
import { RetellWebClient } from "retell-client-js-sdk";
import { Phone, Users, BarChart, Clock, Briefcase, GraduationCap, Building2, LineChartIcon as ChartLine } from 'lucide-react';

interface RegisterCallResponse {
  access_token?: string;
  callId?: string;
  sampleRate: number;
}

interface UserDetails {
  candidate_name: string;
  job_title: string;
  job_description: string;
}

const webClient = new RetellWebClient();

const Recruiter: React.FC = () => {
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started");
  const [callInProgress, setCallInProgress] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    candidate_name: '',
    job_title: '',
    job_description: ''
  });
  const [agentType, setAgentType] = useState<'demanding' | 'friendly'>('friendly');

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
    const agentId = agentType === 'demanding' 
    ? "agent_ad02117e6f4fcfee783b4a2dd5"
    : "agent_de8ebfcd754ea4e9cbd85ca517";
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

    const apiKey = "53b76c26-bd21-4509-98d7-c5cc62f93b59";
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
          retell_llm_dynamic_variables: {
            candidate_name: userDetails.candidate_name,
            job_title: userDetails.job_title,
            job_description: userDetails.job_description
          },
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
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl mx-auto shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter Job Details</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              setUserDetails({
                candidate_name: formData.get('candidate_name') as string,
                job_title: formData.get('job_title') as string,
                job_description: formData.get('job_description') as string
              });
              setShowForm(false);
            }} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="candidate_name" className="block text-sm font-medium text-gray-700">Candidate Name</label>
                  <input
                    type="text"
                    id="candidate_name"
                    name="candidate_name"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="job_title" className="block text-sm font-medium text-gray-700">Job Title</label>
                  <input
                    type="text"
                    id="job_title"
                    name="job_title"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="job_description" className="block text-sm font-medium text-gray-700">Job Description</label>
                  <textarea
                    id="job_description"
                    name="job_description"
                    required
                    rows={4}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="agent_type" className="block text-sm font-medium text-gray-700">Agent Type</label>
                  <select
                    id="agent_type"
                    name="agent_type"
                    value={agentType}
                    onChange={(e) => setAgentType(e.target.value as 'demanding' | 'friendly')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="demanding">Demanding</option>
                    <option value="friendly">Friendly</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-[#0040FF] text-white font-bold py-2 px-4 rounded-full hover:bg-blue-700">
                Continue
              </button>
            </form>
          </div>
        </div>
      )}
      <header className="bg-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <img 
                src="/handshake_logo.svg" 
                alt="Handshake Logo" 
                className="h-10"
              />
              <div className="hidden md:flex space-x-6">
                <a href="#products" className="text-gray-600 hover:text-[#0040FF]">Products</a>
                <a href="#resources" className="text-gray-600 hover:text-[#0040FF]">Resources</a>
                <a href="#compare" className="text-gray-600 hover:text-[#0040FF]">Compare plans</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-gray-700 hover:text-[#0040FF]">
                Sign up
              </button>
              <button className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800">
                Contact sales
              </button>
            </div>
          </div>
        </nav>
      </header>

      <div className="relative bg-[#0040FF] overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 100H1440V0C1440 0 1320 50 720 50C120 50 0 0 0 0V100Z" fill="white"/>
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-6">
              <h2 className="text-5xl font-bold leading-tight">Recruit smarter, not harder</h2>
              <p className="text-xl">
                Streamline your recruiting with advanced tools to improve candidate quality and reduce time to hire. Request a demo to experience the future of hiring.
              </p>
              <div className="flex items-center space-x-4">
                <button className="px-6 py-3 bg-[#9eff00] text-black font-semibold rounded-full hover:bg-[#8be000] transition-colors">
                  Request demo
                </button>
                <div
                  className={`relative z-10 bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 ${
                    callStatus === "active" ? "bg-green-500 ring-4 ring-green-300 ring-opacity-50 animate-pulse" : ""
                  }`}
                  onClick={toggleConversation}
                >
                  <Phone className={`w-8 h-8 text-[#0040FF] ${callStatus === "active" ? "animate-bounce" : ""}`} />
                </div>
              </div>
              <p className="pl-20 ml-10 text-sm text-gray-200">
                {callStatus === "active" ? "Click to end call" : "Click to speak with our team"}
              </p>
            </div>
            <div className="relative">
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-start space-x-3">

                  <div>
                    <p className="font-semibold">Recruitment Batch</p>
                    <p className="text-sm text-gray-600">Computer Science • 2024</p>
                  </div>
                </div>
                <p className="mt-4">Everything you need to hire top talent</p>
                <img src="/handshake_new_hero_image.webp?height=300&width=400" alt="Internship Experience" className="mt-4 rounded-lg w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Recruiting Solutions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <Users className="w-12 h-12 text-[#0040FF] mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Talent Sourcing</h4>
              <p className="text-gray-600">Access a diverse pool of qualified candidates from top universities</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <BarChart className="w-12 h-12 text-[#0040FF] mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Analytics</h4>
              <p className="text-gray-600">Data-driven insights to optimize your recruiting process</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <Clock className="w-12 h-12 text-[#0040FF] mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Time Savings</h4>
              <p className="text-gray-600">Automated tools to streamline your hiring workflow</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <Briefcase className="w-12 h-12 text-[#0040FF] mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Job Distribution</h4>
              <p className="text-gray-600">Reach qualified candidates across multiple channels</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Who We Serve</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <GraduationCap className="w-12 h-12 text-[#0040FF] mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Universities</h4>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <ChartLine className="w-5 h-5 text-[#0040FF] mr-2" />
                  <span>Career services platform</span>
                </li>
                <li className="flex items-center">
                  <ChartLine className="w-5 h-5 text-[#0040FF] mr-2" />
                  <span>Student engagement</span>
                </li>
                <li className="flex items-center">
                  <ChartLine className="w-5 h-5 text-[#0040FF] mr-2" />
                  <span>Outcome tracking</span>
                </li>
              </ul>
              <button className="w-full bg-[#0040FF] text-white font-bold py-2 px-4 rounded-full hover:bg-blue-700 transition-colors">
                Learn More
              </button>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <Building2 className="w-12 h-12 text-[#0040FF] mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Employers</h4>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <ChartLine className="w-5 h-5 text-[#0040FF] mr-2" />
                  <span>Early talent recruiting</span>
                </li>
                <li className="flex items-center">
                  <ChartLine className="w-5 h-5 text-[#0040FF] mr-2" />
                  <span>Virtual career fairs</span>
                </li>
                <li className="flex items-center">
                  <ChartLine className="w-5 h-5 text-[#0040FF] mr-2" />
                  <span>Candidate management</span>
                </li>
              </ul>
              <button className="w-full bg-[#0040FF] text-white font-bold py-2 px-4 rounded-full hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <Users className="w-12 h-12 text-[#0040FF] mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Students</h4>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <ChartLine className="w-5 h-5 text-[#0040FF] mr-2" />
                  <span>Job discovery</span>
                </li>
                <li className="flex items-center">
                  <ChartLine className="w-5 h-5 text-[#0040FF] mr-2" />
                  <span>Career resources</span>
                </li>
                <li className="flex items-center">
                  <ChartLine className="w-5 h-5 text-[#0040FF] mr-2" />
                  <span>Network building</span>
                </li>
              </ul>
              <button className="w-full bg-[#0040FF] text-white font-bold py-2 px-4 rounded-full hover:bg-blue-700 transition-colors">
                Join Now
              </button>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="bg-[#0040FF] text-white p-12 rounded-2xl text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to transform your recruiting?</h3>
            <p className="text-xl mb-8">Join thousands of companies hiring top talent on Handshake</p>
            <div className="flex justify-center space-x-4">
              <button className="px-8 py-3 bg-[#9eff00] text-black font-semibold rounded-full hover:bg-[#8be000] transition-colors">
                Request demo
              </button>
              <button className="px-8 py-3 bg-white text-[#0040FF] font-semibold rounded-full hover:bg-gray-100 transition-colors">
                Contact sales
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 text-gray-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">About Handshake</h4>
              <p className="text-sm">Connecting students and recent graduates with employers for early career opportunities.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Solutions</h4>
              <ul className="space-y-2 text-sm">
                <li>Universities</li>
                <li>Employers</li>
                <li>Students</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>Blog</li>
                <li>Events</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm">
            <p>&copy; 2023 Handshake. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Recruiter;