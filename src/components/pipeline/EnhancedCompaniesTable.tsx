
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  MapPin,
  Users,
  Calendar,
  MoreHorizontal,
  UserPlus,
  Sparkles,
  MessageCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Company } from "@/hooks/useCompanies";

interface EnhancedCompaniesTableProps {
  companies: Company[];
  onCompanyClick: (company: Company) => void;
  onSetPriority: (companyId: string, priority: string) => void;
  onBlacklist: (companyId: string) => void;
  newCompanyIds: Set<string>;
  highlightNew: boolean;
  selectedCompanies: Set<string>;
  onSelectCompany: (companyId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onCreateContact: (companyId: string) => void;
  onContactClick: (contactId: string) => void;
  onGenerateMessage: (contactId: string) => void;
}

export const EnhancedCompaniesTable = ({
  companies,
  onCompanyClick,
  onSetPriority,
  onBlacklist,
  newCompanyIds,
  highlightNew,
  selectedCompanies,
  onSelectCompany,
  onSelectAll,
  sortField,
  sortDirection,
  onSort,
  onCreateContact,
  onContactClick,
  onGenerateMessage
}: EnhancedCompaniesTableProps) => {
  const allSelected = companies.length > 0 && companies.every(company => selectedCompanies.has(company.company_id));
  const someSelected = selectedCompanies.size > 0 && !allSelected;

  const handleSelectAll = () => {
    onSelectAll(!allSelected);
  };

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium text-left justify-start hover:bg-transparent"
      onClick={() => onSort(field)}
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
      )}
    </Button>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Top': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Maybe': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                ref={(el: HTMLInputElement | null) => {
                  if (el) el.indeterminate = someSelected;
                }}
              />
            </TableHead>
            <TableHead className="min-w-[200px]">
              <SortButton field="name">Company</SortButton>
            </TableHead>
            <TableHead className="min-w-[120px]">
              <SortButton field="priority">Priority</SortButton>
            </TableHead>
            <TableHead className="min-w-[180px]">Contacts</TableHead>
            <TableHead className="min-w-[140px]">
              <SortButton field="latest_update">Latest Update</SortButton>
            </TableHead>
            <TableHead className="min-w-[140px]">
              <SortButton field="next_followup">Next Follow-up</SortButton>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => {
            const isSelected = selectedCompanies.has(company.company_id);
            const isNew = newCompanyIds.has(company.company_id) && highlightNew;
            const contacts = company.contacts || [];

            return (
              <TableRow
                key={company.company_id}
                className={cn(
                  "hover:bg-gray-50 cursor-pointer transition-colors",
                  isSelected && "bg-blue-50",
                  isNew && "bg-green-50 border-l-4 border-l-green-500"
                )}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectCompany(company.company_id, !!checked)}
                  />
                </TableCell>
                
                <TableCell onClick={() => onCompanyClick(company)}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{company.name}</span>
                      {isNew && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    {company.industry && (
                      <div className="text-sm text-gray-600">{company.industry}</div>
                    )}
                    {company.hq_location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {company.hq_location}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell onClick={() => onCompanyClick(company)}>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", getPriorityColor(company.user_priority || 'Maybe'))}
                  >
                    {company.user_priority || 'Maybe'}
                  </Badge>
                </TableCell>

                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCreateContact(company.company_id)}
                        className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCreateContact(company.company_id)}
                        className="h-6 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Generate
                      </Button>
                    </div>
                    
                    {contacts.length > 0 && (
                      <div className="space-y-1">
                        {contacts.slice(0, 2).map((contact) => (
                          <div key={contact.contact_id} className="flex items-center justify-between text-xs">
                            <button
                              onClick={() => onContactClick(contact.contact_id)}
                              className="text-gray-700 hover:text-blue-600 text-left"
                            >
                              {contact.first_name} {contact.last_name}
                              {contact.role && <span className="text-gray-500 ml-1">• {contact.role}</span>}
                            </button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onGenerateMessage(contact.contact_id)}
                              className="h-5 px-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {contacts.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{contacts.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell onClick={() => onCompanyClick(company)}>
                  {company.latest_update?.interaction_date ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {formatDate(company.latest_update.interaction_date)}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px]">
                        {company.latest_update.description}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">None</span>
                  )}
                </TableCell>

                <TableCell onClick={() => onCompanyClick(company)}>
                  {company.next_followup?.follow_up_due_date ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {formatDate(company.next_followup.follow_up_due_date)}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px]">
                        {company.next_followup.description}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">None</span>
                  )}
                </TableCell>

                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => onSetPriority(company.company_id, 'Top')}
                        className="text-red-600"
                      >
                        Set Priority: Top
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onSetPriority(company.company_id, 'Medium')}
                        className="text-yellow-600"
                      >
                        Set Priority: Medium
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onSetPriority(company.company_id, 'Maybe')}
                        className="text-gray-600"
                      >
                        Set Priority: Maybe
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onBlacklist(company.company_id)}
                        className="text-red-600"
                      >
                        Remove from list
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
