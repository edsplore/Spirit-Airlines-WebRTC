"use client";
import React from "react";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function Independence() {
  const [activeView, setActiveView] = useState<
    "customerDetails" | "startCall" | "endCall" | "practiceCall" | "recordings"
  >("customerDetails");

  const handleViewChange = (
    view:
      | "customerDetails"
      | "startCall"
      | "endCall"
      | "practiceCall"
      | "recordings"
  ) => {
    setActiveView(view);
  };

  return (
    <div className="flex flex-col w-full h-screen bg-white overflow-hidden">
      <header className="flex justify-between items-center p-4">
        <div className="text-[#4a90e2] flex items-center">
          {/* Independence logo */}
          <div className="flex items-center">
            <img
              src="/independence_logo.png"
              alt="Independence Logo"
              style={{ width: "180px", height: "auto" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Welcome, Jon Smith</span>
          {/* VI Labs logo */}
          <div className="flex items-center">
            <img
              src="/vi-labs.png"
              alt="VI Labs Logo"
              style={{ width: "130px", height: "auto" }}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 px-4 pb-4 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-[30%] bg-white">
          <div className="bg-[#4a90e2] text-white p-4">
            <h1 className="text-4xl font-bold mb-3">
              Driving health
              <br />
              care forward
            </h1>
            <p className="text-xl" style={{ lineHeight: "1.3" }}>
              With you at the center of
              <br />
              everything we do, we are
              <br />
              building the healthcare
              <br />
              company of the future by
              <br />
              redefining what to expect from
              <br />a health insurer.
            </p>
          </div>
          {/* Person image with IBX overlay */}
          <div className="relative h-64 bg-[#3a7bc8] flex items-center">
            <img
              src="/independence_home.png"
              alt="Person with coffee"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
              }}
            />
            <div className="absolute right-4 text-[#87CEFA] text-6xl font-bold z-10">
              IBX
            </div>
            <div className="absolute right-0 bottom-1/2 transform translate-y-1/2 z-10">
              <ChevronRight className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 ml-4 flex flex-col overflow-hidden">
          {/* Tab navigation */}
          <div className="mb-2 flex gap-1">
            <button
              onClick={() => handleViewChange("customerDetails")}
              className={`px-3 py-1 rounded-t-md text-sm ${
                activeView === "customerDetails"
                  ? "bg-gray-200 font-semibold"
                  : "bg-gray-100"
              }`}
            >
              Customer Details
            </button>
            <button
              onClick={() => handleViewChange("startCall")}
              className={`px-3 py-1 rounded-t-md text-sm ${
                activeView === "startCall"
                  ? "bg-gray-200 font-semibold"
                  : "bg-gray-100"
              }`}
            >
              Start Call
            </button>
            <button
              onClick={() => handleViewChange("endCall")}
              className={`px-3 py-1 rounded-t-md text-sm ${
                activeView === "endCall"
                  ? "bg-gray-200 font-semibold"
                  : "bg-gray-100"
              }`}
            >
              End Call
            </button>
            <button
              onClick={() => handleViewChange("practiceCall")}
              className={`px-3 py-1 rounded-t-md text-sm ${
                activeView === "practiceCall"
                  ? "bg-gray-200 font-semibold"
                  : "bg-gray-100"
              }`}
            >
              Practice Call
            </button>
            <button
              onClick={() => handleViewChange("recordings")}
              className={`px-3 py-1 rounded-t-md text-sm ${
                activeView === "recordings"
                  ? "bg-gray-200 font-semibold"
                  : "bg-gray-100"
              }`}
            >
              Recordings
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {activeView === "customerDetails" && (
              <div className="w-full">
                <div className="bg-gray-200 p-2 font-bold">
                  Customer Details
                </div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Customer Name:</td>
                      <td className="p-2">Mary Carpenter</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Phone number</td>
                      <td className="p-2">1234567890</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Address</td>
                      <td className="p-2">
                        1234, University avenue, Miami, Florida - 20145
                      </td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Date of Birth</td>
                      <td className="p-2">06 June 1980</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Account#</td>
                      <td className="p-2">987654321</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2">Customer Behaviour</td>
                      <td className="p-2">Normal</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-8 flex flex-col items-center justify-center">
                  <div
                    className="w-20 h-20 rounded-full bg-black flex items-center justify-center cursor-pointer"
                    onClick={() => handleViewChange("startCall")}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                        stroke="#87CEFA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19 10v2a7 7 0 0 1-14 0v-2"
                        stroke="#87CEFA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="12"
                        y1="19"
                        x2="12"
                        y2="23"
                        stroke="#87CEFA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="8"
                        y1="23"
                        x2="16"
                        y2="23"
                        stroke="#87CEFA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-[#005b96] text-3xl font-bold mt-2">
                    Click to Start Call
                  </div>
                </div>
              </div>
            )}

            {activeView === "startCall" && (
              <div className="w-full">
                <div className="bg-gray-200 p-2 font-bold">
                  Customer Details
                </div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Customer Name:</td>
                      <td className="p-2">Mary Carpenter</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Phone number</td>
                      <td className="p-2">1234567890</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Address</td>
                      <td className="p-2">
                        1234, University avenue, Miami, Florida - 20145
                      </td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Date of Birth</td>
                      <td className="p-2">06 June 1980</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Account#</td>
                      <td className="p-2">987654321</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2">Customer Behaviour</td>
                      <td className="p-2">Normal</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-8 flex flex-col items-center justify-center">
                  <div
                    className="w-20 h-20 rounded-full bg-black flex items-center justify-center cursor-pointer"
                    onClick={() => handleViewChange("endCall")}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                        stroke="#87CEFA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19 10v2a7 7 0 0 1-14 0v-2"
                        stroke="#87CEFA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="12"
                        y1="19"
                        x2="12"
                        y2="23"
                        stroke="#87CEFA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="8"
                        y1="23"
                        x2="16"
                        y2="23"
                        stroke="#87CEFA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-[#005b96] text-3xl font-bold mt-2">
                    Click to Start Call
                  </div>
                  <button className="mt-2 bg-[#4a90e2] text-white py-2 px-6 rounded-md">
                    Click to Listen to call recording
                  </button>
                </div>
              </div>
            )}

            {activeView === "endCall" && (
              <div className="w-full">
                <div className="bg-gray-200 p-2 font-bold">
                  Customer Details
                </div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Customer Name:</td>
                      <td className="p-2">Mary Carpenter</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Phone number</td>
                      <td className="p-2">1234567890</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Address</td>
                      <td className="p-2">
                        1234, University avenue, Miami, Florida - 20145
                      </td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Date of Birth</td>
                      <td className="p-2">06 June 1980</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 text-[#4a90e2]">Account#</td>
                      <td className="p-2">987654321</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-2">Customer Behaviour</td>
                      <td className="p-2">Normal</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-8 flex flex-col items-center justify-center">
                  <div
                    className="w-20 h-20 rounded-full bg-[#cc0000] flex items-center justify-center cursor-pointer"
                    onClick={() => handleViewChange("customerDetails")}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19 10v2a7 7 0 0 1-14 0v-2"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="12"
                        y1="19"
                        x2="12"
                        y2="23"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="8"
                        y1="23"
                        x2="16"
                        y2="23"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-[#005b96] text-3xl font-bold mt-2">
                    Click to End Call
                  </div>
                </div>
              </div>
            )}

            {activeView === "practiceCall" && (
              <div className="w-full">
                <div
                  className="border border-[#4a90e2] rounded-lg p-4 mb-4"
                  style={{ borderRadius: "16px" }}
                >
                  <div className="bg-gray-200 p-2 mb-3">
                    Enter details Initiating Practise call
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <div className="w-64 text-[#4a90e2]">Your Name:</div>
                      <div className="flex-1">Jon Smith</div>
                    </div>
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <div className="w-64 text-[#4a90e2]">
                        Choose Practise scenario
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <span>Coverage & Benefits</span>
                        <div className="bg-gray-200 w-6 h-6 flex items-center justify-center">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <div className="w-64 text-[#4a90e2]">
                        Choose Customer behaviour
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <span>Normal</span>
                        <div className="bg-gray-200 w-6 h-6 flex items-center justify-center">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button className="w-full bg-[#d35400] text-white py-2 rounded-md">
                        Click to Submit
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="border border-[#4a90e2] rounded-lg p-4"
                  style={{ borderRadius: "16px" }}
                >
                  <div className="bg-gray-200 p-2 mb-3">
                    Choose name to listening to previous call recordings
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center border-b border-gray-300 pb-2">
                      <div className="w-64 text-[#4a90e2]">Your Name:</div>
                      <div className="flex-1 flex justify-between items-center">
                        <span>Jon Smith</span>
                        <div className="bg-gray-200 w-6 h-6 flex items-center justify-center">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        className="w-full bg-[#d35400] text-white py-2 rounded-md"
                        onClick={() => handleViewChange("recordings")}
                      >
                        Click to Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === "recordings" && (
              <div className="w-full">
                <div className="bg-gray-200 p-2 flex justify-between items-center">
                  <span className="font-bold">Call Recordings</span>
                  <button className="bg-[#d35400] text-white px-3 py-1 rounded">
                    Refresh
                  </button>
                </div>
                <div
                  className="overflow-auto"
                  style={{ maxHeight: "calc(100vh - 180px)" }}
                >
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="p-2 text-left">Call ID</th>
                        <th className="p-2 text-left">Start time</th>
                        <th className="p-2 text-left">End Time</th>
                        <th className="p-2 text-left">Call Summary</th>
                        <th className="p-2 text-left">Customer Sentiment</th>
                        <th className="p-2 text-left">Call recording</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Empty rows for call recordings */}
                      {[...Array(10)].map((_, index) => (
                        <tr key={index} className="border-b border-gray-300">
                          <td className="p-2">&nbsp;</td>
                          <td className="p-2">&nbsp;</td>
                          <td className="p-2">&nbsp;</td>
                          <td className="p-2">&nbsp;</td>
                          <td className="p-2">&nbsp;</td>
                          <td className="p-2">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
