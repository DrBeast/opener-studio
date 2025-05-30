
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, User, MapPin, Building, Mail, Linkedin, UserPlus, RefreshCw } from "lucide-react";
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
  const [generatedContact, setGeneratedContact] = useState<GeneratedContact | null>(null);

  const handleGenerateContact = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate_contacts', {
        body: { company_id: companyId }
      });

      if (error) throw error;

      if (data?.status === 'success' && data.contacts && data.contacts.length > 0) {
        setGeneratedContact(data.contacts[0]); // Take the first (and only) contact
      } else {
        throw new Error('No contacts generated');
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

  const handleCreateContact = async () => {
    if (!user || !generatedContact) return;

    setIsCreating(true);
    try {
      const nameParts = generatedContact.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          company_id: companyId,
          first_name: firstName,
          last_name: lastName,
          role: generatedContact.role,
          email: generatedContact.email,
          linkedin_url: generatedContact.linkedin_url,
          location: generatedContact.location,
          bio_summary: generatedContact.bio_summary,
          how_i_can_help: generatedContact.how_i_can_help,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact saved successfully",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error creating contact:", error);
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateOneMore = async () => {
    setGeneratedContact(null);
    await handleGenerateContact();
  };

  const handleDiscard = () => {
    setGeneratedContact(null);
  };

  const resetForm = () => {
    setGeneratedContact(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Contact at {companyName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!generatedContact ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Generate Contact</h3>
                <p className="text-muted-foreground mb-6">
                  AI will identify a key individual at {companyName} who can help with your job search based on your background and target criteria.
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
                <h3 className="text-lg font-medium">Generated Contact</h3>
              </div>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-green-200">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <div>
                        <h4 className="font-medium">{generatedContact.name}</h4>
                        {generatedContact.role && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{generatedContact.role}</span>
                          </div>
                        )}
                        {generatedContact.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{generatedContact.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {generatedContact.bio_summary && (
                        <div>
                          <p className="font-medium text-sm text-gray-800 mb-1">Background:</p>
                          <p className="text-sm text-gray-600">{generatedContact.bio_summary}</p>
                        </div>
                      )}
                      
                      {generatedContact.how_i_can_help && (
                        <div>
                          <p className="font-medium text-sm text-blue-800 mb-1">How You Can Help:</p>
                          <p className="text-sm text-blue-600">{generatedContact.how_i_can_help}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {generatedContact.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{generatedContact.email}</span>
                          </div>
                        )}
                        {generatedContact.linkedin_url && (
                          <div className="flex items-center gap-1">
                            <Linkedin className="h-3 w-3" />
                            <span>LinkedIn</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleDiscard}
                    disabled={isCreating}
                  >
                    Discard
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGenerateOneMore}
                    disabled={isGenerating || isCreating}
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Generate one more
                      </>
                    )}
                  </Button>
                </div>
                <Button 
                  onClick={handleCreateContact} 
                  disabled={isCreating}
                  className="flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Contact...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Save Contact
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
