import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/design-system/modals";
import { OutlineAction } from "@/components/ui/design-system";
import { AddContact } from "./AddContact";
import { useCompanies } from "@/hooks/useCompanies";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  companyName?: string;
  onSuccess: () => void;
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
}: AddContactModalProps) => {
  const { companies } = useCompanies();
  const [createdContact, setCreatedContact] = useState<CreatedContact | null>(
    null
  );

  const handleContactCreated = (newContact: CreatedContact) => {
    setCreatedContact(newContact);
    onSuccess();
  };

  const handleClose = () => {
    setCreatedContact(null);
    onClose();
  };

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
          companies={companies || []}
          onContactCreated={handleContactCreated}
          createdContact={createdContact}
        />
      </div>
    </Modal>
  );
};
