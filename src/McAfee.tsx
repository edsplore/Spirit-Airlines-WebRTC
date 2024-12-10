import "./App.css";
import { useState } from 'react'
import { ChevronDown, MessageSquare, Phone } from 'lucide-react'
import { RetellWebClient } from "retell-client-js-sdk"
const webClient = new RetellWebClient()

export default function McAfeeDemo() {
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [showCountries, setShowCountries] = useState(false)

  const initiateCall = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const registerCallResponse = await registerCall()
      if (registerCallResponse.callId) {
        await webClient.startCall({
          accessToken: registerCallResponse.access_token,
          callId: registerCallResponse.callId,
          sampleRate: registerCallResponse.sampleRate,
        })
        setCallStatus("active")
      }
    } catch (error) {
      console.error("Error starting call:", error)
    }
  }

  const endCall = async () => {
    try {
      await webClient.stopCall()
      setCallStatus("not-started")
    } catch (error) {
      console.error("Error ending call:", error)
    }
  }

  const registerCall = async () => {
    try {
      const response = await fetch("https://api.retellai.com/v2/create-web-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer 53b76c26-bd21-4509-98d7-c5cc62f93b59`,
        },
        body: JSON.stringify({
          agent_id: "agent_f43f5317639c9ed51ec1a11c83",
        }),
      })
      const data = await response.json()
      return {
        access_token: data.access_token,
        callId: data.call_id,
        sampleRate: 16000,
      }
    } catch (error) {
      console.error("Error registering call:", error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="flex-shrink-0">
                <img
                  src="/McAfeeHzRed.svg"
                  alt="McAfee"
                  className="h-8 w-auto"
                />
              </a>
            </div>
            <nav className="flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Home
              </a>
              <div className="relative group">
                <button className="text-gray-700 group-hover:text-gray-900 px-3 py-2 text-sm font-medium inline-flex items-center">
                  Help Topics
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
              </div>
              <a href="/contact" className="text-red-600 px-3 py-2 text-sm font-medium">
                Contact Us
              </a>
            </nav>
            <div>
              <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h1>
            <p className="text-lg text-gray-600 mb-12">Here are some options to get in contact with us:</p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Chatbot Card */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex flex-col items-center text-center">
                  <MessageSquare className="h-8 w-8 text-red-600 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Chatbot</h2>
                  <p className="text-gray-600 mb-6">Hours of Operation: Available 24/7</p>
                  <button className="bg-red-600 text-white px-8 py-3 rounded-md font-medium hover:bg-red-700 transition-colors">
                    Start Chat
                  </button>
                </div>
              </div>

              {/* Call Us Card */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex flex-col items-center text-center">
                  <Phone className="h-8 w-8 text-red-600 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Call Us</h2>
                  {callStatus === "active" ? (
                    <div className="text-center">
                      <p className="text-green-600 font-medium mb-4">Call in progress...</p>
                      <button
                        onClick={endCall}
                        className="bg-red-600 text-white px-8 py-3 rounded-md font-medium hover:bg-red-700 transition-colors"
                      >
                        Stop Call
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-6">Hours of Operation: Available 24/7</p>
                      <button
                        onClick={initiateCall}
                        className="bg-red-600 text-white px-8 py-3 rounded-md font-medium hover:bg-red-700 transition-colors"
                      >
                        Start Call
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Countries and Phone Numbers Section */}
            <div className="bg-white rounded-lg border p-6 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-700 font-medium">Not seeing the right phone number?</p>
                  <p className="text-gray-600">Click the button to view all countries and phone numbers</p>
                </div>
                <button
                  onClick={() => setShowCountries(!showCountries)}
                  className="text-blue-600 hover:text-blue-700 font-medium px-6 py-2 rounded-full border border-blue-600"
                >
                  Countries and phone numbers
                </button>
              </div>
            </div>

            {/* Recent Case Section */}
            <div className="bg-red-50 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need help with a recent case?</h2>
              <p className="text-gray-600 mb-6">Click the button below to check out your recent case details.</p>
              <button className="bg-red-600 text-white px-8 py-3 rounded-md font-medium hover:bg-red-700 transition-colors">
                My Cases
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

