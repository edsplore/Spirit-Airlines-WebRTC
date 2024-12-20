import React, { useEffect, useState } from 'react'
import "./App.css";
import { Mic, MessageCircle, User } from 'lucide-react'
import { RetellWebClient } from "retell-client-js-sdk"
import { addDays, format } from 'date-fns';

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

export default function SpiritAirlinesDemo() {
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
      const script = document.createElement('script')
      const projectId = "676471f9262abee922cce364";
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
                    phone: "${userDetails.phone}",
                    confirmation_code: "${userDetails.confirmationCode}",                  
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
      name: formData.get('name') as string,
      phone: `${formData.get('countryCode')}${formData.get('phone')}` as string,
      email: formData.get('email') as string,
      confirmationCode: formData.get('confirmationCode') as string,
      language: formData.get('language') as string
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
      const projectId = "676471f9262abee922cce364";
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
                    phone: "${newUserDetails.phone}",
                    confirmation_code: "${newUserDetails.confirmationCode}",                  
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
    ? "agent_076c8b8122e8d9d9cfe46100fb"
    : "agent_daa34732914c990996c9153ffc";
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
          borderLeft: '50px solid #00205B',
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
          borderRight: '50px solid #00205B',
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
          borderRight: '700px solid #00205B',
          borderLeft: '100px solid transparent',
          borderBottom: '4vw solid transparent',
          borderTop: '0 solid transparent',
          zIndex: 10,
        }}
      ></div>

      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#00205B] rounded-[40px] p-4 sm:p-6 w-full max-w-xl mx-auto border-2 border-black shadow-lg overflow-y-auto max-h-[90vh] sm:max-h-none">
            <h2 className="text-base sm:text-xl font-medium text-white mb-4 sm:mb-6">
              {getTranslatedText(
                "Customer details required for verification and authentication",
                "Detalles del cliente requeridos para verificación y autenticación"
              )}
            </h2>
            <form onSubmit={handleSubmitDetails} className="space-y-4">
              <div className="grid gap-4 max-w-lg mx-auto">
                <div className="grid gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label htmlFor="name" className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
                      {getTranslatedText("Enter full name", "Ingrese nombre completo")}<span className="text-red-500">*</span>
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
                    <label htmlFor="phone" className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
                      {getTranslatedText("Whatsapp Number", "Número de Whatsapp")}
                    </label>
                    <div className="flex-1 flex">
                      <select
                        id="countryCode"
                        name="countryCode"
                        className="p-1.5 rounded-l bg-white text-black border border-gray-300 border-r-0 font-bold text-sm"
                      >
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+91">+91</option>
                        <option value="+61">+61</option>  {/* Australia */}
                        <option value="+81">+81</option>  {/* Japan */}
                        <option value="+49">+49</option>  {/* Germany */}
                        <option value="+86">+86</option>  {/* China */}
                        <option value="+33">+33</option>  {/* France */}
                        <option value="+39">+39</option>  {/* Italy */}
                      </select>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        className="flex-1 p-1.5 rounded-r bg-white text-black border border-gray-300 font-bold text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label htmlFor="email" className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
                      {getTranslatedText("Email", "Correo electrónico")}
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
                    <label htmlFor="confirmationCode" className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
                      {getTranslatedText("Confirmation Code#", "Código de confirmación#")}
                    </label>
                    <input
                      type="text"
                      id="confirmationCode"
                      name="confirmationCode"
                      defaultValue="XIIMM"
                      readOnly
                      className="flex-1 p-1.5 rounded bg-[#D9D9D9] text-black border border-gray-300 font-bold text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label htmlFor="language" className="w-full sm:w-40 text-white text-sm sm:text-base mb-1 sm:mb-0 sm:text-right sm:pr-3">
                      {getTranslatedText("Language", "Idioma")}
                    </label>
                    <select
                      id="language"
                      name="language"
                      className="flex-1 p-1.5 rounded bg-white text-black border border-gray-300 font-bold text-sm"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Español</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className="px-10 py-1.5 bg-black text-white text-base rounded-full hover:bg-gray-800 transition-colors font-bold"
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

      <nav className="bg-[#00205B] mb-4">
        <div className="container mx-auto px-4 py-2" style={{zIndex: 12}}>
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <img src="/jetblue-logo.svg" alt="Spirit" className="h-8 mb-2 sm:mb-0" />
            {userDetails.name && (
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-white">
                <User className="w-5 h-5" />
                <span>{userDetails.name}</span>                
                <span className="font-bold">{getTranslatedText("Email id:", "Correo electrónico:")} </span>{userDetails.email}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="relative w-full">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-2/3 relative">
            <img
              src="/jetblue-hero.png"
              alt="Spirit Airlines beach scene"
              className="w-full h-auto md:h-[350px] object-contain md:object-cover"
            />
          </div>
          <div className="w-full md:w-1/3 bg-white pt-12 pl-8 pr-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 text-sm border border-gray-300">
                <div className="font-semibold bg-[#00205B] p-2 border-r border-b border-gray-300 text-white">Confirmation Code</div>
                <div className="bg-[#00205B] p-2 border-b border-gray-300 text-white">XIIMM</div>
                <div className="font-semibold p-2 border-r border-b border-gray-300">Flight from</div>
                <div className="p-2 border-b border-gray-300">Miami, FL (MIA)</div>
                <div className="font-semibold p-2 border-r border-b border-gray-300">Flight to</div>
                <div className="p-2 border-b border-gray-300">Las Vegas, NV (LAS)</div>
                <div className="font-semibold p-2 border-r border-b border-gray-300">Travel Date</div>
                <div className="p-2 border-b border-gray-300">{format(addDays(new Date(), 2), 'dd MMM yyyy')}</div>
                <div className="font-semibold p-2 border-r border-b border-gray-300">Flight#</div>
                <div className="p-2 border-b border-gray-300">NK 3168</div>
                <div className="font-semibold p-2 border-r border-b border-gray-300">Depart Time</div>
                <div className="p-2 border-b border-gray-300">10:00 AM</div>
                <div className="font-semibold p-2 border-r border-b border-gray-300">Arrival Time</div>
                <div className="p-2 border-b border-gray-300">4:00 PM</div>
                <div className="font-semibold p-2 border-r border-b border-gray-300"># of PAX</div>
                <div className="p-2">2</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-2 bg-white md:w-2/3">
        <p className="text-base md:text-lg text-gray-800 mb-2 font-semibold">
          Born at JFK in 2000, JetBlue is now a global, award-winning travel company.
        </p>
        <p className="text-sm md:text-base bg-[#00205B] inline-block px-3 py-1 font-semibold text-white">
          Get to know us and our commitment to customers and communities.
        </p>
      </div>

      <div className="bg-white pt-6 px-4">
        <div className="flex flex-col sm:flex-row justify-center gap-12 sm:gap-24">
          <button
            onClick={toggleConversation}
            className="flex flex-col items-center group"
          >
            <div className={`p-8 md:p-12 bg-black rounded-full transition-all duration-300 group-hover:scale-105 ${
              callStatus === "active" ? "ring-4 ring-[#ffdc00] animate-pulse" : ""
            }`}>
              <Mic className={`w-12 h-12 md:w-16 md:h-16 text-white ${
                callStatus === "active" ? "animate-bounce" : ""
              }`} />
            </div>
            <span className="mt-4 text-lg md:text-xl font-medium">
              {callStatus === "active" 
                ? <span className="text-brown-500">{getTranslatedText("Click to Disconnect", "Haga clic para desconectar")}</span>
                : getTranslatedText("Let's Talk", "Hablemos")
              }
            </span>
          </button>

          <button 
            onClick={() => (window as any).voiceflow?.chat?.open()}
            className="flex flex-col items-center group">
            <div className="p-8 md:p-12 bg-black rounded-full transition-all duration-300 group-hover:scale-105">
              <MessageCircle className="w-12 h-12 md:w-16 md:h-16 text-white" />
            </div>
            <span className="mt-4 text-lg md:text-xl font-medium">{getTranslatedText("Let's Chat", "Chateemos")}</span>
          </button>

          <button 
            onClick={() => window.open('https://wa.me/16508008958?text=Hi', '_blank')}
            className="flex flex-col items-center group">
            <div className="p-8 md:p-12 bg-black rounded-full transition-all duration-300 group-hover:scale-105">
              <img src="/whatsapp.png" alt="WhatsApp" className="w-14 h-14 md:w-16 md:h-16" />
            </div>
            <span className="mt-4 text-lg md:text-xl font-medium">{getTranslatedText("Scan to WhatsApp", "Escanear para WhatsApp")}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

