import "./App.css";
import { useEffect, useState } from 'react'
import { Mic, MessageCircle, QrCode, User } from 'lucide-react'
import { RetellWebClient } from "retell-client-js-sdk"

interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}

interface UserDetails {
  name: string
  phone: string
  email: string
  confirmationCode: string
}

const webClient = new RetellWebClient()

const notes = [
  "The platform is not integrated into the company systems, therefore asking for specific details for authentication and verification",
  <span>Please enter the name that the Virtual Assistant want to address you as.</span>,
  "Upon authentication request by Virtual Assistant please mention confirmation code # and full name as shown on the top right side of the bar for reference upon this form submission.",
  "Phone# and Email id is required to send instant messages and confirmation"
]

export default function Component() {
  const [showVerificationForm, setShowVerificationForm] = useState(true)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    phone: '',
    email: '',
    confirmationCode: ''
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

    return () => {
      webClient.off("conversationStarted")
      webClient.off("conversationEnded")
      webClient.off("error")
      webClient.off("update")
    }
  }, [])

  const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setUserDetails({
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      confirmationCode: formData.get('confirmationCode') as string
    })
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
    const agentId = "agent_7c443079f65a33b75f9275f5a1"
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
    const sampleRate = parseInt(process.env.REACT_APP_RETELL_SAMPLE_RATE || "16000", 10)

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
            member_name: userDetails.name,
            phone: userDetails.phone,
            email: userDetails.email,
            confirmation_code: userDetails.confirmationCode            
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

  return (
    <div className="min-h-screen bg-white">
      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#F8EC4D] rounded-[40px] p-8 max-w-2xl w-full mx-4 border-2 border-black shadow-lg">
            <h2 className="text-2xl font-medium text-black mb-8">
              Customer details required for verification and authentication
            </h2>
            <form onSubmit={handleSubmitDetails} className="space-y-6">
              <div className="grid gap-6 max-w-lg mx-auto">
                <div className="grid gap-6">
                  <div className="flex items-center">
                    <label htmlFor="name" className="w-48 text-black text-lg text-right pr-4">
                      Enter full name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      defaultValue="Kevin Grant"
                      required
                      className="flex-1 p-2 rounded bg-white text-black border border-gray-300 font-bold"
                    />
                  </div>
                  <div className="flex items-center">
                    <label htmlFor="phone" className="w-48 text-black text-lg text-right pr-4">
                      Phone #
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      defaultValue="6502937925"
                      required
                      className="flex-1 p-2 rounded bg-white text-black border border-gray-300 font-bold"
                    />
                  </div>
                  <div className="flex items-center">
                    <label htmlFor="email" className="w-48 text-black text-lg text-right pr-4">
                      Email id
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      defaultValue="Kevingrant@gmail.com"
                      required
                      className="flex-1 p-2 rounded bg-white text-black border border-gray-300 font-bold"
                    />
                  </div>
                  <div className="flex items-center">
                    <label htmlFor="confirmationCode" className="w-48 text-black text-lg text-right pr-4">
                      Confirmation Code#
                    </label>
                    <input
                      type="text"
                      id="confirmationCode"
                      name="confirmationCode"
                      defaultValue="XIIMM"
                      readOnly
                      className="flex-1 p-2 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-8">
                <button
                  type="submit"
                  className="px-12 py-2 bg-black text-[#F8EC4D] text-lg rounded-full hover:bg-gray-800 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
            <div className="mt-6 bg-white p-4 rounded-lg">
              <p className="font-medium text-red-500 mb-2">Note:</p>
              <ul className="space-y-2 text-black text-[15px]">
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

      <nav className="bg-[#F8EC4D]">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <img src="/spirit-logo.svg" alt="Spirit" className="h-8" />
            {userDetails.name && (
              <div className="flex items-center gap-4 text-sm text-black">
                <User className="w-5 h-5" />
                <span className="font-bold">{userDetails.name}</span>
                <span className="font-bold">PNR# {userDetails.confirmationCode}</span>
                <span className="font-bold">Email id: {userDetails.email}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="relative w-full">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-2/3 h-[400px] relative">
            <img
              src="/Picture1.png"
              alt="Spirit Airlines beach scene"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-full md:w-1/3 bg-white p-12 flex items-center">
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">ABOUT SPIRIT</h2>
              <p className="text-lg text-gray-600 mb-4">
                We are dedicated to pairing great value with excellent service while
                re-imagining the airline experience.
              </p>
              <p className="text-lg text-gray-600">
                We make it possible for our Guests to venture further, travel often and
                discover more than ever before. We believe it should be easy to take off
                and Go have some fun.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white pt-10 px-4"> {/* Updated padding */}
        <div className="flex justify-center gap-24"> {/* Updated gap */}
          <button
            onClick={toggleConversation}
            className="flex flex-col items-center group"
          >
            <div className={`p-12 bg-black rounded-full transition-all duration-300 group-hover:scale-105 ${
              callStatus === "active" ? "ring-4 ring-[#ffdc00] animate-pulse" : ""
            }`}>
              <Mic className={`w-16 h-16 text-[#F8EC4D] ${
                callStatus === "active" ? "animate-bounce" : ""
              }`} />
            </div>
            <span className="mt-4 text-xl font-medium">Let's Talk</span>
          </button>

          <button className="flex flex-col items-center group">
            <div className="p-12 bg-black rounded-full transition-all duration-300 group-hover:scale-105">
              <MessageCircle className="w-16 h-16 text-[#F8EC4D]" />
            </div>
            <span className="mt-4 text-xl font-medium">Let's Chat</span>
          </button>

          <button className="flex flex-col items-center group">
            <div className="p-12 bg-black rounded-full transition-all duration-300 group-hover:scale-105">
              <QrCode className="w-16 h-16 text-[#F8EC4D]" />
            </div>
            <span className="mt-4 text-xl font-medium">Scan to WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  )
}