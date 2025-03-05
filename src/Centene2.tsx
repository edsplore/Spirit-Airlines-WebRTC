"use client"

import "./App.css"
import type React from "react"
import { useEffect, useState } from "react"
import { Mic, MessageCircle, Edit2, X } from "lucide-react"
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

    return () => {
      webClient.off("conversationStarted")
      webClient.off("conversationEnded")
      webClient.off("error")
      webClient.off("update")
      if (chatbotScript && chatbotScript.parentNode) {
        chatbotScript.parentNode.removeChild(chatbotScript)
      }
    }
  }, [userDetails])

  const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const newFormData = new FormData(e.currentTarget)
    const newName = newFormData.get("name") as string
    const newDob = newFormData.get("dob") as string
    const newEmail = newFormData.get("email") as string
    const newAddress = newFormData.get("address") as string

    // Validate inputs against expected values
    const validation = {
      name: newName === "Jacob Williams" ? "valid" : "invalid",
      dob: newDob === "1990-12-12" ? "valid" : "invalid",
      email: newEmail === "jacobwilliam@gmail.com" ? "valid" : "invalid",
      address: newAddress === "123 Maple Street, Nashville, Tennessee, 37201" ? "valid" : "invalid",
      // Adding validation for phone and medicalCode
      phone: userDetails.phone === "6152314412" ? "valid" : "invalid",
      medicalCode: userDetails.medicalCode === "U900312752" ? "valid" : "invalid",
    }

    // Update userDetails with form data only after submit
    const newUserDetails = {
      name: newName,
      dob: newDob,
      email: newEmail,
      address: newAddress,
      medicalCode: userDetails.medicalCode,
      phone: userDetails.phone,
      validation: validation,
    }

    setUserDetails(newUserDetails)
    setFormSubmitted(true)
    setIsEditable(false)

    const existingScript = document.querySelector('script[src="https://cdn.voiceflow.com/widget/bundle.mjs"]')
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript)
    }

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
                    customer_name: "${newUserDetails.name}",
                    email: "${newUserDetails.email}",
                    confirmation_code: "${newUserDetails.medicalCode}",
                    address: "${newUserDetails.address}",
                    DOB: "${newUserDetails.dob}",
                    phone: "${newUserDetails.phone}"
                  }
                }
              },
            });
          }
          v.src = "https://cdn.voiceflow.com/widget/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
        })(document, 'script');
      `
      document.body.appendChild(script)
    }
    addChatbotScript()
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
    const agentId = "agent_3ad7f48e10b9c6a45ffaf0cfac"
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

  return (
    <div className="min-h-screen bg-white relative">
      <nav
        className="w-full h-48 md:h-64 bg-cover bg-center relative"
        style={{
          backgroundImage: "url('/Centene_Header.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="px-4 md:px-20 py-6">
          <img
            src="/centene_logo.png"
            alt="Centene"
            className="h-12 md:h-14 absolute top-2 left-2"
          />
        </div>
      </nav>




      {/* <div className="relative w-full">
        <img src="/centene-hero2.png" alt="Centene Hero" className="w-full object-cover rounded-lg shadow-md" />
        <div className="absolute bottom-1 left-0 w-full flex flex-col items-center justify-center p-3">
          <div className="w-full md:w-4/5 flex flex-col">
            <div className="text-white text-3xl md:text-5xl font-extrabold">
              <span>Who we are</span>
            </div>
            <div className="bg-white bg-opacity-70 text-black p-4 rounded-3xl shadow-md mt-4 hidden md:block">
              <p
                className="text-sm md:text-2xl font-bold text-black"
                style={{ display: "inline-block", width: "100%", wordSpacing: "0.2rem" }}
              >
                Centene is committed to helping people live healthier lives. We provide access to high-quality
              </p>
              <p
                className="text-sm md:text-2xl font-bold text-black"
                style={{ display: "inline-block", width: "100%", wordSpacing: "0.3rem" }}
              >
                healthcare, innovative programs and health solutions that help families and individuals
              </p>
              <p
                className="text-sm md:text-2xl font-bold text-black"
                style={{ display: "inline-block", width: "100%", wordSpacing: "0.1rem" }}
              >
                get well, stay well and be well.
              </p>
            </div>
          </div>
        </div>
      </div> */}

      <div className="flex flex-col lg:flex-row gap-6 mt-4 px-4 lg:px-8">
        <div className="w-full lg:w-1/2">
          {/* Always show the table, but only show data after form submission */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="grid grid-cols-2 text-xs md:text-sm border border-gray-300">
              <div className="font-semibold bg-[#2E5388] text-white p-2 border-r border-b border-gray-300">
                Medical ID #
              </div>
              <div className="bg-[#2E5388] text-white p-2 border-b border-gray-300 flex justify-between items-center">
                {formSubmitted ? userDetails.medicalCode : ""}
                {formSubmitted && (
                  <span className="text-white text-xs font-medium">
                    {userDetails.validation.medicalCode === "valid" ? "Valid" : "Invalid"}
                  </span>
                )}
              </div>

              <div className="font-semibold p-2 border-r border-b border-gray-300">Phone Number</div>
              <div className="p-2 border-b border-gray-300 flex justify-between items-center">
                {formSubmitted ? userDetails.phone : ""}
                {formSubmitted && (
                  <span
                    className={
                      userDetails.validation.phone === "valid"
                        ? "text-green-500 text-xs font-medium"
                        : "text-red-500 text-xs font-medium"
                    }
                  >
                    {userDetails.validation.phone === "valid" ? "Valid" : "Invalid"}
                  </span>
                )}
              </div>

              <div className="font-semibold p-2 border-r border-b border-gray-300">Member Name</div>
              <div className="p-2 border-b border-gray-300 flex justify-between items-center">
                {formSubmitted ? userDetails.name : ""}
                {formSubmitted && (
                  <span
                    className={
                      userDetails.validation.name === "valid"
                        ? "text-green-500 text-xs font-medium"
                        : "text-red-500 text-xs font-medium"
                    }
                  >
                    {userDetails.validation.name === "valid" ? "Valid" : "Invalid"}
                  </span>
                )}
              </div>

              <div className="font-semibold p-2 border-r border-b border-gray-300">Email ID</div>
              <div className="p-2 border-b border-gray-300 flex justify-between items-center">
                {formSubmitted ? userDetails.email : ""}
                {formSubmitted && (
                  <span
                    className={
                      userDetails.validation.email === "valid"
                        ? "text-green-500 text-xs font-medium"
                        : "text-red-500 text-xs font-medium"
                    }
                  >
                    {userDetails.validation.email === "valid" ? "Valid" : "Invalid"}
                  </span>
                )}
              </div>

              <div className="font-semibold p-2 border-r border-b border-gray-300">Status</div>
              <div className="p-2 border-b border-gray-300">{formSubmitted ? "Enrolled" : ""}</div>

              <div className="font-semibold p-2 border-r border-b border-gray-300">DOB</div>
              <div className="p-2 border-b border-gray-300 flex justify-between items-center">
                {formSubmitted ? userDetails.dob : ""}
                {formSubmitted && (
                  <span
                    className={
                      userDetails.validation.dob === "valid"
                        ? "text-green-500 text-xs font-medium"
                        : "text-red-500 text-xs font-medium"
                    }
                  >
                    {userDetails.validation.dob === "valid" ? "Valid" : "Invalid"}
                  </span>
                )}
              </div>

              <div className="font-semibold p-2 border-r border-b border-gray-300">Address</div>
              <div className="p-2 border-b border-gray-300 flex justify-between items-center">
                <div className="truncate pr-2">{formSubmitted ? userDetails.address : ""}</div>
                {formSubmitted && (
                  <span
                    className={
                      userDetails.validation.address === "valid"
                        ? "text-green-500 text-xs font-medium"
                        : "text-red-500 text-xs font-medium"
                    }
                  >
                    {userDetails.validation.address === "valid" ? "Valid" : "Invalid"}
                  </span>
                )}
              </div>

              <div className="font-semibold p-2 border-r border-b border-gray-300">Policy Active Date</div>
              <div className="p-2 border-b border-gray-300">
                {formSubmitted ? format(addDays(new Date(), 15), "dd MMM yyyy") : ""}
              </div>
            </div>
          </div>

          {/* Always show the note section */}
          <div className="mt-4 bg-white p-3 rounded-lg border shadow">
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
        </div>

        <div className="w-full lg:w-1/2">
          <div className="bg-[#1e81b0] rounded-lg p-4 shadow border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base sm:text-xl font-medium text-white">
                Customer details required for verification
              </h2>
              <button
                onClick={toggleEditable}
                className="flex items-center gap-1 bg-black text-white px-3 py-1 rounded-full text-sm"
              >
                {isEditable ? (
                  <>
                    <X size={14} /> Lock Form
                  </>
                ) : (
                  <>
                    <Edit2 size={14} /> Edit Form
                  </>
                )}
              </button>
            </div>

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
                      className={`flex-1 p-1.5 rounded ${isEditable ? "bg-white" : "bg-gray-100"} text-black border border-gray-300 font-bold text-sm`}
                      value={isEditable ? formData.name : userDetails.name}
                      onChange={handleFormChange}
                      readOnly={!isEditable}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="dob"
                      className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Choose DOB
                    </label>
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      required
                      className={`flex-1 p-1.5 rounded ${isEditable ? "bg-white" : "bg-gray-100"} text-black border border-gray-300 font-bold text-sm`}
                      value={isEditable ? formData.dob : userDetails.dob}
                      onChange={handleFormChange}
                      readOnly={!isEditable}
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
                      value={isEditable ? formData.address : userDetails.address}
                      onChange={handleFormChange}
                      readOnly
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
                      className={`flex-1 p-1.5 rounded ${isEditable ? "bg-white" : "bg-gray-100"} text-black border border-gray-300 font-bold text-sm`}
                      value={isEditable ? formData.email : userDetails.email}
                      onChange={handleFormChange}
                      readOnly={!isEditable}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="medicalCode"
                      className="w-full sm:w-40 text-white text-sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Medical Code#
                    </label>
                    <input
                      type="text"
                      id="medicalCode"
                      name="medicalCode"
                      value={userDetails.medicalCode}
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
                      value={userDetails.phone}
                      readOnly
                      className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className="px-10 py-1.5 bg-black text-[#1e81b0] text-base rounded-full hover:bg-gray-800 transition-colors font-bold"
                  disabled={!isEditable}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mt-8 px-4">
        <div className="bg-white pt-2 px-2 w-full max-w-4xl">
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-24">
            <button onClick={toggleConversation} className="flex flex-col items-center group">
              <div
                className={`p-8 md:p-16 bg-black rounded-full transition-all duration-300 group-hover:scale-105 ${callStatus === "active" ? "ring-4 ring-[#ffdc00] animate-pulse" : ""
                  }`}
              >
                <Mic
                  className={`w-12 h-12 md:w-16 md:h-16 text-[#1e81b0] ${callStatus === "active" ? "animate-bounce" : ""
                    }`}
                />
              </div>
              <span className="mt-4 text-[#1e81b0] text-xl md:text-3xl font-bold">
                {callStatus === "active" ? <span className="text-[#1e81b0]">Click to Disconnect</span> : "Let's Talk"}
              </span>
            </button>

            <button
              onClick={() => (window as any).voiceflow?.chat?.open()}
              className="flex flex-col items-center group"
            >
              <div className="p-8 md:p-16 bg-black rounded-full transition-all duration-300 group-hover:scale-105">
                <MessageCircle className="w-12 h-12 md:w-16 md:h-16 text-[#1e81b0]" />
              </div>
              <span className="mt-4 text-[#1e81b0] text-xl md:text-3xl font-bold">Let's Chat</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className="bg-cover bg-center text-white py-2.5 mt-8 relative"
        style={{ backgroundImage: "url('/Centene_Footer.png')" }}
      >
        {/* Overlay for better readability */}
        <div className="absolute "></div>

        <div className="container mx-auto px-4 sm:px-8 max-w-full flex flex-col sm:flex-row justify-between items-center sm:items-start relative z-10">
          <div className="flex flex-col items-start gap-2 mb-4 sm:mb-0">
            <img src="/centene_logo.png" alt="Centene" className="h-12 sm:h-16 mb-2 sm:mb-0" />
            <p className="text-sm text-[#2E5388] sm:text-lg font-normal italic text-center sm:text-left">
              Transform the health of the communities, <br />
              we serve one person at a time.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-start gap-1 mt-4 sm:mt-8 mb-4 sm:mb-0">
            <h2 className="text-xl  text-[#2E5388] sm:text-2xl font-bold uppercase text-center sm:text-left">
              Healthcare IS BEST DELIVERED LOCALLY
            </h2>
            <p className="text-sm sm:text-lg text-[#2E5388]  font-normal text-center sm:text-left">
              Our unique local approach allows us to help members helpers take out you from there, <br />
              access high-quality, culturally sensitive healthcare services
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-start gap-2">
            <ul className="text-sm  text-[#2E5388] sm:text-lg font-normal text-center sm:text-left">
              <li>Contact</li>
              <li>Equal Opportunity Employer</li>
              <li>Privacy Policy</li>
              <li>Terms & Conditions</li>
              <li>Purchase Order Terms & Conditions</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  )
}

