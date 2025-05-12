
import { useEffect } from "react";
import HeroSection from "@/components/landing/HeroSection";
import PainPointsSection from "@/components/landing/PainPointsSection";
import SolutionSection from "@/components/landing/SolutionSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import ProfileInput from "@/components/landing/ProfileInput"; // Added import

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
      <div className="container mx-auto px-4 py-16">
        <ProfileInput /> {/* Added ProfileInput component */}
      </div>
      <PainPointsSection />
      <SolutionSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default Index;
