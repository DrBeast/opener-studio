
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserRound, LogIn } from "lucide-react";

const Header = () => {
  const { user, isLoading } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold">
            EngageAI
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/" className="text-sm hover:underline">
              Home
            </Link>
            {user && (
              <>
                <Link to="/companies" className="text-sm hover:underline">
                  Companies
                </Link>
                <Link to="/contacts" className="text-sm hover:underline">
                  Contacts
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
            <Button asChild variant="ghost">
              <Link to="/profile">
                <UserRound className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
