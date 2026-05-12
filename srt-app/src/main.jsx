// main.jsx
// The entry point for the React application.
// Mounts the <App /> component into the #root div defined in index.html.
// StrictMode is kept on during development — it double-invokes some lifecycle methods
// to help catch bugs early, but has no effect in production builds.

import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Find the #root element in index.html and mount the full React app into it
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
