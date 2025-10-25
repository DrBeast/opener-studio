import React from "react";
import { createRoot } from "react-dom/client";
import { PostHogProvider } from "posthog-js/react";
import App from "./App.tsx";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

const shouldTrack = import.meta.env.VITE_PUBLIC_POSTHOG_ENABLED === "true";

root.render(
  <React.StrictMode>
    {shouldTrack ? (
      <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
        options={{
          api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
          capture_exceptions: true,
          debug: import.meta.env.MODE === "development",
        }}
      >
        <App />
      </PostHogProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
