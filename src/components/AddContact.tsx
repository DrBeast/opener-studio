import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/airtable-ds/textarea";
import { Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/airtable-ds/sonner";
import { PrimaryAction } from "@/components/ui/design-system";
import { Button } from "@/components/ui/design-system/buttons";
import { ContactPreview } from "./ContactPreview";
import { Label } from "@/components/ui/airtable-ds/label";

// --- Interface Definitions ---
interface CreatedContact {
  contact_id: string;
  company_id?: string | null;
  first_name: string;
  last_name: string;
  role: string;
  current_company: string;
  location: string;
  bio_summary: string;
  how_i_can_help: string;
  recent_activity_summary: string;
}

interface AddContactProps {
  onContactCreated: (newContact: CreatedContact) => void;
  createdContact?: CreatedContact | null;
  onClearContact?: () => void;
}

export const AddContact = ({
  onContactCreated,
  createdContact,
  onClearContact,
}: AddContactProps) => {
  const { user } = useAuth();
  const [linkedinBio, setLinkedinBio] = useState(
    () => sessionStorage.getItem("linkedinBioDraft") || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isBioValid, setIsBioValid] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const words = linkedinBio.trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    setWordCount(count);
    setIsBioValid(count >= 50);
    sessionStorage.setItem("linkedinBioDraft", linkedinBio);
  }, [linkedinBio]);

  const handleProcessBio = async () => {
    if (!user || !linkedinBio.trim()) return;

    setIsLoading(true);
    try {
      // Single call to the backend function which now handles everything
      const { data, error } = await supabase.functions.invoke(
        "add_contact_by_bio",
        {
          body: {
            linkedin_bio: linkedinBio.trim(),
            userId: user.id,
          },
        }
      );

      if (error) throw error;
      if (!data?.success || !data?.contact) {
        throw new Error(data?.message || "Failed to create contact.");
      }

      // The backend has done all the work. We just need to notify the parent component.
      onContactCreated(data.contact as CreatedContact);
      setLinkedinBio("");
      sessionStorage.removeItem("linkedinBioDraft");
      toast.success(data.message || "Contact created successfully!");
    } catch (error: any) {
      console.error("Error processing bio and creating contact:", error);
      toast.error(error.message || "Failed to create contact.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-full">
      {!createdContact && (
        <div className="space-y-6 ">
          <div className="space-y-4 ">
            <div className="grid w-full gap-1.5">
              <Textarea
                value={linkedinBio}
                onChange={(e) => setLinkedinBio(e.target.value)}
                placeholder="Copy / paste your LinkedIn profile (recommended), resume content, or professional bio here (50 words min)"
                className="min-h-[120px] text-sm resize-none bg-secondary border-border"
              />
              <Label
                className={`text-xs text-right ${
                  isBioValid ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                Word count: {wordCount} / 50
              </Label>
            </div>
            <PrimaryAction
              onClick={handleProcessBio}
              disabled={!isBioValid || isLoading}
              className="w-full"
              size="default"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                  Bio...
                </>
              ) : (
                "Process Bio and Create Contact"
              )}
            </PrimaryAction>
          </div>
        </div>
      )}

      {createdContact && (
        <div className="h-full space-y-4">
          <ContactPreview contact={createdContact} className="h-full" />
          {onClearContact && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearContact}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                New Contact
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Note: Duplicate dialogs are removed for this simplified flow */}
    </div>
  );
};
