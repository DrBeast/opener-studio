import React from "react";
import { Button } from "@/components/ui/airtable-ds/button";
import { Checkbox } from "@/components/ui/airtable-ds/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/airtable-ds/table";
import { ArrowUpDown, MessageCircle, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContactInteractionOverview } from "@/hooks/useContactInteractionOverview";

interface Contact {
  contact_id: string;
  user_id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  role: string;
  location: string;
  email: string;
  linkedin_url: string;
  user_notes: string;
  bio_summary: string;
  how_i_can_help: string;
  recent_activity_summary: string;
  added_at: string;
  updated_at: string;
  status: "active" | "inactive";
  // Extended with company info from join
  company_name?: string;
  company_industry?: string;
}

interface ContactsTableProps {
  contacts: Contact[];
  onContactClick: (contactId: string) => void;
  onGenerateMessage: (contactId: string) => void;
  selectedContacts: Set<string>;
  onSelectContact: (contactId: string) => void;
  onSelectAll: () => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  onToggleStatus?: (
    contactId: string,
    newStatus: "active" | "inactive"
  ) => void;
}

const ContactInteractionOverviewCell = ({
  contactId,
}: {
  contactId: string;
}) => {
  const { overview, isLoading, error, regenerateOverview } =
    useContactInteractionOverview(contactId);

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
          Generating overview...
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-xs text-red-500">Error: {error}</div>;
  }

  if (!overview) {
    return (
      <div className="text-xs text-muted-foreground">No interactions yet</div>
    );
  }

  return (
    <div className="text-xs leading-relaxed max-w-64">
      <div>{overview.overview}</div>
      {overview.hasInteractions && overview.interactionCount && (
        <div className="text-xs text-muted-foreground mt-1">
          {overview.interactionCount} total
          {overview.pastCount !== undefined &&
            overview.plannedCount !== undefined &&
            ` (${overview.pastCount} past, ${overview.plannedCount} planned)`}
        </div>
      )}
    </div>
  );
};

export const ContactsTable = ({
  contacts,
  onContactClick,
  onGenerateMessage,
  selectedContacts,
  onSelectContact,
  onSelectAll,
  sortField,
  sortDirection,
  onSort,
  onToggleStatus,
}: ContactsTableProps) => {
  const SortButton = ({
    field,
    children,
  }: {
    field: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  const formatContactName = (contact: Contact) => {
    return `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
  };

  const formatCompanyInfo = (contact: Contact) => {
    return contact.company_name || "-";
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  checked={
                    selectedContacts.size === contacts.length &&
                    contacts.length > 0
                  }
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead className="w-[160px]">
                <SortButton field="name">Contact</SortButton>
              </TableHead>
              <TableHead className="min-w-[280px]">Bio Summary</TableHead>
              <TableHead className="min-w-[400px]">How I Can Help</TableHead>
              <TableHead className="min-w-[120px]">
                <SortButton field="latest_interaction">History</SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => {
              const isSelected = selectedContacts.has(contact.contact_id);
              const contactName = formatContactName(contact);
              const companyInfo = formatCompanyInfo(contact);

              return (
                <TableRow
                  key={contact.contact_id}
                  className={cn(
                    "group cursor-pointer hover:bg-muted/50",
                    isSelected ? "bg-muted/20" : ""
                  )}
                  onClick={() => onContactClick(contact.contact_id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() =>
                        onSelectContact(contact.contact_id)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm leading-tight break-words text-primary">
                            {contactName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Building className="h-3 w-3 text-muted-foreground shrink-0" />
                            <div className="text-xs text-muted-foreground break-words">
                              {companyInfo || "-"}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground break-words mt-1">
                            {contact.role || "-"}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-2 shrink-0 border-blue-200 hover:bg-blue-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onGenerateMessage(contact.contact_id);
                          }}
                          title="Generate message for this contact"
                        >
                          <MessageCircle
                            className="h-4 w-4 text-[hsl(var(--primary))]"
                            style={{ transform: "scale(1.5)" }}
                          />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs leading-relaxed max-w-64">
                      {contact.bio_summary || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs leading-relaxed">
                      {contact.how_i_can_help || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ContactInteractionOverviewCell
                      contactId={contact.contact_id}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
