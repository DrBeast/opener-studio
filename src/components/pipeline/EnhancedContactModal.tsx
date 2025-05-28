
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Loader2, User, MapPin, Building, Mail, Linkedin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { LinkedInQuerySuggestions } from "./LinkedInQuerySuggestions";

interface EnhancedContactModalProps {
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

export const EnhancedContactModal = ({
  isOpen,
  onClose,
  companyId,
  companyName,
  onSuccess
}: EnhancedContactModalProps) => {
  const { user } = useAuth();
  const [linkedinBio, setLinkedinBio] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedContact, setGeneratedContact] = useState<GeneratedContact | null>(null);

  const handleGenerateContact = async () => {
    if (!user || !linkedinBio.trim()) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('add_contact_by_bio', {
        body: { 
          company_id: companyId,
          linkedin_bio: linkedinBio.trim()
        }
      });

      if (error) throw error;

      if (data?.contact) {
        setGeneratedContact(data.contact);
      } else {
        throw new Error('No contact data received');
      }
    } catch (error: any) {
      console.error("Error generating contact:", error);
      toast({
        title: "Error",
        description: "Failed to generate contact information",
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
        description: "Contact created successfully",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error creating contact:", error);
      toast({
        title: "Error",
        description: "Failed to create contact",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setLinkedinBio('');
    setGeneratedContact(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Contact - {companyName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Box */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">How to Find the Right Contacts</p>
                  <p className="mb-2">
                    Start with your existing network. Provide their LinkedIn bios, and AI will do the rest. 
                    To expand into new cold contacts, it works best to identify contacts by searching on LinkedIn 
                    for people in your function around and above your level, recruiters who posted relevant roles, 
                    or general business managers.
                  </p>
                  <p className="font-medium">Feel free to use the suggested queries below:</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn Query Suggestions */}
          <LinkedInQuerySuggestions companyName={companyName} />

          {/* LinkedIn Bio Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="linkedinBio">LinkedIn Profile Content</Label>
              <div className="mt-1 mb-2 text-sm text-muted-foreground">
                It is essential to provide contact's professional background. We will use it to craft personalized 
                messages to them. An easy way to do this is to go on their LinkedIn profile page, copy everything 
                (Ctrl+A, Ctrl+C) and paste it here (Ctrl+V). Don't worry about formatting - AI will figure it out.
              </div>
              <Textarea
                id="linkedinBio"
                value={linkedinBio}
                onChange={(e) => setLinkedinBio(e.target.value)}
                placeholder="Paste the contact's LinkedIn profile content here..."
                className="min-h-[150px]"
              />
            </div>

            <Button 
              onClick={handleGenerateContact} 
              disabled={!linkedinBio.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Contact...
                </>
              ) : (
                'Generate Contact'
              )}
            </Button>
          </div>

          {/* Generated Contact Preview */}
          {generatedContact && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 text-green-800">Generated Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{generatedContact.name}</span>
                  </div>
                  
                  {generatedContact.role && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-green-600" />
                      <span>{generatedContact.role}</span>
                    </div>
                  )}
                  
                  {generatedContact.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span>{generatedContact.location}</span>
                    </div>
                  )}
                  
                  {generatedContact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{generatedContact.email}</span>
                    </div>
                  )}
                  
                  {generatedContact.linkedin_url && (
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-green-600" />
                      <span className="text-sm truncate">{generatedContact.linkedin_url}</span>
                    </div>
                  )}
                  
                  {generatedContact.bio_summary && (
                    <div>
                      <p className="font-medium text-sm text-green-800 mb-1">Background Summary:</p>
                      <p className="text-sm">{generatedContact.bio_summary}</p>
                    </div>
                  )}
                  
                  {generatedContact.how_i_can_help && (
                    <div>
                      <p className="font-medium text-sm text-green-800 mb-1">How You Can Help:</p>
                      <p className="text-sm">{generatedContact.how_i_can_help}</p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleCreateContact} 
                  disabled={isCreating}
                  className="w-full mt-4"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Contact...
                    </>
                  ) : (
                    'Create Contact'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
