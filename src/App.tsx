import "./App.css";
import { useEffect, useState } from 'react'
import { Mic, Wifi, Tv, Globe, User } from 'lucide-react'
import { RetellWebClient } from "retell-client-js-sdk"

interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}

interface UserDetails {
  name: string
  accountNumber: string
  address: string
}

const webClient = new RetellWebClient()

const notes = [
  "The platform is not integrated into the company systems, therefore asking for specific detail for authentication and verification",
  <span>Please enter the name that you want the Virtual Assistant to address you as.</span>,
  "Upon authentication request by Virtual Assistant, please mention the account# and address.",
  "Personal details will be shown on the top right side of the bar for reference upon this form submission.",
  "Account# and Address fields are pre-filled and cannot be edited."
]

export default function Component() {
  const [showVerificationForm, setShowVerificationForm] = useState(true)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    accountNumber: '',
    address: ''
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
      accountNumber: formData.get('accountNumber') as string,
      address: formData.get('address') as string
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
    const agentId = "agent_a6075c48f5a298374c1c314357"
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
            account_number: userDetails.accountNumber,
            address: userDetails.address            
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#e68818] rounded-3xl p-4 sm:p-8 w-full max-w-[90%] sm:max-w-2xl max-h-[90vh] sm:max-h-none overflow-y-auto">
            <h2 className="text-2xl font-bold text-black mb-6">
              Customer details required for verification and authentication
            </h2>
            <form onSubmit={handleSubmitDetails} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,2fr] gap-2 sm:gap-4 items-center">
                <label htmlFor="name" className="text-white text-base sm:text-lg font-bold sm:text-right">
                  Enter Name<span className="text-black-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="p-2 rounded bg-[#fff2e3] text-black w-full font-bold"
                />
                <label htmlFor="accountNumber" className="text-white text-base sm:text-lg font-bold sm:text-right">
                  Account#
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  defaultValue="604299478"
                  readOnly
                  className="p-2 rounded bg-[#BFBFBF] text-gray-700 w-full font-bold"
                />
                <label htmlFor="address" className="text-white text-base sm:text-lg font-bold sm:text-right">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  defaultValue="64 Tanamerah 465534"
                  readOnly
                  className="p-2 rounded bg-[#BFBFBF] text-gray-700 w-full font-bold"
                />
              </div>
              <div className="flex justify-center mt-4 sm:mt-6">
                <button
                  type="submit"
                  className="px-6 sm:px-8 bg-[#703d01] text-white py-2 text-base sm:text-lg rounded-full hover:bg-[#bd6602] transition-colors font-bold"
                >
                  Submit
                </button>
              </div>
              <div className="mt-4 sm:mt-6 bg-[#fff2e3] p-3 sm:p-4 rounded-lg">
                <p className="font-bold mb-1 sm:mb-2 text-red-500 text-sm sm:text-base">Note:</p>
                <ul className="space-y-1 text-black text-xs sm:text-sm">
                  {notes.map((note, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#000000] mr-1 sm:mr-2">➤</span>
                      {index === 1 ? (
                        <>
                          <span className="text-red-500 mr-1 font-bold">*</span>
                          {note}
                        </>
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

      <nav className="bg-[#ffffff] mb-6">
        <div className="container mx-auto px-2 py-1">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <img src="/m1-logo.svg" alt="M1" className="h-12 mb-2 sm:mb-0" />
            {userDetails.name && (
              <div className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm text-black">
                <div className="flex items-center">
                  <User className="w-5 h-5 sm:w-7 sm:h-7 text-black mr-1" />
                  <span>{userDetails.name}</span>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start">
                  <span className="font-bold mr-1">Account#</span>
                  <span className="mr-2">{userDetails.accountNumber}</span>
                  <span className="font-bold mr-1">Address:</span>
                  <span>{userDetails.address}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="relative w-full">
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-1/2 flex items-center bg-white p-4 sm:p-8">
            <div className="w-full sm:pl-8 md:pl-24">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-6">about us</h1>
              <div className="w-16 h-1 bg-[#ff9e1b] mb-2 sm:mb-6"></div>
              <p className="text-base sm:text-lg text-gray-600">
                Singapore's most vibrant and dynamic communications company
              </p>
            </div>
          </div>
          <div className="w-full sm:w-1/2 h-[200px] sm:h-[400px]">
            <img
              src="About-Us.png"
              alt="M1 family"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="text-center">
            <button
              onClick={toggleConversation}
              className={`relative bg-[#ff9e1b] rounded-full p-6 sm:p-8 transition-all duration-300 hover:scale-105 ${
                callStatus === "active" ? "ring-4 ring-[#ff9e1b]/50 animate-pulse" : ""
              }`}
            >
              <Mic className={`w-8 h-8 sm:w-12 sm:h-12 text-white ${callStatus === "active" ? "animate-bounce" : ""}`} />
            </button>
            <p className={`mt-4 text-base sm:text-lg ${
              callStatus === "active" ? "text-red-500" : "text-[#ff9e1b]"
            }`}>
              {callStatus === "active"
                ? "Click the icon to disconnect the call"
                : "Click the icon to start the call"}
            </p>
          </div>

          <div className="p-4 border border-[#ff9e1b] rounded-lg flex flex-col items-center">
            <Wifi className="w-6 h-6 text-[#ff9e1b] mb-2" />
            <h3 className="text-lg font-semibold text-[#ff9e1b] mb-1">Connectivity</h3>
            <p className="text-gray-600 text-sm text-center">
              Extensive fibre and wireless infrastructure for quality mobile and fixed services
            </p>
          </div>
          <div className="p-4 border border-[#ff9e1b] rounded-lg flex flex-col items-center">
            <Tv className="w-6 h-6 text-[#ff9e1b] mb-2" />
            <h3 className="text-lg font-semibold text-[#ff9e1b] mb-1">Entertainment</h3>
            <p className="text-gray-600 text-sm text-center">Broad suite of premium content for diverse entertainment options</p>
          </div>
          <div className="p-4 border border-[#ff9e1b] rounded-lg flex flex-col items-center">
            <Globe className="w-6 h-6 text-[#ff9e1b] mb-2" />
            <h3 className="text-lg font-semibold text-[#ff9e1b] mb-1">Digital Solutions</h3>
            <p className="text-gray-600 text-sm text-center">Innovative digital services for businesses and consumers</p>
          </div>
        </div>
      </main>
    </div>
  )
}

