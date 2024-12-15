
import React, { useEffect, useState } from 'react'
import "./App.css";
import { Mic, MessageCircle, User } from 'lucide-react'
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
  language: string
}

const webClient = new RetellWebClient()

const notes = [
  "The platform is not integrated into the company systems, therefore asking for specific details for authentication and verification",
  <span>Please enter the name that the Virtual Assistant want to address you as.</span>,
  "Upon authentication request by Virtual Assistant please mention confirmation code # and full name as shown on the top right side of the bar for reference upon this form submission.",
  "Phone# and Email id is required to send instant messages and confirmation"
]

export default function AONDemo() {
  // Keep all the existing state and handlers
  const [showVerificationForm, setShowVerificationForm] = useState(true)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    phone: '',
    email: '',
    confirmationCode: '',
    language: 'English'
  })
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [callInProgress, setCallInProgress] = useState(false)

  // Keep all existing useEffect and handlers

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

    const script = document.createElement('script')
    const projectId = "669833f4ca2c7886e6638f93";
    script.type = 'text/javascript'
    script.innerHTML = `
      (function(d, t) {
        var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
        v.onload = function() {
          window.voiceflow.chat.load({
            verify: { projectID: '${projectId}' },
            url: 'https://general-runtime.voiceflow.com',
            versionID: 'production'
          });
        }
        v.src = "https://cdn.voiceflow.com/widget/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
      })(document, 'script');
    `
    document.body.appendChild(script)

    return () => {
      webClient.off("conversationStarted")
      webClient.off("conversationEnded")
      webClient.off("error")
      webClient.off("update")
      document.body.removeChild(script)
    }
  }, [])

  // Keep all existing handlers
  const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setUserDetails({
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      confirmationCode: formData.get('confirmationCode') as string,
      language: formData.get('language') as string
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
    const agentId = userDetails.language === 'Spanish'
      ? "agent_b16bbe5e6fa810fae50bef4763"
      : "agent_7c443079f65a33b75f9275f5a1";
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
      const formattedConfirmationCode = userDetails.confirmationCode.split('').join(' - ');
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
            confirmation_code: formattedConfirmationCode,
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
    return userDetails.language === 'Spanish' ? spanishText : englishText;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="bg-white py-4 px-6 shadow-sm">
        <div className="flex justify-between items-center">
          <img src="/AON_logo.png" alt="AON" className="h-8" />
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <User className="w-5 h-5" />
            <span>Kevin Grant</span>
            <span>kevingrant@gmail.com</span>
            <span>1234 Elm Street Springfield</span>
            <span>62704</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex">
          {/* Left Content */}
          <div className="w-1/2 pr-8">
            <h1 className="text-2xl font-bold mb-4">ABOUT AON</h1>
            <div className="flex items-start">
              <div className="w-1 bg-red-600 h-12 mr-4"></div>
              <p className="text-gray-800">
                At Aon, we exist to shape decisions for the better — to protect and enrich the lives of people around the world.
              </p>
            </div>

            {/* Communication Options */}
            <div className="mt-20 grid grid-cols-2 gap-16">
              <div className="text-center">
                <button
                  onClick={toggleConversation}
                  className="mb-4 p-6 rounded-full bg-black hover:bg-gray-900 transition-all"
                >
                  <Mic className="w-12 h-12 text-white" />
                </button>
                <p className="text-lg font-medium">Let's Talk</p>
              </div>
              <div className="text-center">
                <button
                  onClick={() => (window as any).voiceflow?.chat?.open()}
                  className="mb-4 p-6 rounded-full bg-black hover:bg-gray-900 transition-all"
                >
                  <MessageCircle className="w-12 h-12 text-white" />
                </button>
                <p className="text-lg font-medium">Let's Chat</p>
              </div>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="w-1/2">
            <div className="relative">
              <img
                src="/aon-meeting.jpg"
                alt="AON Meeting"
                className="w-full rounded-lg"
              />
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-yellow-400"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Form Modal */}
      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl mx-auto">
            {/* Keep existing form content */}
          </div>
        </div>
      )}
    </div>
  )
}
