import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AirtableCard,
  AirtableCardContent,
} from "@/components/ui/airtable-card";
import {
  Info,
  Loader2,
  User,
  Building,
  ArrowRight,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { LinkedInQuerySuggestions } from "./LinkedInQuerySuggestions";
import { MessageGeneration } from "@/components/MessageGeneration";
import { PrimaryAction } from "@/components/ui/design-system";

interface IntegratedContactWorkflowProps {
  companies: Array<{ company_id: string; name: string }>;
  onContactCreated: () => void;
}

interface GeneratedContact {
  contact_id: string;
  name: string;
  first_name: string;
  last_name: string;
  role?: string;
  location?: string;
  linkedin_url?: string;
  email?: string;
  bio_summary?: string;
  how_i_can_help?: string;
  company_id: string;
}

export const IntegratedContactWorkflow = ({
  companies,
  onContactCreated,
}: IntegratedContactWorkflowProps) => {
  const { user } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [linkedinBio, setLinkedinBio] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedContact, setGeneratedContact] =
    useState<GeneratedContact | null>(null);
  const [createdContact, setCreatedContact] = useState<GeneratedContact | null>(
    null
  );

  const selectedCompany = companies.find(
    (c) => c.company_id === selectedCompanyId
  );

  const handleGenerateContact = async () => {
    if (!user || !linkedinBio.trim() || !selectedCompanyId) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "add_contact_by_bio",
        {
          body: {
            company_id: selectedCompanyId,
            linkedin_bio: linkedinBio.trim(),
          },
        }
      );

      if (error) throw error;

      if (data?.contact) {
        const contactWithIds = {
          ...data.contact,
          contact_id: crypto.randomUUID(), // Temporary ID for preview
          company_id: selectedCompanyId,
          first_name: data.contact.name.split(" ")[0] || "",
          last_name: data.contact.name.split(" ").slice(1).join(" ") || "",
        };
        setGeneratedContact(contactWithIds);
      } else {
        throw new Error("No contact data received");
      }
    } catch (error: any) {
      console.error("Error generating contact:", error);
      toast({
        title: "Error",
        description: "Failed to generate contact information",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateContact = async () => {
    if (!user || !generatedContact) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          company_id: selectedCompanyId,
          first_name: generatedContact.first_name,
          last_name: generatedContact.last_name,
          role: generatedContact.role,
          email: generatedContact.email,
          linkedin_url: generatedContact.linkedin_url,
          location: generatedContact.location,
          bio_summary: generatedContact.bio_summary,
          how_i_can_help: generatedContact.how_i_can_help,
        })
        .select()
        .single();

      if (error) throw error;

      const createdContactWithCompanyId = {
        ...data,
        company_id: selectedCompanyId,
        name: `${data.first_name} ${data.last_name}`.trim(),
      };

      setCreatedContact(createdContactWithCompanyId);
      setGeneratedContact(null);

      toast({
        title: "Success",
        description: "Contact created successfully",
      });

      onContactCreated();
    } catch (error: any) {
      console.error("Error creating contact:", error);
      toast({
        title: "Error",
        description: "Failed to create contact",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetWorkflow = () => {
    setSelectedCompanyId("");
    setLinkedinBio("");
    setGeneratedContact(null);
    setCreatedContact(null);
  };

  const handleMessageSaved = () => {
    toast({
      title: "Success",
      description: "Message saved and workflow completed!",
    });
    resetWorkflow();
  };

  return (
    <div className="space-y-6 bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Add New Contact</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Left Side - LinkedIn Input */}
        <div className="space-y-4">
          {/* Company Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Company</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.company_id} value={company.company_id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* LinkedIn Profile Content Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">LinkedIn Profile Content</Label>
            <div className="text-xs text-gray-600 mb-2">
              Copy everything from their LinkedIn profile (Ctrl+A, Ctrl+C) and paste here.
            </div>
            <Textarea
              value={linkedinBio}
              onChange={(e) => setLinkedinBio(e.target.value)}
              placeholder="Paste the contact's LinkedIn profile content here..."
              className="min-h-[200px] text-sm"
            />
          </div>

          {/* Generate Contact Button */}
          <PrimaryAction
            onClick={handleGenerateContact}
            disabled={!linkedinBio.trim() || !selectedCompanyId || isGenerating}
            className="w-full"
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Contact...
              </>
            ) : (
              "Generate Contact"
            )}
          </PrimaryAction>

          {/* Generated Contact Preview */}
          {generatedContact && (
            <AirtableCard className="border-green-200 bg-green-50">
              <AirtableCardContent className="p-3">
                <h4 className="font-medium mb-2 text-green-800 text-sm">
                  Generated Contact
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-green-600" />
                    <span className="font-medium">{generatedContact.name}</span>
                  </div>
                  {generatedContact.role && (
                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3 text-green-600" />
                      <span>{generatedContact.role}</span>
                    </div>
                  )}
                </div>
                <PrimaryAction
                  onClick={handleCreateContact}
                  disabled={isCreating}
                  className="w-full mt-3"
                  size="sm"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Contact"
                  )}
                </PrimaryAction>
              </AirtableCardContent>
            </AirtableCard>
          )}

          {/* Contact Created State */}
          {createdContact && (
            <AirtableCard className="border-green-200 bg-green-50">
              <AirtableCardContent className="p-3">
                <div className="text-center space-y-2">
                  <div className="text-green-600">✓</div>
                  <h4 className="font-medium text-green-800 text-sm">Contact Created</h4>
                  <p className="text-sm text-green-700">
                    {createdContact.name} at {selectedCompany?.name}
                  </p>
                  <Button variant="outline" size="sm" onClick={resetWorkflow} className="text-xs">
                    Create Another Contact
                  </Button>
                </div>
              </AirtableCardContent>
            </AirtableCard>
          )}
        </div>

        {/* Right Side - Info Box with LinkedIn Query Suggestions */}
        <div className="space-y-4">
          <AirtableCard className="bg-blue-50 border-blue-200">
            <AirtableCardContent className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How to Find the Right Contacts</p>
                  <p className="mb-2">
                    Start with your existing network. Provide their LinkedIn bios, and AI will do the rest.
                  </p>
                  <p className="font-medium">Feel free to use the suggested queries below:</p>
                </div>
              </div>
              
              {/* LinkedIn Query Suggestions */}
              {selectedCompany && (
                <div className="mt-3">
                  <LinkedInQuerySuggestions
                    companyName={selectedCompany.name}
                    isModalOpen={true}
                  />
                </div>
              )}
            </AirtableCardContent>
          </AirtableCard>
        </div>
      </div>

      {/* Message Generation Section */}
      {createdContact && (
        <div className="mt-6 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Generate Message</h3>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="font-medium text-blue-800 mb-1">Generating message for:</p>
              <p className="text-blue-700">{createdContact.name} at {selectedCompany?.name}</p>
            </div>

            <MessageGeneration
              contact={createdContact}
              companyName={selectedCompany?.name || ""}
              isOpen={true}
              onClose={() => {}}
              onMessageSaved={handleMessageSaved}
              embedded={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
