"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import "./App.css"
import { Mic } from "lucide-react"
import { RetellWebClient } from "retell-client-js-sdk"



interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}

interface UserDetails {
  name: string
  dob: string
  phone: string
  email: string
  memberId: string
  address: string
  language: string
}

const webClient = new RetellWebClient()

export default function CSVPharmacy() {
  const [showVerificationForm, setShowVerificationForm] = useState(true)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "",
    dob: "",
    phone: "",
    email: "",
    memberId: "",
    address: "",
    language: "English",
  })
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [callInProgress, setCallInProgress] = useState(false)
  const [formattedDob, setFormattedDob] = useState("Dec/12/1990")
  const [rawDob, setRawDob] = useState("1990-12-12")
  const dateInputRef = useRef<HTMLInputElement>(null)

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

    // Format initial date
    formatDate("1990-12-12")

    // Add chatbot script with launcher disabled
    // const addChatbotScript = () => {
    //   const script = document.createElement("script")
    //   const projectId = "676471f9262abee922cce364"
    //   script.type = "text/javascript"
    //   script.innerHTML = `
    //     (function(d, t) {
    //       var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
    //       v.onload = function() {
    //         window.voiceflow.chat.load({
    //           verify: { projectID: '${projectId}' },
    //           url: 'https://general-runtime.voiceflow.com',
    //           versionID: 'production',
    //           launch: {
    //             event: {
    //               type: "launch",
    //               payload: {
    //                 customer_name: "${userDetails.name}",
    //                 email: "${userDetails.email}",
    //                 phone: "${userDetails.phone}",
    //                 member_id: "${userDetails.memberId}",
    //                 dob: "${userDetails.dob}",
    //                 address: "${userDetails.address}",
    //                 language: "${userDetails.language}"
    //               }
    //             }
    //           },
    //           // Disable the chat launcher icon
    //           launcher: { open: false, show: false },
    //         });
    //       }
    //       v.src = "https://cdn.voiceflow.com/widget/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
    //     })(document, 'script');
    //   `
    //   document.body.appendChild(script)
    //   return script
    // }

    // const chatbotScript = addChatbotScript()

    return () => {
      webClient.off("conversationStarted")
      webClient.off("conversationEnded")
      webClient.off("error")
      webClient.off("update")
      //   if (chatbotScript && chatbotScript.parentNode) {
      //     chatbotScript.parentNode.removeChild(chatbotScript)
      //   }
    }
  }, [userDetails])

  const formatDate = (dateString: string) => {
    if (!dateString) return

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateString)
        return
      }

      // Format as MMM/DD/YYYY (e.g., Dec/12/1990)
      const formattedDate = date
        .toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
        .replace(/\s/g, "/")
        .replace(/,/g, "") // Remove any commas

      setFormattedDob(formattedDate)
      setRawDob(dateString)
    } catch (error) {
      console.error("Error formatting date:", error)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    formatDate(dateValue)
  }

  

  const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const newUserDetails = {
      name: formData.get("name") as string,
      dob: formattedDob, // Use the formatted date
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      memberId: formData.get("memberId") as string,
      address: formData.get("address") as string,
      language: formData.get("language") as string,
    }
    setUserDetails(newUserDetails)
    setShowVerificationForm(false)
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
    const agentId =
      userDetails.language === "Spanish" ? "agent_0e3ef73032a9f6c137c0480285" : "agent_0e3ef73032a9f6c137c0480285"
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

    const apiKey = "53b76c26-bd21-4509-98d7-c5cc62f93b59"
    const sampleRate = Number.parseInt(process.env.REACT_APP_RETELL_SAMPLE_RATE || "16000", 10)

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
            customer_name: userDetails.name,
            email: userDetails.email,
            phone: userDetails.phone,
            member_id: userDetails.memberId,
            dob: userDetails.dob,
            address: userDetails.address,
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

  const getTranslatedText = (englishText: string, spanishText: string) => {
    return userDetails.language === "Spanish" ? spanishText : englishText
  }

  const HeartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="#E31837"
      />
    </svg>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-100 rounded-[30px] sm:rounded-[40px] p-3 sm:p-6 w-full max-w-xl mx-auto border-2 border-gray-500 shadow-lg">
            <h2 className="text-sm sm:text-base md:text-xl font-bold text-center text-black mb-3 sm:mb-6">
              {getTranslatedText(
                "Customer details are required for verification and authentication",
                "Se requieren detalles del cliente para verificación y autenticación",
              )}
            </h2>
            <form onSubmit={handleSubmitDetails} className="space-y-4">
              <div className="grid gap-4 max-w-lg mx-auto border-2 border-[#800080] rounded-lg p-4">
                <div className="grid gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="name"
                      className="w-full sm:w-40 text-[#004B87] font-bold text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      {getTranslatedText("Full Name:", "Nombre completo:")}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      defaultValue="John Smith"
                      className="flex-1 p-1 sm:p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-xs sm:text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="dob"
                      className="w-full sm:w-40 text-[#004B87] font-bold text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      {getTranslatedText("DOB:", "Fecha de nacimiento:")}
                    </label>
                    <div className="flex-1 relative">
                      <div className="flex items-center">
                        <input
                          type="date"
                          id="dob-hidden"
                          name="dob"
                          ref={dateInputRef}
                          value={rawDob}
                          onChange={handleDateChange}
                          className="absolute opacity-0 w-full h-full cursor-pointer z-10"
                          required
                        />
                        <div className="relative flex-1">
                          <input
                            type="text"
                            id="dob"
                            value={formattedDob}
                            readOnly
                            className="w-full p-1 sm:p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-xs sm:text-sm cursor-pointer"
                            placeholder="MMM/DD/YYYY"
                            onClick={() => dateInputRef.current?.click()}
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Format: MMM/DD/YYYY (e.g., Dec/12/1990)</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="email"
                      className="w-full sm:w-40 text-[#004B87] font-bold text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      {getTranslatedText("Email id :", "Correo electrónico :")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      defaultValue="jacobwilliam@gmail.com"
                      className="flex-1 p-1 sm:p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-xs sm:text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="memberId"
                      className="w-full sm:w-40 text-[#004B87] font-bold text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      {getTranslatedText("Member ID :", "ID de miembro :")}
                    </label>
                    <input
                      type="text"
                      id="memberId"
                      name="memberId"
                      required
                      defaultValue="99 BE-99-9E09"
                      readOnly
                      className="flex-1 p-1 sm:p-1.5 rounded bg-gray-200 text-black border border-gray-300 font-bold text-xs sm:text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <label
                      htmlFor="address"
                      className="w-full sm:w-40 text-[#004B87] font-bold text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3 sm:pt-1"
                    >
                      {getTranslatedText("Address :", "Dirección :")}
                    </label>
                    <div className="flex-1">
                      <textarea
                        id="address"
                        name="address"
                        required
                        defaultValue="116 Dogwood Rd, Lancaster, Kentucky(KY), 40444"
                        readOnly
                        className="w-full p-1 sm:p-1.5 rounded bg-gray-200 text-black border border-gray-300 font-bold text-xs sm:text-sm resize-none h-20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="phone"
                      className="w-full sm:w-40 text-[#004B87] font-bold text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      {getTranslatedText("Phone no :", "Número de teléfono :")}
                    </label>
                    <div className="flex-1 flex">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        defaultValue="2707111234"
                        readOnly
                        className="flex-1 p-1 sm:p-1.5 rounded bg-gray-200 text-black border border-gray-300 font-bold text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-16 mb-4">
                <button
                  type="submit"
                  className="px-8 sm:px-12 py-3 sm:py-3.5 bg-black text-yellow-300 text-base sm:text-lg rounded-full hover:bg-gray-800 transition-colors font-bold shadow-md"
                >
                  {getTranslatedText("Submit", "Enviar")}
                </button>
              </div>
            </form>
            <div className="mt-4 bg-white p-3 rounded-lg">
              <p className="font-medium text-red-500 mb-1">
                {getTranslatedText("Disclaimer :", "Descargo de responsabilidad :")}
              </p>
              <ul className="space-y-1 text-black text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-black">➤</span>
                  <span>
                    The platform isn't integrated with company systems, so it requires authentication details.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black">➤</span>
                  <span>Enter the name the Virtual Assistant should use.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black">➤</span>
                  <span>An email ID is needed for instant messages and confirmation.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="w-full bg-white border-b border-gray-200">
        <div className="w-full px-4">
          {/* Top Navigation Row */}
          <div className="flex items-center justify-between h-16">
            {/* Logo and Main Navigation */}
            <div className="flex items-left space-x-1">
              {/* Logo */}
              <img src="/csvLogo.png" alt="CVS" className="h-16 w-auto -mt-10" />

              {/* Main Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                <div className="relative">
                  <button className="flex items-center text-gray-800 font-medium hover:text-red-600">
                    Prescriptions
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                </div>

                <div className="relative">
                  <button className="flex items-center text-gray-800 font-medium hover:text-red-600">
                    Health
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                </div>

                <div className="relative">
                  <button className="flex items-center text-gray-800 font-medium hover:text-red-600">
                    Shop
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                </div>

                <div className="relative">
                  <button className="flex items-center text-gray-800 font-medium hover:text-red-600">
                    Savings & Memberships
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* User Sign In - Push to extreme right */}
            <div className="flex items-center">
              <button className="flex items-center text-gray-800 font-medium hover:text-red-600">
                <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path>
                </svg>
                Sign in
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Secondary Navigation Row */}
          <div className="flex flex-nowrap items-center justify-start pl-0 overflow-x-auto py-3 text-sm whitespace-nowrap space-x-6">
            <a href="/schedule-vaccine" className="text-gray-800 hover:text-red-600 hover:underline">
              Schedule a vaccine
            </a>
            <a href="/manage-prescriptions" className="text-gray-800 hover:text-red-600 hover:underline">
              Manage prescriptions
            </a>
            <a href="/photo" className="text-gray-800 hover:text-red-600 hover:underline flex items-center">
              Photo
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                ></path>
              </svg>
            </a>
            <a href="/minuteclinic" className="text-gray-800 hover:text-red-600 hover:underline">
              MinuteClinic Services
            </a>
            <a href="/extracare" className="text-gray-800 hover:text-red-600 hover:underline">
              ExtraCare savings
            </a>
            <a href="/deals" className="text-gray-800 hover:text-red-600 hover:underline">
              Deals of the Week
            </a>
            <a href="/weekly-ad" className="text-gray-800 hover:text-red-600 hover:underline">
              Weekly ad
            </a>
            <a href="/primary-care" className="text-gray-800 hover:text-red-600 hover:underline">
              Primary care for older adults
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section with Overlapping Verification Panel */}
      <div className="flex-grow flex flex-col min-h-0">
        {/* Hero Background */}
        <div className="w-full bg-[#004B87] h-[30vh] sm:h-[40vh] md:h-[50vh]">
          <img src="/CSV_hero.png" alt="Hero" className="w-full h-full object-fit object-center" />
        </div>

        {/* Verification Panel and Call Button - Positioned higher to overlap more of the hero section */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 -mt-16 sm:-mt-24 md:-mt-32 relative z-10 mb-auto md:pl-4 lg:pl-18">
          {/* Verification Panel */}
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 max-w-xl w-full md:w-2/5 border-2 border-[#004B87]">
            <h3 className="text-[#004B87] text-xl font-bold mb-2 border-b-2 border-[#004B87] pb-1">
              Verification Information
            </h3>
            <div className="space-y-0">
              <div className="py-1 border-b border-[#004B87]">
                <div className="flex items-center">
                  <HeartIcon />
                  <div className="ml-2 flex-1 overflow-hidden">
                    <span className="text-[#004B87] font-bold mr-2">Member ID:</span>
                    <span className="text-gray-700 break-words">{userDetails.memberId}</span>
                  </div>
                </div>
              </div>
              <div className="py-1 border-b border-[#004B87]">
                <div className="flex items-center">
                  <HeartIcon />
                  <div className="ml-2 flex-1 overflow-hidden">
                    <span className="text-[#004B87] font-bold mr-2">Full Name:</span>
                    <span className="text-gray-700 break-words">{userDetails.name}</span>
                  </div>
                </div>
              </div>
              <div className="py-1 border-b border-[#004B87]">
                <div className="flex items-center">
                  <HeartIcon />
                  <div className="ml-2 flex-1 overflow-hidden">
                    <span className="text-[#004B87] font-bold mr-2">DOB:</span>
                    <span className="text-gray-700 break-words">{userDetails.dob}</span>
                  </div>
                </div>
              </div>
              <div className="py-1 border-b border-[#004B87]">
                <div className="flex items-start">
                  <HeartIcon className="mt-1" />
                  <div className="ml-2 flex-1 overflow-hidden">
                    <span className="text-[#004B87] font-bold mr-2">Address:</span>
                    <span className="text-gray-700 break-words whitespace-pre-line">{userDetails.address}</span>
                  </div>
                </div>
              </div>
              <div className="py-1 border-b border-[#004B87]">
                <div className="flex items-center">
                  <HeartIcon />
                  <div className="ml-2 flex-1 overflow-hidden">
                    <span className="text-[#004B87] font-bold mr-2">Phone No:</span>
                    <span className="text-gray-700 break-words">{userDetails.phone}</span>
                  </div>
                </div>
              </div>
              <div className="py-1 border-b border-[#004B87]">
                <div className="flex items-center">
                  <HeartIcon />
                  <div className="ml-2 flex-1 overflow-hidden">
                    <span className="text-[#004B87] font-bold mr-2">Email ID:</span>
                    <span className="text-gray-700 break-words">{userDetails.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call Button - With text to the side */}
          <div className="flex flex-col items-center justify-center w-full md:w-2/5 py-3 sm:py-6 mt-6 md:mt-10">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-[90%] mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 my-2 sm:my-4">
                <button onClick={toggleConversation} className="group">
                  <div
                    className={`p-6 sm:p-8 md:p-10 ${callStatus === "active" ? "bg-[#E31837]" : "bg-[#004B87]"} rounded-full transition-all duration-300 group-hover:scale-105 ${
                      callStatus === "active" ? "ring-4 ring-[#ffdc00] animate-pulse" : ""
                    } shadow-lg`}
                  >
                    <Mic
                      className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-white ${callStatus === "active" ? "animate-bounce" : ""}`}
                    />
                  </div>
                </button>
                <span
                  className={`text-xl sm:text-2xl md:text-3xl font-bold ${callStatus === "active" ? "text-[#E31837]" : "text-[#004B87]"} whitespace-nowrap mt-4 md:mt-0`}
                >
                  {callStatus === "active" ? "Click to Stop Call" : "Click to Start Call"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white py-2 sm:py-3 border-t border-gray-300 flex-shrink-0 mt-2 w-full">
        <div className="w-full px-4">
          <div className="flex flex-wrap justify-start gap-x-4 sm:gap-x-6 gap-y-1 sm:gap-y-2 text-[10px] xs:text-xs text-gray-600 mb-2">
            <a href="/terms" className="hover:text-[#004B87] hover:underline transition-colors">
              Terms of use
            </a>
            <a href="/accessibility" className="hover:text-[#004B87] hover:underline transition-colors">
              Accessibility
            </a>
            <a href="/wifi-terms" className="hover:text-[#004B87] hover:underline transition-colors">
              In-Store WiFi Terms (PDF)
            </a>
            <a href="/security" className="hover:text-[#004B87] hover:underline transition-colors">
              Security
            </a>
            <a href="/sitemap" className="hover:text-[#004B87] hover:underline transition-colors">
              Sitemap
            </a>
            <a href="/privacy" className="hover:text-[#004B87] hover:underline transition-colors">
              Privacy policy
            </a>
            <a href="/wa-privacy" className="hover:text-[#004B87] hover:underline transition-colors">
              WA privacy policy
            </a>
            <a href="/ca-privacy" className="hover:text-[#004B87] hover:underline transition-colors">
              CA privacy notice
            </a>
            <div className="flex items-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1"
              >
                <circle cx="8" cy="8" r="7.5" fill="#0066CC" stroke="#0066CC" />
                <path
                  d="M5 8L7 10L11 6"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <a href="/privacy-choices" className="hover:text-[#004B87] hover:underline transition-colors">
                Your Privacy Choices
              </a>
            </div>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                />
              </svg>
              <a href="/es" className="hover:text-[#004B87] hover:underline transition-colors">
                Español
              </a>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-left">© Copyright 1999-2025 CSV.com</div>
        </div>
      </footer>
    </div>
  )
}

