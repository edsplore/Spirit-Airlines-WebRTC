"use client";
import React from "react";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { RetellWebClient } from "retell-client-js-sdk";

// Define interface for RegisterCallResponse
interface RegisterCallResponse {
  access_token?: string;
  callId?: string;
  sampleRate: number;
}

interface Agent {
  _id: string;
  name: string;
  agentId?: string; // Make agentId optional since it might not be present in all responses
  callIds: string[];
  __v: number;
}

// Initialize the RetellWebClient outside the component
const webClient = new RetellWebClient();

export default function Independence() {
  const [activeView, setActiveView] = useState<
    "practiceCall" | "startCall" | "endCall" | "recordings"
  >("practiceCall");

  const [userName, setUserName] = useState(" ");
  const [namesList, setNamesList] = useState<string[]>([]);
  const [filteredNames, setFilteredNames] = useState<string[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(
    "Coverage & Benefits"
  );
  const [customerBehavior, setCustomerBehavior] = useState("Normal");
  const [showScenarioDropdown, setShowScenarioDropdown] = useState(false);
  const [showBehaviorDropdown, setShowBehaviorDropdown] = useState(false);
  const [callStatus, setCallStatus] = useState<
    "not-started" | "active" | "inactive"
  >("not-started");
  const [callInProgress, setCallInProgress] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedAgentId, setSelectedAgentId] = useState<string>(""); // Store the _id of the selected agent
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  // Track the current call information
  const [currentCallId, setCurrentCallId] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentAgentId, setCurrentAgentId] = useState<string>("");
  const [isUpdatingCallRecord, setIsUpdatingCallRecord] = useState(false);

  // Customer details from the table
  const customerDetails = {
    name: "Mary Carpenter",
    phone: "1234567890",
    address: "1234, University avenue, Miami, Florida - 20145",
    dob: "06 June 1980",
    accountNumber: "987654321",
    behavior: "Normal",
  };

  useEffect(() => {
    // Set up event listeners for the webClient
    webClient.on("conversationStarted", () => {
      console.log("Conversation started successfully");
      setCallStatus("active");
      setCallInProgress(false);
    });

    webClient.on("conversationEnded", ({ code, reason }) => {
      console.log("Conversation ended with code:", code, "reason:", reason);
      setCallStatus("inactive");
      setCallInProgress(false);
      // No need to update call record here as per requirements
    });

    webClient.on("error", (error) => {
      console.error("An error occurred:", error);
      setCallStatus("inactive");
      setCallInProgress(false);
    });

    webClient.on("update", (update) => {
      console.log("Update received", update);
    });

    // Fetch agents when component mounts
    fetchAgents();

    // Cleanup function
    return () => {
      if (callStatus === "active") {
        webClient.stopCall();
      }

      // Remove event listeners
      webClient.off("conversationStarted");
      webClient.off("conversationEnded");
      webClient.off("error");
      webClient.off("update");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // We intentionally omit callStatus to avoid recreating the effect

  // Add this useEffect to fetch names list
  useEffect(() => {
    // Fetch names list from API
    const fetchNamesList = async () => {
      try {
        const response = await fetch(
          "https://ibx-backend.replit.app/api/agents/list"
        );
        if (response.ok) {
          const data = await response.json();
          // Extract names from the agents list
          const names = data.map((agent: Agent) => agent.name);
          setNamesList(names);
        }
      } catch (error) {
        console.error("Error fetching names list:", error);
      }
    };

    fetchNamesList();
  }, []);

  // Add this function to handle name input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserName(value);

    // Filter names based on input
    if (value.trim() !== "") {
      const filtered = namesList.filter((name) =>
        name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredNames(filtered);
      setShowNameSuggestions(filtered.length > 0);
    } else {
      setShowNameSuggestions(false);
    }
  };

  const handleViewChange = (
    view: "practiceCall" | "startCall" | "endCall" | "recordings"
  ) => {
    setActiveView(view);
  };

  const handlePracticeSubmit = async () => {
    try {
      // Determine the agentId based on selected scenario
      const agentId =
        selectedScenario === "Coverage & Benefits"
          ? "agent_516f9ab713ddc59c08c698ed96" // Coverage & Benefits agent ID
          : "agent_fd6cfc5cffacc3c89ea5ad0374"; // Medical Card Replacement agent ID

      // Store the current agent ID for later use
      setCurrentAgentId(agentId);
      console.log("Set current agent ID to:", agentId);

      // Make API call to create agent with the required format
      const response = await fetch(
        "https://ibx-backend.replit.app/api/agents/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: userName,
            agentId: agentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Agent created successfully:", data);

      // Continue with the original flow
      handleViewChange("startCall");
    } catch (error) {
      console.error("Error creating agent:", error);
      // Still navigate to the next view even if there's an error
      handleViewChange("startCall");
    }
  };

  const fetchAgents = async () => {
    setIsLoadingAgents(true);
    try {
      // Get all agents
      const response = await fetch(
        "https://ibx-backend.replit.app/api/agents/list"
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("All agents response:", data);
      setAgents(data);

      // Set the first agent as selected if available and no agent is currently selected
      if (data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0].name);
        setSelectedAgentId(data[0]._id); // Store the _id
        if (data[0].agentId) {
          setCurrentAgentId(data[0].agentId);
        }
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  // Function to handle clicking "Submit" after selecting an agent
  const handleRecordingsSubmit = async () => {
    try {
      // Find the selected agent to get its _id
      const agent = agents.find((a) => a.name === selectedAgent);
      if (!agent) {
        console.error("No agent selected");
        return;
      }

      console.log("Fetching details for agent _id:", agent._id);

      // Call the agent details API with _id
      const response = await fetch(
        `https://ibx-backend.replit.app/api/agents/details/${agent._id}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Agent details response:", data);

      // Update the agents state with the detailed data
      // The API might return a single object or an array, handle both cases
      if (Array.isArray(data)) {
        setAgents(data);
      } else {
        // If it's a single object, create an array with just that object
        setAgents([data]);
        // Also update the selected agent and IDs
        setSelectedAgent(data.name);
        setSelectedAgentId(data._id); // Store the _id
        if (data.agentId) {
          setCurrentAgentId(data.agentId);
        }
      }

      // Navigate to recordings view
      handleViewChange("recordings");
    } catch (error) {
      console.error("Error fetching agent details:", error);
      // Still navigate to recordings view even if there's an error
      handleViewChange("recordings");
    }
  };

  // Function to handle clicking "Listen to call recording"
  const handleListenToRecording = async () => {
    console.log("handleListenToRecording called");

    // For testing, create a dummy call ID if none exists
    if (!currentCallId) {
      const dummyCallId = `Call${Date.now().toString().slice(-5)}`;
      console.log("No current call ID, using dummy ID:", dummyCallId);
      setCurrentCallId(dummyCallId);
    }

    // Find the selected agent to get its _id
    const agent = agents.find((a) => a.name === selectedAgent);

    if (!agent || !agent._id) {
      console.error("No valid agent found");
      alert("No valid agent found. Please select an agent first.");
      return;
    }

    try {
      setIsUpdatingCallRecord(true);
      const callIdToUse =
        currentCallId || `Call${Date.now().toString().slice(-5)}`;

      console.log("Updating call record with:", {
        agentId: agent._id, // Use _id directly
        callId: callIdToUse,
      });

      // Call the update API with _id
      const response = await fetch(
        `https://ibx-backend.replit.app/api/agents/calls/add/${agent._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            callId: callIdToUse,
          }),
        }
      );

      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Raw response text:", responseText);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Call record updated successfully:", data);
      } catch (e) {
        console.warn("Could not parse response as JSON:", e);
        data = { message: responseText };
      }

      // Refresh agent details to show updated call records
      await handleRecordingsSubmit();
    } catch (error) {
      console.error("Error updating call record:", error);
      alert("Failed to update call record. Please try again.");
    } finally {
      setIsUpdatingCallRecord(false);
    }
  };

  const registerCall = async (): Promise<RegisterCallResponse> => {
    // Choose agent ID based on selected scenario
    const agentId =
      selectedScenario === "Coverage & Benefits"
        ? "agent_516f9ab713ddc59c08c698ed96"
        : "agent_fd6cfc5cffacc3c89ea5ad0374";

    // Store the current agent ID for later use
    setCurrentAgentId(agentId);
    console.log("Set current agent ID in registerCall to:", agentId);

    try {
      // Format the date of birth to match expected format if needed
      const dobParts = customerDetails.dob.split(" ");
      const formattedDob = `${dobParts[0]} ${dobParts[1]} ${dobParts[2]}`;

      // Make API call to register the call
      const response = await fetch(
        "https://api.retellai.com/v2/create-web-call",
        {
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
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Call registered successfully:", data);

      // Extract the call_id from the response
      const callId = data.call_id;
      console.log("Extracted call ID from response:", callId);

      return {
        access_token: data.access_token,
        callId: callId,
        sampleRate: 16000,
      };
    } catch (error) {
      console.error("Error registering call:", error);
      throw error;
    }
  };

  // Add this function to render call records in the recordings view
  const renderCallRecords = () => {
    if (!selectedAgent || agents.length === 0) {
      return [...Array(10)].map((_, index) => (
        <tr key={index} className="border-b border-gray-300">
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
        </tr>
      ));
    }

    // Find the selected agent
    const agent = agents.find((a) => a.name === selectedAgent);
    console.log("Agent found for rendering call records:", agent);

    if (!agent) {
      console.error("Selected agent not found in agents list");
      return [...Array(10)].map((_, index) => (
        <tr key={index} className="border-b border-gray-300">
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
        </tr>
      ));
    }

    if (!agent.callIds || agent.callIds.length === 0) {
      console.log("No call IDs found for agent:", agent.name);
      return [...Array(10)].map((_, index) => (
        <tr key={index} className="border-b border-gray-300">
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
          <td className="p-2">&nbsp;</td>
        </tr>
      ));
    }

    // Display the call records
    return agent.callIds.map((callId, index) => (
      <tr key={index} className="border-b border-gray-300">
        <td className="p-2">{callId}</td>
        <td className="p-2">{new Date().toLocaleTimeString()}</td>
        <td className="p-2">{new Date().toLocaleTimeString()}</td>
        <td className="p-2">Call summary not available</td>
        <td className="p-2">Neutral</td>
        <td className="p-2">
          <button className="bg-[#4a90e2] text-white px-2 py-1 rounded text-xs">
            Play
          </button>
        </td>
      </tr>
    ));
  };

  // Toggle function that handles both starting and ending calls
  const toggleCall = async () => {
    if (callInProgress) return;

    setCallInProgress(true);

    try {
      if (callStatus === "active") {
        // End the call if it's active
        await webClient.stopCall();
        setCallStatus("inactive");
      } else {
        // Start a new call if no call is active
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Register the call and get the necessary tokens
        const registerCallResponse = await registerCall();

        if (registerCallResponse.callId && registerCallResponse.access_token) {
          // Store the call ID from the response
          setCurrentCallId(registerCallResponse.callId);
          console.log("Set current call ID to:", registerCallResponse.callId);

          // Start the call with the obtained tokens
          await webClient.startCall({
            accessToken: registerCallResponse.access_token,
            callId: registerCallResponse.callId,
            sampleRate: registerCallResponse.sampleRate,
            enableUpdate: true,
          });

          setCallStatus("active");
          handleViewChange("endCall");
        } else {
          throw new Error("Failed to get valid call ID or access token");
        }
      }
    } catch (error) {
      console.error("Error handling call:", error);
    } finally {
      setCallInProgress(false);
    }
  };

  return (
    <div className="flex px-12 flex-col w-full h-screen bg-white overflow-hidden">
      <header className="flex justify-between items-center p-4">
        <div className="text-[#4a90e2] flex items-center">
          {/* Independence logo */}
          <div className="flex items-center">
            <img
              src="/independence_logo.png"
              alt="Independence Logo"
              style={{ width: "420px", height: "auto", marginLeft: "-70px" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Welcome, {userName}</span>
          {/* VI Labs logo */}
          <div className="flex items-center">
            <img
              src="/vi-labs.png"
              alt="VI Labs Logo"
              style={{ width: "200px", height: "auto" }}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 px-4 pb-4 overflow-hidden">
        {activeView !== "recordings" ? (
          <>
            {/* Left sidebar */}
            <div className="w-[23%] bg-white flex flex-col">
              {/* Blue Section with Centered Text */}
              <div className="bg-[#4a90e2] text-white px-6 py-12 flex flex-col justify-center text-left">
                <h1 className="text-3xl font-bold mb-6 leading-tight">
                  Driving health
                  <br />
                  care forward
                </h1>
                <p className="text-base leading-relaxed">
                  With you at the center of everything we do, we are building
                  the healthcare company of the future by redefining what to
                  expect from a health insurer.
                </p>
              </div>

              {/* Person image with IBX overlay */}
              <div className="relative h-74 bg-[#3a7bc8] flex items-center">
                <img
                  src="/independence_home.png"
                  alt="Person with coffee"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right content area */}
            <div className="flex-1 mt-2 ml-4 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto">
                {activeView === "practiceCall" && (
                  <div className="w-full ">
                    <div
                      className="border border-[#4a90e2] rounded-lg p-8 mb-4"
                      style={{ borderRadius: "16px" }}
                    >
                      <div className="bg-gray-200 p-2 mb-3">
                        Enter details Initiating Practise call
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center border-b border-gray-300 pb-2">
                          <div className="w-64 text-[#4a90e2]">Your Name:</div>
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={userName}
                              onChange={handleNameChange}
                              className="w-full border-none focus:outline-none"
                              placeholder="Enter your name"
                            />
                            {showNameSuggestions && (
                              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 z-10 max-h-40 overflow-y-auto">
                                {filteredNames.map((name, index) => (
                                  <div
                                    key={index}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      setUserName(name);
                                      setShowNameSuggestions(false);
                                    }}
                                  >
                                    {name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center border-b border-gray-300 pb-2">
                          <div className="w-64 text-[#4a90e2]">
                            Choose Practise scenario
                          </div>
                          <div className="flex-1 relative">
                            <div
                              className="flex justify-between items-center cursor-pointer"
                              onClick={() =>
                                setShowScenarioDropdown(!showScenarioDropdown)
                              }
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
                                    setSelectedScenario("Coverage & Benefits");
                                    setShowScenarioDropdown(false);
                                  }}
                                >
                                  Coverage & Benefits
                                </div>
                                <div
                                  className="p-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => {
                                    setSelectedScenario(
                                      "Medical Card Replacement"
                                    );
                                    setShowScenarioDropdown(false);
                                  }}
                                >
                                  Medical Card Replacement
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center border-b border-gray-300 pb-2">
                          <div className="w-64 text-[#4a90e2]">
                            Choose Customer behaviour
                          </div>
                          <div className="flex-1 relative">
                            <div
                              className="flex justify-between items-center cursor-pointer"
                              onClick={() =>
                                setShowBehaviorDropdown(!showBehaviorDropdown)
                              }
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
                                    setCustomerBehavior("Normal");
                                    setShowBehaviorDropdown(false);
                                  }}
                                >
                                  Normal
                                </div>
                                <div
                                  className="p-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => {
                                    setCustomerBehavior("Aggressive");
                                    setShowBehaviorDropdown(false);
                                  }}
                                >
                                  Aggressive
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex justify-center">
                          <button
                            className="bg-[#d35400] text-white py-2 px-24 rounded-md"
                            onClick={handlePracticeSubmit}
                          >
                            Click to Submit
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      className="border border-[#4a90e2] mt-10 rounded-lg p-8"
                      style={{ borderRadius: "16px" }}
                    >
                      <div className="bg-gray-200 p-2 mb-3">
                        Choose name to listening to previous call recordings
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center border-b border-gray-300 pb-2">
                          <div className="w-64 text-[#4a90e2]">Your Name:</div>
                          <div className="flex-1 relative">
                            <div
                              className="flex justify-between items-center cursor-pointer"
                              onClick={() =>
                                setShowAgentDropdown(!showAgentDropdown)
                              }
                            >
                              <span>{selectedAgent || "Select an agent"}</span>
                              <div className="bg-gray-200 w-6 h-6 flex items-center justify-center">
                                {isLoadingAgents ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-[#4a90e2] border-t-transparent rounded-full"></div>
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                            {showAgentDropdown && agents.length > 0 && (
                              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 z-10 max-h-40 overflow-y-auto">
                                {agents.map((agent) => (
                                  <div
                                    key={agent._id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      setSelectedAgent(agent.name);
                                      setSelectedAgentId(agent._id); // Store the _id
                                      if (agent.agentId) {
                                        setCurrentAgentId(agent.agentId);
                                      }
                                      setShowAgentDropdown(false);
                                    }}
                                  >
                                    {agent.name}
                                  </div>
                                ))}
                              </div>
                            )}
                            {agents.length === 0 && !isLoadingAgents && (
                              <div className="text-sm text-gray-500 mt-1">
                                No agents available
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex justify-center">
                          <button
                            className=" bg-[#d35400] text-white py-2 px-24 rounded-md"
                            onClick={handleRecordingsSubmit}
                            disabled={!selectedAgent || isLoadingAgents}
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
                    <div className="bg-gray-200 p-2 font-bold">
                      Customer Details
                    </div>
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
                          <td className="p-2">
                            {customerDetails.accountNumber}
                          </td>
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
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
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
                      <div className="text-[#005b96] text-3xl font-bold mt-2">
                        Click to Start Call
                      </div>
                    </div>
                  </div>
                )}

                {activeView === "endCall" && (
                  <div className="w-full">
                    <div className="bg-gray-200 p-2 font-bold">
                      Customer Details
                    </div>
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
                          <td className="p-2">
                            {customerDetails.accountNumber}
                          </td>
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
                            <svg
                              width="40"
                              height="40"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
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
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <line
                                x1="8"
                                y1="23"
                                x2="16"
                                y2="23"
                                stroke="white"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="text-[#005b96] text-3xl font-bold mt-2">
                            Click to End Call
                          </div>
                          {isUpdatingCallRecord && (
                            <div className="mt-2 text-gray-500 flex items-center">
                              <div className="animate-spin h-4 w-4 border-2 border-[#4a90e2] border-t-transparent rounded-full mr-2"></div>
                              Updating call record...
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Start Call button */}
                          <div
                            className="w-20 h-20 rounded-full bg-black flex items-center justify-center cursor-pointer"
                            onClick={toggleCall}
                          >
                            <svg
                              width="40"
                              height="40"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
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
                          <div className="text-[#005b96] text-3xl font-bold mt-2">
                            Click to Start Call
                          </div>

                          {/* Listen to recording button */}
                          <button
                            className="mt-4 bg-[#4a90e2] text-white py-2 px-8 rounded-md w-64"
                            onClick={handleListenToRecording}
                          >
                            Click to Listen to call recording
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Recordings view with new layout */
          <div className="w-full h-full flex flex-col">
            {/* Banner Section */}
            <div className="flex mb-4 h-[300px]">
              {/* Left blue section */}
              <div className="w-[50%] bg-[#4a90e2] text-white p-4">
                <h1 className="text-3xl font-bold mb-2 leading-tight">
                  Driving health
                  <br />
                  care forward
                </h1>
                <p className="text-base leading-snug">
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

              {/* Right image section */}
              <div className="w-[50%] relative h-full">
                <img
                  src="/independence_home.png"
                  alt="Person with coffee"
                  className="w-full h-full object-cover"
                />
               
              </div>
            </div>

            {/* Call Recordings section */}
            <div className="w-full flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-gray-200 p-2 flex justify-between items-center">
                <span className="font-bold">
                  Call Recordings for {selectedAgent}
                </span>
                <button
                  className="bg-[#d35400] text-white px-3 py-1 rounded"
                  onClick={handleRecordingsSubmit}
                >
                  Refresh
                </button>
              </div>

              {/* Scrollable Table */}
              <div className="overflow-y-auto flex-1">
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
                  <tbody>{renderCallRecords()}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
