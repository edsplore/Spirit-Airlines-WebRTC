"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Mic, MessageCircle, Search, Menu, ShoppingCart, User, Diamond } from "lucide-react"
import { RetellWebClient } from "retell-client-js-sdk"

interface UserDetails {
  customer_name: string
  email: string
  account_pin: string
  order_number: string
  shipping_date: string
  estimated_delivery: string
  trade_in_value: string
  use_case: string
}

const webClient = new RetellWebClient()

const notes = [
  "The platform is not integrated into the company systems, therefore asking for specific details for authentication and verification",
  "Please enter the name that the Virtual Assistant want to address you as.",
  "Upon authentication request by Virtual Assistant please mention Account PIN and full name as shown on the top right side of the bar for reference upon this form submission.",
  "Email id is required to send instant messages and confirmation",
]

export default function GameStopDemo() {
  const [showVerificationForm, setShowVerificationForm] = useState(true)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    customer_name: "Alex Johnson",
    email: "alex.johnson@example.com",
    account_pin: "4729",
    order_number: "GS12345678",
    shipping_date: "March 30, 2025",
    estimated_delivery: "April 5, 2025",
    trade_in_value: "$85",
    use_case: "order_status_and_tradein_warranty",
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
                    customer_name: "${userDetails.customer_name}",
                    email: "${userDetails.email}",
                    account_pin: "${userDetails.account_pin}",
                    order_number: "${userDetails.order_number}",
                    shipping_date: "${userDetails.shipping_date}",
                    estimated_delivery: "${userDetails.estimated_delivery}",
                    trade_in_value: "${userDetails.trade_in_value}",
                    use_case: "${userDetails.use_case}"
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
      customer_name: formData.get("customer_name") as string,
      email: formData.get("email") as string,
      account_pin: formData.get("account_pin") as string,
      order_number: formData.get("order_number") as string,
      shipping_date: formData.get("shipping_date") as string,
      estimated_delivery: formData.get("estimated_delivery") as string,
      trade_in_value: formData.get("trade_in_value") as string,
      use_case: "order_status_and_tradein_warranty",
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
                    customer_name: "${newUserDetails.customer_name}",
                    email: "${newUserDetails.email}",
                    account_pin: "${newUserDetails.account_pin}",
                    order_number: "${newUserDetails.order_number}",
                    shipping_date: "${newUserDetails.shipping_date}",
                    estimated_delivery: "${newUserDetails.estimated_delivery}",
                    trade_in_value: "${newUserDetails.trade_in_value}",
                    use_case: "${newUserDetails.use_case}"
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
    const agentId = "agent_0d67c1b83f9d20793fa8e1bc58"
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

    const apiKey = "key_df318c25639cd8361eed44aff7cb"
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
            customer_name: userDetails.customer_name,
            email: userDetails.email,
            account_pin: userDetails.account_pin,
            order_number: userDetails.order_number,
            shipping_date: userDetails.shipping_date,
            estimated_delivery: userDetails.estimated_delivery,
            trade_in_value: userDetails.trade_in_value,
            use_case: userDetails.use_case,
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
    <div className="min-h-screen bg-black text-white">
      {showVerificationForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-lg mx-auto shadow-xl">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold text-black mb-2">GameStop</h1>
              <h2 className="text-lg font-semibold text-black">Customer Verification Required</h2>
            </div>
            <form onSubmit={handleSubmitDetails} className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center">
                  <label htmlFor="customer_name" className="w-32 text-black text-sm font-medium text-right pr-3">
                    Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    defaultValue="Alex Johnson"
                    required
                    className="flex-1 p-2 rounded border border-gray-300 text-black font-medium text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <label htmlFor="email" className="w-32 text-black text-sm font-medium text-right pr-3">
                    Email<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue="alex.johnson@example.com"
                    required
                    className="flex-1 p-2 rounded border border-gray-300 text-black font-medium text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <label htmlFor="account_pin" className="w-32 text-black text-sm font-medium text-right pr-3">
                    Account PIN
                  </label>
                  <input
                    type="text"
                    id="account_pin"
                    name="account_pin"
                    defaultValue="4729"
                    readOnly
                    className="flex-1 p-2 rounded bg-gray-100 border border-gray-300 text-black font-medium text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <label htmlFor="order_number" className="w-32 text-black text-sm font-medium text-right pr-3">
                    Order Number
                  </label>
                  <input
                    type="text"
                    id="order_number"
                    name="order_number"
                    defaultValue="GS12345678"
                    readOnly
                    className="flex-1 p-2 rounded bg-gray-100 border border-gray-300 text-black font-medium text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <label htmlFor="shipping_date" className="w-32 text-black text-sm font-medium text-right pr-3">
                    Shipping Date
                  </label>
                  <input
                    type="text"
                    id="shipping_date"
                    name="shipping_date"
                    defaultValue="March 30, 2025"
                    readOnly
                    className="flex-1 p-2 rounded bg-gray-100 border border-gray-300 text-black font-medium text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <label htmlFor="estimated_delivery" className="w-32 text-black text-sm font-medium text-right pr-3">
                    Est. Delivery
                  </label>
                  <input
                    type="text"
                    id="estimated_delivery"
                    name="estimated_delivery"
                    defaultValue="April 5, 2025"
                    readOnly
                    className="flex-1 p-2 rounded bg-gray-100 border border-gray-300 text-black font-medium text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <label htmlFor="trade_in_value" className="w-32 text-black text-sm font-medium text-right pr-3">
                    Trade-in Value
                  </label>
                  <input
                    type="text"
                    id="trade_in_value"
                    name="trade_in_value"
                    defaultValue="$85"
                    readOnly
                    className="flex-1 p-2 rounded bg-gray-100 border border-gray-300 text-black font-medium text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-center mt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white text-base rounded hover:bg-red-700 transition-colors font-bold"
                >
                  Submit
                </button>
              </div>
              <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-red-600 mb-1 text-sm">Important Notes:</p>
                <ul className="space-y-1 text-black text-xs">
                  {notes.map((note, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-red-600">•</span>
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
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white text-black">
        <div className="container mx-auto px-4">
          {/* Top Navigation */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-4">
              <Menu className="w-6 h-6 md:hidden" />
              <div className="text-2xl font-bold">GameStop</div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="flex w-full">
                <input
                  type="text"
                  placeholder="Search games, consoles & more"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button className="px-4 py-2 bg-red-600 text-white rounded-r-md hover:bg-red-700 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6">
                <div className="flex flex-col items-center text-center">
                  <ShoppingCart className="w-5 h-5 rotate-180" />
                  <div className="text-xs">Trade-In</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Diamond className="w-5 h-5" />
                  <div className="text-xs">GameStop Pro</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <User className="w-5 h-5" />
                  <div className="text-xs">Sign In</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <ShoppingCart className="w-5 h-5" />
                  <div className="text-xs">Cart</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Menu - Centered */}
          <nav className="hidden md:flex items-center justify-center gap-8 py-2 border-t border-gray-200">
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="hover:text-red-600">
              Trading Cards
            </a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="hover:text-red-600">
              Deals
            </a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="hover:text-red-600">
              Shop My Store
            </a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="hover:text-red-600">
              Collectibles & More
            </a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="hover:text-red-600">
              PlayStation
            </a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="hover:text-red-600">
              Nintendo Switch
            </a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="hover:text-red-600">
              Xbox
            </a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="hover:text-red-600">
              Pre-Owned
            </a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="hover:text-red-600">
              Only At GameStop
            </a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="hover:text-red-600">
              New Releases
            </a>
          </nav>
        </div>

        {/* Promotional Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-orange-500 text-white text-center py-2">
          <p className="font-medium">Pros, Save $25 When You Spend $250</p>
          <p className="text-sm">In-Store Or Online & Pick Up In-Store*</p>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="relative h-96 bg-gradient-to-r from-black via-gray-900 to-black overflow-hidden">
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
            <div className="max-w-2xl">
              <div className="bg-pink-600 text-white px-4 py-1 rounded-full inline-block mb-4 text-sm font-bold">
                ♦ PROS GET 5% EXTRA OFF + 5% EXTRA TRADE CREDIT*
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Buy & Sell Your Graded
                <br />
                Cards At GameStop!
              </h1>
              <button className="bg-transparent border-2 border-white text-white px-6 py-3 rounded hover:bg-white hover:text-black transition-colors font-medium">
                Buy & Sell Graded Cards Now
              </button>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-30">
            <div className="grid grid-cols-4 gap-2 h-full p-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons Section - More Prominent */}
        <div className="bg-gray-900 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Need Help with Your Order?</h2>
              <p className="text-xl text-gray-300">Get instant support through voice or chat</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-16">
              {/* Voice Call Button */}
              <div className="text-center">
                <button onClick={toggleConversation} className="flex flex-col items-center group">
                  <div
                    className={`p-16 border-6 border-red-600 rounded-full transition-all duration-300 shadow-2xl ${
                      callStatus === "active"
                        ? "bg-red-600 shadow-red-600/50"
                        : "bg-transparent group-hover:bg-red-600 group-hover:shadow-red-600/50"
                    }`}
                  >
                    <Mic
                      className={`w-20 h-20 ${
                        callStatus === "active" ? "text-white" : "text-red-600 group-hover:text-white"
                      }`}
                    />
                  </div>
                  <span className="mt-6 text-3xl font-bold text-red-600 group-hover:text-red-400">
                    {callStatus === "active" ? "Click to Disconnect" : "Let's Talk"}
                  </span>
                  <p className="mt-2 text-gray-400 text-lg">Speak with our AI assistant</p>
                </button>
              </div>

              {/* Chat Button */}
              <div className="text-center">
                <button
                  onClick={() => (window as any).voiceflow?.chat?.open()}
                  className="flex flex-col items-center group"
                >
                  <div className="p-16 border-6 border-red-600 rounded-full transition-all duration-300 group-hover:bg-red-600 group-hover:shadow-red-600/50 shadow-2xl">
                    <MessageCircle className="w-20 h-20 text-red-600 group-hover:text-white" />
                  </div>
                  <span className="mt-6 text-3xl font-bold text-red-600 group-hover:text-red-400">Let's Chat</span>
                  <p className="mt-2 text-gray-400 text-lg">Chat with our AI assistant</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}
