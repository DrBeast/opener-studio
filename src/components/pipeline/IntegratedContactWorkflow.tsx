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
  current_company?: string;
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
    if (!user || !linkedinBio.trim()) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "add_contact_by_bio",
        {
          body: {
            linkedin_bio: linkedinBio.trim(),
          },
        }
      );

      if (error) throw error;

      if (data?.contact) {
        const contactWithIds = {
          ...data.contact,
          contact_id: crypto.randomUUID(), // Temporary ID for preview
          company_id: null,
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
          company_id: null,
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
        company_id: null,
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Creation Panel */}
        <div
          className={`space-y-4 p-4 rounded-lg border-2 transition-all ${
            !createdContact
              ? "border-primary/20 bg-primary/5"
              : "border-gray-200 bg-gray-50/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Add New Contact</h3>
            {createdContact && (
              <div className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                ✓ Complete
              </div>
            )}
          </div>

          {!createdContact ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column - LinkedIn Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Paste their LinkedIn content here
                  </Label>

                  <Textarea
                    value={linkedinBio}
                    onChange={(e) => setLinkedinBio(e.target.value)}
                    placeholder="Copy everything from their LinkedIn profile (Ctrl+A, Ctrl+C) and paste it here (Ctrl + V)"
                    className="min-h-[120px] text-sm"
                  />
                </div>

                <PrimaryAction
                  onClick={handleGenerateContact}
                  disabled={
                    !linkedinBio.trim() || isGenerating
                  }
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
              </div>

              {/* Right Column - Contact Preview or Info Box */}
              <div className="space-y-4">
                {generatedContact ? (
                  <AirtableCard className="border-green-200 bg-green-50">
                    <AirtableCardContent className="p-4">
                      <h4 className="font-medium mb-3 text-green-800 text-sm">
                        Contact Preview
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-600/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-green-700 font-semibold text-sm">
                              {generatedContact.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm truncate text-green-800">{generatedContact.name}</h5>
                            {generatedContact.role && (
                              <p className="text-xs text-green-700">{generatedContact.role}</p>
                            )}
                            {generatedContact.current_company && (
                              <p className="text-xs text-green-600">{generatedContact.current_company}</p>
                            )}
                            {generatedContact.location && (
                              <p className="text-xs text-green-600">{generatedContact.location}</p>
                            )}
                          </div>
                        </div>
                        
                        {generatedContact.bio_summary && (
                          <div>
                            <p className="text-xs font-medium mb-1 text-green-800">Background</p>
                            <p className="text-xs text-green-700 leading-relaxed">
                              {generatedContact.bio_summary}
                            </p>
                          </div>
                        )}
                        
                        {generatedContact.how_i_can_help && (
                          <div>
                            <p className="text-xs font-medium mb-1 text-green-800">How I Can Help</p>
                            <p className="text-xs text-green-700 leading-relaxed">
                              {generatedContact.how_i_can_help}
                            </p>
                          </div>
                        )}
                        
                        {generatedContact.email && (
                          <div>
                            <p className="text-xs font-medium mb-1 text-green-800">Email</p>
                            <p className="text-xs text-green-600">{generatedContact.email}</p>
                          </div>
                        )}
                        
                        {generatedContact.linkedin_url && (
                          <div>
                            <p className="text-xs font-medium mb-1 text-green-800">LinkedIn</p>
                            <a 
                              href={generatedContact.linkedin_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:underline"
                            >
                              View Profile
                            </a>
                          </div>
                        )}

                        <PrimaryAction
                          onClick={handleCreateContact}
                          disabled={isCreating}
                          className="w-full mt-4"
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
                      </div>
                    </AirtableCardContent>
                  </AirtableCard>
                ) : (
                  <AirtableCard className="bg-blue-50 border-blue-200">
                    <AirtableCardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-blue-800">
                          <p className="font-medium mb-1">
                            Who should I contact?
                          </p>
                          <p className="mb-1">
                            Whether you are looking for referrals or exploring
                            roles, the most relevant contacts are people you
                            already know: classmates, friends, ex-colleagues.
                          </p>
                          <p>
                            If you're expanding your network, consider reaching
                            out to people in the same function or recruiters. On
                            LinkedIn, try searching for [company name] [function].
                          </p>
                        </div>
                      </div>
                    </AirtableCardContent>
                  </AirtableCard>
                )}
              </div>
            </div>
          ) : (
            /* Contact Created State */
            <AirtableCard className="border-green-200 bg-green-50">
              <AirtableCardContent className="p-3">
                <div className="text-center space-y-2">
                  <div className="text-green-600">✓</div>
                  <h4 className="font-medium text-green-800 text-sm">
                    Contact Created
                  </h4>
                  <p className="text-sm text-green-700">
                    {createdContact.name}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetWorkflow}
                    className="text-xs"
                  >
                    Create Another Contact
                  </Button>
                </div>
              </AirtableCardContent>
            </AirtableCard>
          )}
        </div>

        {/* Message Generation Panel */}
        <div
          className={`space-y-4 p-4 rounded-lg border-2 transition-all ${
            createdContact
              ? "border-primary/20 bg-primary/5"
              : "border-gray-200 bg-gray-50/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Generate Message</h3>
            {!createdContact && (
              <div className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Waiting for contact
              </div>
            )}
          </div>

          {createdContact ? (
            <div className="space-y-4">
              <div className="text-sm p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="font-medium text-blue-800 mb-1">
                  Generating message for:
                </p>
                <p className="text-blue-700">
                  {createdContact.name}
                </p>
              </div>

              <MessageGeneration
                contact={createdContact}
                companyName=""
                isOpen={true}
                onClose={() => {}}
                onMessageSaved={handleMessageSaved}
                embedded={true}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Create a contact first to generate a message
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
