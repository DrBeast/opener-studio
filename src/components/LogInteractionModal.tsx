import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/airtable-ds/input";
import { DsTextarea } from "@/components/ui/design-system";
import { Label } from "@/components/ui/airtable-ds/label";
import { Badge } from "@/components/ui/airtable-ds/badge";
import { X, Plus, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/airtable-ds/sonner";
import { format } from "date-fns";
import { Modal } from "@/components/ui/design-system/modals";
import { PrimaryAction, OutlineAction } from "@/components/ui/design-system";
import { interactionDescriptionSchema } from "@/lib/validation";
import { TextCounter } from "@/components/ui/TextCounter";

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface LogInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  availableContacts: ContactData[];
  preSelectedContact?: ContactData;
  onSuccess: () => void;
}

const SUGGESTION_CHIPS = [
  "Email sent",
  "Applied for a role",
  "LinkedIn connection request",
  "Comment",
  "Face-to-face conversation",
  "Met at conference",
  "Introduced by another contact",
];

export const LogInteractionModal = ({
  isOpen,
  onClose,
  companyId,
  companyName,
  availableContacts,
  preSelectedContact,
  onSuccess,
}: LogInteractionModalProps) => {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedContacts, setSelectedContacts] = useState<ContactData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize selected contacts based on context
  useEffect(() => {
    if (preSelectedContact) {
      setSelectedContacts([preSelectedContact]);
    } else {
      setSelectedContacts([]);
    }
  }, [preSelectedContact, isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setDescription("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      if (preSelectedContact) {
        setSelectedContacts([preSelectedContact]);
      } else {
        setSelectedContacts([]);
      }
    }
  }, [isOpen, preSelectedContact]);

  const handleChipClick = (chipText: string) => {
    // Insert the chip text at the current cursor position or append it
    const textarea = document.querySelector(
      'textarea[name="description"]'
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = description;

      // Add space if there's existing text and it doesn't end with a space
      const prefix =
        currentText &&
        !currentText.endsWith(" ") &&
        start === currentText.length
          ? " "
          : "";
      const newText =
        currentText.substring(0, start) +
        prefix +
        chipText +
        currentText.substring(end);

      setDescription(newText);

      // Set cursor position after the inserted text
      setTimeout(() => {
        const newCursorPos = start + prefix.length + chipText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    } else {
      // Fallback if textarea not found
      const prefix = description && !description.endsWith(" ") ? " " : "";
      setDescription((prev) => prev + prefix + chipText);
    }
  };

  const addContact = (contact: ContactData) => {
    if (!selectedContacts.find((c) => c.contact_id === contact.contact_id)) {
      setSelectedContacts((prev) => [...prev, contact]);
    }
  };

  const removeContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.filter((c) => c.contact_id !== contactId)
    );
  };

  const availableToAdd = availableContacts.filter(
    (contact) =>
      !selectedContacts.find(
        (selected) => selected.contact_id === contact.contact_id
      )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description.trim()) return;

    // Validate description using Zod schema
    const validationResult = interactionDescriptionSchema.safeParse(
      description.trim()
    );

    if (!validationResult.success) {
      const errors = validationResult.error.format();
      toast.error(
        errors._errors[0] || "Description must be less than 5,000 characters"
      );
      return;
    }

    setIsLoading(true);
    try {
      // Create the base interaction data
      const interactionData = {
        user_id: user.id,
        company_id: companyId,
        description: description.trim(),
        interaction_type: "Log",
        interaction_date: new Date(date).toISOString(),
        follow_up_completed: true,
        // If we have exactly one contact selected, associate it
        contact_id:
          selectedContacts.length === 1 ? selectedContacts[0].contact_id : null,
      };

      const { error } = await supabase
        .from("interactions")
        .insert(interactionData);

      if (error) throw error;

      // If multiple contacts selected, create additional interaction records
      if (selectedContacts.length > 1) {
        const additionalInteractions = selectedContacts
          .slice(1)
          .map((contact) => ({
            ...interactionData,
            contact_id: contact.contact_id,
          }));

        const { error: multiError } = await supabase
          .from("interactions")
          .insert(additionalInteractions);

        if (multiError) throw multiError;
      }

      toast.success("Interaction logged successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error logging interaction:", error);
      toast.error("Failed to log interaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Interaction"
      description={`with ${companyName}`}
      icon={<MessageSquare />}
      className="sm:max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="description">Description</Label>
          <div className="space-y-2">
            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="inline-flex items-center rounded-full bg-muted hover:bg-muted/80 px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Description Textarea */}
            <DsTextarea
              tone="white"
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
              rows={3}
              required
            />
            <TextCounter text={description} maxChars={5000} showChars={true} />
          </div>
        </div>

        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Contact Association */}
        <div>
          <Label>Associated Contacts</Label>
          <div className="space-y-2">
            {/* Selected Contacts */}
            {selectedContacts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedContacts.map((contact) => (
                  <Badge
                    key={contact.contact_id}
                    variant="secondary"
                    className="gap-1"
                  >
                    {contact.first_name} {contact.last_name}
                    <button
                      type="button"
                      onClick={() => removeContact(contact.contact_id)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Contact Options */}
            {availableToAdd.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableToAdd.map((contact) => (
                  <button
                    key={contact.contact_id}
                    type="button"
                    onClick={() => addContact(contact)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 hover:bg-primary/20 px-3 py-1 text-xs font-medium text-primary transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    {contact.first_name} {contact.last_name}
                  </button>
                ))}
              </div>
            )}

            {selectedContacts.length === 0 && availableToAdd.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No contacts available for this company
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <OutlineAction type="button" onClick={onClose}>
            Cancel
          </OutlineAction>
          <PrimaryAction
            type="submit"
            disabled={isLoading || !description.trim()}
          >
            {isLoading ? "Logging..." : "Log Interaction"}
          </PrimaryAction>
        </div>
      </form>
    </Modal>
  );
};
