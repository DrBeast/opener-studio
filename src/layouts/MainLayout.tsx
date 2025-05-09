
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PersistentAssistant from "@/components/PersistentAssistant";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  // State to track if assistant is visible
  const [assistantVisible, setAssistantVisible] = useState(false);
  
  // Track visibility of the assistant panel
  useEffect(() => {
    // Select the assistant panel element
    const assistantPanel = document.querySelector('[data-sidebar="sidebar"]');
    
    if (assistantPanel) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            // Check if the panel is visible (not hidden)
            const isVisible = !assistantPanel.classList.contains('hidden') && 
                             window.getComputedStyle(assistantPanel).display !== 'none';
            setAssistantVisible(isVisible);
          }
        });
      });
      
      // Start observing the element
      observer.observe(assistantPanel, { attributes: true });
      
      // Initial check
      const isVisible = !assistantPanel.classList.contains('hidden') && 
                       window.getComputedStyle(assistantPanel).display !== 'none';
      setAssistantVisible(isVisible);
      
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 relative">
        <main className={`flex-1 px-4 py-8 overflow-x-hidden transition-all duration-300 ${
          assistantVisible ? 'md:pr-[320px]' : ''
        }`}>
          {children}
        </main>
        <PersistentAssistant />
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
