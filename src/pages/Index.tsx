
import { useEffect } from "react";
import HeroSection from "@/components/landing/HeroSection";
import PainPointsSection from "@/components/landing/PainPointsSection";
import SolutionSection from "@/components/landing/SolutionSection";

const Index = () => {
  // Scroll to section if hash is present in URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
  }, []);

  return (
    <div className="min-h-screen">
      <HeroSection />
      <SolutionSection />
      <PainPointsSection />
    </div>
  );
};

export default Index;
