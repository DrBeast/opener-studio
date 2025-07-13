import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ChevronDown,
  MessageCircle,
  RefreshCw,
  User,
  Building,
  MapPin,
  Linkedin,
} from "lucide-react";
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
}

const ContactInteractionOverviewCell = ({ contactId }: { contactId: string }) => {
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
    return (
      <div className="text-xs text-red-500">
        <div>Error: {error}</div>
        <Button
          size="sm"
          variant="ghost"
          className="h-4 w-4 p-0 mt-1"
          onClick={(e) => {
            e.stopPropagation();
            regenerateOverview();
          }}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-xs text-muted-foreground">
        <div>No interactions yet</div>
        <Button
          size="sm"
          variant="ghost"
          className="h-4 w-4 p-0 mt-1"
          onClick={(e) => {
            e.stopPropagation();
            regenerateOverview();
          }}
          title="Generate overview"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
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
      <Button
        size="sm"
        variant="ghost"
        className="h-3 w-3 p-0 mt-1 opacity-50 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          regenerateOverview();
        }}
        title="Regenerate overview"
      >
        <RefreshCw className="h-2 w-2" />
      </Button>
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
    const parts = [];
    if (contact.company_name) parts.push(contact.company_name);
    if (contact.company_industry) parts.push(contact.company_industry);
    return parts.join(" • ");
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
              <TableHead className="min-w-[160px]">
                <SortButton field="name">Contact</SortButton>
              </TableHead>
              <TableHead className="min-w-[140px]">
                <SortButton field="role">Role</SortButton>
              </TableHead>
              <TableHead className="min-w-[180px]">
                <SortButton field="company">Company</SortButton>
              </TableHead>
              <TableHead className="hidden md:table-cell min-w-[120px]">
                Location
              </TableHead>
              <TableHead className="min-w-[250px]">
                Bio Summary
              </TableHead>
              <TableHead className="min-w-[100px]">
                Actions
              </TableHead>
              <TableHead className="min-w-[250px]">
                Interactions
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
                    "cursor-pointer hover:bg-muted/50",
                    isSelected ? "bg-muted/20" : ""
                  )}
                  onClick={() => onContactClick(contact.contact_id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectContact(contact.contact_id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <div className="font-medium text-sm leading-tight">
                          {contactName}
                        </div>
                        {contact.email && (
                          <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                            {contact.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {contact.role || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="text-sm">
                        {companyInfo || "-"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="text-xs">
                        {contact.location || "-"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs leading-relaxed max-w-64">
                      {contact.bio_summary || contact.how_i_can_help || "-"}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
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
                        />
                      </Button>
                      {contact.linkedin_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-2 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(contact.linkedin_url, '_blank');
                          }}
                          title="View LinkedIn profile"
                        >
                          <Linkedin className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ContactInteractionOverviewCell contactId={contact.contact_id} />
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