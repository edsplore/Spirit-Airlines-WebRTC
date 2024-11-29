import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import M1Limited from "./App.tsx";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  // Render your React component
  root.render(<M1Limited />);
} else {
  console.error("Root element not found");
}
