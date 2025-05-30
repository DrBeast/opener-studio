
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, User, MapPin, Building, Mail, Linkedin, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

interface GenerateContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  onSuccess: () => void;
}

interface GeneratedContact {
  name: string;
  role?: string;
  location?: string;
  linkedin_url?: string;
  email?: string;
  bio_summary?: string;
  how_i_can_help?: string;
}

export const GenerateContactsModal = ({
  isOpen,
  onClose,
  companyId,
  companyName,
  onSuccess
}: GenerateContactsModalProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedContacts, setGeneratedContacts] = useState<GeneratedContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());

  const handleGenerateContacts = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate_contacts', {
        body: { company_id: companyId }
      });

      if (error) throw error;

      if (data?.status === 'success' && data.contacts) {
        setGeneratedContacts(data.contacts);
        // Select all contacts by default
        setSelectedContacts(new Set(data.contacts.map((_: any, index: number) => index)));
      } else {
        throw new Error('No contacts generated');
      }
    } catch (error: any) {
      console.error("Error generating contacts:", error);
      toast({
        title: "Error",
        description: "Failed to generate contacts",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateContacts = async () => {
    if (!user || generatedContacts.length === 0) return;

    setIsCreating(true);
    try {
      const contactsToCreate = Array.from(selectedContacts).map(index => {
        const contact = generatedContacts[index];
        const nameParts = contact.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
          user_id: user.id,
          company_id: companyId,
          first_name: firstName,
          last_name: lastName,
          role: contact.role,
          email: contact.email,
          linkedin_url: contact.linkedin_url,
          location: contact.location,
          bio_summary: contact.bio_summary,
          how_i_can_help: contact.how_i_can_help,
        };
      });

      const { error } = await supabase
        .from('contacts')
        .insert(contactsToCreate);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Created ${contactsToCreate.length} contact(s) successfully`,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error creating contacts:", error);
      toast({
        title: "Error",
        description: "Failed to create contacts",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleContactSelection = (index: number) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedContacts(newSelected);
  };

  const resetForm = () => {
    setGeneratedContacts([]);
    setSelectedContacts(new Set());
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Contacts at {companyName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {generatedContacts.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Generate Contacts</h3>
                <p className="text-muted-foreground mb-6">
                  AI will identify key individuals at {companyName} who can help with your job search based on your background and target criteria.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">How AI identifies the right contacts:</p>
                    <p className="mb-2">
                      Our AI analyzes your professional background, skills, and target criteria to identify individuals who would be most relevant for your networking goals. This goes beyond simple title matching to find decision-makers and influencers who align with your career objectives.
                    </p>
                    <p className="font-medium">Important limitations:</p>
                    <p>
                      We cannot access private LinkedIn profiles or proprietary databases. Suggested contacts are based on publicly available information only. Some companies may have limited public contact data.
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleGenerateContacts} 
                disabled={isGenerating}
                className="w-full max-w-md"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating contacts based on your profile...
                  </>
                ) : (
                  'Generate Contacts'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Generated Contacts ({generatedContacts.length})</h3>
                <div className="text-sm text-muted-foreground">
                  {selectedContacts.size} of {generatedContacts.length} selected
                </div>
              </div>

              <div className="grid gap-4">
                {generatedContacts.map((contact, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all ${
                      selectedContacts.has(index) 
                        ? 'border-green-200 bg-green-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => toggleContactSelection(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            selectedContacts.has(index) ? 'bg-green-200' : 'bg-primary/10'
                          }`}>
                            <User className={`h-4 w-4 ${
                              selectedContacts.has(index) ? 'text-green-600' : 'text-primary'
                            }`} />
                          </div>
                          <div className="space-y-3 flex-1">
                            <div>
                              <h4 className="font-medium">{contact.name}</h4>
                              {contact.role && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Building className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{contact.role}</span>
                                </div>
                              )}
                              {contact.location && (
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{contact.location}</span>
                                </div>
                              )}
                            </div>
                            
                            {contact.bio_summary && (
                              <div>
                                <p className="font-medium text-sm text-gray-800 mb-1">Background:</p>
                                <p className="text-sm text-gray-600">{contact.bio_summary}</p>
                              </div>
                            )}
                            
                            {contact.how_i_can_help && (
                              <div>
                                <p className="font-medium text-sm text-blue-800 mb-1">How You Can Help:</p>
                                <p className="text-sm text-blue-600">{contact.how_i_can_help}</p>
                              </div>
                            )}
                            
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              {contact.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{contact.email}</span>
                                </div>
                              )}
                              {contact.linkedin_url && (
                                <div className="flex items-center gap-1">
                                  <Linkedin className="h-3 w-3" />
                                  <span>LinkedIn</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between gap-4 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateContacts} 
                  disabled={isCreating || selectedContacts.size === 0}
                  className="flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Contacts...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create {selectedContacts.size} Contact(s)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
