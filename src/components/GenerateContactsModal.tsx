
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, User, MapPin, Building, Mail, Linkedin, UserPlus, Sparkles, X } from "lucide-react";
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
  selected?: boolean;
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
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContacts, setGeneratedContacts] = useState<GeneratedContact[]>([]);

  const handleGenerateContact = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate_contacts', {
        body: { company_id: companyId }
      });

      if (error) throw error;

      if (data?.status === 'success' && data.contacts && data.contacts.length > 0) {
        const newContact = { ...data.contacts[0], selected: true };
        setGeneratedContacts(prev => [...prev, newContact]);
      } else {
        throw new Error('No contact generated');
      }
    } catch (error: any) {
      console.error("Error generating contact:", error);
      toast({
        title: "Error",
        description: "Failed to generate contact",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContactSelect = (index: number, checked: boolean) => {
    setGeneratedContacts(prev => 
      prev.map((contact, i) => 
        i === index ? { ...contact, selected: checked } : contact
      )
    );
  };

  const handleSelectAll = () => {
    setGeneratedContacts(prev => 
      prev.map(contact => ({ ...contact, selected: true }))
    );
  };

  const handleDeselectAll = () => {
    setGeneratedContacts(prev => 
      prev.map(contact => ({ ...contact, selected: false }))
    );
  };

  const handleSaveSelected = async () => {
    if (!user) return;

    const selectedContacts = generatedContacts.filter(contact => contact.selected);
    
    if (selectedContacts.length === 0) {
      toast({
        title: "No contacts selected",
        description: "Please select at least one contact to save",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const contactsToCreate = selectedContacts.map(contact => {
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
        description: `${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''} saved successfully`,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error saving contacts:", error);
      toast({
        title: "Error",
        description: "Failed to save contacts",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setGeneratedContacts([]);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const selectedCount = generatedContacts.filter(contact => contact.selected).length;

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
                <h3 className="text-lg font-medium mb-2">Generate Contact</h3>
                <p className="text-muted-foreground mb-6">
                  AI will identify a key individual at {companyName} who can help with your job search based on your background and target criteria.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">How AI helps:</p>
                    <p className="mb-2">
                      Contacts are selected based on your specific background and skills in relation to this company's needs, not just title matching. The AI considers your experience and identifies decision-makers and influencers who would be most relevant to your career goals.
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleGenerateContact} 
                disabled={isGenerating}
                className="w-full max-w-md"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating contact based on your profile...
                  </>
                ) : (
                  'Generate Contact'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">AI has identified key individuals who can potentially facilitate your application, provide insights into opportunities, or influence hiring decisions.</h3>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  Deselect All
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedCount} of {generatedContacts.length} selected
                </span>
              </div>

              <div className="space-y-3">
                {generatedContacts.map((contact, index) => (
                  <Card key={index} className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={contact.selected || false}
                            onCheckedChange={(checked) => handleContactSelect(index, checked as boolean)}
                            className="mt-1"
                          />
                          <div className="p-2 rounded-lg bg-green-200">
                            <User className="h-4 w-4 text-green-600" />
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
                                <p className="font-medium text-sm text-gray-800 mb-1">Background Summary:</p>
                                <p className="text-sm text-gray-600">{contact.bio_summary}</p>
                              </div>
                            )}
                            
                            {contact.how_i_can_help && (
                              <div>
                                <p className="font-medium text-sm text-blue-800 mb-1">How I Can Help:</p>
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
                                  <span>LinkedIn Profile</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-4"
                        >
                          Generate Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-center justify-center">
                <Button 
                  variant="outline"
                  onClick={handleGenerateContact} 
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate More
                    </>
                  )}
                </Button>
              </div>

              <div className="flex justify-between gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleDiscard}
                  className="flex items-center gap-2"
                >
                  Cancel
                </Button>
                
                <Button 
                  onClick={handleSaveSelected} 
                  disabled={isSaving || selectedCount === 0}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Save Selected Contacts ({selectedCount})
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
