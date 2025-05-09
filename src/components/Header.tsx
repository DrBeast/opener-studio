
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";

const Header = () => {
  const { user, isLoading, signOut } = useAuth();

  return (
    <header className="border-b shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold text-primary">
            EngageAI
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            {/* Only show navigation links for logged-in users */}
            {user && (
              <>
                <Link to="/profile" className="text-sm hover:text-primary hover:underline transition-colors">
                  Profile
                </Link>
                <Link to="/job-targets" className="text-sm hover:text-primary hover:underline transition-colors">
                  Targets
                </Link>
                <Link to="/companies" className="text-sm hover:text-primary hover:underline transition-colors">
                  Companies & Contacts
                </Link>
                <Link to="/tracking" className="text-sm hover:text-primary hover:underline transition-colors">
                  Tracking
                </Link>
                <Link to="/pipeline" className="text-sm hover:text-primary hover:underline transition-colors">
                  Pipeline
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && !user ? (
            <>
              <Button asChild variant="ghost">
                <Link to="/auth/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Log In
                </Link>
              </Button>
              <Button asChild>
                <Link to="/auth/signup">Sign Up</Link>
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              onClick={signOut} 
              className="flex items-center"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
