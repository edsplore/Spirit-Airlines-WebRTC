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

/* ----------------------------------
 *  NORMALIZATION HELPERS
 * --------------------------------- */

// For general fields (name, address, SSN, etc.) ignoring punctuation/spaces
function normalizeGeneral(str: string): string {
  if (!str) return ""
  return str
    .toLowerCase()
    // remove all non-alphanumeric
    .replace(/[^a-z0-9]/g, "")
}

// For reference ID, preserve dashes but remove everything else non-alphanumeric
function normalizeReference(str: string): string {
  if (!str) return ""
  return str
    .toLowerCase()
    // keep letters, digits, and dashes
    .replace(/[^a-z0-9-]/g, "")
}

// For phone numbers, strip non-digits and handle leading "1" if it’s 11 digits
function normalizePhone(str: string): string {
  if (!str) return ""
  const digits = str.replace(/\D/g, "")
  // If it starts with "1" and is 11 digits, strip the leading "1"
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1)
  }
  return digits
}

// For emails, we typically just lowercase + trim
function normalizeEmail(str: string): string {
  if (!str) return ""
  return str.trim().toLowerCase()
}

// For DOB, parse out month/day/year and return a standard format (YYYYMMDD or MMDDYYYY).
// This treats "Jan-04-2018", "1/4/2018", "January 4, 2018" the same.
function normalizeDOB(dob: string): string {
  if (!dob) return ""

  // Convert to lowercase for easier matching
  const lower = dob.toLowerCase().trim()

  // 1) Try to parse known textual month formats: "jan", "feb", etc.
  //    e.g., "Jan-04-2018" => month=jan, day=04, year=2018
  //    or "27-Jul-1990" => day=27, month=jul, year=1990
  const textualPattern = /([a-z]+)[^\d]*(\d{1,2})[^\d]*(\d{2,4})/
  const textMatch = lower.match(textualPattern)
  if (textMatch) {
    // e.g. textMatch = ["jan-04-2018", "jan", "04", "2018"]
    const [, rawMonth, rawDay, rawYear] = textMatch
    const monthNames = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ]
    const monthIndex = monthNames.indexOf(rawMonth.slice(0, 3))
    if (monthIndex !== -1) {
      const day = rawDay.padStart(2, "0")
      const year = rawYear.length === 2 ? "20" + rawYear : rawYear
      // Return in e.g. "YYYYMMDD"
      return `${year}${(monthIndex + 1).toString().padStart(2, "0")}${day}`
    }
  }

  // 2) Try slash or dash numeric: "01/04/2018", "1-4-2018", "1/4/18"
  const numericPattern = /(\d{1,2})[^\d](\d{1,2})[^\d](\d{2,4})/
  const numericMatch = lower.match(numericPattern)
  if (numericMatch) {
    const [, rawMonth, rawDay, rawYear] = numericMatch
    const month = rawMonth.padStart(2, "0")
    const day = rawDay.padStart(2, "0")
    const year = rawYear.length === 2 ? "20" + rawYear : rawYear
    return `${year}${month}${day}`
  }

  // 3) If we can’t parse known patterns, fallback to general alphanumeric
  return normalizeGeneral(dob)
}

/* ----------------------------------
 *  COMPONENT START
 * --------------------------------- */

export default function Experian(): React.ReactElement {
  const [, setAllTrialsUsed] = useState(false)

  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "",
    dob: "",
    email: "",
    address: "1234, Plainview, Texas, 79072",
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

  /* ----------------------------------
   *  processCallData
   * --------------------------------- */
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
          dob: customData._d_o_b_try1 || "",
          dob2: customData._d_o_b_try2 || "",
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

        // For demonstration, storing the arrays in setApiData
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
          shipping_address: [customData.address_try1, customData.address_try2].filter(Boolean),
          member_name: [customData.full_name_try1, customData.full_name_try2].filter(Boolean),
          _d_o_b: [customData._d_o_b_try1, customData._d_o_b_try2].filter(Boolean),
          phone: [customData.phone_number_try1, customData.phone_number_try2].filter(Boolean),
          email: [customData.email, customData.email2].filter(Boolean),
          ssn: [customData.ssn_try1, customData.ssn_try2].filter(Boolean),
        })

        // 1) Normalize user input
        const userName = normalizeGeneral(userDetails.name)
        const userDOB = normalizeDOB(userDetails.dob)
        const userEmail = normalizeEmail(userDetails.email)
        const userAddress = normalizeGeneral(userDetails.address)
        const userPhone = normalizePhone(userDetails.phone)
        const userSSN = normalizeGeneral(userDetails.ssn)
        const userMedicalCode = normalizeReference(userDetails.medicalCode)

        // 2) Normalize extracted data
        const extractedName = normalizeGeneral(extractedData.name)
        const extractedDOB = normalizeDOB(extractedData.dob)
        const extractedEmail = normalizeEmail(extractedData.email)
        const extractedAddress = normalizeGeneral(extractedData.address)
        const extractedPhone = normalizePhone(extractedData.phone)
        const extractedSSN = normalizeGeneral(extractedData.ssn)
        const extractedMedicalCode = normalizeReference(extractedData.medicalCode)

        // 3) Compare
        const validation: UserDetails["validation"] = {
          name: extractedName === userName ? "valid" : "invalid",
          dob: extractedDOB === userDOB ? "valid" : "invalid",
          email: extractedEmail === userEmail ? "valid" : "invalid",
          address: extractedAddress === userAddress ? "valid" : "invalid",
          phone: extractedPhone === userPhone ? "valid" : "invalid",
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
    [userDetails]
  )

  /* ----------------------------------
   *  fetchCallData
   * --------------------------------- */
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
    [processCallData]
  )

  /* ----------------------------------
   *  EVENT HOOKS & LIFECYCLE
   * --------------------------------- */
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

  /* ----------------------------------
   *  FORM SUBMISSION
   * --------------------------------- */
  const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    const formElement = document.getElementById("verification-form") as HTMLFormElement
    if (!formElement) return

    const newFormData = new FormData(formElement)
    const newName = newFormData.get("name") as string
    const month = dobMonth
    const day = dobDay
    const year = dobYear
    const newEmail = newFormData.get("email") as string

    if (!newName || !month || !day || !year || !newEmail) {
      // Required fields are missing; do not close the form
      return
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthName = monthNames[Number.parseInt(month) - 1] || "Jan"
    const newDob = `${monthName}-${day.padStart(2, "0")}-${year}`

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

  /* ----------------------------------
   *  TOGGLE CONVERSATION
   * --------------------------------- */
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
      // Reset data
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

  /* ----------------------------------
   *  INITIATE CONVERSATION
   * --------------------------------- */
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

  /* ----------------------------------
   *  RE-OPEN VERIFICATION
   * --------------------------------- */
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

  /* ----------------------------------
   *  GENERATE OPTIONS
   * --------------------------------- */
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

  /* ----------------------------------
   *  RENDER
   * --------------------------------- */
  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      {/* Your Nav, Hero, and Table UI exactly as you have it, unchanged */}
      {/* ... omitted for brevity ... */}

      {/* The Verification Form Modal */}
      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-purple-200 flex flex-col w-full max-w-md">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-700 to-blue-700 px-5 py-3 rounded-t-2xl">
              <h2 className="text-base font-bold text-white">ID Proofing Portal</h2>
              <p className="text-white/80 text-xs">Please provide your details for identity verification</p>
            </div>

            {/* Main content area */}
            <div className="px-5 py-3 text-sm">
              <form id="verification-form" onSubmit={handleSubmitDetails} className="space-y-2">
                {/* Member Name */}
                <div className="flex flex-col">
                  <label htmlFor="name" className="text-purple-800 font-semibold text-sm mb-1">
                    Member Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-3 py-1 rounded bg-gray-50 border border-gray-200 
                      focus:border-purple-500 focus:ring-1 focus:ring-purple-200 
                      outline-none transition-all text-gray-800 text-sm"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Date of Birth */}
                <div className="flex flex-col">
                  <label htmlFor="dob" className="text-purple-800 font-semibold text-sm mb-1">
                    Choose DOB <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      id="dobMonth"
                      name="dobMonth"
                      required
                      className="w-full px-2 py-1 rounded bg-gray-50 border border-gray-200
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
                      className="w-full px-2 py-1 rounded bg-gray-50 border border-gray-200
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
                      className="w-full px-2 py-1 rounded bg-gray-50 border border-gray-200
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
                  <label htmlFor="email" className="text-purple-800 font-semibold text-sm mb-1">
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-3 py-1 rounded bg-gray-50 border border-gray-200 
                      focus:border-purple-500 focus:ring-1 focus:ring-purple-200 
                      outline-none transition-all text-gray-800 text-sm"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Reference ID */}
                <div className="flex flex-col">
                  <label htmlFor="medicalCode" className="text-purple-800 font-semibold text-sm mb-1">
                    Reference ID
                  </label>
                  <input
                    type="text"
                    id="medicalCode"
                    name="medicalCode"
                    defaultValue="99 BE-99-9E09"
                    readOnly
                    className="w-full px-3 py-1 rounded bg-gray-100 border border-gray-200 
                      text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>

                {/* SSN */}
                <div className="flex flex-col">
                  <label htmlFor="ssn" className="text-purple-800 font-semibold text-sm mb-1">
                    SSN
                  </label>
                  <input
                    type="text"
                    id="ssn"
                    name="ssn"
                    defaultValue="111223333"
                    readOnly
                    className="w-full px-3 py-1 rounded bg-gray-100 border border-gray-200 
                      text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>

                {/* Phone Number */}
                <div className="flex flex-col">
                  <label htmlFor="phone" className="text-purple-800 font-semibold text-sm mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    defaultValue="2707111234"
                    readOnly
                    className="w-full px-3 py-1 rounded bg-gray-100 border border-gray-200 
                      text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>

                {/* Address */}
                <div className="flex flex-col">
                  <label htmlFor="address" className="text-purple-800 font-semibold text-sm mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    defaultValue="1234, Plainview, Texas, 79072"
                    readOnly
                    className="w-full px-3 py-1 rounded bg-gray-100 border border-gray-200 
                      text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
              </form>

              {/* Disclaimer/Notes */}
              <div className="bg-blue-50 p-2 mt-2 rounded-xl border border-blue-100">
                <p className="font-bold text-blue-800 text-xs mb-1">Disclaimer:</p>
                <ul className="space-y-0.5 text-xs text-blue-700">
                  {notes.map((note, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-500 flex-shrink-0 text-sm">•</span>
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
                className="px-4 py-1.5 bg-gradient-to-r from-purple-700 to-purple-900 text-white 
                  font-bold rounded-full hover:shadow-lg transform hover:scale-105 
                  transition-all duration-200 text-sm"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading and Error messages */}
      <div>
        {isLoading && <p className="text-blue-400 font-bold">Loading call data...</p>}
        {error && <p className="text-red-500 font-bold">Error: {error}</p>}
      </div>
    </div>
  )
}
