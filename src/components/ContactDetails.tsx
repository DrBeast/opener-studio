
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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Save, User } from "lucide-react";

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  location?: string;
  email?: string;
  linkedin_url?: string;
  user_notes?: string;
  bio_summary?: string;
  how_i_can_help?: string;
}

interface ContactDetailsProps {
  contact: ContactData;
  isOpen: boolean;
  onClose: () => void;
  onContactUpdated: () => void;
}

export function ContactDetails({ 
  contact, 
  isOpen, 
  onClose, 
  onContactUpdated 
}: ContactDetailsProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ContactData>(contact);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFormData(contact);
  }, [contact]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          location: formData.location,
          email: formData.email,
          linkedin_url: formData.linkedin_url,
          user_notes: formData.user_notes,
          updated_at: new Date().toISOString()
        })
        .eq('contact_id', contact.contact_id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Contact updated successfully"
      });
      
      onContactUpdated();
      onClose();
    } catch (error: any) {
      console.error("Error updating contact:", error);
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {formData.first_name || ''} {formData.last_name || ''}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                name="role"
                value={formData.role || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                value={formData.linkedin_url || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_notes">Notes</Label>
            <Textarea
              id="user_notes"
              name="user_notes"
              rows={4}
              value={formData.user_notes || ''}
              onChange={handleChange}
              placeholder="Add your notes about this contact..."
            />
          </div>

          {formData.bio_summary && (
            <div className="space-y-2">
              <Label>Bio Summary</Label>
              <div className="rounded-md border p-3 bg-muted/20 text-sm">
                {formData.bio_summary}
              </div>
            </div>
          )}

          {formData.how_i_can_help && (
            <div className="space-y-2">
              <Label>How I Can Help</Label>
              <div className="rounded-md border p-3 bg-primary/5 border-primary/10 text-sm">
                {formData.how_i_can_help}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
