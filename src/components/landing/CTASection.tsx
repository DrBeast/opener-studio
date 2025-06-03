
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const CTASection = () => {
  const { user } = useAuth();

  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Job Search?</h2>
          <p className="text-xl text-[hsl(var(--normaltext))] mb-8">
            Join thousands of professionals who are landing interviews and offers faster by networking more effectively with ConnectorAI.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            {user ? (
              <Button size="lg" asChild className="group">
                <Link to="/profile">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild className="group">
                <Link to="/auth/signup">
                  Start Networking Smarter Today
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-center text-sm text-[hsl(var(--normaltext))]">
            <Shield className="h-4 w-4 mr-2" />
            <span>Your data is secure and used only to power your personalized networking</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
