import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/design-system/buttons";
import { PrimaryAction } from "@/components/ui/design-system/buttons";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, BookOpen, Settings } from "lucide-react";
import { Badge } from "@/components/ui/airtable-ds/badge";
import FeedbackBox from "@/components/FeedbackBox";
import SettingsModal from "@/components/SettingsModal";
import { useState } from "react";

interface HeaderProps {
  onOpenOnboarding?: () => void;
}

const Header = ({ onOpenOnboarding }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-background backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* LEFT SIDE: Logo, DEV Badge, and Onboarding Button */}
          <div className="flex items-center space-x-2">
            <Link
              to={user ? "/pipeline" : "/"}
              className="flex items-center space-x-2" // Keep flex for logo and badge alignment
            >
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                ConnectorAI
              </span>
              <Badge
                variant="secondary"
                className="bg-red-100 text-red-700 border-red-200 text-xs font-medium"
              >
                DEV
              </Badge>
            </Link>
            {/* Onboarding Button - Placed next to logo/badge */}
            {user && onOpenOnboarding && (
              <PrimaryAction
                size="sm"
                onClick={onOpenOnboarding}
                className="flex items-center gap-3"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Onboarding</span>
              </PrimaryAction>
            )}
          </div>

          {/* MIDDLE: Empty - Navigation removed */}
          {user ? (
            <div className="hidden md:flex items-center">
              {/* Navigation removed - Pipeline is now the main view */}
            </div>
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

          {/* RIGHT SIDE: Settings, Feedback and Logout Buttons */}
          {user && (
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <FeedbackBox viewName={location.pathname} />
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

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />

          {/* Mobile Menu (simplified for now) */}
          {!user && (
            <div className="md:hidden">
              <Button
                asChild
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Link to="/auth/login">Login</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
