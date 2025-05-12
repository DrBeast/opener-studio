
import { useEffect } from "react";
import HeroSection from "@/components/landing/HeroSection";
import PainPointsSection from "@/components/landing/PainPointsSection";
import SolutionSection from "@/components/landing/SolutionSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import ProfileInput from "@/components/landing/ProfileInput";

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
      <section id="try-it-now" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <ProfileInput />
        </div>
      </section>
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default Index;
