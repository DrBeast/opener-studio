import { Link } from "react-router-dom";
import { Linkedin } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();

  const handleHowItWorksClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const currentPath = window.location.pathname;
    if (currentPath === "/") {
      e.preventDefault();
      const section = document.getElementById("how-it-works");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="bg-background backdrop-blur-sm border-t border-border shadow-sm">
      <div className="w-full px-4 py-2">
        <div
          className="grid grid-cols-1 md:grid-cols-6 gap-4"
          style={{
            gridTemplateColumns: "4fr 3fr 1fr 1fr 1fr",
          }}
        >
          {/* Column 1: Copyright & Legal Links (Left Aligned) - 30% */}
          <div className="text-left px-8">
            <p className="text-xs text-muted-foreground mb-1">
              © {year} Two Steps Ahead LLC. All rights reserved.
            </p>
            <div className="flex items-center space-x-3">
              <Link
                to="/privacy"
                className="text-xs hover:text-primary transition-colors text-muted-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-xs hover:text-primary transition-colors text-muted-foreground"
              >
                Terms of Service
              </Link>
              <a
                href="https://www.linkedin.com/company/opener-studio"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors text-muted-foreground"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Column 2: Brand & Description (Center Aligned) - 30% */}
          <div className="text-center md:text-left">
            <h5 className="text-sm font-display font-bold text-foreground mb-1">
              Opener Studio
            </h5>
            <p className="font-sans text-xs text-muted-foreground">
              Your AI-powered workspace for the art and craft of professional
              outreach.
            </p>
          </div>

          {/* Column 3: Product (Right Aligned) - 20% */}
          <div className="text-right">
            <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0">
              Product
            </h6>
            <ul className="space-y-0">
              <li>
                <Link
                  to="/#how-it-works"
                  onClick={handleHowItWorksClick}
                  className="text-xs hover:text-primary transition-colors text-muted-foreground"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-xs hover:text-primary transition-colors text-muted-foreground"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company (Right Aligned) - 20% */}
          <div className="text-right">
            <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0">
              Company
            </h6>
            <ul className="space-y-0">
              <li>
                <Link
                  to="/about"
                  className="text-xs hover:text-primary transition-colors text-muted-foreground"
                >
                  About Us
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@openerstudio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:text-primary transition-colors text-muted-foreground"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
