
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";

const Header = () => {
  const { user, isLoading, signOut } = useAuth();
  const location = useLocation();

  // Function to determine if a link is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Check if we're on the landing page
  const isLandingPage = location.pathname === "/";
  
  // Determine where the logo should link to
  const logoLinkPath = user ? "/job-search" : "/";

  return (
    <header className={`border-b shadow-sm ${isLandingPage ? 'bg-white/95 backdrop-blur-sm sticky top-0 z-50' : ''}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to={logoLinkPath} className="text-2xl font-bold">
            <span className="text-primary">Connector</span>AI
            <span className="ml-1 text-xs bg-primary/10 text-primary px-1 py-0.5 rounded uppercase font-semibold">Beta</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            {isLandingPage ?
              // Landing page navigation
              <>
                
              </> :
              // App navigation (only for logged-in users)
              user && <>
                <Link to="/profile" className={`text-sm transition-colors ${isActive("/profile") ? "text-primary font-medium underline underline-offset-4" : "hover:text-primary hover:underline"}`}>
                  Profile
                </Link>
                <Link to="/job-search" className={`text-sm transition-colors ${isActive("/job-search") ? "text-primary font-medium underline underline-offset-4" : "hover:text-primary hover:underline"}`}>
                  Companies & Contacts
                </Link>
                <Link to="/job-targets" className={`text-sm transition-colors ${isActive("/job-targets") ? "text-primary font-medium underline underline-offset-4" : "hover:text-primary hover:underline"}`}>
                  Targets
                </Link>
                <Link to="/pipeline" className={`text-sm transition-colors ${isActive("/pipeline") ? "text-primary font-medium underline underline-offset-4" : "hover:text-primary hover:underline"}`}>
                  Pipeline
                </Link>
              </>
            }
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && !user ? 
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
            </> : 
            <Button variant="ghost" onClick={signOut} className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          }
        </div>
      </div>
    </header>
  );
};

export default Header;
