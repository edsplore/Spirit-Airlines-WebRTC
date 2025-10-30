"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { RetellWebClient } from "retell-client-js-sdk"

interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}

interface Member {
  member_name: string
  address: string
  entry_instructions: string
  gift_card: string
  city: string
  residence_type: string
  member_availability: string
  zip_code: string
  callback_datetime: string
  state: string
  dob: string
  phone_number: string
  visit_date: string
}

const getNextDateFormatted = (): string => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const day = tomorrow.getDate()
  const month = tomorrow.toLocaleString("default", { month: "long" })
  const year = tomorrow.getFullYear()

  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th"

  return `${day}${suffix} ${month} ${year}`
}

const nextVisitDate = getNextDateFormatted()

const members: Member[] = [
  {
    member_name: "Mike Blood",
    address: "543 Montgomery Boulevard NE Albuquerque NM 87109",
    entry_instructions: "No",
    gift_card: "Yes - Visa gift card $100",
    city: "Albuquerque",
    residence_type: "Residential",
    member_availability: "Yes",
    zip_code: "87109",
    callback_datetime: "N/A",
    state: "NM",
    dob: "March 10th 1985",
    phone_number: "4051231234",
    visit_date: nextVisitDate,
  },
  {
    member_name: "Legna Garcia",
    address: "234 Western Avenue Apt 204 , Moore OK 73160",
    entry_instructions: "No",
    gift_card: "No",
    city: "Moore",
    residence_type: "Apartment complex",
    member_availability: "Yes",
    zip_code: "73160",
    callback_datetime: "N/A",
    state: "OK",
    dob: "July 22nd 1990",
    phone_number: "5051231234",
    visit_date: nextVisitDate,
  },
  {
    member_name: "Chris Bennett",
    address: "150 Montano Boulevard Apt 23 , Yukon OK 73131",
    entry_instructions: "Yes - Gate Code is 5431",
    gift_card: "Yes - Visa gift card $75",
    city: "Yukon",
    residence_type: "Gated community",
    member_availability: "No",
    zip_code: "73131",
    callback_datetime: "11/5/2025 - 2PM CST",
    state: "OK",
    dob: "November 5th 1988",
    phone_number: "4073214321",
    visit_date: nextVisitDate,
  },
  {
    member_name: "Derrick Barela",
    dob: "May 18th 1982",
    address: "2584 Sify Drive Dallas TX 75001",
    phone_number: "2033214321",
    visit_date: nextVisitDate,
    gift_card: "Yes - Visa gift card $50",
    member_availability: "Yes",
    callback_datetime: "N/A",
    residence_type: "Residential",
    entry_instructions: "No",
    city: "Dallas",
    state: "TX",
    zip_code: "75001",
  },
]


const webClient = new RetellWebClient()

const SignifyHealth: React.FC = () => {
  const [memberData, setMemberData] = useState<Member | null>(null)
  const [callStatus, setCallStatus] = useState<"not-started" | "active" | "inactive">("not-started")
  const [callInProgress, setCallInProgress] = useState(false)

  useEffect(() => {
    const randomMember = members[Math.floor(Math.random() * members.length)]
    setMemberData(randomMember)
  }, [])

  // useEffect(() => {
  //   if (!memberData) return

  //   const addChatbotScript = () => {
  //     const script = document.createElement("script")
  //     const projectId = "68ffc14027f31bb8c491da5c"
  //     script.type = "text/javascript"
  //     script.innerHTML = `
  //       (function(d, t) {
  //         var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
  //         v.onload = function() {
  //           window.voiceflow.chat.load({
  //             verify: { projectID: '${projectId}' },
  //             url: 'https://general-runtime.voiceflow.com',
  //             versionID: 'production',
  //             voice: {
  //               url: "https://runtime-api.voiceflow.com"
  //             },
  //             launch: {
  //               event: {
  //                 type: "launch",
  //                 payload: {
  //                   member_name: "${memberData.member_name}",
  //                   address: "${memberData.address}",
  //                   entry_instructions: "${memberData.entry_instructions}",
  //                   gift_card: "${memberData.gift_card}",
  //                   city: "${memberData.city}",
  //                   residence_type: "${memberData.residence_type}",
  //                   member_availability: "${memberData.member_availability}",
  //                   zip_code: "${memberData.zip_code}",
  //                   callback_datetime: "${memberData.callback_datetime}",
  //                   state: "${memberData.state}",
  //                   dob: "${memberData.dob}",
  //                   phone_number: "${memberData.phone_number}",
  //                   visit_date: "${memberData.visit_date}"
  //                 }
  //               }
  //             }
  //           });
  //         }
  //         v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs"; 
  //         v.type = "text/javascript"; 
  //         s.parentNode.insertBefore(v, s);
  //       })(document, 'script');
  //     `
  //     document.body.appendChild(script)
  //   }

  //   addChatbotScript()

  //   return () => {
  //     if (window.voiceflow && window.voiceflow.chat) {
  //       window.voiceflow.chat.destroy()
  //     }
  //   }
  // }, [memberData])


  // Retell WebClient events
  useEffect(() => {
    webClient.on("conversationStarted", () => {
      console.log("Conversation started successfully")
      setCallStatus("active")
      setCallInProgress(false)
    })

    webClient.on("conversationEnded", () => {
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

  const toggleConversation = async () => {
    if (callInProgress || !memberData) return
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
    if (!memberData) return

    const agentId = "agent_ca8d65583f200a6b247a57e535"
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
      console.error("Error starting call:", error)
    }
  }

  async function registerCall(agentId: string): Promise<RegisterCallResponse> {
    if (!memberData) throw new Error("No member data available")

    const apiKey = "key_362d4c0a30f22f6906345dcc5521"
    const sampleRate = 16000

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
            member_name: memberData.member_name,
            address: memberData.address,
            entry_instructions: memberData.entry_instructions,
            gift_card: memberData.gift_card,
            city: memberData.city,
            residence_type: memberData.residence_type,
            member_availability: memberData.member_availability,
            zip_code: memberData.zip_code,
            callback_datetime: memberData.callback_datetime,
            state: memberData.state,
            dob: memberData.dob,
            phone_number: memberData.phone_number,
            visit_date: memberData.visit_date,
          },
        }),
      })

      if (!response.ok) throw new Error(`Error: ${response.status}`)
      const data = await response.json()

      console.log("Full LLM Response from Retell:", data)

      return {
        access_token: data.access_token,
        callId: data.call_id,
        sampleRate,
      }
    } catch (err) {
      console.error("Error registering call:", err)
      throw err
    }
  }

  const handleChatClick = () => {
    if (window.voiceflow && window.voiceflow.chat) {
      window.voiceflow.chat.open()
    }
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading member data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <section className="w-full">
        <img
          src="/signifyhealth/header.png"
          alt="SignifyHealth site header"
          className="block w-full h-[clamp(300px,28vw,440px)] object-cover object-[50%_65%]"
        />
      </section>

      {/* Main Content */}
     <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between px-4 py-8 gap-8">
  {/* Table */}
  <div className="w-full md:w-1/2"> {/* shifted slightly left */}
    <table
      className="table-fixed w-[580px] h-[220px] border border-gray-200 text-sm sm:text-base overflow-hidden -ml-20"
    >
      <thead className="bg-[#CADA63]">
        <tr>
          <th className="p-2 text-left text-black font-bold w-[40%]">
            Authentication Parameter
          </th>
          <th className="p-2 text-left text-black font-bold w-[60%]">
            Member Details
          </th>
        </tr>
      </thead>
      <tbody className="align-top">
        <tr className="border-b">
          <td className="p-2 text-[#295C94] font-semibold">Member Name</td>
          <td className="p-2 truncate">{memberData.member_name}</td>
        </tr>
        <tr className="border-b">
          <td className="p-2 text-[#295C94] font-semibold">DOB</td>
          <td className="p-2 truncate">{memberData.dob}</td>
        </tr>
        <tr className="border-b">
          <td className="p-2 text-[#295C94] font-semibold">Address</td>
          <td className="p-2 truncate">{memberData.address}</td>
        </tr>
        <tr className="border-b">
          <td className="p-2 text-[#295C94] font-semibold">Phone No.</td>
          <td className="p-2 truncate">{memberData.phone_number}</td>
        </tr>
        <tr className="border-b">
          <td className="p-2 text-[#295C94] font-semibold">Gift Card</td>
          <td className="p-2 truncate">{memberData.gift_card}</td>
        </tr>
        <tr>
          <td className="p-2 text-[#295C94] font-semibold">Visit Date</td>
          <td className="p-2 truncate">{memberData.visit_date}</td>
        </tr>
      </tbody>
    </table>
  </div>

        {/* Right Buttons */}
        <div className="w-full md:w-1/2 grid grid-cols-2 gap-6 justify-items-center ml-20">
          {/* MIC */}
          <div className="flex flex-col items-center cursor-pointer mt-10 ml-10" onClick={toggleConversation}>
            <div
              className={`relative rounded-full shadow-lg p-7 bg-white transition-transform duration-300 hover:scale-105 ${
                callStatus === "active" ? "animate-pulse ring-4 ring-red-400 ring-offset-4 ring-offset-white" : ""
              }`}
            >
              {callInProgress && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                  <div className="w-6 h-6 border-4 border-[#295C94] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src="/signifyhealth/mic.png"
                alt="Mic"
                className={`w-20 h-20 rounded-full object-contain ${callStatus === "active" ? "opacity-80" : ""}`}
              />
            </div>
            <p className={`mt-3 text-lg font-semibold ${callStatus === "active" ? "text-red-600" : "text-[#295C94]"}`}>
              {callStatus === "active"
                ? callInProgress
                  ? "Ending..."
                  : "End Call"
                : callInProgress
                  ? "Connecting..."
                  : "Start Call"}
            </p>
          </div>

          {/* CHAT */}
          {/* <div className="flex flex-col items-center cursor-pointer mt-10 ml-10" onClick={handleChatClick}>
            <div className="rounded-full shadow-lg p-6 bg-white hover:scale-105 transition-transform">
              <img src="/signifyhealth/chat.png" alt="Chatbot" className="w-20 h-20 rounded-full object-contain" />
            </div>
            <p className="mt-3 text-lg font-semibold text-[#295C94]">Click to Chat</p>
          </div> */}
        </div>
      </div>
    </div>
  )
}

export default SignifyHealth

// Extend Window interface for TypeScript
declare global {
  interface Window {
    voiceflow?: {
      chat?: {
        load: (config: any) => void
        open: () => void
        close: () => void
        destroy: () => void
      }
    }
  }
}
