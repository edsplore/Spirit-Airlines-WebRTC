import React, { useEffect, useState } from 'react'
import "./App.css";
import { Mic, MessageCircle, User, Mail, Home, MapPin } from 'lucide-react'
import { RetellWebClient } from "retell-client-js-sdk"

interface UserDetails {
  name: string
  email: string
  address: string
  zipCode: string
  language: string
}

const webClient = new RetellWebClient()

const notes = [
  "The platform is not integrated into the company systems, therefore asking for specific details for authentication and verification",
  "Please enter the name that the Virtual Assistant want to address you as.",
  "Upon authentication request by Virtual Assistant please mention Zip Code and full name as shown on the top right side of the bar for reference upon this form submission.",
  "Email id is required to send instant messages and confirmation"
]

export default function SpiritAirlinesDemo() {
  const [showVerificationForm, setShowVerificationForm] = useState(true)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    email: '',
    address: '1234 Elm Street Springfield',
    zipCode: '62704',
    language: 'English'
  })
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [callInProgress, setCallInProgress] = useState(false)

  useEffect(() => {
    // Add chatbot script
    const addChatbotScript = () => {
      const script = document.createElement('script')
      const projectId = "675e58a4bdfd5f757cea0976";
      script.type = 'text/javascript'
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
      return script;
    }

    const chatbotScript = addChatbotScript();

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
        window.voiceflow.chat.destroy();
      }
    }
  }, [])

  const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newUserDetails = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      zipCode: formData.get('zipCode') as string,
      language: 'English'
    }
    setUserDetails(newUserDetails)
    setShowVerificationForm(false)

    // Reload the chatbot script with new user details
    const existingScript = document.querySelector('script[src="https://cdn.voiceflow.com/widget/bundle.mjs"]');
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript);
    }
    const addChatbotScript = () => {
      const script = document.createElement('script')
      const projectId = "675e58a4bdfd5f757cea0976";
      script.type = 'text/javascript'
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
    addChatbotScript();
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
      ? "agent_c53c273bda8beda64317da5bc9"
      : "agent_c53c273bda8beda64317da5bc9";
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
            customer_name: userDetails.name,
            email: userDetails.email,
            address: userDetails.address,
            zip_code: userDetails.zipCode,
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

      <div
        className="absolute decorative-triangle"
        style={{
          bottom: 0,
          left: 0,
          width: 0,
          height: 0,
          borderLeft: '50px solid #EEF6F7',
          borderRight: '20px solid transparent',
          borderTop: '50vw solid transparent',
          borderBottom: '0 solid transparent',
          zIndex: 10,
        }}
      ></div>

      <div
        className="absolute decorative-triangle"
        style={{
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          borderRight: '50px solid #EEF6F7',
          borderLeft: '20px solid transparent',
          borderTop: '50vw solid transparent',
          borderBottom: '0 solid transparent',
          zIndex: 10,
        }}
      ></div>

      <div
        className="absolute decorative-triangle"
        style={{
          top: 63,
          right: 0,
          width: 0,
          height: 0,
          borderRight: '700px solid #EEF6F7',
          borderLeft: '100px solid transparent',
          borderBottom: '4vw solid transparent',
          borderTop: '0 solid transparent',
          zIndex: 10,
        }}
      ></div>

      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#EEF6F7] rounded-[40px] p-4 sm:p-6 w-full max-w-xl mx-auto border-2 border-black shadow-lg overflow-y-auto max-h-[90vh] sm:max-h-none">
            <h2 className="text-base sm:text-xl font-medium text-black mb-4 sm:mb-6">
              {getTranslatedText(
                "Customer details required for verification and authentication",
                "Detalles del cliente requeridos para verificación y autenticación"
              )}
            </h2>
            <form onSubmit={handleSubmitDetails} className="space-y-4">
              <div className="grid gap-4 max-w-lg mx-auto">
                <div className="grid gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label htmlFor="name" className="w-full sm:w-40 text-black text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
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
                    <label htmlFor="email" className="w-full sm:w-40 text-black text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
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
                    <label htmlFor="address" className="w-full sm:w-40 text-black text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
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
                    <label htmlFor="zipCode" className="w-full sm:w-40 text-black text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
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

      <nav className="bg-[#EEF6F7] mb-4">
        <div className="container mx-auto px-4 py-2" style={{ zIndex: 12 }}>
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <img src="/aon-logo.svg" alt="Aon" className="h-8 mb-2 sm:mb-0" />
            {userDetails.name && (
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-black">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span>{userDetails.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  <span>{userDetails.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  <span>{userDetails.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{userDetails.zipCode}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto pl-20">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/2">
            <h1 className="text-3xl font-bold mb-6">ABOUT AON</h1>
            <p className="text-lg mb-4">
              At Aon, we exist to shape decisions for the better — to protect and enrich the lives of people around the world.
            </p>
          </div>
          <div className="w-full md:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Aon office collage"
              className="w-full max-h-[50vh] object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-white pt-8 px-4">
        <div className="flex flex-col sm:flex-row justify-center gap-12 sm:gap-24">
          {/* Button 1 */}
          <button
            onClick={toggleConversation}
            className="flex flex-col items-center group"
          >
            <div
              className={`p-8 md:p-12 border-4 border-black rounded-full transition-all duration-300 group-hover:border-transparent ${callStatus === "active"
                  ? "bg-red-500 group-hover:bg-red-500"
                  : "bg-transparent group-hover:bg-red-500"
                }`}
            >
              <Mic
                className={`w-12 h-12 md:w-16 md:h-16 ${callStatus === "active"
                    ? "text-white group-hover:text-white"
                    : "text-[#EB0017] group-hover:text-white"
                  }`}
              />
            </div>
            <span
              className={`mt-4 text-lg md:text-xl font-medium text-[#EB0017] group-hover:text-[#EB0017]`}
            >
              {callStatus === "active" ? "Click to Disconnect" : "Let's Talk"}
            </span>
          </button>

          {/* Button 2 */}
          <button
            onClick={() => (window as any).voiceflow?.chat?.open()}
            className="flex flex-col items-center group"
          >
            <div className="p-8 md:p-12 border-4 border-black rounded-full transition-all duration-300 group-hover:border-transparent group-hover:bg-red-500">
              <MessageCircle className="w-12 h-12 md:w-16 md:h-16 text-[#EB0017] group-hover:text-white" />
            </div>
            <span className="mt-4 text-lg md:text-xl font-medium text-[#EB0017] group-hover:text-[#EB0017]">
              Let's Chat
            </span>
          </button>
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

