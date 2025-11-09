import React, { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/design-system/modals";
import { OutlineAction } from "@/components/ui/design-system";
import { AddContact } from "./AddContact";
interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  companyName?: string;
  onSuccess: () => void;
  onContactCreated?: (contact: CreatedContact) => void;
}

interface CreatedContact {
  contact_id: string;
  company_id?: string | null;
  first_name: string;
  last_name: string;
  role: string;
  current_company: string;
  location: string;
  bio_summary: string;
  how_i_can_help: string;
  recent_activity_summary: string;
}

export const AddContactModal = ({
  isOpen,
  onClose,
  companyId,
  companyName,
  onSuccess,
  onContactCreated,
}: AddContactModalProps) => {
  const [createdContact, setCreatedContact] = useState<CreatedContact | null>(
    null
  );

  const handleContactCreated = (newContact: CreatedContact) => {
    setCreatedContact(newContact);
    onSuccess();
    if (onContactCreated) {
      onContactCreated(newContact);
    }
  };

  const handleClose = () => {
    setCreatedContact(null);
    onClose();
  };

  // Reset createdContact whenever modal opens to ensure clean state
  useEffect(() => {
    if (isOpen) {
      setCreatedContact(null);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Contact"
      icon={<UserPlus />}
      description={`${companyName}`}
      className="sm:max-w-2xl"
    >
      <div className="space-y-6">
        <AddContact
          onContactCreated={handleContactCreated}
          createdContact={createdContact}
        />
      </div>
    </Modal>
  );
};
