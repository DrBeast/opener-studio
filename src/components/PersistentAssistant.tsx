import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/airtable-ds/button";
import { MessageCircle } from "lucide-react";

const PersistentAssistant: React.FC = () => {
  // State to track if the message has been shown
  const [messageShown, setMessageShown] = useState<boolean>(false);

  // Effect to show the welcome message when the component mounts
  useEffect(() => {
    // Only show welcome message if it hasn't been shown before in this session
    if (!messageShown) {
      // Get the assistant container element
      const assistantContainer = document.querySelector(
        '[data-sidebar="sidebar"]'
      );

      if (
        assistantContainer &&
        !assistantContainer.classList.contains("hidden")
      ) {
        // Simulate a welcome message
        const welcomeMessage = document.createElement("div");
        welcomeMessage.className =
          "p-4 bg-blue-50 rounded-lg mb-4 border border-blue-200 text-blue-800";
        welcomeMessage.innerHTML = `
          <p class="font-medium mb-2">👋 Welcome to EngageAI!</p>
          <p class="text-sm">I'm your AI networking assistant. I can help you with:</p>
          <ul class="list-disc list-inside text-sm mt-2">
            <li>Building your professional profile</li>
            <li>Finding target companies and contacts</li>
            <li>Crafting outreach messages</li>
            <li>Managing your job search networking</li>
          </ul>
          <p class="text-sm mt-2">Let me know how I can assist you today!</p>
        `;

        // Find the chat container to prepend the message
        const chatContainer = assistantContainer.querySelector(
          '[data-radix-scroll-area-viewport=""]'
        );
        if (chatContainer && chatContainer.firstChild) {
          chatContainer.insertBefore(welcomeMessage, chatContainer.firstChild);
          setMessageShown(true);
        }
      }
    }
  }, [messageShown]);

  return null;
};

export default PersistentAssistant;
