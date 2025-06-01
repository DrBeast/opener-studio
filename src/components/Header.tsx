
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User, BookOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onOpenOnboarding?: () => void;
}

const Header = ({ onOpenOnboarding }: HeaderProps) => {
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

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="text-xl font-bold text-primary">
            ConnectorAI
          </Link>

          {/* Navigation */}
          {user ? (
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/dashboard") ? "text-primary" : "text-gray-600"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/profile") ? "text-primary" : "text-gray-600"
                }`}
              >
                Profile
              </Link>
              <Link
                to="/job-targets"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/job-targets") ? "text-primary" : "text-gray-600"
                }`}
              >
                Job Targets
              </Link>
              <Link
                to="/pipeline"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/pipeline") ? "text-primary" : "text-gray-600"
                }`}
              >
                Pipeline
              </Link>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/auth/login" className="text-sm font-medium text-gray-600 hover:text-primary">
                Login
              </Link>
              <Button asChild size="sm">
                <Link to="/auth/signup">Sign Up</Link>
              </Button>
            </nav>
          )}

          {/* User Menu */}
          {user && (
            <div className="flex items-center space-x-4">
              {onOpenOnboarding && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenOnboarding}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Onboarding
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Mobile Menu (simplified for now) */}
          {!user && (
            <div className="md:hidden">
              <Button asChild size="sm">
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
