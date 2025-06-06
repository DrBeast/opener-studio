import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building, UserPlus, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedContactModal } from "@/components/pipeline/EnhancedContactModal";
import { GenerateContactsModal } from "@/components/GenerateContactsModal";

interface Company {
  company_id: string;
  name: string;
  industry?: string;
  hq_location?: string;
}

interface CompanySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanySelectionModal = ({
  isOpen,
  onClose,
}: CompanySelectionModalProps) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [contactMethod, setContactMethod] = useState<
    "generate" | "manual" | null
  >(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchCompanies();
    }
  }, [isOpen, user]);

  const fetchCompanies = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("companies")
        .select("company_id, name, industry, hq_location")
        .eq("user_id", user.id)
        .eq("is_blacklisted", false)
        .order("name");

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (
    company: Company,
    method: "generate" | "manual"
  ) => {
    setSelectedCompany(company);
    setContactMethod(method);
    setIsContactModalOpen(true);
    onClose();
  };

  const handleCloseContactModal = () => {
    setIsContactModalOpen(false);
    setSelectedCompany(null);
    setContactMethod(null);
  };

  const handleSuccess = () => {
    handleCloseContactModal();
    // Optionally refresh data or show success message
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Contact - Select Company
            </DialogTitle>
            <DialogDescription>
              Choose a company to add a new contact to
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading companies...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Companies Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add some target companies first before adding contacts
              </p>
              <Button
                onClick={() => {
                  onClose();
                  window.location.href = "/job-targets";
                }}
              >
                Add Companies
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
                <Card
                  key={company.company_id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{company.name}</h3>
                          {company.industry && (
                            <p className="text-sm text-muted-foreground">
                              {company.industry}
                            </p>
                          )}
                          {company.hq_location && (
                            <p className="text-xs text-muted-foreground">
                              {company.hq_location}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleCompanySelect(company, "generate")
                          }
                          className="flex items-center gap-1"
                        >
                          <Bot className="h-3 w-3" />
                          Generate
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleCompanySelect(company, "manual")}
                          className="flex items-center gap-1"
                        >
                          <UserPlus className="h-3 w-3" />
                          Add Manually
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedCompany && contactMethod && (
        <>
          {contactMethod === "generate" ? (
            <GenerateContactsModal
              isOpen={isContactModalOpen}
              onClose={handleCloseContactModal}
              companyId={selectedCompany.company_id}
              companyName={selectedCompany.name}
              onSuccess={handleSuccess}
            />
          ) : (
            <EnhancedContactModal
              isOpen={isContactModalOpen}
              onClose={handleCloseContactModal}
              companyId={selectedCompany.company_id}
              companyName={selectedCompany.name}
              onSuccess={handleSuccess}
            />
          )}
        </>
      )}
    </>
  );
};
