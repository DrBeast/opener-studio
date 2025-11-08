import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t py-4 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="text-xl font-bold">
              Opener Studio
            </Link>
            <p className="mt-2 text-sm text-[hsl(var(--normaltext))]">
              Your AI-powered workspace for the art and craft of professional
              outreach
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--normaltext))] opacity-70">
              &copy; {year} Opener Studio. All rights reserved.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium mb-1.5">Product</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/"
                    className="text-sm text-[hsl(var(--normaltext))] hover:text-gray-900"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="text-sm text-[hsl(var(--normaltext))] hover:text-gray-900"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1.5">Company</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/"
                    className="text-sm text-[hsl(var(--normaltext))] hover:text-gray-900"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="text-sm text-[hsl(var(--normaltext))] hover:text-gray-900"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1.5">Legal</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/"
                    className="text-sm text-[hsl(var(--normaltext))] hover:text-gray-900"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="text-sm text-[hsl(var(--normaltext))] hover:text-gray-900"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
