import "./App.css";
import { useState, useEffect } from 'react'
import { RetellWebClient } from "retell-client-js-sdk"
import { Search, Calendar, Plus, Car, Truck, Globe2, Award, Shield, Phone, Menu, X } from 'lucide-react'

interface RegisterCallResponse {
  access_token?: string
  callId?: string
  sampleRate: number
}

const webClient = new RetellWebClient()

// Custom Button component
const Button = ({ 
  children, 
  className = '', 
  variant = 'primary',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors duration-200"
  const variantStyles = {
    primary: "bg-[#FF6B00] text-white hover:bg-[#ff5c00] px-6 py-3",
    secondary: "bg-white/10 text-white hover:bg-white/20 px-4 py-2",
    tab: "text-gray-700 hover:text-black px-4 py-2"
  }

  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default function SixtHomepage() {
  const [activeTab, setActiveTab] = useState('cars')
  const [showReturnLocation, setShowReturnLocation] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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

    return () => {
      webClient.off("conversationStarted")
      webClient.off("conversationEnded")
      webClient.off("error")
    }
  }, [])

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
    const agentId = "agent_1b7405c4a5635a6de5bb8a2a48" // Replace with your actual Retell agent ID
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
    const apiKey = "53b76c26-bd21-4509-98d7-c5cc62f93b59" // Replace with your actual API key
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
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Top Banner */}
      <div className="bg-[#FF6B00] text-white text-center py-1 text-sm">
        112 years of SIXT. 112 years of tradition.
      </div>

      {/* Navigation */}
      <nav className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <img
                src="/sixt-logo.svg"
                alt="Sixt"
                className="h-8"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="text-white hover:text-[#FF6B00]">Rent</a>
              <a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="text-white hover:text-[#FF6B00]">Share</a>
              <a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="text-white hover:text-[#FF6B00]">Ride</a>
              <a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="text-white hover:text-[#FF6B00]">Subscribe</a>
              <a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="text-white hover:text-[#FF6B00]">Locations</a>
              <a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="text-white hover:text-[#FF6B00]">Deals</a>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-[#FF6B00]"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/90 border-t border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="block px-3 py-2 text-white hover:text-[#FF6B00]">Rent</a>
              <a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="block px-3 py-2 text-white hover:text-[#FF6B00]">Share</a>
              <a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="block px-3 py-2 text-white hover:text-[#FF6B00]">Ride</a>
              <a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="block px-3 py-2 text-white hover:text-[#FF6B00]">Subscribe</a>
              <a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="block px-3 py-2 text-white hover:text-[#FF6B00]">Locations</a>
              <a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="block px-3 py-2 text-white hover:text-[#FF6B00]">Deals</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen">
        <div className="absolute inset-0">
          <img
            src="/sixt-hero.webp"
            alt="Mercedes-Benz EQS"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Booking Form */}
        <div className="relative sm:pt-4 sm:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg p-6 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Rent the car</h2>

              {/* Tabs */}
              <div className="flex space-x-4 mb-6">
                <Button 
                  variant="tab"
                  className={`flex items-center ${activeTab === 'cars' ? 'border-b-2 border-[#FF6B00]' : ''}`}
                  onClick={() => setActiveTab('cars')}
                >
                  <Car className="w-5 h-5 mr-2" />
                  Cars
                </Button>
                <Button 
                  variant="tab"
                  className={`flex items-center ${activeTab === 'trucks' ? 'border-b-2 border-[#FF6B00]' : ''}`}
                  onClick={() => setActiveTab('trucks')}
                >
                  <Truck className="w-5 h-5 mr-2" />
                  Trucks
                </Button>
              </div>

              {/* Search Form */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pick-up & return</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Airport, city or address"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                  <button
                    onClick={() => setShowReturnLocation(!showReturnLocation)}
                    className="flex items-center text-[#FF6B00] text-sm mt-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Different return location
                  </button>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pick-up date</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Select date"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                    />
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return date</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Select date"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                    />
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                  <Button variant="primary" className="w-full">
                    <Search className="w-4 h-4 text-white" />                    
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Text */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#FF6B00] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-black mb-4">
              RENT FIRST CLASS.
              <br />
              PAY ECONOMY.
            </h1>
          </div>
        </div>

        {/* Retell WebRTC Call Button */}
        <div
          className={`fixed bottom-8 right-8 z-20 bg-white rounded-full p-4 w-16 h-16 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg ${
            callStatus === "active" ? "bg-green-500 ring-4 ring-green-300 ring-opacity-50 animate-pulse" : ""
          }`}
          onClick={toggleConversation}
        >
          <Phone className={`w-8 h-8 text-[#FF6B00] ${callStatus === "active" ? "animate-bounce" : ""}`} />
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <Globe2 className="w-12 h-12 text-[#FF6B00] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Global reach</h3>
              <p className="text-gray-600">2,000+ SIXT stations in over 105 countries</p>
            </div>
            <div className="text-center">
              <Award className="w-12 h-12 text-[#FF6B00] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Distinctive fleet</h3>
              <p className="text-gray-600">From high-end convertibles to practical vans</p>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 text-[#FF6B00] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Exceptional service</h3>
              <p className="text-gray-600">Stress-free, trustworthy, no hidden fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img
                src="https://www.sixt.com/build/assets/images/logos/sixt-logo-white.svg"
                alt="Sixt"
                className="h-8 mb-4"
              />
              <p className="text-gray-400 text-sm">
                Premium car rental at affordable rates. Worldwide.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Rental</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="hover:text-white">Car Rental</a></li>
                <li><a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="hover:text-white">Van Rental</a></li>
                <li><a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="hover:text-white">Luxury Cars</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="hover:text-white">About Us</a></li>
                <li><a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="hover:text-white">Careers</a></li>
                <li><a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="hover:text-white">Terms of Service</a></li>
                <li><a href="https://voicebot.everailabs.com/demo/carrental/sixt" className="hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Sixt SE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}