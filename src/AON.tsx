import type React from "react"
import { useEffect, useState } from "react"
import "./App.css"
import { Mic, MessageCircle } from "lucide-react"
import { RetellWebClient } from "retell-client-js-sdk"

interface UserDetails {
  name: string
  email: string
  address: string
  zipCode: string
  language: string
  bookingId: string
  claimReferenceNumber: string
}

const webClient = new RetellWebClient()

const notes = [
  "The platform is not integrated into the company systems, therefore asking for specific details for authentication and verification",
  "Please enter the name that the Virtual Assistant want to address you as.",
  "Upon authentication request by Virtual Assistant please mention Zip Code and full name as shown on the top right side of the bar for reference upon this form submission.",
  "Email id is required to send instant messages and confirmation",
]

export default function SpiritAirlinesDemo() {
  const [showVerificationForm, setShowVerificationForm] = useState(true)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "",
    email: "",
    address: "1234 Elm Street Springfield",
    zipCode: "62704",
    language: "English",
    bookingId: "P4B7V9",
    claimReferenceNumber: "20257",
  })
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [callInProgress, setCallInProgress] = useState(false)

  useEffect(() => {
    // Add chatbot script
    const addChatbotScript = () => {
      const script = document.createElement("script")
      const projectId = "675e58a4bdfd5f757cea0976"
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
                    address: "${userDetails.address}",
                    zipcode: "${userDetails.zipCode}",
                    language: "${userDetails.language}",
                     bookingId: "${userDetails.bookingId}",
                    claimReferenceNumber: "${userDetails.claimReferenceNumber}"
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
      if (chatbotScript && chatbotScript.parentNode) {
        chatbotScript.parentNode.removeChild(chatbotScript)
      }
    }
  }, [userDetails])

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

    return () => {
      webClient.off("conversationStarted")
      webClient.off("conversationEnded")
      webClient.off("error")
      webClient.off("update")
      if (window.voiceflow && window.voiceflow.chat) {
        window.voiceflow.chat.destroy()
      }
    }
  }, [])

  const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newUserDetails = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      zipCode: formData.get("zipCode") as string,
      bookingId: formData.get("bookingId") as string,
      claimReferenceNumber: formData.get("claimReferenceNumber") as string,

      language: "English",
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
      const projectId = "675e58a4bdfd5f757cea0976"
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
                    address: "${newUserDetails.address}",
                    zipcode: "${newUserDetails.zipCode}",
                    language: "${newUserDetails.language}",
                   bookingId: "${userDetails.bookingId}",
                    claimReferenceNumber: "${userDetails.claimReferenceNumber}"
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
      userDetails.language === "Spanish" ? "agent_c53c273bda8beda64317da5bc9" : "agent_c53c273bda8beda64317da5bc9"
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
            address: userDetails.address,
            zip_code: userDetails.zipCode,
            bookingId: userDetails.bookingId,
            claimReferenceNumber: userDetails.claimReferenceNumber,
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
          <div className="bg-[#EEF6F7] rounded-[40px] p-4 sm:p-6 w-full max-w-xl mx-auto border-2 border-black shadow-lg overflow-y-auto max-h-[90vh] sm:max-h-none">
            <h2 className="text-base sm:text-xl font-medium text-black mb-4 sm:mb-6">
              {getTranslatedText(
                "Customer details required for verification and authentication",
                "Detalles del cliente requeridos para verificación y autenticación",
              )}
            </h2>
            <form onSubmit={handleSubmitDetails} className="space-y-4">
              <div className="grid gap-4 max-w-lg mx-auto">
                <div className="grid gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="name"
                      className="w-full sm:w-40 text-black text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Enter full name<span className="text-red-500">*</span>
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
                      htmlFor="email"
                      className="w-full sm:w-40 text-black text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
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
                      className="w-full sm:w-40 text-black text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      defaultValue="1234 Elm Street Springfield"
                      required
                      className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="zipCode"
                      className="w-full sm:w-40 text-black text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Zip Code #
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      defaultValue="62704"
                      readOnly
                      className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="bookingId"
                      className="w-full sm:w-40 text-black text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Booking ID
                    </label>
                    <input
                      type="text"
                      id="bookingId"
                      name="bookingId"
                      defaultValue="P4B7V9"
                      required
                      readOnly
                      className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label
                      htmlFor="claimReferenceNumber"
                      className="w-full sm:w-40 text-black text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3"
                    >
                      Claim Reference no.
                    </label>
                    <input
                      type="text"
                      id="claimReferenceNumber"
                      name="claimReferenceNumber"
                      defaultValue="20257"
                      required
                      readOnly
                      className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className="px-10 py-1.5 bg-black text-[#F8EC4D] text-base rounded-full hover:bg-gray-800 transition-colors font-bold"
                >
                  {getTranslatedText("Submit", "Enviar")}
                </button>
              </div>
            </form>
            <div className="mt-4 bg-white p-3 rounded-lg">
              <p className="font-medium text-red-500 mb-1">{getTranslatedText("Note:", "Nota:")}</p>
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
        </div>
      )}

      <nav className="bg-white mb-1">
        <div className="container mx-auto px-4 py-1" style={{ zIndex: 12 }}>
          <div className="flex flex-col sm:flex-row items-center justify-between">
            {/* Left Section: Logo and Navigation Links */}
            <div className="flex items-center gap-8">
              <img src="/aon-logo.svg" alt="Aon" className="h-12" />
              <div className="hidden sm:flex gap-8 text-xl font-semibold text-black">
                <a href="https://voicebot.everailabs.com/demo/riskmanagement/aon" className="hover:underline">
                  Capabilities
                </a>
                <a href="https://voicebot.everailabs.com/demo/riskmanagement/aon" className="hover:underline">
                  Industries
                </a>
                <a href="https://voicebot.everailabs.com/demo/riskmanagement/aon" className="hover:underline">
                  Insights
                </a>
                <a href="https://voicebot.everailabs.com/demo/riskmanagement/aon" className="hover:underline">
                  About
                </a>
              </div>
            </div>

            {/* Right Section: Careers and Investors */}
            <div className="hidden sm:flex gap-8 text-xl font-semibold">
              <a
                href="https://voicebot.everailabs.com/demo/riskmanagement/aon"
                className="text-gray-500 hover:underline"
              >
                Careers
              </a>
              <a
                href="https://voicebot.everailabs.com/demo/riskmanagement/aon"
                className="text-gray-500 hover:underline"
              >
                Investors
              </a>
              <a
                href="https://voicebot.everailabs.com/demo/riskmanagement/aon"
                className="text-gray-500 hover:underline"
              >
                News
              </a>
            </div>

            {/* Mobile Menu */}
            <div className="sm:hidden flex flex-col items-center mt-4">
              <div className="flex gap-4 text-sm font-semibold text-black mb-2">
                <a href="https://voicebot.everailabs.com/demo/riskmanagement/aon" className="hover:underline">
                  Capabilities
                </a>
                <a href="https://voicebot.everailabs.com/demo/riskmanagement/aon" className="hover:underline">
                  Industries
                </a>
                <a href="https://voicebot.everailabs.com/demo/riskmanagement/aon" className="hover:underline">
                  Insights
                </a>
                <a href="https://voicebot.everailabs.com/demo/riskmanagement/aon" className="hover:underline">
                  About
                </a>
              </div>
              <div className="flex gap-4 text-sm font-semibold">
                <a
                  href="https://voicebot.everailabs.com/demo/riskmanagement/aon"
                  className="text-gray-500 hover:underline"
                >
                  Careers
                </a>
                <a
                  href="https://voicebot.everailabs.com/demo/riskmanagement/aon"
                  className="text-gray-500 hover:underline"
                >
                  Investors
                </a>
                <a
                  href="https://voicebot.everailabs.com/demo/riskmanagement/aon"
                  className="text-gray-500 hover:underline"
                >
                  News
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto relative w-full">
        <div className="flex flex-col md:flex-row items-stretch gap-0 w-full relative">
          {/* Left Side */}
          <div className="w-full md:w-1/2 flex flex-col md:flex-row items-stretch relative">
            {/* Transparent Background */}
            <div className="absolute top-0 left-0 w-full h-full bg-gray-100 opacity-60 z-0"></div>

            {/* Stacked Rectangles */}
            <div className="flex-1 bg-[#F2F8F9] flex items-center justify-center text-white text-3xl font-medium bg-opacity-70 p-1"></div>
            <div className="flex">
              {/* First Rectangle */}
              <div className="flex-1 bg-[#B5D7DC] flex items-center justify-start text-white text-3xl font-bold pt-12 pr-12 pd-12">
                <div className="flex flex-col items-start">
                  <span className="text-left hidden md:block">Better</span>
                  <span className="mt-2 ml-12 text-left hidden md:block">Informed</span>
                </div>
              </div>

              {/* Second Rectangle */}
              <div className="flex-1 bg-[#BEC5C9] flex items-center justify-start text-white text-3xl font-bold pt-12 pr-12 pd-12">
                <div className="flex flex-col items-start" style={{ marginTop: "calc(7rem + 1rem)" }}>
                  <span className="text-left hidden md:block">Better</span>
                  <span className="mt-2 ml-12 text-left hidden md:block">Advised</span>
                </div>
              </div>

              {/* Third Rectangle */}
              <div className="flex-1 bg-[#F2BBBC] flex items-center justify-start text-white text-3xl font-bold pt-12 pr-12 pd-12">
                <div className="flex flex-col items-start" style={{ marginTop: "calc(15rem + 2rem)" }}>
                  <span className="text-left hidden md:block">Better</span>
                  <span className="mt-2 ml-12 text-left hidden md:block">Decisions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="w-full md:w-1/2 relative">
            <img
              src="/AON_left_hero.png"
              alt="Aon office collage"
              className="w-full h-full object-cover rounded-sm shadow-lg"
            />
          </div>
        </div>

        {/* Overlay Text */}
        <div className="absolute top-4 left-4 md:left-10 z-10 flex items-start gap-4 w-full">
          {/* Vertical Red Line */}
          <div className="w-2 h-[100px] bg-red-500"></div>

          {/* Text Content */}
          <div className="text-black text-lg md:text-4xl font-bold whitespace-pre-line">
            At Aon, we exist to shape decisions for the better — to
            <br />
            protect and enrich the lives of people around the world.
          </div>
        </div>
      </div>

      <div className="bg-white px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-space-between gap-12 sm:gap-20 px-4">
          {/* User Details Table */}
          {userDetails && (
            <div className="overflow-hidden rounded-lg w-full sm:w-1/2 p-6">
              <table className="table-auto w-full text-left border border-gray-300 text-sm text-gray-700">
                <tbody>
                  <tr className="bg-[#262836] text-white">
                    <td className="px-4 py-2 font-medium border-r border-gray-300">Member Name</td>
                    <td className="px-4 py-2">{userDetails.name || "N/A"}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2 font-medium border-r border-gray-300">Email ID</td>
                    <td className="px-4 py-2">{userDetails.email || "N/A"}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2 font-medium border-r border-gray-300">Address</td>
                    <td className="px-4 py-2">{userDetails.address || "N/A"}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2 font-medium border-r border-gray-300">Zip Code</td>
                    <td className="px-4 py-2">{userDetails.zipCode || "N/A"}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2 font-medium border-r border-gray-300">Booking Id</td>
                    <td className="px-4 py-2">{userDetails.bookingId || "N/A"}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2 font-medium border-r border-gray-300">Claim Reference Number</td>
                    <td className="px-4 py-2">{userDetails.claimReferenceNumber || "N/A"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Buttons Section */}
          <div className="flex flex-col sm:flex-row justify-center gap-18 sm:gap-16 mt-8">
            {/* Button 1 */}
            <button onClick={toggleConversation} className="flex flex-col items-center group md:mr-16">
              <div
                className={`p-8 md:p-12 border-8 border-black rounded-full transition-all duration-300 group-hover:border-transparent ${
                  callStatus === "active" ? "bg-red-500" : "bg-transparent group-hover:bg-red-500"
                }`}
              >
                <Mic
                  className={`w-12 h-12 md:w-16 md:h-16 ${
                    callStatus === "active" ? "text-white" : "text-[#EB0017] group-hover:text-white"
                  }`}
                />
              </div>
              <span
                className={`mt-4 text-2xl md:text-3xl font-bold ${
                  callStatus === "active"
                    ? "text-white group-hover:text-white"
                    : "text-[#EB0017] group-hover:text-[#EB0017]"
                }`}
              >
                {callStatus === "active" ? "Click to Disconnect" : "Let's Talk"}
              </span>
            </button>

            {/* Button 2 */}
            <button
              onClick={() => (window as any).voiceflow?.chat?.open()}
              className="flex flex-col items-center group"
            >
              <div className="p-8 md:p-12 border-8 border-black rounded-full transition-all duration-300 group-hover:border-transparent group-hover:bg-red-500">
                <MessageCircle className="w-12 h-12 md:w-16 md:h-16 text-[#EB0017] group-hover:text-white" />
              </div>
              <span className="mt-4 text-2xl md:text-3xl font-bold text-[#EB0017] group-hover:text-[#EB0017]">
                Let's Chat
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#262836] py-5 text-white">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
          {/* Left Section */}
          <div className="flex flex-col items-start gap-4">
            <img src="/aon-logo.svg" alt="Aon" className="h-8" />
            <p className="text-white" style={{ fontStyle: "italic" }}>
              Aon is in the Business of Better Decisions
            </p>
          </div>

          {/* Right Section */}
          <div className="flex flex-col gap-8 md:flex-row md:gap-32">
            {/* First Column */}
            <div className="flex flex-col gap-3">
              <h3 className="text-gray-400">About Aon</h3>
              <ul className="space-y-1">
                <li className="text-white">Our Story</li>
                <li className="text-white">Careers</li>
                <li className="text-white">Investors</li>
                <li className="text-white">News</li>
              </ul>
            </div>

            {/* Second Column */}
            <div className="flex flex-col gap-3">
              <h3 className="text-gray-400">Explore</h3>
              <ul className="space-y-1">
                <li className="text-white">Capabilities</li>
                <li className="text-white">Industries</li>
                <li className="text-white">Insights</li>
              </ul>
            </div>

            {/* Third Column */}
            <div className="flex flex-col gap-3">
              <h3 className="text-gray-400">Learn</h3>
              <ul className="space-y-1">
                <li className="text-white">Trade</li>
                <li className="text-white">Technology</li>
                <li className="text-white">Weather</li>
                <li className="text-white">Workforce</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}

