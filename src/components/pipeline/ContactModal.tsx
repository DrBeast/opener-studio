
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { UserPlus } from "lucide-react";

// Design System Imports
import {
  ActionModal,
  PrimaryAction,
  OutlineAction
} from "@/components/ui/design-system";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess: () => void;
}

export const ContactModal = ({
  isOpen,
  onClose,
  companyId,
  onSuccess
}: ContactModalProps) => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firstName) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          company_id: companyId,
          first_name: firstName,
          last_name: lastName,
          role,
          email: email || null,
          linkedin_url: linkedinUrl || null,
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
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setRole('');
    setEmail('');
    setLinkedinUrl('');
  };

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Contact"
      icon={<UserPlus />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g., Software Engineer, HR Manager"
            className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Optional"
            className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div>
          <Label htmlFor="linkedin" className="text-sm font-medium text-gray-700">LinkedIn URL</Label>
          <Input
            id="linkedin"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="Optional"
            className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <OutlineAction type="button" onClick={onClose}>
            Cancel
          </OutlineAction>
          <PrimaryAction type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Contact'}
          </PrimaryAction>
        </div>
      </form>
    </ActionModal>
  );
};
