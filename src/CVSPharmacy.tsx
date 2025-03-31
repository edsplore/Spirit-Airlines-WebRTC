"use client"

import type React from "react"
import { useEffect, useState } from "react"
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

    // Add chatbot script
    const addChatbotScript = () => {
      const script = document.createElement("script")
      const projectId = "676471f9262abee922cce364"
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
                    phone: "${userDetails.phone}",
                    member_id: "${userDetails.memberId}",
                    dob: "${userDetails.dob}",
                    address: "${userDetails.address}",
                    language: "${userDetails.language}"
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
    const formData = new FormData(e.currentTarget)
    const newUserDetails = {
      name: formData.get("name") as string,
      dob: formData.get("dob") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      memberId: formData.get("memberId") as string,
      address: formData.get("address") as string,
      language: formData.get("language") as string,
    }
    setUserDetails(newUserDetails)
    setShowVerificationForm(false)

    // Reload the chatbot script with new user details
    const existingScript = document.querySelector('script[src="https://cdn.voiceflow.com/widget/bundle.mjs"]')
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript)
    }
    const addChatbotScript = () => {
      const script = document.createElement("script")
      const projectId = "676471f9262abee922cce364"
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
                  phone: "${newUserDetails.phone}",
                  member_id: "${newUserDetails.memberId}",
                  dob: "${newUserDetails.dob}",
                  address: "${newUserDetails.address}",
                  language: "${newUserDetails.language}"
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
      userDetails.language === "Spanish" ? "agent_076c8b8122e8d9d9cfe46100fb" : "agent_daa34732914c990996c9153ffc"
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

  return (
    <div className="min-h-screen bg-white relative">
      <style>
        {`
          @media (max-width: 640px) {
            .decorative-triangle {
              display: none;
            }
          }
        `}
      </style>

      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-[40px] p-4 sm:p-6 w-full max-w-xl mx-auto border-2 border-gray-500 shadow-lg overflow-y-auto max-h-[90vh] sm:max-h-none">
            <h2 className="text-base sm:text-xl font-bold text-center text-black mb-4 sm:mb-6">
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
                      {getTranslatedText("Member Name :", "Nombre del miembro :")}
                      <span className="text-[#004B87]"> Choose</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      defaultValue="John Smith"
                      className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="dob"
                      className="w-full sm:w-40 text-[#004B87] font-bold text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      {getTranslatedText("DOB :", "Fecha de nacimiento :")}
                    </label>
                    <input
                      type="text"
                      id="dob"
                      name="dob"
                      required
                      defaultValue="12/12/1990"
                      className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                    />
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
                      className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
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
                      className="flex-1 p-1.5 rounded bg-gray-200 text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="address"
                      className="w-full sm:w-40 text-[#004B87] font-bold text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      {getTranslatedText("Address :", "Dirección :")}
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required
                      defaultValue="116 Dogwood Rd, Lancaster, Kentucky(KY), 40444"
                      readOnly
                      className="flex-1 p-1.5 rounded bg-gray-200 text-black border border-gray-300 font-bold text-sm"
                    />
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
                        className="flex-1 p-1.5 rounded bg-gray-200 text-black border border-gray-300 font-bold text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className="px-10 py-1.5 bg-black text-yellow-300 text-base rounded-full hover:bg-gray-800 transition-colors font-bold"
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

      <nav className="bg-white border-b border-gray-200 py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/csvLogo.png"
              alt="CSV Pharmacy"
              className="w-full h-auto md:h-[50px] object-contain md:object-cover"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="mr-1">Sign in</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <button className="bg-[#004B87] text-white px-4 py-2 rounded-full font-semibold">Use CSV App</button>
          </div>
        </div>
      </nav>

      <div className="relative w-full">
        <div className="w-full">
          <img
            src="/csvHero.png"
            alt="CSV Pharmacy"
            className="w-full h-auto md:h-[350px] object-contain md:object-cover"
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between px-8 py-6">
          <div className="w-full md:w-1/2 mb-6 md:mb-0">
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-[#004B87]">Verification Information</h2>
              </div>
              <div className="grid grid-cols-2 text-sm border border-gray-300">
                <div className="font-semibold bg-[#004B87] p-2 border-r border-b border-gray-300 text-white">
                  Medical ID -
                </div>
                <div className="p-2 border-b border-gray-300">{userDetails.memberId}</div>
                <div className="font-semibold bg-[#004B87] p-2 border-r border-b border-gray-300 text-white">
                  Full Name -
                </div>
                <div className="p-2 border-b border-gray-300">{userDetails.name}</div>
                <div className="font-semibold bg-[#004B87] p-2 border-r border-b border-gray-300 text-white">DOB -</div>
                <div className="p-2 border-b border-gray-300">{userDetails.dob}</div>
                <div className="font-semibold bg-[#004B87] p-2 border-r border-b border-gray-300 text-white">
                  Address -
                </div>
                <div className="p-2 border-b border-gray-300">{userDetails.address}</div>
                <div className="font-semibold bg-[#004B87] p-2 border-r border-b border-gray-300 text-white">
                  Phone No -
                </div>
                <div className="p-2 border-b border-gray-300">{userDetails.phone}</div>
                <div className="font-semibold bg-[#004B87] p-2 border-r border-gray-300 text-white">Email ID -</div>
                <div className="p-2">{userDetails.email}</div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/3 flex justify-center items-center">
            <button onClick={toggleConversation} className="flex flex-col items-center group">
              <div
                className={`p-8 md:p-12 bg-[#004B87] rounded-full transition-all duration-300 group-hover:scale-105 ${
                  callStatus === "active" ? "ring-4 ring-[#ffdc00] animate-pulse" : ""
                }`}
              >
                <Mic
                  className={`w-12 h-12 md:w-16 md:h-16 text-white ${callStatus === "active" ? "animate-bounce" : ""}`}
                />
              </div>
              <span className="mt-4 text-lg md:text-xl font-medium">
                {callStatus === "active" ? (
                  <span className="text-brown-500">
                    {getTranslatedText("Click to Disconnect", "Haga clic para desconectar")}
                  </span>
                ) : (
                  getTranslatedText("Let's Talk", "Hablemos")
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="text-center pt-2 bg-white">
          <p className="text-base md:text-lg text-gray-800 mb-2 font-semibold">
            CSV Pharmacy - Your trusted healthcare partner since 1963.
          </p>
          <p className="text-sm md:text-base bg-[#004B87] inline-block px-3 py-1 font-semibold text-white">
            Dedicated to your health and wellness needs.
          </p>
        </div>
      </div>
      <footer className="bg-gray-100 py-4 border-t border-gray-300">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-start gap-x-6 gap-y-2 text-sm text-gray-600 mb-2">
            <a href="/terms" className="hover:underline">
              Terms of use
            </a>
            <a href="/accessibility" className="hover:underline">
              Accessibility
            </a>
            <a href="/wifi-terms" className="hover:underline">
              In-Store WiFi Terms (PDF)
            </a>
            <a href="/security" className="hover:underline">
              Security
            </a>
            <a href="/sitemap" className="hover:underline">
              Sitemap
            </a>
            <a href="/privacy" className="hover:underline">
              Privacy policy
            </a>
            <a href="/wa-privacy" className="hover:underline">
              WA privacy policy
            </a>
            <a href="/ca-privacy" className="hover:underline">
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
              <a href="/privacy-choices" className="hover:underline">
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
              <a href="/es" className="hover:underline">
                Español
              </a>
            </div>
          </div>
          <div className="text-xs text-gray-500">© Copyright 1999-2025 CSV.com</div>
        </div>
      </footer>
    </div>
  )
}

