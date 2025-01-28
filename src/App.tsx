import React from "react";
import { Routes, Route } from "react-router-dom";
import SpiritAirlinesDemo from "./SpiritAirlines.tsx";
import JetBlueDemo from "./JetBlue.tsx";
import AON from "./AON.tsx";
import McAfeeDemo from "./McAfee.tsx";
import Centene from "./Centene.tsx";
import Mone from "./M1.tsx";
import Recruiter from "./Recruiter.tsx";
import SixtHomepage from "./Sixt.tsx";

export default function App() {
  return (
    <Routes>
      {/* Add more routes as needed */}
      <Route path="/demo/airline/spirit" element={<SpiritAirlinesDemo />} />
      <Route path="/demo/healthcare/centene" element={<Centene />} />
      <Route path="/demo/telecom/M1" element={<Mone />} />
      <Route path="/demo/HR/Recruiter" element={<Recruiter />} />

      <Route path="/demo/airline/jetblue" element={<JetBlueDemo />} />
      <Route path="/demo/security/mcafee" element={<McAfeeDemo />} />
      <Route path="/demo/riskmanagement/aon" element={<AON />} />
      <Route path="/demo/carrental/sixt" element={<SixtHomepage />} />
      <Route path="*" element={<div>Coming Soon</div>} />
    </Routes>
  );
}
