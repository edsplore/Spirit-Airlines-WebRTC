"use client"

import React from "react"

import "./App.css"
import { useEffect, useState, useRef, useCallback } from "react"
import { Mic, RefreshCcw } from "lucide-react"
import { RetellWebClient } from "retell-client-js-sdk"
import { addDays, format } from "date-fns"

interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}

interface UserDetails {
  name: string
  dob: string
  email: string
  address: string
  medicalCode: string
  phone: string
  validation: {
    name: "valid" | "invalid" | ""
    dob: "valid" | "invalid" | ""
    email: "valid" | "invalid" | ""
    address: "valid" | "invalid" | ""
    medicalCode: "valid" | "invalid" | ""
    phone: "valid" | "invalid" | ""
  }
}

interface ApiData {
  name: string
  dob: string
  email: string
  address: string
  medicalCode: string
  phone: string
}

const webClient = new RetellWebClient()

const notes = [
  "The platform is not integrated into the company systems, therefore asking for specific details for authentication and verification",
  <span key="1">Please enter the name that the Virtual Assistant wants to address you as.</span>,
  "Upon authentication request by Virtual Assistant please mention confirmation code # and full name as shown on the top right side of the bar for reference upon this form submission.",
  "Phone# and Email id is required to send instant messages and confirmation",
]

const apiKey = "key_98fef97480c54d6bf0698564addb"

export default function Centene2(): React.ReactElement {
  const [allTrialsUsed, setAllTrialsUsed] = useState(false)

  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "",
    dob: "",
    email: "",
    address: "123 Maple Street, Nashville, Tennessee, 37201",
    medicalCode: "U900312752",
    phone: "6152314412",
    validation: {
      name: "",
      dob: "",
      email: "",
      address: "",
      medicalCode: "",
      phone: "",
    },
  })

  // Replace the existing apiCallData state with this:
  const [apiCallData, setApiCallData] = useState<{
    member_id: string[]
    shipping_address: string[]
    member_name: string[]
    _d_o_b: string[]
    phone: string[]
    email: string[]
  }>({
    member_id: [],
    shipping_address: [],
    member_name: [],
    _d_o_b: [],
    phone: [],
    email: [],
  })

  // Replace the existing apiData state with this:
  const [apiData, setApiData] = useState<{
    name: string[]
    dob: string[]
    email: string[]
    address: string[]
    medicalCode: string[]
    phone: string[]
  }>({
    name: [],
    dob: [],
    email: [],
    address: [],
    medicalCode: [],
    phone: [],
  })

  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [callInProgress, setCallInProgress] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [showVerificationForm, setShowVerificationForm] = useState(true)

  const [dobMonth, setDobMonth] = useState("")
  const [dobDay, setDobDay] = useState("")
  const [dobYear, setDobYear] = useState("")

  const [currentCallId, setCurrentCallId] = useState<string>("")
  const callEndedRef = useRef(false)
  const [callEnded, setCallEnded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add a new state to track which agent ID to use
  const [useAlternateAgent, setUseAlternateAgent] = useState(false)

  useEffect(() => {
    setFormSubmitted(false)
    setAllTrialsUsed(false)
  }, [])

  // Modify the fetchCallData function to update the new state
  const fetchCallData = useCallback(async (callId: string) => {
    setIsLoading(true)
    setError(null)
    console.log(`Attempting to fetch call data for ID: ${callId}`)

    try {
      const apiUrl = `https://api.retellai.com/v2/get-call/${callId}`
      console.log(`Making API request to: ${apiUrl}`)

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      })

      console.log(`API response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to fetch call data. Status: ${response.status}, Response: ${errorText}`)
        throw new Error(`API Error: ${response.status}, ${errorText}`)
      }

      const data = await response.json()
      console.log("Call data retrieved successfully:", JSON.stringify(data))

      // Extract the custom analysis data
      const customData = data.call_analysis.custom_analysis_data
      setApiCallData((prev) => ({
        member_id: [...prev.member_id, customData.member_id || ""],
        shipping_address: [...prev.shipping_address, customData.shipping_address || ""],
        member_name: [...prev.member_name, customData.member_name || ""],
        _d_o_b: [...prev._d_o_b, customData._d_o_b || ""],
        phone: [...prev.phone, customData.phone_number || customData.phone || ""],
        email: [...prev.email, customData.email || ""],
      }))

      setIsLoading(false)
      return data
    } catch (err) {
      console.error("Error in fetchCallData:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setIsLoading(false)
      throw err
    }
  }, [])

  useEffect(() => {
    webClient.on("conversationStarted", () => {
      console.log("Conversation started successfully")
      setCallStatus("active")
      setCallInProgress(false)
      callEndedRef.current = false
      // Explicitly ensure callEnded is false when conversation starts
      setCallEnded(false)
    })

    webClient.on("conversationEnded", ({ code, reason }) => {
      console.log("Conversation ended event triggered with code:", code, "reason:", reason)
      setCallStatus("inactive")
      setCallInProgress(false)
      callEndedRef.current = true

      // Add a small delay before setting callEnded to true to ensure all other state updates have completed
      setTimeout(() => {
        setCallEnded(true)
        console.log("Call ended, callEnded state set to true")
        console.log("Current call ID:", currentCallId)
      }, 500)
    })

    webClient.on("error", (error) => {
      console.error("An error occurred:", error)
      setCallStatus("inactive")
      setCallInProgress(false)
    })

    webClient.on("update", (update) => {
      console.log("Update received", update)
    })

    return () => {
      webClient.off("conversationStarted")
      webClient.off("conversationEnded")
      webClient.off("error")
      webClient.off("update")
    }
  }, [currentCallId])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    // Only run this effect when callEnded changes from false to true
    if (callEnded && currentCallId) {
      console.log("Call ended detected, preparing to fetch call data...")
      console.log("Current call ID:", currentCallId)

      // Increase the timeout to give the API more time to process the call data
      timeoutId = setTimeout(() => {
        console.log("Timeout completed, now fetching call data...")
        fetchCallData(currentCallId)
          .then((data) => {
            console.log("Call data fetched successfully:", data)
            return processCallData(data)
          })
          .then(() => {
            console.log("Call data processed successfully")
            // Reset callEnded after processing to prevent repeated API calls
            setCallEnded(false)
          })
          .catch((error) => console.error("Error fetching or processing call data:", error))
      }, 5000) // Increased from 1000ms to 3000ms to ensure the API has time to process
    }

    return () => {
      if (timeoutId) {
        console.log("Clearing timeout for API call")
        clearTimeout(timeoutId)
      }
    }
  }, [callEnded, currentCallId, fetchCallData])

  // Replace the processCallData function with this updated version
  // Replace the processCallData function with this improved version
  const processCallData = useCallback(
    (callData: any) => {
      try {
        console.log("Processing call data:", JSON.stringify(callData))

        const userInfo = callData.transcript?.user_info
        const customData = callData.call_analysis?.custom_analysis_data || {}

        if (!userInfo && !customData) {
          console.error("User info not found in call data")
          return
        }

        // Prefer data from custom_analysis_data if available, fall back to user_info
        const extractedData = {
          name: customData.member_name || userInfo?.name || "",
          dob: customData._d_o_b || userInfo?.dob || "",
          email: customData.email || userInfo?.email || "",
          address: customData.shipping_address || userInfo?.address || "",
          medicalCode: customData.member_id || userInfo?.medical_id || userInfo?.member_id || "",
          phone: customData.phone_number || customData.phone || userInfo?.phone || "",
        }

        console.log("Extracted data from API:", extractedData)
        console.log("User details:", userDetails)

        setApiData((prev) => ({
          name: [...prev.name, extractedData.name],
          dob: [...prev.dob, extractedData.dob],
          email: [...prev.email, extractedData.email],
          address: [...prev.address, extractedData.address],
          medicalCode: [...prev.medicalCode, extractedData.medicalCode],
          phone: [...prev.phone, extractedData.phone],
        }))

        // Improved normalization functions
        const normalizeString = (str: string) => {
          if (!str) return ""
          return str.toLowerCase().replace(/[^a-z0-9]/g, "")
        }

        const normalizeDOB = (dob: string) => {
          if (!dob) return ""

          // Try to match "Month-Day-Year" format (e.g., "Jan-01-1990")
          const dashPattern = /([a-z]+)-(\d+)-(\d+)/i
          const dashMatch = dob.match(dashPattern)

          if (dashMatch) {
            const [_, month, day, year] = dashMatch
            const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
            const monthIndex = monthNames.indexOf(month.toLowerCase().substring(0, 3))
            if (monthIndex !== -1) {
              return `${(monthIndex + 1).toString().padStart(2, "0")}${day.padStart(2, "0")}${year}`
            }
          }

          // Try to match "Month/Day/Year" format (e.g., "01/01/1990")
          const slashPattern = /(\d+)\/(\d+)\/(\d+)/
          const slashMatch = dob.match(slashPattern)

          if (slashMatch) {
            const [_, month, day, year] = slashMatch
            return `${month.padStart(2, "0")}${day.padStart(2, "0")}${year}`
          }

          // If no pattern matches, just normalize the string
          return normalizeString(dob)
        }

        // Normalize phone number (remove all non-digits)
        const normalizePhone = (phone: string) => {
          if (!phone) return ""
          return phone.replace(/\D/g, "")
        }

        // Perform validations
        const userDOB = normalizeDOB(userDetails.dob)
        const extractedDOB = normalizeDOB(extractedData.dob)

        console.log("Normalized DOB comparison:", userDOB, "vs", extractedDOB)

        const validation: UserDetails["validation"] = {
          name: normalizeString(extractedData.name) === normalizeString(userDetails.name) ? "valid" : "invalid",
          dob: userDOB === extractedDOB ? "valid" : "invalid",
          email: normalizeString(extractedData.email) === normalizeString(userDetails.email) ? "valid" : "invalid",
          address:
            normalizeString(extractedData.address) === normalizeString(userDetails.address) ? "valid" : "invalid",
          phone: normalizePhone(extractedData.phone) === normalizePhone(userDetails.phone) ? "valid" : "invalid",
          medicalCode:
            normalizeString(extractedData.medicalCode) === normalizeString(userDetails.medicalCode)
              ? "valid"
              : "invalid",
        }

        console.log("Validation results:", validation)
        console.log("Normalized comparisons:")
        console.log("Name:", normalizeString(extractedData.name), "vs", normalizeString(userDetails.name))
        console.log("DOB:", userDOB, "vs", extractedDOB)
        console.log("Email:", normalizeString(extractedData.email), "vs", normalizeString(userDetails.email))
        console.log("Address:", normalizeString(extractedData.address), "vs", normalizeString(userDetails.address))
        console.log("Phone:", normalizePhone(extractedData.phone), "vs", normalizePhone(userDetails.phone))
        console.log(
          "Medical ID:",
          normalizeString(extractedData.medicalCode),
          "vs",
          normalizeString(userDetails.medicalCode),
        )

        setUserDetails((prev) => ({
          ...prev,
          validation,
        }))
      } catch (error) {
        console.error("Error processing call data:", error)
      }
    },
    [userDetails],
  )

  // Add this new state to track if all columns are filled
  const [allColumnsFilled, setAllColumnsFilled] = useState(false)

  // Add this useEffect to check if all columns are filled
  useEffect(() => {
    const columnCount = Object.values(apiCallData).reduce((max, arr) => Math.max(max, arr.length), 0)
    const allFilled = columnCount >= 3
    setAllColumnsFilled(allFilled)

    // Set useAlternateAgent to true when all columns are filled
    if (allFilled) {
      setUseAlternateAgent(true)
      console.log("Switching to alternate agent ID: agent_032768381114b7bf21281a9790")
    }
  }, [apiCallData])

  const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const newFormData = new FormData(e.currentTarget)
    const newName = newFormData.get("name") as string
    const month = dobMonth
    const day = dobDay
    const year = dobYear

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthName = monthNames[Number.parseInt(month) - 1]

    const newDob = `${monthName}-${day.padStart(2, "0")}-${year}`

    const newEmail = newFormData.get("email") as string

    const newUserDetails = {
      ...userDetails,
      name: newName,
      dob: newDob,
      email: newEmail,
    }

    setUserDetails(newUserDetails)
    setFormSubmitted(true)
    setShowVerificationForm(false)
    console.log("Form submitted with details:", newUserDetails)
  }

  const toggleConversation = async () => {
    if (callInProgress) return
    setCallInProgress(true)

    if (callStatus === "active") {
      try {
        console.log("Stopping the call...")
        await webClient.stopCall()
        setCallStatus("inactive")
        setCallEnded(true)
        console.log("Call stopped, callEnded state set to true")
      } catch (error) {
        console.error("Error stopping the call:", error)
      } finally {
        setCallInProgress(false)
      }
    } else {
      try {
        // Reset callEnded state when starting a new call
        setCallEnded(false)
        await navigator.mediaDevices.getUserMedia({ audio: true })
        await initiateConversation()
      } catch (error) {
        console.error("Microphone permission denied or error occurred:", error)
      } finally {
        setCallInProgress(false)
      }
    }
  }

  // Modify the initiateConversation function to use the alternate agent ID when needed
  const initiateConversation = async () => {
    // Use the alternate agent ID when useAlternateAgent is true
    const agentId = useAlternateAgent ? "agent_032768381114b7bf21281a9790" : "agent_d3ca92c1776826ef142c084251"

    try {
      const registerCallResponse = await registerCall(agentId)
      if (registerCallResponse.callId) {
        setCurrentCallId(registerCallResponse.callId)
        console.log("Call ID set to:", registerCallResponse.callId)

        await webClient.startCall({
          accessToken: registerCallResponse.access_token || "",
          callId: registerCallResponse.callId,
          sampleRate: registerCallResponse.sampleRate,
          enableUpdate: true,
        })
        setCallStatus("active")
      }
    } catch (error) {
      console.error("Error in registering or starting the call:", error)
    }
  }

  async function registerCall(agentId: string): Promise<RegisterCallResponse> {
    console.log("Registering call for agent:", agentId)
    const sampleRate = Number.parseInt(process.env.NEXT_PUBLIC_RETELL_SAMPLE_RATE || "16000", 10)
    const policy_date = format(addDays(new Date(), 15), "dd MMM yyyy")

    try {
      const formattedConfirmationCode = userDetails.medicalCode.split("").join(" - ")
      const response = await fetch("https://api.retellai.com/v2/create-web-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          agent_id: agentId,
          retell_llm_dynamic_variables: {
            member_name: userDetails.name,
            email: userDetails.email,
            confirmation_code: formattedConfirmationCode,
            address: userDetails.address,
            DOB: userDetails.dob,
            policy_date: policy_date,
            phone: userDetails.phone,
            member_id: userDetails.medicalCode,
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
        sampleRate: sampleRate,
      }
    } catch (err) {
      console.error("Error registering call:", err)
      throw err
    }
  }

  // Update the reopenVerificationForm function
  const reopenVerificationForm = () => {
    if (allColumnsFilled) {
      // Reset all data and show the form
      setApiCallData({
        member_id: [],
        shipping_address: [],
        member_name: [],
        _d_o_b: [],
        phone: [],
        email: [],
      })
      setApiData({
        name: [],
        dob: [],
        email: [],
        address: [],
        medicalCode: [],
        phone: [],
      })
      setUserDetails({
        name: "",
        dob: "",
        email: "",
        address: "123 Maple Street, Nashville, Tennessee, 37201",
        medicalCode: "U900312752",
        phone: "6152314412",
        validation: {
          name: "",
          dob: "",
          email: "",
          address: "",
          medicalCode: "",
          phone: "",
        },
      })
      setShowVerificationForm(true)
      setFormSubmitted(false)
      setAllColumnsFilled(false)

      // Reset the agent ID to the original one
      setUseAlternateAgent(false)
      console.log("Reverting to original agent ID: agent_d3ca92c1776826ef142c084251")
    }
  }

  const generateMonthOptions = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.map((month, index) => (
      <option key={month} value={String(index + 1).padStart(2, "0")}>
        {month}
      </option>
    ))
  }

  const generateDayOptions = () => {
    return Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
      <option key={day} value={String(day).padStart(2, "0")}>
        {day}
      </option>
    ))
  }

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 100 }, (_, i) => currentYear - i).map((year) => (
      <option key={year} value={year}>
        {year}
      </option>
    ))
  }

  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      <nav className="bg-[#2E5388] w-full">
        <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-20 py-2">
          <img src="/centene_logo.png" alt="Centene" className="h-12 bg-transparent mb-4 md:mb-0" />
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-white text-sm md:text-lg font-bold">
            <span className="cursor-pointer whitespace-nowrap">Who are we</span>
            <span className="cursor-pointer whitespace-nowrap">Why we are different</span>
            <span className="cursor-pointer whitespace-nowrap">Products and Services</span>
            <span className="cursor-pointer whitespace-nowrap">Careers</span>
            <span className="cursor-pointer whitespace-nowrap">Investors</span>
            <span className="cursor-pointer whitespace-nowrap">News</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6 mt-4 px-4 lg:px-8 flex-grow">
        <div className="w-full lg:w-3/4">
          <div className="bg-white p-4 rounded-lg shadow border">
            {/* Update the JSX for the table header to include the Refresh button */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Customer Identity Verification (CIV) Status</h2>
              {allColumnsFilled && (
                <button
                  onClick={reopenVerificationForm}
                  className="flex items-center text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded"
                >
                  <RefreshCcw className="w-4 h-4 mr-1" />
                  Refresh
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#2E5388] text-white">
                    <th className="border p-2 text-left">CIV Parameter</th>
                    <th className="border p-2 text-left">Customer Details</th>
                    <th className="border p-2 text-left">Input Provided</th>
                    <th className="border p-2 text-left">Authentication Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Update the table rows to show validation status for each input */}
                  {[
                    { label: "Medical ID", key: "medicalCode", apiKey: "member_id" },
                    { label: "Member Name", key: "name", apiKey: "member_name" },
                    { label: "Date of Birth", key: "dob", apiKey: "_d_o_b" },
                    { label: "Address", key: "address", apiKey: "shipping_address" },
                    { label: "Phone Number", key: "phone", apiKey: "phone" },
                    { label: "Email ID", key: "email", apiKey: "email" },
                  ].map((param, index) => (
                    <React.Fragment key={param.key}>
                      {[0, 1, 2].map((row) => (
                        <tr key={`${param.key}-${row}`} className={index % 2 === 0 ? "bg-[#E6F3FF]" : "bg-white"}>
                          {row === 0 && (
                            <>
                              <td className="border p-8" rowSpan={3}>
                                {param.label}
                              </td>
                              <td className="border p-8 font-bold" rowSpan={3}>
                                {formSubmitted ? String(userDetails[param.key as keyof UserDetails]) : ""}
                              </td>
                            </>
                          )}
                          <td className="border p-2">
                            {apiCallData[param.apiKey as keyof typeof apiCallData][row] || ""}
                          </td>
                          <td className="border p-2">
                            {apiCallData[param.apiKey as keyof typeof apiCallData][row] && (
                              <span
                                className={
                                  userDetails.validation[param.key as keyof UserDetails["validation"]] === "valid"
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                {userDetails.validation[param.key as keyof UserDetails["validation"]] === "valid"
                                  ? "Valid"
                                  : "Invalid"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/4 flex items-start justify-center lg:mt-16">
          <button onClick={toggleConversation} className="flex flex-col items-center group">
            <div
              className={`p-8 md:p-16 bg-black rounded-full transition-all duration-300 group-hover:scale-105 ${
                callStatus === "active" ? "ring-4 ring-[#ffdc00] animate-pulse" : ""
              }`}
            >
              <Mic
                className={`w-12 h-12 md:w-16 md:h-16 text-[#1e81b0] ${
                  callStatus === "active" ? "animate-bounce" : ""
                }`}
              />
            </div>
            <span className="mt-4 text-[#1e81b0] text-xl md:text-3xl font-bold">
              {callStatus === "active" ? <span className="text-[#1e81b0]">Click to Disconnect</span> : "Let's Talk"}
            </span>
          </button>
        </div>
      </div>

      <div
        className="bg-fit bg-center text-white py-8 mt-8"
        style={{
          backgroundImage: "url('/Centene_Footer.png')",
          marginTop: "auto",
        }}
      >
        <div className="container mx-auto px-4 text-right">
          <p className="text-[#2E5388] font-bold text-sm md:text-base">Centene Headquarters:</p>
          <p className="text-[#2E5388] text-sm md:text-base">Centene Corporation, Centene Plaza,</p>
          <p className="text-[#2E5388] text-sm md:text-base">7700 Forsyth Boulevard St. Louis, MO 63105</p>
        </div>
      </div>

      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2E5388] rounded-[40px] p-4 sm:p-6 w-full max-w-xl mx-auto border-2 border-black shadow-lg overflow-y-auto max-h-[90vh] sm:max-h-none">
            <h2 className="text-base sm:text-xl font-medium text-white mb-4 sm:mb-6">
              Customer details required for verification and authentication
            </h2>
            <form onSubmit={handleSubmitDetails} className="space-y-4">
              <div className="grid gap-4 max-w-lg mx-auto">
                <div className="grid gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="name"
                      className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Member Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="dob"
                      className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Choose DOB
                    </label>
                    <div className="flex-1 flex gap-2">
                      <select
                        id="dobMonth"
                        name="dobMonth"
                        required
                        className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                        value={dobMonth}
                        onChange={(e) => setDobMonth(e.target.value)}
                      >
                        <option value="">Month</option>
                        {generateMonthOptions()}
                      </select>
                      <select
                        id="dobDay"
                        name="dobDay"
                        required
                        className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                        value={dobDay}
                        onChange={(e) => setDobDay(e.target.value)}
                      >
                        <option value="">Day</option>
                        {generateDayOptions()}
                      </select>
                      <select
                        id="dobYear"
                        name="dobYear"
                        required
                        className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                        value={dobYear}
                        onChange={(e) => setDobYear(e.target.value)}
                      >
                        <option value="">Year</option>
                        {generateYearOptions()}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="email"
                      className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Email id
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="address"
                      className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required
                      className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                      defaultValue="123 Maple Street, Nashville, Tennessee, 37201"
                      readOnly
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="medicalCode"
                      className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Medical ID
                    </label>
                    <input
                      type="text"
                      id="medicalCode"
                      name="medicalCode"
                      defaultValue="U900312752"
                      readOnly
                      className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="phone"
                      className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Phone Number
                    </label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      defaultValue="6152314412"
                      readOnly
                      className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className="px-10 py-1.5 bg-black text-[#1e81b0] text-base rounded-full transition-colors font-bold hover:bg-gray-800"
                >
                  Submit
                </button>
              </div>
              <div className="mt-4 bg-white p-3 rounded-lg">
                <p className="font-medium text-[#8B0000] mb-1">Note</p>
                <ul className="space-y-1 text-black text-sm">
                  {notes.map((note, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-black">➤</span>
                      {index === 1 ? (
                        <span>
                          <span className="text-red-500">*</span>
                          {note}
                        </span>
                      ) : (
                        <span>{note}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </form>
          </div>
        </div>
      )}
      <div>
        {isLoading && <p className="text-blue-500 font-bold">Loading call data...</p>}
        {error && <p className="text-red-500 font-bold">Error: {error}</p>}
      </div>
    </div>
  )
}