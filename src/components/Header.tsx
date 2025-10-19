import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/design-system/buttons";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User, MessageSquare, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/airtable-ds/badge";
import FeedbackBox from "@/components/FeedbackBox";

interface HeaderProps {
  // Empty interface - no props needed
}

const Header = ({}: HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-background backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* LEFT SIDE: Logo, DEV Badge, and Beta Feedback */}
          <div className="flex items-center space-x-2">
            <Link to={user ? "/pipeline" : "/"} className="flex items-center">
              <img
                src="/opener-studio-logo.png"
                alt="Opener Studio"
                className="h-14 w-auto"
              />
            </Link>
            {/* Beta Feedback button moved here */}
            {user && <FeedbackBox viewName={location.pathname} />}
          </div>

          {/* MIDDLE: Breadcrumb Navigation */}
          {user ? (
            <nav className="hidden md:flex items-center space-x-2 text-sm">
              <Link
                to="/pipeline"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Studio
              </Link>
              {(location.pathname === "/profile" ||
                location.pathname === "/message-history") && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 font-medium">
                    {location.pathname === "/profile" ? "Profile" : "History"}
                  </span>
                </>
              )}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Button
                asChild
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Link to="/auth/signup">Sign Up</Link>
              </Button>
            </nav>
          )}

          {/* RIGHT SIDE: Message History, Profile and Logout Buttons */}
          {user && (
            <div className="flex items-center space-x-3">
              <Button
                variant={
                  location.pathname === "/message-history"
                    ? "primary"
                    : "outline"
                }
                size="sm"
                onClick={() => navigate("/message-history")}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
              <Button
                variant={
                  location.pathname === "/profile" ? "primary" : "outline"
                }
                size="sm"
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              <Button
                variant="outlinedestructive"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
