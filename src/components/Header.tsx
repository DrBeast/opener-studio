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
      <div className="w-full px-6">
        <div className="flex items-center justify-between h-16">
          {/* LEFT SIDE: Logo, DEV Badge, and Beta Feedback */}
          <div className="flex items-center space-x-0 gap-4">
            <Link
              to={user ? "/pipeline" : "/"}
              className="flex items-center space-x-2" // Keep flex for logo and badge alignment
            >
              <img
                src="/opener-studio-logo.png"
                alt="Opener Studio"
                className="h-14 w-auto"
              />
              <Badge
                variant="secondary"
                className="bg-red-100 text-red-700 border-red-200 text-xs font-medium"
              >
                DEV
              </Badge>
            </Link>
            {user && <FeedbackBox viewName={location.pathname} />}
          </div>

          {/* MIDDLE: Breadcrumb Navigation removed per request */}

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
