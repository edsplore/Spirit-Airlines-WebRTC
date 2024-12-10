import React from "react";
import { Routes, Route } from "react-router-dom";
import SpiritAirlinesDemo from "./SpiritAirlines.tsx";
import McAfeeDemo from "./McAfee.tsx";

export default function App() {
  return (
    <Routes>
      {/* Add more routes as needed */}
      <Route path="/demo/airline/spirit" element={<SpiritAirlinesDemo />} />
      <Route path="/demo/security/mcafee" element={<McAfeeDemo />} />
      <Route path="*" element={<div>Coming Soon</div>} />
    </Routes>
  );
}
