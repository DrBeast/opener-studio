
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="py-16 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 -z-10" />
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Break Through the Noise: <span className="text-primary">Your AI Copilot</span> for Job Search Networking
            </h1>
            <p className="text-xl text-gray-600">
              In today's tough market, getting seen is hard. ConnectorAI helps you build the right connections and craft outreach that actually gets responses, without the awkwardness.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Button size="lg" asChild className="group">
                  <Link to="/profile">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="group">
                  <a href="#profile-builder">
                    Generate Your Networking Profile - It's Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/30 p-2">
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-white shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                  alt="Professional networking concept"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
