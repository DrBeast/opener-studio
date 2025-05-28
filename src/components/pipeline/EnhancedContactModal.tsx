
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, User, Building, Sparkles } from "lucide-react";
import { FeedbackBox } from "@/components/FeedbackBox";

interface EnhancedContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  onSuccess: () => void;
}

interface ContactData {
  first_name: string;
  last_name: string;
  role: string;
  location: string;
  linkedin_url: string;
  email: string;
  bio_summary: string;
  recent_activity_summary: string;
  how_i_can_help: string;
  user_notes: string;
}

export const EnhancedContactModal: React.FC<EnhancedContactModalProps> = ({
  isOpen,
  onClose,
  companyId,
  companyName,
  onSuccess
}) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'review'>('input');
  const [linkedinBio, setLinkedinBio] = useState('');
  const [generatedContact, setGeneratedContact] = useState<ContactData>({
    first_name: '',
    last_name: '',
    role: '',
    location: '',
    linkedin_url: '',
    email: '',
    bio_summary: '',
    recent_activity_summary: '',
    how_i_can_help: '',
    user_notes: ''
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('input');
      setLinkedinBio('');
      setGeneratedContact({
        first_name: '',
        last_name: '',
        role: '',
        location: '',
        linkedin_url: '',
        email: '',
        bio_summary: '',
        recent_activity_summary: '',
        how_i_can_help: '',
        user_notes: ''
      });
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!user || !linkedinBio.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide LinkedIn profile information.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('add_contact_by_bio', {
        body: {
          companyId,
          linkedinBio: linkedinBio.trim()
        }
      });

      if (error) throw error;

      if (data?.success && data.contact) {
        setGeneratedContact(data.contact);
        setCurrentStep('review');
        toast({
          title: "Contact Generated",
          description: "Please review the generated contact information."
        });
      } else {
        throw new Error(data?.error || 'Failed to generate contact');
      }
    } catch (error: any) {
      console.error("Error generating contact:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate contact from bio.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('contacts').insert({
        user_id: user.id,
        company_id: companyId,
        ...generatedContact
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact added successfully"
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactData, value: string) => {
    setGeneratedContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <FeedbackBox viewName="Enhanced Contact Modal" variant="modal" />
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Contact - {companyName}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'input' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  LinkedIn Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="linkedin-bio">
                    Paste LinkedIn profile information (bio, experience, etc.)
                  </Label>
                  <Textarea
                    id="linkedin-bio"
                    value={linkedinBio}
                    onChange={(e) => setLinkedinBio(e.target.value)}
                    placeholder="Copy and paste the person's LinkedIn profile information including their bio, current role, experience, location, etc."
                    className="min-h-[200px]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !linkedinBio.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Contact
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Generated Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={generatedContact.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={generatedContact.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={generatedContact.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={generatedContact.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input
                      id="linkedin_url"
                      value={generatedContact.linkedin_url}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={generatedContact.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio_summary">Bio Summary</Label>
                  <Textarea
                    id="bio_summary"
                    value={generatedContact.bio_summary}
                    onChange={(e) => handleInputChange('bio_summary', e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="recent_activity_summary">Recent Activity Summary</Label>
                  <Textarea
                    id="recent_activity_summary"
                    value={generatedContact.recent_activity_summary}
                    onChange={(e) => handleInputChange('recent_activity_summary', e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="how_i_can_help">How I Can Help</Label>
                  <Textarea
                    id="how_i_can_help"
                    value={generatedContact.how_i_can_help}
                    onChange={(e) => handleInputChange('how_i_can_help', e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="user_notes">Your Notes</Label>
                  <Textarea
                    id="user_notes"
                    value={generatedContact.user_notes}
                    onChange={(e) => handleInputChange('user_notes', e.target.value)}
                    placeholder="Add any personal notes about this contact..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep('input')}>
                    Back
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={isSubmitting || !generatedContact.first_name || !generatedContact.last_name}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Contact'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
