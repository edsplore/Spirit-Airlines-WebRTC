import React from "react";
import { Routes, Route } from "react-router-dom";
import SpiritAirlinesDemo from "./SpiritAirlines.tsx";

export default function App() {
  return (
    <Routes>
      {/* Add more routes as needed */}
      <Route path="/demo/airline/spirit" element={<SpiritAirlinesDemo />} />
      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}
