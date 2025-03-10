"use client"

import React from "react"

import "./App.css"
import { useEffect, useState, useRef, useCallback } from "react"
import { Mic, RefreshCcw, ChevronDown } from "lucide-react"
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

const webClient = new RetellWebClient()

const notes = [
  "The platform isn't integrated with company systems, so it requires authentication details.",
  "Enter the name the Virtual Assistant should use.",
  "An email ID is needed for instant messages and confirmation.",
]

const apiKey = "key_98fef97480c54d6bf0698564addb"

export default function Centene2(): React.ReactElement {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_allTrialsUsed, setAllTrialsUsed] = useState(false)

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_apiData, setApiData] = useState<{
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_useAlternateAgent, setUseAlternateAgent] = useState(false)

  // Add this new state to track if all columns are filled
  const [allColumnsFilled, setAllColumnsFilled] = useState(false)

  useEffect(() => {
    setFormSubmitted(false)
    setAllTrialsUsed(false)
  }, [])

  // Replace the existing processCallData function with this updated version
  const processCallData = useCallback(
    (callData: any) => {
      try {
        console.log("Processing call data:", JSON.stringify(callData))

        const customData = callData.call_analysis?.custom_analysis_data || {}
        console.log("Custom data from API:", customData)

        if (!customData) {
          console.error("Custom data not found in call data")
          return
        }

        // Extract all the data from the custom_analysis_data object
        // This now handles the new format with multiple fields (member_id, member_id2, etc.)
        const extractedData = {
          name: customData.member_name1 || "",
          name2: customData.member_name2 || "",
          name3: customData.member_name3 || "",
          dob: customData._d_o_b1 || "",
          dob2: customData._d_o_b2 || "",
          dob3: customData._d_o_b3 || "",
          address: customData.shipping_address1 || "",
          address2: customData.shipping_address2 || "",
          address3: customData.shipping_address3 || "",
          medicalCode: customData.member_id1 || "",
          medicalCode2: customData.member_id2 || "",
          medicalCode3: customData.member_id3 || "",
          phone: customData.phone_number1 || "",
          phone2: customData.phone_number2 || "",
          phone3: customData.phone_number3 || "",
          email: customData.email1 || "",
          email2: customData.email2 || "",
          email3: customData.email3 || "",
        }

        console.log("Extracted data from API:", extractedData)

        // Update the API data state with all three sets of data at once
        setApiData({
          name: [extractedData.name, extractedData.name2, extractedData.name3].filter(Boolean),
          dob: [extractedData.dob, extractedData.dob2, extractedData.dob3].filter(Boolean),
          email: [extractedData.email, extractedData.email2, extractedData.email3].filter(Boolean),
          address: [extractedData.address, extractedData.address2, extractedData.address3].filter(Boolean),
          medicalCode: [extractedData.medicalCode, extractedData.medicalCode2, extractedData.medicalCode3].filter(
            Boolean,
          ),
          phone: [extractedData.phone, extractedData.phone2, extractedData.phone3].filter(Boolean),
        })

        // Also update the apiCallData state with all three sets of data at once
        setApiCallData({
          member_id: [customData.member_id1, customData.member_id2, customData.member_id3].filter(Boolean),
          shipping_address: [
            customData.shipping_address1,
            customData.shipping_address2,
            customData.shipping_address3,
          ].filter(Boolean),
          member_name: [customData.member_name1, customData.member_name2, customData.member_name3].filter(Boolean),
          _d_o_b: [customData._d_o_b1, customData._d_o_b2, customData._d_o_b3].filter(Boolean),
          phone: [customData.phone_number1, customData.phone_number2, customData.phone_number3].filter(Boolean),
          email: [customData.email1, customData.email2, customData.email3].filter(Boolean),
        })

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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, month, day, year] = dashMatch
            const monthNames = ["jan", "feb", ', "mar', "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
            const monthIndex = monthNames.indexOf(month.toLowerCase().substring(0, 3))
            if (monthIndex !== -1) {
              return `${(monthIndex + 1).toString().padStart(2, "0")}${day.padStart(2, "0")}${year}`
            }
          }

          // Try to match "Month/Day/Year" format (e.g., "01/01/1990")
          const slashPattern = /(\d+)\/(\d+)\/(\d+)/
          const slashMatch = dob.match(slashPattern)

          if (slashMatch) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

        setUserDetails((prev) => ({
          ...prev,
          validation,
        }))

        // Set allColumnsFilled to true since we now get all data at once
        setAllColumnsFilled(true)
      } catch (error) {
        console.error("Error processing call data:", error)
      }
    },
    [userDetails],
  )

  // Now define fetchCallData after processCallData
  const fetchCallData = useCallback(
    async (callId: string) => {
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

        // Process the call data directly
        processCallData(data)

        setIsLoading(false)
        return data
      } catch (err) {
        console.error("Error in fetchCallData:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        setIsLoading(false)
        throw err
      }
    },
    [processCallData],
  )

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

  // Now update the useEffect that uses fetchCallData
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
            // No need to call processCallData again as it's already called in fetchCallData
            return data
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
      // Reset API data and validation status when starting a new call
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
      setUserDetails((prev) => ({
        ...prev,
        validation: {
          name: "",
          dob: "",
          email: "",
          address: "",
          medicalCode: "",
          phone: "",
        },
      }))
      setAllColumnsFilled(false)
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
    // Always use the same agent ID
    const agentId = "agent_d3ca92c1776826ef142c084251"

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
    // Reset only the API data but keep user details
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

    // Reset validation status
    setUserDetails((prev) => ({
      ...prev,
      validation: {
        name: "",
        dob: "",
        email: "",
        address: "",
        medicalCode: "",
        phone: "",
      },
    }))

    setShowVerificationForm(true)
    setFormSubmitted(false)
    setAllColumnsFilled(false)
    setUseAlternateAgent(false)
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
    <div className="min-h-screen bg-gray-50 relative flex flex-col">
      {/* Header/Navigation - Modern gradient style */}
      <nav className="bg-gradient-to-r from-[#1a4b8c] to-[#2E5388] shadow-lg w-full">
        <div className="flex items-center justify-between px-4 md:px-12 py-4">
          <img src="/centene_logo.png" alt="Centene" className="h-10 bg-transparent" />
          <div className="hidden md:flex items-center gap-6 text-white">
            {["Who are we", "Why we are different", "Products and Services", "Careers", "Investors", "News"].map(
              (item, index) => (
                <div key={index} className="group relative cursor-pointer">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium hover:text-blue-200 transition-colors">{item}</span>
                    <ChevronDown size={16} className="text-blue-200" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </div>
              ),
            )}
          </div>
          <button className="block md:hidden text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8 flex-grow">
        {/* Left section with brand info and mic button */}
        <div className="w-full lg:w-1/3 flex flex-col">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
            <img src="/centene_Hero.png" alt="Centene commitment" className="w-full h-48 object-cover" />
            <div className="p-5">
              <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                Centene is committed to helping people live healthier lives. We provide access to high-quality
                healthcare, innovative programs and health solutions that help families and individuals get well, stay
                well and be well.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={toggleConversation}
              className="group flex flex-col items-center justify-center transform transition-all hover:scale-105"
            >
              <div
                className={`p-8 bg-gradient-to-br from-[#1a4b8c] to-[#2E5388] rounded-full shadow-lg transition-all duration-300 ${callStatus === "active" ? "ring-4 ring-blue-300 animate-pulse" : ""
                  }`}
              >
                <Mic className={`w-12 h-12 text-white ${callStatus === "active" ? "animate-bounce" : ""}`} />
              </div>
              <span className="mt-4 text-[#1a4b8c] text-xl font-bold">
                {callStatus === "active" ? "Click to Disconnect" : "Let's Talk"}
              </span>
            </button>
          </div>
        </div>

        {/* Right section with verification table */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#1a4b8c]">Customer Identity Verification (CIV) Status</h2>
              {allColumnsFilled && (
                <button
                  onClick={reopenVerificationForm}
                  className="flex items-center text-white bg-gradient-to-r from-[#1a4b8c] to-[#2E5388] px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-[#1a4b8c] text-white py-3 px-4 rounded-tl-lg text-left font-medium">
                      CIV Parameter
                    </th>
                    <th className="bg-[#1a4b8c] text-white py-3 px-4 text-left font-medium">Customer Details</th>
                    <th className="bg-[#1a4b8c] text-white py-3 px-4 text-left font-medium">Input Provided</th>
                    <th className="bg-[#1a4b8c] text-white py-3 px-4 rounded-tr-lg text-left font-medium">Status</th>
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
                  ].map((param, index) => (
                    <React.Fragment key={param.key}>
                      {[0, 1, 2].map((row) => (
                        <tr
                          key={`${param.key}-${row}`}
                          className={`${index % 2 === 0 ? "bg-blue-50" : "bg-white"} border-b border-gray-100 hover:bg-blue-100 transition-colors`}
                        >
                          {row === 0 && (
                            <>
                              <td className="py-3 px-4 font-medium text-gray-700" rowSpan={3}>
                                {param.label}
                              </td>
                              <td className="py-3 px-4 font-medium" rowSpan={3}>
                                {formSubmitted ? String(userDetails[param.key as keyof UserDetails]) : ""}
                              </td>
                            </>
                          )}
                          <td className="py-3 px-4">
                            {apiCallData[param.apiKey as keyof typeof apiCallData][row] || ""}
                          </td>
                          <td className="py-3 px-4">
                            {apiCallData[param.apiKey as keyof typeof apiCallData][row] && (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userDetails.validation[param.key as keyof UserDetails["validation"]] === "valid"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                  }`}
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
                  {/* Add Email ID as a single row */}
                  <tr
                    className={`${[0, 2, 4].includes(5) ? "bg-blue-50" : "bg-white"} border-b border-gray-100 hover:bg-blue-100 transition-colors`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-700">Email ID</td>
                    <td className="py-3 px-4 font-medium">{formSubmitted ? String(userDetails.email) : ""}</td>
                    <td className="py-3 px-4">{apiCallData.email[0] || ""}</td>
                    <td className="py-3 px-4">
                      {apiCallData.email[0] && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userDetails.validation.email === "valid"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                            }`}
                        >
                          {userDetails.validation.email === "valid" ? "Valid" : "Invalid"}
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with styled gradient */}
      <div className="py-4 mt-auto bg-cover bg-center" style={{ backgroundImage: "url('/Centene_Footer.png')", height: '8rem' }}>
        <div className="container mx-auto px-4 text-right">
          <p className="text-[#1a4b8c] font-bold">Centene Headquarters:</p>
          <p className="text-[#2E5388]">Centene Corporation, Centene Plaza,</p>
          <p className="text-[#2E5388]">7700 Forsyth Boulevard St. Louis, MO 63105</p>
        </div>
      </div>


      {/* Verification modal with reduced spacing for smaller screens */}
      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#1a4b8c] to-[#2E5388] 
                          rounded-xl p-4 w-full max-w-md mx-auto 
                          shadow-2xl animate-fadeIn">
            <h2 className="text-lg font-semibold text-white mb-4 text-center">
              Customer details required for verification and authentication
            </h2>

            <form onSubmit={handleSubmitDetails} className="space-y-3">
              {/* Member Name */}
              <div className="flex flex-col">
                <label
                  htmlFor="name"
                  className="text-white text-sm mb-1 font-medium"
                >
                  Member Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="p-2 rounded-lg bg-white text-gray-800 border border-blue-300 
                             focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="Enter your name"
                />
              </div>

              {/* Date of Birth */}
              <div className="flex flex-col">
                <label
                  htmlFor="dob"
                  className="text-white text-sm mb-1 font-medium"
                >
                  Choose Date of Birth
                </label>
                <div className="flex gap-2">
                  <select
                    id="dobMonth"
                    name="dobMonth"
                    required
                    className="flex-1 p-2 rounded-lg bg-white text-gray-800 border border-blue-300 
                               focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
                    className="flex-1 p-2 rounded-lg bg-white text-gray-800 border border-blue-300 
                               focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
                    className="flex-1 p-2 rounded-lg bg-white text-gray-800 border border-blue-300 
                               focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value)}
                  >
                    <option value="">Year</option>
                    {generateYearOptions()}
                  </select>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <label
                  htmlFor="email"
                  className="text-white text-sm mb-1 font-medium"
                >
                  Email ID
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="p-2 rounded-lg bg-white text-gray-800 border border-blue-300 
                             focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="Enter your email"
                />
              </div>

              {/* Address */}
              <div className="flex flex-col">
                <label
                  htmlFor="address"
                  className="text-white text-sm mb-1 font-medium"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  className="p-2 rounded-lg bg-blue-100 text-gray-800 border border-blue-300"
                  defaultValue="123 Maple Street, Nashville, Tennessee, 37201"
                  readOnly
                />
              </div>

              {/* Medical ID */}
              <div className="flex flex-col">
                <label
                  htmlFor="medicalCode"
                  className="text-white text-sm mb-1 font-medium"
                >
                  Medical ID
                </label>
                <input
                  type="text"
                  id="medicalCode"
                  name="medicalCode"
                  defaultValue="U900312752"
                  readOnly
                  className="p-2 rounded-lg bg-blue-100 text-gray-800 border border-blue-300"
                />
              </div>

              {/* Phone Number */}
              <div className="flex flex-col">
                <label
                  htmlFor="phone"
                  className="text-white text-sm mb-1 font-medium"
                >
                  Phone Number
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  defaultValue="6152314412"
                  readOnly
                  className="p-2 rounded-lg bg-blue-100 text-gray-800 border border-blue-300"
                />
              </div>

              {/* Submit button */}
              <div className="flex justify-center mt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-white text-[#1a4b8c] text-sm 
                             rounded-full shadow-md hover:shadow-lg 
                             transition-all transform hover:scale-105 font-bold"
                >
                  Submit
                </button>
              </div>

              {/* Notes section */}
              <div className="mt-4 bg-white p-3 rounded-xl shadow">
                <p className="font-medium text-red-700 mb-2">Note</p>
                <ul className="space-y-1 text-gray-700 text-xs">
                  {notes.map((note, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
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

      {/* Loading/Error indicators */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading call data...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>Error: {error}</span>
          </div>
        </div>
      )}
    </div>
  )
}

