import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import M1Telecom from "./App.tsx";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  // Render your React component
  root.render(<M1Telecom />);
} else {
  console.error("Root element not found");
}
