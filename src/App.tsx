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
import Lumicera from "./Lumicera.tsx";
import Centene2 from "./Centene2.tsx";
import Experian from "./Experian.tsx";
import CVSPharmacy from "./CVSPharmacy.tsx";
import Independence from "./IBX/Independence.tsx";
import SGSientificGames from "./SGGames/SGSientificGames.tsx";

export default function App() {
  return (
    <Routes>
      {/* Add more routes as needed */}
      <Route path="/demo/healthcare/lumicera" element={<Lumicera />} />

      <Route path="/demo/airline/spirit" element={<SpiritAirlinesDemo />} />
      <Route path="/demo/healthcare/centene" element={<Centene />} />
      <Route path="/demo/healthcare/centene2" element={<Centene2 />} />
      <Route path="/demo/healthcare/experian" element={<Experian />} />


      <Route path="/demo/pharmacy/CVSPharmacy" element={<CVSPharmacy />} />

      <Route path="/demo/telecom/M1" element={<Mone />} />
      <Route path="/demo/HR/Recruiter" element={<Recruiter />} />

      <Route path="/demo/airline/jetblue" element={<JetBlueDemo />} />
      <Route path="/demo/security/mcafee" element={<McAfeeDemo />} />
      <Route path="/demo/riskmanagement/aon" element={<AON />} />
      <Route path="/demo/carrental/sixt" element={<SixtHomepage />} />

      <Route path="/demo/healthcare/IBX" element={<Independence />} />
      <Route path="/demo/games/SGGames" element={<SGSientificGames />} />


      <Route path="*" element={<div>Coming Soon</div>} />
    </Routes>
  );
}
