
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const CTASection = () => {
  const { user } = useAuth();
  
  return (
    <section id="cta" className="py-16 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Transform Your Job Search?
        </h2>
        <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
          Start building meaningful connections that lead to real opportunities. Join thousands of professionals who've already upgraded their networking strategy.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {user ? (
            <Link to="/pipeline">
              <Button size="lg" variant="secondary" className="font-medium">
                Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth/signup">
                <Button size="lg" variant="secondary" className="font-medium">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Log In
                </Button>
              </Link>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-center mt-8 text-sm">
          <Shield className="h-4 w-4 mr-2" />
          <span>Secure, private, and trusted by thousands of professionals</span>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
