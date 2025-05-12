
import { useEffect } from "react";
import HeroSection from "@/components/landing/HeroSection";
import PainPointsSection from "@/components/landing/PainPointsSection";
import SolutionSection from "@/components/landing/SolutionSection";
import ProfileBuilderSection from "@/components/landing/ProfileBuilderSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";

const Index = () => {
  // Scroll to section if hash is present in URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="min-h-screen">
      <HeroSection />
      <PainPointsSection />
      <SolutionSection />
      <ProfileBuilderSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default Index;
