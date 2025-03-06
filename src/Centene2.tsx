"use client"

import "./App.css"
import type React from "react"
import { useEffect, useState } from "react"
import { Mic, Edit2 } from "lucide-react"
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
  "The platform is not integrated into the company systems, therefore asking for specific details for authentication and verification",
  <span key="1">Please enter the name that the Virtual Assistant want to address you as.</span>,
  "Upon authentication request by Virtual Assistant please mention confirmation code # and full name as shown on the top right side of the bar for reference upon this form submission.",
  "Phone# and Email id is required to send instant messages and confirmation",
]

export default function Centene2() {
  const [isEditable, setIsEditable] = useState(false)
  const [formData, setFormData] = useState({
    name: "Jacob Williams",
    dob: "1990-12-12",
    email: "jacobwilliam@gmail.com",
    address: "123 Maple Street, Nashville, Tennessee, 37201",
  })
  const [remainingTrials, setRemainingTrials] = useState(3)

  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "Jacob Williams",
    dob: "1990-12-12",
    email: "jacobwilliam@gmail.com",
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

  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [callInProgress, setCallInProgress] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [showVerificationForm, setShowVerificationForm] = useState(true)

  // Clear form submitted state on page refresh/load
  useEffect(() => {
    setFormSubmitted(false)
  }, [])

  useEffect(() => {
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

    /* 
    // Voiceflow chatbot script injection disabled
    const addChatbotScript = () => {
      const script = document.createElement("script")
      const projectId = "67900940c6f7a86d23b3de98"
      script.type = "text/javascript"
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
                    customer_name: "${userDetails.name}",
                    email: "${userDetails.email}",
                    confirmation_code: "${userDetails.medicalCode}",
                    DOB: "${userDetails.dob}",
                    address: "${userDetails.address}",
                    phone: "${userDetails.phone}"
                  }
                }
              },
            });
          }
          v.src = "https://cdn.voiceflow.com/widget/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
        })(document, 'script');
      `
      document.body.appendChild(script)
      return script
    }

    const chatbotScript = addChatbotScript()
    */

    return () => {
      webClient.off("conversationStarted")
      webClient.off("conversationEnded")
      webClient.off("error")
      webClient.off("update")
      /*
      if (chatbotScript && chatbotScript.parentNode) {
        chatbotScript.parentNode.removeChild(chatbotScript)
      }
      */
    }
  }, [userDetails])

  const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (remainingTrials <= 0) {
      return // Don't allow submission if no trials are left
    }
    const newFormData = new FormData(e.currentTarget)
    const newName = newFormData.get("name") as string
    const newDob = newFormData.get("dob") as string
    const newEmail = newFormData.get("email") as string
    const newAddress = newFormData.get("address") as string

    // Validate inputs against expected values
    const validation = {
      name: newName.trim().toLowerCase() === "jacob williams" ? "valid" : "invalid",
      dob: newDob === "1990-12-12" ? "valid" : "invalid",
      email: newEmail.trim().toLowerCase() === "jacobwilliam@gmail.com" ? "valid" : "invalid",
      address:
        newAddress.trim().toLowerCase() === "123 maple street, nashville, tennessee, 37201" ? "valid" : "invalid",
      phone: userDetails.phone === "6152314412" ? "valid" : "invalid",
      medicalCode: userDetails.medicalCode === "U900312752" ? "valid" : "invalid",
    }

    // Update userDetails with form data
    const newUserDetails = {
      name: newName,
      dob: newDob,
      email: newEmail,
      address: newAddress,
      medicalCode: userDetails.medicalCode,
      phone: userDetails.phone,
      validation: validation,
    }

    // Always submit the form and update user details
    setUserDetails(newUserDetails)
    setFormSubmitted(true)

    // Decrement trials on each submission, but not below 0
    setRemainingTrials((prev) => Math.max(0, prev - 1))

    // Close the form after each submission
    setShowVerificationForm(false)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditable) return

    // Only update the formData state, not the userDetails yet
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const toggleConversation = async () => {
    if (callInProgress) return

    setCallInProgress(true)

    if (callStatus === "active") {
      try {
        await webClient.stopCall()
        setCallStatus("inactive")
      } catch (error) {
        console.error("Error stopping the call:", error)
      } finally {
        setCallInProgress(false)
      }
    } else {
      try {
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
    const agentId = "agent_d3ca92c1776826ef142c084251"
    try {
      const registerCallResponse = await registerCall(agentId)
      if (registerCallResponse.callId) {
        await webClient.startCall({
          accessToken: registerCallResponse.access_token,
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

    const apiKey = "key_98fef97480c54d6bf0698564addb"
    const sampleRate = Number.parseInt(process.env.REACT_APP_RETELL_SAMPLE_RATE || "16000", 10)
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

  const toggleEditable = () => {
    if (!isEditable) {
      // When enabling edit mode, sync formData with userDetails
      setFormData({
        name: userDetails.name,
        dob: userDetails.dob,
        email: userDetails.email,
        address: userDetails.address,
      })
    }
    setIsEditable(!isEditable)
  }

  const reopenVerificationForm = () => {
    if (remainingTrials > 0) {
      setShowVerificationForm(true)
    } else {
      alert("No more trials left. Please contact support for assistance.")
    }
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Customer Identity Verification (CIV) Status
                {remainingTrials < 3 && (
                  <span className="ml-2 text-red-500 text-sm">
                    ({remainingTrials} {remainingTrials === 1 ? "trial" : "trials"} remaining)
                  </span>
                )}
              </h2>
              <button
                onClick={reopenVerificationForm}
                className="flex items-center text-[#2E5388] hover:text-[#1e81b0]"
              >
                <Edit2 className="w-5 h-5 mr-1" />
                Edit
              </button>
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
                  <tr className="bg-[#E6F3FF]">
                    <td className="border p-2">Medical ID</td>
                    <td className="border p-2 font-bold">U900312752</td>
                    <td className="border p-2">{formSubmitted ? userDetails.medicalCode : ""}</td>
                    <td className="border p-2">
                      {formSubmitted && (
                        <span
                          className={userDetails.validation.medicalCode === "valid" ? "text-green-500" : "text-red-500"}
                        >
                          {userDetails.validation.medicalCode === "valid" ? "Valid" : "Invalid"}
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border p-2">Member Name</td>
                    <td className="border p-2 font-bold">Jacob Williams</td>
                    <td className="border p-2">{formSubmitted ? userDetails.name : ""}</td>
                    <td className="border p-2">
                      {formSubmitted && (
                        <span className={userDetails.validation.name === "valid" ? "text-green-500" : "text-red-500"}>
                          {userDetails.validation.name === "valid" ? "Valid" : "Invalid"}
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-[#E6F3FF]">
                    <td className="border p-2">Date of Birth</td>
                    <td className="border p-2 font-bold">1990-12-12</td>
                    <td className="border p-2">{formSubmitted ? userDetails.dob : ""}</td>
                    <td className="border p-2">
                      {formSubmitted && (
                        <span className={userDetails.validation.dob === "valid" ? "text-green-500" : "text-red-500"}>
                          {userDetails.validation.dob === "valid" ? "Valid" : "Invalid"}
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border p-2">Address</td>
                    <td className="border p-2 font-bold">123 Maple Street, Nashville, Tennessee, 37201</td>
                    <td className="border p-2">{formSubmitted ? userDetails.address : ""}</td>
                    <td className="border p-2">
                      {formSubmitted && (
                        <span
                          className={userDetails.validation.address === "valid" ? "text-green-500" : "text-red-500"}
                        >
                          {userDetails.validation.address === "valid" ? "Valid" : "Invalid"}
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-[#E6F3FF]">
                    <td className="border p-2">Phone Number</td>
                    <td className="border p-2 font-bold">6152314412</td>
                    <td className="border p-2">{formSubmitted ? userDetails.phone : ""}</td>
                    <td className="border p-2">
                      {formSubmitted && (
                        <span className={userDetails.validation.phone === "valid" ? "text-green-500" : "text-red-500"}>
                          {userDetails.validation.phone === "valid" ? "Valid" : "Invalid"}
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border p-2">Email ID</td>
                    <td className="border p-2 font-bold">jacobwilliam@gmail.com</td>
                    <td className="border p-2">{formSubmitted ? userDetails.email : ""}</td>
                    <td className="border p-2">
                      {formSubmitted && (
                        <span className={userDetails.validation.email === "valid" ? "text-green-500" : "text-red-500"}>
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
          <div className="bg-[#1e81b0] rounded-[40px] p-4 sm:p-6 w-full max-w-xl mx-auto border-2 border-black shadow-lg overflow-y-auto max-h-[90vh] sm:max-h-none">
            <h2 className="text-base sm:text-xl font-medium text-white mb-4 sm:mb-6">
              Customer details required for verification and authentication
              <span className="ml-2 text-yellow-300 text-sm block sm:inline">
                ({remainingTrials} {remainingTrials === 1 ? "trial" : "trials"} remaining)
              </span>
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
                      className="w-full sm:w-40 text-white text-sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Choose DOB
                    </label>
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      required
                      className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="email"
                      className="w-full sm:w-40 text-white text-sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
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
                      className="w-full sm:w-40 text-white text-sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
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
                      className="w-full sm:w-40 text-white text-sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
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
                      className="w-full sm:w-40 text-white text-sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
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
              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className={`px-10 py-1.5 bg-black text-[#1e81b0] text-base rounded-full transition-colors font-bold ${
                    remainingTrials > 0 ? "hover:bg-gray-800" : "opacity-50 cursor-not-allowed"
                  }`}
                  disabled={remainingTrials <= 0}
                >
                  {remainingTrials > 0
                    ? `Submit (${remainingTrials} ${remainingTrials === 1 ? "trial" : "trials"} left)`
                    : "No trials left"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

