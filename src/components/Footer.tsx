import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="w-full px-6">
        <div className="flex h-16 flex-col items-center justify-center gap-3 md:flex-row md:justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold">
              Opener Studio
            </Link>
            <p className="hidden md:block text-xs text-[hsl(var(--normaltext))] opacity-70">
              &copy; {year} Two Steps Ahead LLC. All rights reserved.
            </p>
          </div>
          <p className="text-sm text-[hsl(var(--normaltext))] text-center">
            Your AI-powered workspace for the art and craft of professional
            outreach
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[hsl(var(--normaltext))]">
            <Link to="/" className="inline-flex items-center gap-2">
              <span>Features</span>
              <span>&amp;</span>
              <span>Pricing</span>
            </Link>
            <Link to="/" className="inline-flex items-center gap-2">
              <span>About</span>
              <span>&amp;</span>
              <span>Contact</span>
            </Link>
            <Link to="/" className="inline-flex items-center gap-2">
              <span>Privacy</span>
              <span>&amp;</span>
              <span>Terms</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
