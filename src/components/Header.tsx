import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/design-system/buttons";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";
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

  const handleHowItWorksClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === "/") {
      e.preventDefault();
      const section = document.getElementById("how-it-works");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
    // Otherwise, let the Link handle navigation to "/#how-it-works"
  };

  return (
    <header className="bg-background backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="w-full px-6">
        <div className="flex items-center justify-between h-16">
          {/* LEFT SIDE: Logo, DEV Badge, and Beta Feedback */}
          <div className="flex items-center space-x-0 gap-4">
            <Link
              to={user ? "/studio" : "/"}
              className="flex items-center space-x-2"
            >
              <img
                src="/Logo_5_main_rs_cr.png"
                alt="Opener Studio"
                className="h-14 w-auto"
              />
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 border-green-200 text-xs font-medium"
              >
                BETA 0.4
              </Badge>
            </Link>
            {user && <FeedbackBox viewName={location.pathname} />}
          </div>

          {/* MIDDLE: Navigation Links (for non-authenticated users) */}
          {!user && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/#how-it-works"
                onClick={handleHowItWorksClick}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                How It Works
              </Link>
              <Link
                to="/pricing"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                About
              </Link>
            </nav>
          )}

          {/* RIGHT SIDE ACTIONS */}
          {user ? (
            <div className="flex items-center space-x-3">
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
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/auth/login"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
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
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
