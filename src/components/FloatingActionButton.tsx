
import { useState } from "react";
import { MessageCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { ContactSelectionModal } from "@/components/ContactSelectionModal";
import { CompanySelectionModal } from "@/components/CompanySelectionModal";

const FloatingActionButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isContactSelectionOpen, setIsContactSelectionOpen] = useState(false);
  const [isCompanySelectionOpen, setIsCompanySelectionOpen] = useState(false);
  const location = useLocation();

  // Don't show on landing page or auth pages
  if (location.pathname === "/" || location.pathname.startsWith("/auth")) {
    return null;
  }

  const handleQuickMessage = () => {
    setIsContactSelectionOpen(true);
    setIsExpanded(false);
  };

  const handleQuickContact = () => {
    setIsCompanySelectionOpen(true);
    setIsExpanded(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end gap-3">
          {/* Expanded Actions */}
          {isExpanded && (
            <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200">
              <Button
                onClick={handleQuickMessage}
                className="shadow-lg bg-primary hover:bg-primary/90 text-white"
                size="sm"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Generate Message
              </Button>
              <Button
                onClick={handleQuickContact}
                className="shadow-lg bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Find Contacts
              </Button>
            </div>
          )}

          {/* Main FAB */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
            size="lg"
          >
            {isExpanded ? (
              <X className="h-6 w-6" />
            ) : (
              <MessageCircle className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      <ContactSelectionModal
        isOpen={isContactSelectionOpen}
        onClose={() => setIsContactSelectionOpen(false)}
      />

      <CompanySelectionModal
        isOpen={isCompanySelectionOpen}
        onClose={() => setIsCompanySelectionOpen(false)}
      />
    </>
  );
};

export default FloatingActionButton;
