import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ProfileInput from "@/components/landing/ProfileInput";
const HeroSection = () => {
  const {
    user
  } = useAuth();
  return <section className="py-16 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 -z-10" />
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Connect With a Human: <span className="text-primary">
                Your AI Copilot</span> for Job Search Networking
            </h1>
            <p className="text-xl text-gray-600 mb-8">In today's job market, getting to talk to a real person is hard yet essential. ConnectorAI helps you craft messaging that gets responses and build networks that actually help - at scale and without the awkwardness .</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              {user ? <Button size="lg" asChild className="group">
                  <Link to="/profile">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button> : <Button size="lg" asChild className="group">
                  
                </Button>}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <ProfileInput />
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;