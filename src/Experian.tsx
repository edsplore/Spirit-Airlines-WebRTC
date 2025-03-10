"use client"

import React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { Mic, RefreshCcw, CheckCircle, XCircle } from "lucide-react"
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
  ssn: string
  validation: {
    name: "valid" | "invalid" | ""
    dob: "valid" | "invalid" | ""
    email: "valid" | "invalid" | ""
    address: "valid" | "invalid" | ""
    medicalCode: "valid" | "invalid" | ""
    phone: "valid" | "invalid" | ""
    ssn: "valid" | "invalid" | ""
  }
}

const webClient = new RetellWebClient()

const notes = [
  "The platform isn't integrated with company systems, so it requires authentication details.",
  <span key="1">"Enter the name the Virtual Assistant should use."</span>,
  "An email ID is needed for instant messages and confirmation.",
]

const apiKey = "key_98fef97480c54d6bf0698564addb"

// Improve the normalization functions to be more consistent and handle edge cases
// Replace the existing normalization functions with these enhanced versions:

function normalizeGeneral(str: string): string {
  if (!str) return ""
  // Convert to lowercase and remove all non-alphanumeric characters
  return str.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function normalizeReference(str: string): string {
  if (!str) return ""
  // Preserve dashes but remove all other non-alphanumeric characters
  return str.toLowerCase().replace(/[^a-z0-9-]/g, "")
}

// Fix the normalizePhone function to ensure consistent formatting
// Replace the existing normalizePhone function with this improved version:
function normalizePhone(str: string): string {
  if (!str) return ""
  // Remove all non-numeric characters and ensure we're working with just the digits
  const digitsOnly = str.replace(/\D/g, "")

  // Handle US phone numbers with or without country code
  // If it starts with 1 and has 11 digits, remove the leading 1
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return digitsOnly.substring(1)
  }

  // Return just the digits
  return digitsOnly
}

function normalizeEmail(str: string): string {
  if (!str) return ""
  // For emails, we want to keep the @ and . characters
  return str.toLowerCase().trim()
}

export default function Experian(): React.ReactElement {
  const [, setAllTrialsUsed] = useState(false)

  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "",
    dob: "",
    email: "",
    address: "116 Dogwood Rd, Lancaster, Kentucky(KY), 40444",
    medicalCode: "99 BE-99-9E09",
    phone: "2707111234",
    ssn: "111223333",
    validation: {
      name: "",
      dob: "",
      email: "",
      address: "",
      medicalCode: "",
      phone: "",
      ssn: "",
    },
  })

  const [apiCallData, setApiCallData] = useState<{
    member_id: string[]
    shipping_address: string[]
    member_name: string[]
    _d_o_b: string[]
    phone: string[]
    email: string[]
    ssn: string[]
  }>({
    member_id: [],
    shipping_address: [],
    member_name: [],
    _d_o_b: [],
    phone: [],
    email: [],
    ssn: [],
  })

  const [, setApiData] = useState<{
    name: string[]
    dob: string[]
    email: string[]
    address: string[]
    medicalCode: string[]
    phone: string[]
    ssn: string[]
  }>({
    name: [],
    dob: [],
    email: [],
    address: [],
    medicalCode: [],
    phone: [],
    ssn: [],
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

  const [, setUseAlternateAgent] = useState(false)
  const [allColumnsFilled, setAllColumnsFilled] = useState(false)

  useEffect(() => {
    setFormSubmitted(false)
    setAllTrialsUsed(false)
  }, [])

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

        // Extract fields from customData
        const extractedData = {
          name: customData.full_name_try1 || "",
          name2: customData.full_name_try2 || "",
          dob: customData.DOB_try1 || "",
          dob2: customData.DOB_try2 || "",
          address: customData.address_try1 || "",
          address2: customData.address_try2 || "",
          medicalCode: customData.reference_number_try1 || "",
          medicalCode2: customData.reference_number_try2 || "",
          phone: customData.phone_number_try1 || "",
          phone2: customData.phone_number_try2 || "",
          email: customData.email || "",
          email2: customData.email2 || "",
          ssn: customData.ssn_try1 || "",
          ssn2: customData.ssn_try2 || "",
        }

        console.log("Extracted data from API:", extractedData)

        setApiData({
          name: [extractedData.name, extractedData.name2].filter(Boolean),
          dob: [extractedData.dob, extractedData.dob2].filter(Boolean),
          email: [extractedData.email, extractedData.email2].filter(Boolean),
          address: [extractedData.address, extractedData.address2].filter(Boolean),
          medicalCode: [extractedData.medicalCode, extractedData.medicalCode2].filter(Boolean),
          phone: [extractedData.phone, extractedData.phone2].filter(Boolean),
          ssn: [extractedData.ssn, extractedData.ssn2].filter(Boolean),
        })

        setApiCallData({
          member_id: [customData.reference_number_try1, customData.reference_number_try2].filter(Boolean),
          shipping_address: [customData.address_try1, customData.full_name_try2].filter(Boolean),
          member_name: [customData.full_name_try1, customData.full_name_try2].filter(Boolean),
          _d_o_b: [customData.DOB_try1, customData.DOB_try2].filter(Boolean),
          phone: [customData.phone_number_try1, customData.phone_number_try2].filter(Boolean),
          email: [customData.email, customData.email2].filter(Boolean),
          ssn: [customData.ssn_try1, customData.ssn_try2].filter(Boolean),
        })

        // Update the processCallData function to use the appropriate normalization for each field type
        // Replace the validation section in processCallData with this improved version:

        // Use appropriate normalization functions for each field type
        const userName = normalizeGeneral(userDetails.name)
        const userDOB = normalizeGeneral(userDetails.dob)
        const userEmail = normalizeEmail(userDetails.email)
        const userAddress = normalizeGeneral(userDetails.address)
        // Update the validation section in processCallData to use more robust comparison
        // In the processCallData function, replace the phone validation line with:
        const userPhone = normalizePhone(userDetails.phone)
        const extractedPhone = normalizePhone(extractedData.phone)
        console.log("Normalized phone comparison:", { userPhone, extractedPhone })

        const userSSN = normalizeGeneral(userDetails.ssn)
        // Preserve dashes in the reference number
        const userMedicalCode = normalizeReference(userDetails.medicalCode)

        const extractedName = normalizeGeneral(extractedData.name)
        const extractedDOB = normalizeGeneral(extractedData.dob)
        const extractedEmail = normalizeEmail(extractedData.email)
        const extractedAddress = normalizeGeneral(extractedData.address)

        const extractedSSN = normalizeGeneral(extractedData.ssn)
        // Preserve dashes for the reference number
        const extractedMedicalCode = normalizeReference(extractedData.medicalCode)

        const validation: UserDetails["validation"] = {
          name: extractedName === userName ? "valid" : "invalid",
          dob: extractedDOB === userDOB ? "valid" : "invalid",
          email: extractedEmail === userEmail ? "valid" : "invalid",
          address: extractedAddress === userAddress ? "valid" : "invalid",
          phone: userPhone === extractedPhone ? "valid" : "invalid",
          medicalCode: extractedMedicalCode === userMedicalCode ? "valid" : "invalid",
          ssn: extractedSSN === userSSN ? "valid" : "invalid",
        }

        console.log("Validation results:", validation)

        setUserDetails((prev) => ({
          ...prev,
          validation,
        }))

        setAllColumnsFilled(true)
      } catch (error) {
        console.error("Error processing call data:", error)
      }
    },
    [userDetails],
  )

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
      setCallEnded(false)
    })

    webClient.on("conversationEnded", ({ code, reason }) => {
      console.log("Conversation ended event triggered with code:", code, "reason:", reason)
      setCallStatus("inactive")
      setCallInProgress(false)
      callEndedRef.current = true

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

    if (callEnded && currentCallId) {
      console.log("Call ended detected, preparing to fetch call data...")
      console.log("Current call ID:", currentCallId)

      timeoutId = setTimeout(() => {
        console.log("Timeout completed, now fetching call data...")
        fetchCallData(currentCallId)
          .then((data) => {
            console.log("Call data fetched successfully:", data)
            return data
          })
          .then(() => {
            console.log("Call data processed successfully")
            setCallEnded(false)
          })
          .catch((error) => console.error("Error fetching or processing call data:", error))
      }, 5000)
    }

    return () => {
      if (timeoutId) {
        console.log("Clearing timeout for API call")
        clearTimeout(timeoutId)
      }
    }
  }, [callEnded, currentCallId, fetchCallData])

  const handleSubmitDetails = (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Get the form element by ID
    const formElement = document.getElementById("verification-form") as HTMLFormElement
    if (!formElement) return

    const newFormData = new FormData(formElement)
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
      setApiCallData({
        member_id: [],
        shipping_address: [],
        member_name: [],
        _d_o_b: [],
        phone: [],
        email: [],
        ssn: [],
      })

      setApiData({
        name: [],
        dob: [],
        email: [],
        address: [],
        medicalCode: [],
        phone: [],
        ssn: [],
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
          ssn: "",
        },
      }))
      setAllColumnsFilled(false)
      try {
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

  const initiateConversation = async () => {
    const agentId = "agent_3e2ad94206b3865925e9004395"

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
            ssn: userDetails.ssn,
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

  const reopenVerificationForm = () => {
    setApiCallData({
      member_id: [],
      shipping_address: [],
      member_name: [],
      _d_o_b: [],
      phone: [],
      email: [],
      ssn: [],
    })
    setApiData({
      name: [],
      dob: [],
      email: [],
      address: [],
      medicalCode: [],
      phone: [],
      ssn: [],
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
        ssn: "",
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

  // Add improved responsive styling to the main container and table
  // Replace the return statement with this enhanced responsive version:

  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      <nav className="bg-white w-full border-b border-gray-200">
        <div className="flex items-center justify-between px-4 md:px-20 py-2">
          <img src="/experian_logo.svg" alt="Experian" className="h-8" />
          <div className="hidden md:flex items-center gap-8">
            <span className="cursor-pointer text-gray-700 text-sm font-medium">Bureau Membership</span>
            <div className="relative group">
              <span className="cursor-pointer text-gray-700 text-sm font-medium flex items-center">
                Credit Services <span className="ml-1">▼</span>
              </span>
            </div>
            <div className="relative group">
              <span className="cursor-pointer text-gray-700 text-sm font-medium flex items-center">
                Consumer Services <span className="ml-1">▼</span>
              </span>
            </div>
            <button className="bg-purple-800 text-white text-sm font-medium px-4 py-1 rounded">
              Free Credit Score
            </button>
            <div className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-700"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
          <div className="md:hidden">
            <button className="text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div className="relative w-full">
        <img src="/experian_hero.png" alt="Centene commitment" className="w-full h-[200px] md:h-[300px] object-cover" />
      </div>

      <div className="flex flex-col-reverse lg:flex-row gap-6 px-4 lg:px-8 flex-grow mt-6">
        <div className="w-full lg:w-3/4">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-[#2E5388]">Customer Identity Verification (CIV) Status</h2>
              {allColumnsFilled && (
                <button
                  onClick={reopenVerificationForm}
                  className="flex items-center text-white bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 rounded-full transition-all duration-200 hover:shadow-lg hover:scale-105 w-full sm:w-auto justify-center"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              )}
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-[0_0_20px_rgba(0,0,0,0.08)] min-w-[768px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#2E5388] to-[#1E3A6D]">
                      <th className="p-4 text-left font-bold text-white border-b-2 border-blue-400">ID Parameter</th>
                      <th className="p-4 text-left font-bold text-white border-b-2 border-blue-400">
                        Customer Details
                      </th>
                      <th className="p-4 text-left font-bold text-white border-b-2 border-blue-400">Input Provided</th>
                      <th className="p-4 text-left font-bold text-white border-b-2 border-blue-400">
                        Verification Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Reference ID", key: "medicalCode", apiKey: "member_id" },
                      { label: "Member Name", key: "name", apiKey: "member_name" },
                      { label: "Date of Birth", key: "dob", apiKey: "_d_o_b" },
                      { label: "Social Security No. (SSN)", key: "ssn", apiKey: "ssn" },
                      { label: "Address", key: "address", apiKey: "shipping_address" },
                      { label: "Phone Number", key: "phone", apiKey: "phone" },
                      { label: "Email ID", key: "email", apiKey: "email" },
                    ].map((param, index) => (
                      <React.Fragment key={param.key}>
                        {(param.key === "email" ? [0, 1, 2] : [0, 1]).map((row) => (
                          <tr
                            key={`${param.key}-${row}`}
                            className={`${
                              index % 2 === 0 ? "bg-gray-50" : "bg-white"
                            } hover:bg-blue-100/70 transition-all duration-300 group relative`}
                          >
                            {row === 0 && (
                              <>
                                <td
                                  className="p-4 font-bold text-[#681b75] border-r border-gray-200 group-hover:text-purple-900 transition-colors duration-200 relative"
                                  rowSpan={param.key === "email" ? 3 : 2}
                                  style={{
                                    background: "linear-gradient(to right, rgba(104, 27, 117, 0.05), transparent)",
                                  }}
                                >
                                  <div className="flex items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#681b75] mr-2 group-hover:w-2 group-hover:h-2 transition-all duration-300"></div>
                                    {param.label}
                                  </div>
                                  <div className="absolute inset-0 left-0 w-1 bg-purple-600 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom"></div>
                                </td>
                                <td
                                  className="p-4 font-medium text-gray-700 border-r border-gray-200 group-hover:bg-blue-50 transition-all duration-300"
                                  rowSpan={param.key === "email" ? 3 : 2}
                                  style={{
                                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.03)",
                                  }}
                                >
                                  {formSubmitted ? (
                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 group-hover:shadow-md group-hover:border-blue-200 transition-all duration-300">
                                      {String(userDetails[param.key as keyof UserDetails])}
                                    </div>
                                  ) : (
                                    ""
                                  )}
                                </td>
                              </>
                            )}
                            <td className="p-4 border-r border-gray-200 group-hover:bg-blue-50 transition-all duration-300">
                              {apiCallData[param.apiKey as keyof typeof apiCallData][row] ? (
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 transition-all duration-300 group-hover:shadow-md group-hover:border-blue-200 group-hover:translate-y-[-2px]">
                                  {apiCallData[param.apiKey as keyof typeof apiCallData][row]}
                                </div>
                              ) : (
                                ""
                              )}
                            </td>
                            <td className="p-4 group-hover:bg-blue-50 transition-all duration-300">
                              {apiCallData[param.apiKey as keyof typeof apiCallData][row] &&
                                (userDetails.validation[param.key as keyof UserDetails["validation"]] === "valid" ? (
                                  <div className="flex items-center justify-center">
                                    <span className="text-green-600 font-medium flex items-center bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 rounded-full w-fit shadow-sm border border-green-200 transition-all duration-300 group-hover:shadow-md group-hover:bg-gradient-to-r group-hover:from-green-100 group-hover:to-green-200 group-hover:scale-110">
                                      <CheckCircle className="h-5 w-5 mr-2" />
                                      Valid
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center">
                                    <span className="text-red-600 font-medium flex items-center bg-gradient-to-r from-red-50 to-red-100 px-4 py-2 rounded-full w-fit shadow-sm border border-red-200 transition-all duration-300 group-hover:shadow-md group-hover:bg-gradient-to-r group-hover:from-red-100 group-hover:to-red-200 group-hover:scale-110">
                                      <XCircle className="h-5 w-5 mr-2" />
                                      Invalid
                                    </span>
                                  </div>
                                ))}
                            </td>
                          </tr>
                        ))}
                        {index < 6 && (
                          <tr className="border-b border-gray-200">
                            <td colSpan={4} className="p-0">
                              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/4 flex flex-col items-center justify-center">
          <button
            onClick={toggleConversation}
            className="flex flex-col items-center group relative"
            disabled={callInProgress}
          >
            <div
              className={`p-8 md:p-16 bg-gradient-to-br from-purple-700 to-purple-900 rounded-full transition-all duration-300 group-hover:scale-105 shadow-lg ${
                callStatus === "active" ? "ring-4 ring-[#ffdc00] animate-pulse" : ""
              }`}
            >
              {callInProgress ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <Mic
                  className={`w-12 h-12 md:w-16 md:h-16 text-white ${callStatus === "active" ? "animate-bounce" : ""}`}
                />
              )}
            </div>
            <div className="mt-4 flex flex-col items-center">
              <span className="text-[#681b75] text-xl md:text-3xl font-bold">
                {callStatus === "active" ? "End Call" : "Start Call"}
              </span>
              <span className="text-gray-500 text-sm mt-1">
                {callStatus === "active" ? "Click to disconnect" : "Click to verify identity"}
              </span>
            </div>
          </button>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 py-4 mt-6" style={{ marginTop: "auto" }}>
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h3 className="font-bold text-gray-700 mb-4">Discover</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/about" className="text-gray-600 hover:text-gray-900">
                  About Experian
                </a>
              </li>
              <li>
                <a href="/insights" className="text-gray-600 hover:text-gray-900">
                  Experian Insights
                </a>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  Soft Price and Write Defaulters
                </button>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  Consumer Grievance Redressal Policy
                </button>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  RBI Notifications
                </button>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  RBI – Integrated Ombudsman Scheme
                </button>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  Board of Directors
                </button>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  Annual Return Under Companies Act 2013
                </button>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  Regulatory Disclosures
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-700 mb-4">Media</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  Press Room
                </button>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  Experian In the News
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-700 mb-4">Help & Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  Contact Us
                </button>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  Experian Report Download Guide
                </button>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  Raise a Dispute
                </button>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  CIR Policy
                </button>
              </li>
              <li>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  Update – Grievances Nodal Officer
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-700 mb-4">Stay connected</h3>
            <div className="flex space-x-4">
              <a href="https://www.linkedin.com/" className="text-gray-600 hover:text-gray-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="https://www.facebook.com/" className="text-gray-600 hover:text-gray-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-4">
          <div className="h-1 bg-gradient-to-r from-purple-600 via-blue-500 to-blue-700 w-full"></div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-3 text-xs text-gray-500 gap-2">
            <p>© {new Date().getFullYear()} Experian. All rights reserved.</p>
            <p>Terms of Service | Privacy Policy | Cookie Preferences</p>
          </div>
        </div>
      </footer>

      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-purple-200 flex flex-col w-full max-w-md">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-700 to-blue-700 px-4 py-3 rounded-t-2xl">
              <h2 className="text-sm font-bold text-white">Customer Verification Portal</h2>
              <p className="text-white/80 text-xs">Please provide your details for identity verification</p>
            </div>

            {/* Main content area */}
            <div className="px-4 py-4 text-sm">
              <form id="verification-form" onSubmit={handleSubmitDetails} className="space-y-3">
                {/* Member Name */}
                <div className="flex flex-col">
                  <label htmlFor="name" className="text-purple-800 font-semibold text-xs mb-1">
                    Member Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="px-2 py-1 rounded bg-gray-50 border border-gray-200 
               focus:border-purple-500 focus:ring-1 focus:ring-purple-200 
               outline-none transition-all text-gray-800 text-xs"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Date of Birth */}
                <div className="flex flex-col">
                  <label htmlFor="dob" className="text-purple-800 font-semibold text-xs mb-1">
                    Choose DOB <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      id="dobMonth"
                      name="dobMonth"
                      required
                      className="px-2 py-1 rounded bg-gray-50 border border-gray-200
                 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 
                 outline-none transition-all text-gray-800 text-xs"
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
                      className="px-2 py-1 rounded bg-gray-50 border border-gray-200
                 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 
                 outline-none transition-all text-gray-800 text-xs"
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
                      className="px-2 py-1 rounded bg-gray-50 border border-gray-200
                 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 
                 outline-none transition-all text-gray-800 text-xs"
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
                  <label htmlFor="email" className="text-purple-800 font-semibold text-xs mb-1">
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="px-2 py-1 rounded bg-gray-50 border border-gray-200 
               focus:border-purple-500 focus:ring-1 focus:ring-purple-200 
               outline-none transition-all text-gray-800 text-xs"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Reference ID */}
                <div className="flex flex-col">
                  <label htmlFor="medicalCode" className="text-purple-800 font-semibold text-xs mb-1">
                    Reference ID
                  </label>
                  <input
                    type="text"
                    id="medicalCode"
                    name="medicalCode"
                    defaultValue="99 BE-99-9E09"
                    readOnly
                    className="px-2 py-1 rounded bg-gray-100 border border-gray-200 
               text-gray-500 cursor-not-allowed text-xs"
                  />
                </div>

                {/* SSN */}
                <div className="flex flex-col">
                  <label htmlFor="ssn" className="text-purple-800 font-semibold text-xs mb-1">
                    SSN
                  </label>
                  <input
                    type="text"
                    id="ssn"
                    name="ssn"
                    defaultValue="111223333"
                    readOnly
                    className="px-2 py-1 rounded bg-gray-100 border border-gray-200 
               text-gray-500 cursor-not-allowed text-xs"
                  />
                </div>

                {/* Phone Number */}
                <div className="flex flex-col">
                  <label htmlFor="phone" className="text-purple-800 font-semibold text-xs mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    defaultValue="2707111234"
                    readOnly
                    className="px-2 py-1 rounded bg-gray-100 border border-gray-200 
               text-gray-500 cursor-not-allowed text-xs"
                  />
                </div>

                {/* Address */}
                <div className="flex flex-col">
                  <label htmlFor="address" className="text-purple-800 font-semibold text-xs mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    defaultValue="116 Dogwood Rd, Lancaster, Kentucky(KY), 40444"
                    readOnly
                    className="px-2 py-1 rounded bg-gray-100 border border-gray-200 
               text-gray-500 cursor-not-allowed text-xs"
                  />
                </div>
              </form>

              {/* Disclaimer/Notes */}
              <div className="bg-blue-50 p-2 mt-3 rounded-xl border border-blue-100">
                <p className="font-bold text-blue-800 text-xs mb-1">Disclaimer:</p>
                <ul className="space-y-1 text-[10px] text-blue-700">
                  {notes.map((note, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-500 flex-shrink-0">•</span>
                      <span className="flex-1">
                        {index === 1 ? (
                          <span>
                            <span className="text-red-500 font-bold">*</span>
                            {note}
                          </span>
                        ) : (
                          <span>{note}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer with Submit button */}
            <div className="bg-gray-50 p-3 border-t border-gray-200 rounded-b-2xl flex justify-center">
              <button
                type="submit"
                onClick={handleSubmitDetails}
                className="px-4 py-2 bg-gradient-to-r from-purple-700 to-purple-900 text-white 
     font-bold rounded-full hover:shadow-lg transform hover:scale-105 
     transition-all duration-200 text-xs"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        {isLoading && <p className="text-blue-400 font-bold">Loading call data...</p>}
        {error && <p className="text-red-500 font-bold">Error: {error}</p>}
      </div>
    </div>
  )
}

