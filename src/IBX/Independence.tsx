"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Download, X } from "lucide-react";
import { RetellWebClient } from "retell-client-js-sdk";
import { type CustomerDetails, getRandomCustomer } from "./data/customers.ts";

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

// Call details interface
interface CallDetails {
  call_id: string;
  transcript: string;
  recording_url: string;
  duration_ms: number;
  start_timestamp?: number;
  end_timestamp?: number;
  call_analysis: {
    call_summary: string;
    user_sentiment: string;
  };
}

// Interface to store call times
interface CallTimes {
  [callId: string]: {
    startTime: string;
    endTime: string;
    duration?: string;
    sentiment?: string;
  };
}

// Function to format timestamp to Indian time format
function formatTimestampToIndianTime(timestamp: number): string {
  if (!timestamp) return "N/A";

  // Create a date object with the timestamp (milliseconds)
  const date = new Date(timestamp);

  // Format to Indian time (IST is UTC+5:30)
  return date.toLocaleString("en-IN", {
    timeZone: "America/New_York",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Initialize the RetellWebClient outside the component
const webClient = new RetellWebClient();

export default function Independence() {
  const [activeView, setActiveView] = useState<
    "practiceCall" | "startCall" | "endCall" | "recordings"
  >("practiceCall");

  const [userName, setUserName] = useState("");
  const [namesList, setNamesList] = useState<string[]>([]);
  const [filteredNames, setFilteredNames] = useState<string[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  // Update the selectedScenario state to remove the gender suffix
  const [selectedScenario, setSelectedScenario] = useState<
    | "Coverage & Benefits"
    | "Medical Card Replacement"
    | "Prescription Drug Coverage"
    |"Medical Adherence"
  >("Coverage & Benefits");

  const [customerBehavior, setCustomerBehavior] = useState("Normal");
  const [customerGender, setCustomerGender] = useState<"Male" | "Female">(
    "Male"
  );
  const [showScenarioDropdown, setShowScenarioDropdown] = useState(false);
  const [showBehaviorDropdown, setShowBehaviorDropdown] = useState(false);
  const [callStatus, setCallStatus] = useState<
    "not-started" | "active" | "inactive"
  >("not-started");
  const [callInProgress, setCallInProgress] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  // eslint-disable-next-line
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  const [selectedAgentInput, setSelectedAgentInput] = useState("");
  const [agentFilteredNames, setAgentFilteredNames] = useState<string[]>([]);
  const [showAgentSuggestions, setShowAgentSuggestions] = useState(false);

  // Track the current call information
  const [currentCallId, setCurrentCallId] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentAgentId, setCurrentAgentId] = useState<string>("");
  const [isUpdatingCallRecord, setIsUpdatingCallRecord] = useState(false);

  // Store the newly created agent's _id
  const [createdAgentId, setCreatedAgentId] = useState<string>("");

  // Customer details from the table
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>(
    getRandomCustomer("Male", "Normal")
  );

  // Call details and popup state
  const [callDetails, setCallDetails] = useState<CallDetails | null>(null);
  const [showCallSummary, setShowCallSummary] = useState(false);
  const [isLoadingCallDetails, setIsLoadingCallDetails] = useState(false);
  const [currentPlayingCallId, setCurrentPlayingCallId] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);

  // Store call times for all calls
  const [callTimes, setCallTimes] = useState<CallTimes>({});
  const [isLoadingCallTimes, setIsLoadingCallTimes] = useState(false);

  // Store form data for back button
  const [formData, setFormData] = useState({
    userName: "",
    selectedScenario: "Coverage & Benefits",
    customerBehavior: "Normal",
  });

  // Sorting and Filtering states
  const [sortColumn, setSortColumn] = useState<string | null>("startTime");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState<string>("");

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

  // Function to fetch call details from Retell API
  const fetchCallDetails = async (
    callId: string,
    updateCallTimes = false
  ): Promise<CallDetails | null> => {
    if (!updateCallTimes) {
      setIsLoadingCallDetails(true);
    }

    try {
      const response = await fetch(
        `https://api.retellai.com/v2/get-call/${callId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer key_2747254ddf6a6cdeea3935f67a5d`, // Use the same API key as in registerCall
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching call details: ${response.status}`);
      }

      const data = await response.json();
      console.log("Call details fetched successfully:", data);

      if (!updateCallTimes) {
        setCallDetails(data);
        setCurrentPlayingCallId(callId);
        setShowCallSummary(true);

        // If there's a recording URL, set it to the audio element
        if (data.recording_url && audioRef.current) {
          audioRef.current.src = data.recording_url;
          audioRef.current.load();
        }
      }

      return data;
    } catch (error) {
      console.error("Error fetching call details:", error);
      if (!updateCallTimes) {
        alert("Failed to fetch call details. Please try again.");
      }
      return null;
    } finally {
      if (!updateCallTimes) {
        setIsLoadingCallDetails(false);
      }
    }
  };

  // Function to fetch call times for all call IDs
  const fetchAllCallTimes = async (callIds: string[]) => {
    if (!callIds || callIds.length === 0) return;

    setIsLoadingCallTimes(true);
    const newCallTimes: CallTimes = {};

    try {
      // Create an array of promises for all API calls
      const promises = callIds.map((callId) => fetchCallDetails(callId, true));

      // Wait for all promises to resolve
      const results = await Promise.allSettled(promises);

      // Process the results
      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          const callData = result.value;
          const callId = callIds[index];

          newCallTimes[callId] = {
            startTime: formatTimestampToIndianTime(
              callData.start_timestamp || 0
            ),
            endTime: formatTimestampToIndianTime(callData.end_timestamp || 0),
            duration: callData.duration_ms
              ? `${Math.round(callData.duration_ms / 1000)} seconds`
              : "N/A",
            sentiment: callData.call_analysis?.user_sentiment || "N/A",
          };
        } else {
          // If the API call failed, use placeholder values
          const callId = callIds[index];
          newCallTimes[callId] = {
            startTime: "N/A",
            endTime: "N/A",
            duration: "N/A",
            sentiment: "N/A",
          };
        }
      });

      // Update the state with all call times
      setCallTimes(newCallTimes);
    } catch (error) {
      console.error("Error fetching call times:", error);
    } finally {
      setIsLoadingCallTimes(false);
    }
  };

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

  // Function to reset all form fields
  const resetFormFields = () => {
    // If we have saved form data, restore it
    if (formData.userName) {
      setUserName(formData.userName);
      setSelectedScenario(formData.selectedScenario);
      setCustomerBehavior(formData.customerBehavior);
    } else {
      setUserName("");
      setSelectedScenario("Coverage & Benefits");
      setCustomerBehavior("Normal");
    }

    setSelectedAgent("");
    setSelectedAgentId("");
    setShowNameSuggestions(false);
    setShowScenarioDropdown(false);
    setShowBehaviorDropdown(false);
    setShowAgentDropdown(false);
  };

  // Modify the handleViewChange function to reset form fields when going back to the practice call screen
  const handleViewChange = (
    view: "practiceCall" | "startCall" | "endCall" | "recordings"
  ) => {
    setActiveView(view);

    // Reset form fields when going back to the practice call screen
    if (view === "practiceCall") {
      resetFormFields();
    }
  };

  // Update the handlePracticeSubmit function to randomize gender internally
  const handlePracticeSubmit = async () => {
    try {
      // Save form data for back button
      setFormData({
        userName,
        selectedScenario,
        customerBehavior,
      });

      // Randomize gender
      const randomGender = Math.random() < 0.5 ? "Male" : "Female";
      setCustomerGender(randomGender as "Male" | "Female");

      // Determine the agentId based on selected scenario, randomized gender, and behavior
      let agentId;
if (selectedScenario === "Coverage & Benefits") {
  if (randomGender === "Male") {
    agentId = customerBehavior === "Normal"
      ? "agent_86f582156aef296a4df5abbc07"
      : "agent_daba87b4e98a3d4f857f36ee09";
  } else {
    agentId = customerBehavior === "Normal"
      ? "agent_f41aeb86e38c7e6add943bc91d"
      : "agent_a448fcfcdc61e91f865e175c01";
  }
} else if (selectedScenario === "Medical Card Replacement") {
  if (randomGender === "Male") {
    agentId = customerBehavior === "Normal"
      ? "agent_30840e1346b38fac1d68f38aa6"
      : "agent_264722906847c49df34b2a29d7";
  } else {
    agentId = customerBehavior === "Normal"
      ? "agent_ecb82d397828ed4289dab3e85f"
      : "agent_71f7f555e857ec893be87883f5";
  }
} else if (selectedScenario === "Medical Adherence") {
  if (randomGender === "Male") {
    agentId = customerBehavior === "Normal"
      ? "agent_7b6a3d8d765884c278db47b075"
      : "agent_229836927b68d8727f791acdc6";
  } else {
    agentId = customerBehavior === "Normal"
      ? "agent_09b3e6b585bc701d7a0036fba8"
      : "agent_726b44e295398f8517d1898448";
  }
}


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

      // Store the newly created agent's _id
      if (data && data._id) {
        console.log("Setting created agent ID to:", data._id);
        setCreatedAgentId(data._id);
        setSelectedAgentId(data._id);
        setSelectedAgent(userName); // Set the selected agent name to the current user
      }

      // Get a new random customer based on randomized gender and selected behavior
      const newCustomer = getRandomCustomer(randomGender, customerBehavior);
      setCustomerDetails(newCustomer);

      // Continue with the original flow
      handleViewChange("startCall");
    } catch (error) {
      console.error("Error creating agent:", error);
      // Still navigate to the next view even if there's an error
      const randomGender = Math.random() < 0.5 ? "Male" : "Female";
      setCustomerGender(randomGender as "Male" | "Female");
      const newCustomer = getRandomCustomer(randomGender, customerBehavior);
      setCustomerDetails(newCustomer);
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
      // if (data.length > 0 && !selectedAgent) {
      //   setSelectedAgent(data[0].name);
      //   setSelectedAgentId(data[0]._id); // Store the _id
      //   if (data[0].agentId) {
      //     setCurrentAgentId(data[0].agentId);
      //   }
      // }
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

        // Fetch call times for all call IDs if there are any
        const allCallIds = data.flatMap((agent) => agent.callIds || []);
        if (allCallIds.length > 0) {
          fetchAllCallTimes(allCallIds);
        }
      } else {
        // If it's a single object, create an array with just that object
        setAgents([data]);
        // Also update the selected agent and IDs
        setSelectedAgent(data.name);
        setSelectedAgentId(data._id); // Store the _id
        if (data.agentId) {
          setCurrentAgentId(data.agentId);
        }

        // Fetch call times for all call IDs if there are any
        if (data.callIds && data.callIds.length > 0) {
          fetchAllCallTimes(data.callIds);
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

    // Use the created agent ID if available, otherwise try to find the selected agent
    let agentIdToUse = createdAgentId;

    // If we don't have a created agent ID, try to find the selected agent
    if (!agentIdToUse) {
      const agent = agents.find((a) => a.name === selectedAgent);
      if (agent && agent._id) {
        agentIdToUse = agent._id;
      }
    }

    if (!agentIdToUse) {
      console.error("No valid agent ID found");
      alert("No valid agent found. Please select an agent first.");
      return;
    }

    console.log("Using agent ID for call recording:", agentIdToUse);

    try {
      setIsUpdatingCallRecord(true);
      const callIdToUse =
        currentCallId || `Call${Date.now().toString().slice(-5)}`;

      console.log("Updating call record with:", {
        agentId: agentIdToUse,
        callId: callIdToUse,
      });

      // Call the update API with the agent ID
      const response = await fetch(
        `https://ibx-backend.replit.app/api/agents/calls/add/${agentIdToUse}`,
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
      if (createdAgentId) {
        // If we have a created agent ID, fetch details for that agent
        try {
          const detailsResponse = await fetch(
            `https://ibx-backend.replit.app/api/agents/details/${agentIdToUse}`
          );
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            console.log("Agent details after update:", detailsData);

            // Update the agents state with the detailed data
            if (Array.isArray(detailsData)) {
              setAgents(detailsData);

              // Fetch call times for all call IDs
              const allCallIds = detailsData.flatMap(
                (agent) => agent.callIds || []
              );
              if (allCallIds.length > 0) {
                fetchAllCallTimes(allCallIds);
              }
            } else {
              setAgents([detailsData]);
              setSelectedAgent(detailsData.name);

              // Fetch call times for all call IDs
              if (detailsData.callIds && detailsData.callIds.length > 0) {
                fetchAllCallTimes(detailsData.callIds);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching updated agent details:", error);
        }
      } else {
        // Otherwise use the normal refresh method
        await handleRecordingsSubmit();
      }

      // Navigate to recordings view to show the updated records
      handleViewChange("recordings");
    } catch (error) {
      console.error("Error updating call record:", error);
      alert("Failed to update call record. Please try again.");
    } finally {
      setIsUpdatingCallRecord(false);
    }
  };

  // Also update the registerCall function to use the same agent ID selection logic
  const registerCall = async (): Promise<RegisterCallResponse> => {
    // Use the already set customerGender, selected scenario, and behavior
    let agentId;
if (selectedScenario === "Coverage & Benefits") {
  if (customerGender === "Male") {
    agentId = customerBehavior === "Normal"
      ? "agent_86f582156aef296a4df5abbc07"
      : "agent_daba87b4e98a3d4f857f36ee09";
  } else {
    agentId = customerBehavior === "Normal"
      ? "agent_f41aeb86e38c7e6add943bc91d"
      : "agent_a448fcfcdc61e91f865e175c01";
  }
} else if (selectedScenario === "Medical Card Replacement") {
  if (customerGender === "Male") {
    agentId = customerBehavior === "Normal"
      ? "agent_30840e1346b38fac1d68f38aa6"
      : "agent_264722906847c49df34b2a29d7";
  } else {
    agentId = customerBehavior === "Normal"
      ? "agent_ecb82d397828ed4289dab3e85f"
      : "agent_71f7f555e857ec893be87883f5";
  }
} else if (selectedScenario === "Medical Adherence") {
  if (customerGender === "Male") {
    agentId = customerBehavior === "Normal"
      ? "agent_7b6a3d8d765884c278db47b075"
      : "agent_229836927b68d8727f791acdc6";
  } else {
    agentId = customerBehavior === "Normal"
      ? "agent_09b3e6b585bc701d7a0036fba8"
      : "agent_726b44e295398f8517d1898448";
  }
}




    // Store the current agent ID for later use
    setCurrentAgentId(agentId);
    console.log("Set current agent ID in registerCall to:", agentId);

    try {
      // Format the date of birth to match expected format
      const dob = customerDetails.dob;
      const formattedDob = dob;

      // Make API call to register the call
      const response = await fetch(
        "https://api.retellai.com/v2/create-web-call",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer key_2747254ddf6a6cdeea3935f67a5d`,
          },
          body: JSON.stringify({
            agent_id: agentId,
            retell_llm_dynamic_variables: {
              first_name: customerDetails.name,
              gender: customerDetails.gender,
              phone_number: customerDetails.phone,
              address: customerDetails.address,
              dob: formattedDob,
              member_id: customerDetails.memberId,
              customer_behavior: customerBehavior,
              authStatus: customerDetails.authStatus, // ✅ newly added
              medicarePlan: customerDetails.medicarePlan, // ✅ newly added
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

  // Function to handle playing a call recording
  const handlePlayRecording = (callId: string) => {
    console.log("Playing recording for call ID:", callId);
    fetchCallDetails(callId);
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

    // Prepare call records for sorting and filtering
    let callRecords = agent.callIds.map((callId) => ({
      id: callId,
      startTime: callTimes[callId]?.startTime || "N/A",
      endTime: callTimes[callId]?.endTime || "N/A",
      duration: callTimes[callId]?.duration || "N/A",
      sentiment: callTimes[callId]?.sentiment || "N/A",
    }));

    // Apply search filter
    if (searchTerm) {
      callRecords = callRecords.filter((call) =>
        Object.values(call).some((value) =>
          value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn) {
      callRecords.sort((a, b) => {
        let aValue = a[sortColumn as keyof typeof a] || "";
        let bValue = b[sortColumn as keyof typeof b] || "";

        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Display the call records
    return callRecords.length > 0 ? (
      callRecords.map((call, index) => (
        <tr key={index} className="border-b border-gray-300">
          <td className="p-2">{call.id}</td>
          <td className="p-2">{call.startTime}</td>
          <td className="p-2">{call.endTime}</td>
          <td className="p-2">{call.duration}</td>
          <td className="p-2">{call.sentiment}</td>
          <td className="p-2">
            <button
              className="bg-[#4a90e2] text-white px-2 py-1 rounded text-xs"
              onClick={() => handlePlayRecording(call.id)}
              disabled={isLoadingCallDetails}
            >
              {isLoadingCallDetails && currentPlayingCallId === call.id
                ? "Loading..."
                : "View Call Details"}
            </button>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={6} className="p-4 text-center">
          {isLoadingCallTimes
            ? "Loading..."
            : "No call records match your filters."}
        </td>
      </tr>
    );
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
    <div className="flex flex-col w-full h-screen bg-white overflow-hidden">
      <header className="flex justify-between items-center p-4">
        <div className="text-[#4a90e2] flex items-center">
          {/* Independence logo */}
          <div className="flex items-center">
            <img
              src="/independence_logo.png"
              alt="Independence Logo"
              style={{ width: "400px", height: "auto", marginLeft: "-70px" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">
            Welcome, {userName || "User"}
          </span>
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
            <div className="w-[30%] h-full">
              <img
                src="/independence_home.jpeg"
                alt="Person with coffee"
                style={{
                  width: "100%",
                  height: "90%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Right content area */}
            <div className="flex-1 ml-4 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto">
                {activeView === "practiceCall" && (
                  <div className="w-full">
                    <div
                      className="border border-[#4a90e2] rounded-lg p-4 mb-4"
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
                           <div
  className="p-2 hover:bg-gray-100 cursor-pointer"
  onClick={() => {
    setSelectedScenario("Medical Adherence");
    setShowScenarioDropdown(false);
  }}
>
  Medical Adherence - Outbound
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
                            className="bg-[#d35400] text-white py-2 px-24 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                            onClick={handlePracticeSubmit}
                            disabled={!userName || userName.trim() === ""}
                          >
                            Click to Submit
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      className="border border-[#4a90e2] rounded-lg p-4"
                      style={{ borderRadius: "16px" }}
                    >
                      <div className="bg-gray-200 p-2 mb-3">
                        Choose name to listening to previous call recordings
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center border-b border-gray-300 pb-2">
                          <div className="w-64 text-[#4a90e2]">Your Name:</div>
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={selectedAgentInput}
                              onChange={(e) => {
                                const value = e.target.value;
                                setSelectedAgentInput(value);
                                const filtered = namesList.filter((name) =>
                                  name
                                    .toLowerCase()
                                    .includes(value.toLowerCase())
                                );
                                setAgentFilteredNames(filtered);
                                setShowAgentSuggestions(filtered.length > 0);
                              }}
                              className="w-full border-none focus:outline-none"
                              placeholder="Type your name"
                            />
                            {showAgentSuggestions && (
                              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 z-10 max-h-40 overflow-y-auto">
                                {agentFilteredNames.map((name, index) => {
                                  const agent = agents.find(
                                    (a) => a.name === name
                                  );
                                  return (
                                    <div
                                      key={index}
                                      className="p-2 hover:bg-gray-100 cursor-pointer"
                                      onClick={() => {
                                        setSelectedAgentInput(name);
                                        setSelectedAgent(name);
                                        setShowAgentSuggestions(false);
                                        if (agent) {
                                          setSelectedAgentId(agent._id);
                                          if (agent.agentId) {
                                            setCurrentAgentId(agent.agentId);
                                          }
                                        }
                                      }}
                                    >
                                      {name}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex justify-center">
                          <button
                            className="bg-[#d35400] text-white py-2 px-24 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                          <td className="p-2 text-[#4a90e2]">Member ID</td>
                          <td className="p-2">{customerDetails.memberId}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2 text-[#4a90e2]">Gender</td>
                          <td className="p-2">{customerDetails.gender}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">Customer Behaviour</td>
                          <td className="p-2 font-bold">
                            {customerDetails.behavior}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">Practice Scenario</td>
                          <td className="p-2 font-bold">{selectedScenario}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">Plan Name</td>
                          <td className="p-2 font-bold">
                            {customerDetails.medicarePlan}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">Auth Status</td>
                          <td className="p-2 font-bold">
                            {customerDetails.authStatus}
                          </td>
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
                          <td className="p-2 text-[#4a90e2]">Member ID</td>
                          <td className="p-2">{customerDetails.memberId}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2 text-[#4a90e2]">Gender</td>
                          <td className="p-2">{customerDetails.gender}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">Customer Behaviour</td>
                          <td className="p-2 font-bold">
                            {customerDetails.behavior}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">Practice Scenario</td>
                          <td className="p-2 font-bold">{selectedScenario}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">Plan Name</td>
                          <td className="p-2 font-bold">
                            {customerDetails.medicarePlan}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">Auth Status</td>
                          <td className="p-2 font-bold">
                            {customerDetails.authStatus}
                          </td>
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
          /* Recordings view with simplified layout */
          <div className="w-full h-full flex flex-col">
            {/* Simple header bar */}
            <div className="bg-gray-200 p-2 flex justify-between items-center mb-4">
              <span className="font-bold">
                Call Recordings for {selectedAgent}
              </span>
              <button
                className="bg-[#d35400] text-white px-3 py-1 rounded"
                onClick={() => {
                  resetFormFields();
                  handleViewChange("practiceCall");
                }}
              >
                Home Page
              </button>
            </div>
            {/* Search and Sort Controls */}
            <div className="p-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search call records..."
                className="p-2 border border-gray-300 rounded w-1/3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex items-center">
                <label htmlFor="sortColumn" className="mr-2">
                  Sort by:
                </label>
                <select
                  id="sortColumn"
                  className="p-2 border border-gray-300 rounded"
                  value={sortColumn || ""}
                  onChange={(e) => {
                    const column = e.target.value;
                    setSortColumn(column === "" ? null : column);
                    setSortOrder(
                      column === sortColumn
                        ? sortOrder === "asc"
                          ? "desc"
                          : "asc"
                        : "asc"
                    );
                  }}
                >
                  <option value="">None</option>
                  <option value="startTime">Start Time</option>
                  <option value="endTime">End Time</option>
                  <option value="duration">Duration</option>
                  <option value="sentiment">Sentiment</option>
                </select>
                {sortColumn && (
                  <button
                    className="ml-2 px-3 py-1 bg-gray-200 rounded"
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                  >
                    {sortOrder === "asc" ? "Asc" : "Desc"}
                  </button>
                )}
              </div>
            </div>

            {/* Main content with table only - no banner */}
            <div className="flex-1 bg-white p-4 overflow-y-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="p-2 text-left">Call ID</th>
                    <th className="p-2 text-left">Start time</th>
                    <th className="p-2 text-left">End Time</th>
                    <th className="p-2 text-left">Call Duration</th>
                    <th className="p-2 text-left">Customer Sentiment</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>{renderCallRecords()}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Call Summary Popup */}
      {showCallSummary && callDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Call Summary</h2>
              <button
                onClick={() => setShowCallSummary(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-2">Summary</h3>
              <p className="text-gray-700">
                {callDetails.call_analysis?.call_summary ||
                  "No summary available"}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-2">Transcript</h3>
              <div className="bg-gray-100 p-3 rounded-md max-h-40 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">
                  {callDetails.transcript || "No transcript available"}
                </pre>
              </div>
            </div>

            {callDetails.recording_url && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">Recording</h3>
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = callDetails.recording_url;
                      link.download = `call-recording-${
                        callDetails.call_id || "unknown"
                      }.wav`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
                <audio
                  ref={audioRef}
                  controls
                  className="w-full"
                  src={callDetails.recording_url}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

