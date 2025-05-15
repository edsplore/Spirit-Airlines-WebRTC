"use client";
import React from "react";

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { RetellWebClient } from "retell-client-js-sdk"

// Define interface for RegisterCallResponse
interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}

// Initialize the RetellWebClient outside the component
const webClient = new RetellWebClient()

export default function Independence() {
  const [activeView, setActiveView] = useState<"practiceCall" | "startCall" | "endCall" | "recordings">("practiceCall")

  const [userName, setUserName] = useState("Jon Smith")
  const [selectedScenario, setSelectedScenario] = useState("Coverage & Benefits")
  const [customerBehavior, setCustomerBehavior] = useState("Normal")
  const [showScenarioDropdown, setShowScenarioDropdown] = useState(false)
  const [showBehaviorDropdown, setShowBehaviorDropdown] = useState(false)
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [callInProgress, setCallInProgress] = useState(false)

  // Customer details from the table
  const customerDetails = {
    name: "Mary Carpenter",
    phone: "1234567890",
    address: "1234, University avenue, Miami, Florida - 20145",
    dob: "06 June 1980",
    accountNumber: "987654321",
    behavior: "Normal",
  }

  useEffect(() => {
    // Set up event listeners for the webClient
    webClient.on("conversationStarted", () => {
      console.log("Conversation started successfully")
      setCallStatus("active")
      setCallInProgress(false)
    })

    webClient.on("conversationEnded", ({ code, reason }) => {
      console.log("Conversation ended with code:", code, "reason:", reason)
      setCallStatus("inactive")
      setCallInProgress(false)
    })

    webClient.on("error", (error) => {
      console.error("An error occurred:", error)
      setCallStatus("inactive")
      setCallInProgress(false)
    })

    webClient.on("update", (update) => {
      console.log("Update received", update)
    })

    // Cleanup function
    return () => {
      if (callStatus === "active") {
        webClient.stopCall()
      }

      // Remove event listeners
      webClient.off("conversationStarted")
      webClient.off("conversationEnded")
      webClient.off("error")
      webClient.off("update")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // We intentionally omit callStatus to avoid recreating the effect

  const handleViewChange = (view: "practiceCall" | "startCall" | "endCall" | "recordings") => {
    setActiveView(view)
  }

  const handlePracticeSubmit = () => {
    handleViewChange("startCall")
  }

  // Replace with a toggle function that handles both starting and ending calls
  const toggleCall = async () => {
    if (callInProgress) return

    setCallInProgress(true)

    try {
      if (callStatus === "active") {
        // End the call if it's active
        await webClient.stopCall()
        setCallStatus("inactive")
      } else {
        // Start a new call if no call is active
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true })

        // Register the call and get the necessary tokens
        const registerCallResponse = await registerCall()

        if (registerCallResponse.callId && registerCallResponse.access_token) {
          // Start the call with the obtained tokens
          await webClient.startCall({
            accessToken: registerCallResponse.access_token,
            callId: registerCallResponse.callId,
            sampleRate: registerCallResponse.sampleRate,
            enableUpdate: true,
          })

          setCallStatus("active")
          handleViewChange("endCall")
        } else {
          throw new Error("Failed to get valid call ID or access token")
        }
      }
    } catch (error) {
      console.error("Error handling call:", error)
    } finally {
      setCallInProgress(false)
    }
  }

  const registerCall = async (): Promise<RegisterCallResponse> => {
    // Choose agent ID based on selected scenario
    const agentId =
      selectedScenario === "Coverage & Benefits"
        ? "agent_516f9ab713ddc59c08c698ed96" // Replace with your Coverage & Benefits agent ID
        : "agent_fd6cfc5cffacc3c89ea5ad0374" // Replace with your Medical Card Replacement agent ID

    try {
      // Format the date of birth to match expected format if needed
      const dobParts = customerDetails.dob.split(" ")
      const formattedDob = `${dobParts[0]} ${dobParts[1]} ${dobParts[2]}`

      // Make API call to register the call
      const response = await fetch("https://api.retellai.com/v2/create-web-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer key_6d2f13875c4b0cdb80c6f031c6c4`, // Replace with your actual API key
        },
        body: JSON.stringify({
          agent_id: agentId,
          retell_llm_dynamic_variables: {
            first_name: customerDetails.name,
            phone_number: customerDetails.phone,
            address: customerDetails.address,
            dob: formattedDob,
            account_number: customerDetails.accountNumber,
            customer_behavior: customerBehavior,
            scenario: selectedScenario,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Call registered successfully:", data)

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
    <div className="flex flex-col w-full h-screen bg-white overflow-hidden">
      <header className="flex justify-between items-center p-4">
        <div className="text-[#4a90e2] flex items-center">
          {/* Independence logo */}
          <div className="flex items-center">
            <img src="/independence-logo.png" alt="Independence Logo" style={{ width: "180px", height: "auto" }} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Welcome, {userName}</span>
          {/* VI Labs logo */}
          <div className="flex items-center">
            <img src="/vilabs-logo.png" alt="VI Labs Logo" style={{ width: "130px", height: "auto" }} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 px-4 pb-4 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-[30%] bg-white">
          <div className="bg-[#4a90e2] text-white p-4">
            <h1 className="text-4xl font-bold mb-3">
              Driving health
              <br />
              care forward
            </h1>
            <p className="text-lg" style={{ lineHeight: "1.4" }}>
              With you at the center of
              <br />
              everything we do, we are
              <br />
              building the healthcare
              <br />
              company of the future by
              <br />
              redefining what to expect from
              <br />a health insurer.
            </p>
          </div>
          {/* Person image with IBX overlay */}
          <div className="relative h-64 bg-[#3a7bc8] flex items-center">
            <img
              src="/person-image.jpg"
              alt="Person with coffee"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
              }}
            />
            <div className="absolute right-4 text-[#87CEFA] text-6xl font-bold z-10">IBX</div>
            <div className="absolute right-0 bottom-1/2 transform translate-y-1/2 z-10">
              <ChevronRight className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 ml-4 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {activeView === "practiceCall" && (
              <div className="w-full">
                <div className="border border-[#4a90e2] rounded-lg p-4 mb-4" style={{ borderRadius: "16px" }}>
                  <div className="bg-gray-200 p-2 mb-3">Enter details Initiating Practise call</div>
                  <div className="space-y-3">
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <div className="w-64 text-[#4a90e2]">Your Name:</div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full border-none focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <div className="w-64 text-[#4a90e2]">Choose Practise scenario</div>
                      <div className="flex-1 relative">
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => setShowScenarioDropdown(!showScenarioDropdown)}
                        >
                          <span>{selectedScenario}</span>
                          <div className="bg-gray-200 w-6 h-6 flex items-center justify-center">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                        {showScenarioDropdown && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 z-10">
                            <div
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setSelectedScenario("Coverage & Benefits")
                                setShowScenarioDropdown(false)
                              }}
                            >
                              Coverage & Benefits
                            </div>
                            <div
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setSelectedScenario("Medical Card Replacement")
                                setShowScenarioDropdown(false)
                              }}
                            >
                              Medical Card Replacement
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <div className="w-64 text-[#4a90e2]">Choose Customer behaviour</div>
                      <div className="flex-1 relative">
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => setShowBehaviorDropdown(!showBehaviorDropdown)}
                        >
                          <span>{customerBehavior}</span>
                          <div className="bg-gray-200 w-6 h-6 flex items-center justify-center">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                        {showBehaviorDropdown && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 z-10">
                            <div
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setCustomerBehavior("Normal")
                                setShowBehaviorDropdown(false)
                              }}
                            >
                              Normal
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <button className="w-full bg-[#d35400] text-white py-2 rounded-md" onClick={handlePracticeSubmit}>
                        Click to Submit
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-[#4a90e2] rounded-lg p-4" style={{ borderRadius: "16px" }}>
                  <div className="bg-gray-200 p-2 mb-3">Choose name to listening to previous call recordings</div>
                  <div className="space-y-3">
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <div className="w-64 text-[#4a90e2]">Your Name:</div>
                      <div className="flex-1 flex justify-between items-center">
                        <span>{userName}</span>
                        <div className="bg-gray-200 w-6 h-6 flex items-center justify-center">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        className="w-full bg-[#d35400] text-white py-2 rounded-md"
                        onClick={() => handleViewChange("recordings")}
                      >
                        Click to Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === "startCall" && (
              <div className="w-full">
                <div className="bg-gray-200 p-2 font-bold">Customer Details</div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Customer Name:</td>
                      <td className="p-2">{customerDetails.name}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Phone number</td>
                      <td className="p-2">{customerDetails.phone}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Address</td>
                      <td className="p-2">{customerDetails.address}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Date of Birth</td>
                      <td className="p-2">{customerDetails.dob}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Account#</td>
                      <td className="p-2">{customerDetails.accountNumber}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2">Customer Behaviour</td>
                      <td className="p-2">{customerDetails.behavior}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-8 flex flex-col items-center justify-center">
                  <div
                    className="w-20 h-20 rounded-full bg-black flex items-center justify-center cursor-pointer"
                    onClick={toggleCall}
                  >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                        stroke="#87CEFA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19 10v2a7 7 0 0 1-14 0v-2"
                        stroke="#87CEFA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="12"
                        y1="19"
                        x2="12"
                        y2="23"
                        stroke="#87CEFA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="8"
                        y1="23"
                        x2="16"
                        y2="23"
                        stroke="#87CEFA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-[#005b96] text-3xl font-bold mt-2">Click to Start Call</div>
                </div>
              </div>
            )}

            {activeView === "endCall" && (
              <div className="w-full">
                <div className="bg-gray-200 p-2 font-bold">Customer Details</div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Customer Name:</td>
                      <td className="p-2">{customerDetails.name}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Phone number</td>
                      <td className="p-2">{customerDetails.phone}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Address</td>
                      <td className="p-2">{customerDetails.address}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Date of Birth</td>
                      <td className="p-2">{customerDetails.dob}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Account#</td>
                      <td className="p-2">{customerDetails.accountNumber}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2">Customer Behaviour</td>
                      <td className="p-2">{customerDetails.behavior}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-8 flex flex-col items-center justify-center">
                  {callStatus === "active" ? (
                    <>
                      <div
                        className="w-20 h-20 rounded-full bg-[#cc0000] flex items-center justify-center cursor-pointer"
                        onClick={toggleCall}
                      >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M19 10v2a7 7 0 0 1-14 0v-2"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="12"
                            y1="19"
                            x2="12"
                            y2="23"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="8"
                            y1="23"
                            x2="16"
                            y2="23"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="text-[#005b96] text-3xl font-bold mt-2">Click to End Call</div>
                    </>
                  ) : (
                    <>
                      {/* Start Call button */}
                      <div
                        className="w-20 h-20 rounded-full bg-black flex items-center justify-center cursor-pointer"
                        onClick={toggleCall}
                      >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                            stroke="#87CEFA"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M19 10v2a7 7 0 0 1-14 0v-2"
                            stroke="#87CEFA"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="12"
                            y1="19"
                            x2="12"
                            y2="23"
                            stroke="#87CEFA"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="8"
                            y1="23"
                            x2="16"
                            y2="23"
                            stroke="#87CEFA"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="text-[#005b96] text-3xl font-bold mt-2">Click to Start Call</div>

                      {/* Listen to recording button */}
                      <button
                        className="mt-4 bg-[#4a90e2] text-white py-2 px-8 rounded-md w-64"
                        onClick={() => handleViewChange("recordings")}
                      >
                        Click to Listen to call recording
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeView === "recordings" && (
              <div className="w-full h-full flex flex-col">
                {/* Full-width image section */}
                <div className="w-full flex">
                  <div className="w-full relative">
                    <img
                      src="/person-image.jpg"
                      alt="Person with coffee"
                      style={{
                        width: "100%",
                        height: "270px",
                        objectFit: "cover",
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col justify-center items-center">
                      <div
                        className="w-24 h-24 rounded-full bg-black flex items-center justify-center mb-4 cursor-pointer"
                        onClick={() => {
                          handleViewChange("startCall")
                          setTimeout(() => toggleCall(), 100)
                        }}
                      >
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                            stroke="#87CEFA"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M19 10v2a7 7 0 0 1-14 0v-2"
                            stroke="#87CEFA"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="12"
                            y1="19"
                            x2="12"
                            y2="23"
                            stroke="#87CEFA"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="8"
                            y1="23"
                            x2="16"
                            y2="23"
                            stroke="#87CEFA"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="text-[#005b96] text-4xl font-bold mb-4">Click to Start Call</div>
                      <button
                        className="bg-[#4a90e2] text-white py-3 px-8 rounded-md w-96"
                        onClick={() => handleViewChange("recordings")}
                      >
                        Click to Listen to call recording
                      </button>
                    </div>
                  </div>
                </div>

                {/* Call Recordings table */}
                <div className="bg-gray-200 p-2 flex justify-between items-center">
                  <span className="font-bold">Call Recordings</span>
                  <button className="bg-[#d35400] text-white px-3 py-1 rounded">Refresh</button>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="p-2 text-left">Call ID</th>
                        <th className="p-2 text-left">Start time</th>
                        <th className="p-2 text-left">End Time</th>
                        <th className="p-2 text-left">Call Summary</th>
                        <th className="p-2 text-left">Customer Sentiment</th>
                        <th className="p-2 text-left">Call recording</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Empty rows for call recordings */}
                      {[...Array(10)].map((_, index) => (
                        <tr key={index} className="border-b border-gray-300">
                          <td className="p-2">&nbsp;</td>
                          <td className="p-2">&nbsp;</td>
                          <td className="p-2">&nbsp;</td>
                          <td className="p-2">&nbsp;</td>
                          <td className="p-2">&nbsp;</td>
                          <td className="p-2">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
