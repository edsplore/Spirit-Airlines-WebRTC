import "./App.css";
import { useEffect, useState } from 'react'
import { Mic, Wifi, Tv, Globe, User} from 'lucide-react'
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
    const agentId = "agent_cc5c2d67725bc20c61d6d70e4e"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#e68818] rounded-3xl p-8 max-w-3xl w-full mx-4">
            <h2 className="text-2xl font-bold text-black mb-6">
              Customer details required for verification and authentication
            </h2>
            <form onSubmit={handleSubmitDetails} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
                <div className="grid grid-cols-[auto,1fr] items-center">
                  <label htmlFor="name" className="w-32 text-white flex-shrink-0 text-lg font-bold">
                    Enter Name<span className="text-black-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="p-2 rounded bg-[#fff2e3] text-black w-full font-bold"
                  />
                </div>
                <div className="grid grid-cols-[auto,1fr] items-center">
                  <label htmlFor="accountNumber" className="w-32 text-white flex-shrink-0 text-lg font-bold">
                    Account#
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    defaultValue="1.15416371T"
                    readOnly
                    className="p-2 rounded bg-[#BFBFBF] text-gray-700 w-full font-bold"
                  />
                </div>
                <div className="grid grid-cols-[auto,1fr] items-center">
                  <label htmlFor="address" className="w-32 text-white flex-shrink-0 text-lg font-bold">
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
                <div className="flex justify-end pr-32">
                  <button
                    type="submit"
                    className="w-40 px-8 bg-[#703d01] text-white py-3 text-lg rounded-full hover:bg-[#bd6602] transition-colors font-bold"
                  >
                    Submit
                  </button>
                </div>
              </div>
              <div className="mt-6 bg-[#fff2e3] p-4 rounded-lg">
                <p className="font-bold mb-2 text-red-500">Note:</p>
                <ul className="space-y-2 text-black">
                  {notes.map((note, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#000000] mr-2">➤</span>
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

      <nav className="bg-[#ffffff]">
        <div className="container mx-auto px-2 py-1">
          <div className="flex items-center justify-between">
            <img src="/m1-logo.svg" alt="M1" className="h-12" />
            {userDetails.name && (
              <div className="flex items-center gap-1 text-sm text-black">
                <User className="w-7 h-7 text-black" />
                <span>{userDetails.name}</span>
                <span className="font-bold ml-4">Account#</span>{userDetails.accountNumber}
                <span className="font-bold ml-4">Address:</span>{userDetails.address}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="relative w-full h-[400px] flex">
        <div className="w-1/2 flex items-center">
          <div className="pl-24 pr-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">about us</h1>
            <div className="w-26 h-1 bg-[#ff9e1b] mb-6"></div>
            <p className="text-lg text-gray-600">
              Singapore's most vibrant and dynamic communications company
            </p>
          </div>
        </div>
        <div className="w-1/2">
          <img
            src="About-Us.png"
            alt="M1 family"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      <main className="container mx-auto px-6 pt-10">
        <div className="grid grid-cols-4 gap-8">
          <div className="text-center">
            <button
              onClick={toggleConversation}
              className={`relative bg-[#ff9e1b] rounded-full p-8 transition-all duration-300 hover:scale-105 ${
                callStatus === "active" ? "ring-4 ring-[#ff9e1b]/50 animate-pulse" : ""
              }`}
            >
              <Mic className={`w-12 h-12 text-white ${callStatus === "active" ? "animate-bounce" : ""}`} />
            </button>
            <p className={`mt-4 text-lg ${
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