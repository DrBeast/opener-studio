
import React from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Trash, 
  Star, 
  CircleDashed, 
  CircleDot,
  ArrowUpDown,
  Plus,
  Calendar,
  MessageSquare,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Company } from '@/hooks/useCompanies';

interface EnhancedCompaniesTableProps {
  companies: Company[];
  onCompanyClick: (company: Company) => void;
  onSetPriority: (companyId: string, priority: string) => void;
  onBlacklist: (companyId: string) => void;
  newCompanyIds: string[];
  highlightNew: boolean;
  selectedCompanies: Set<string>;
  onSelectCompany: (companyId: string) => void;
  onSelectAll: () => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onLogInteraction: (companyId: string) => void;
  onScheduleAction: (companyId: string) => void;
  onCreateContact: (companyId: string) => void;
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
  onLogInteraction,
  onScheduleAction,
  onCreateContact
}: EnhancedCompaniesTableProps) => {
  const highlightAnimation = `
    @keyframes highlightFade {
      0% { background-color: rgba(var(--primary-rgb), 0.3); }
      100% { background-color: transparent; }
    }
  `;

  const formatContacts = (contacts?: any[]) => {
    if (!contacts || contacts.length === 0) return '-';
    
    const sortedContacts = [...contacts]
      .sort((a, b) => {
        const dateA = a.latest_interaction_date ? new Date(a.latest_interaction_date).getTime() : 0;
        const dateB = b.latest_interaction_date ? new Date(b.latest_interaction_date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
    
    return sortedContacts.map(contact => {
      const firstName = contact.first_name || '';
      const lastInitial = contact.last_name ? contact.last_name.charAt(0) : '';
      return `${firstName} ${lastInitial}`;
    }).join(', ');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return '-';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Top': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Maybe': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <>
      <style>{highlightAnimation}</style>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedCompanies.size === companies.length && companies.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead className="w-20">
                <SortButton field="priority">Priority</SortButton>
              </TableHead>
              <TableHead className="w-48">
                <SortButton field="name">Company</SortButton>
              </TableHead>
              <TableHead className="hidden lg:table-cell w-64">Description</TableHead>
              <TableHead className="hidden md:table-cell w-32">Location</TableHead>
              <TableHead className="hidden lg:table-cell w-24">WFH Policy</TableHead>
              <TableHead className="hidden xl:table-cell w-48">Match Reasoning</TableHead>
              <TableHead className="w-32">Contacts</TableHead>
              <TableHead className="w-40">Latest Update</TableHead>
              <TableHead className="w-40">Follow-up</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => {
              const isNewCompany = newCompanyIds.includes(company.company_id);
              const isSelected = selectedCompanies.has(company.company_id);
              return (
                <TableRow 
                  key={company.company_id} 
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    isNewCompany && highlightNew ? "animate-[highlightFade_3s_ease-out]" : "",
                    isSelected ? "bg-muted/20" : ""
                  )}
                  onClick={() => onCompanyClick(company)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectCompany(company.company_id)}
                    />
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border",
                      getPriorityColor(company.user_priority)
                    )}>
                      {company.user_priority || 'Maybe'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{company.name}</div>
                      {company.industry && (
                        <div className="text-sm text-muted-foreground">{company.industry}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="max-w-xs truncate text-sm">
                      {company.ai_description || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {company.hq_location || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {company.wfh_policy || '-'}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="max-w-xs truncate text-sm">
                      {company.ai_match_reasoning || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{formatContacts(company.contacts)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateContact(company.company_id);
                        }}
                      >
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        {company.latest_update ? (
                          <div>
                            <div className="text-sm truncate max-w-32">
                              {company.latest_update.description}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(company.latest_update.interaction_date)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No updates</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLogInteraction(company.company_id);
                        }}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        {company.next_followup ? (
                          <div>
                            <div className="text-sm truncate max-w-32">
                              {company.next_followup.description}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(company.next_followup.follow_up_due_date)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No follow-ups</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleAction(company.company_id);
                        }}
                      >
                        <Calendar className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onSetPriority(company.company_id, "Top");
                        }}>
                          <Star className="mr-2 h-4 w-4 text-yellow-500" />
                          Mark as Top
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onSetPriority(company.company_id, "Medium");
                        }}>
                          <CircleDot className="mr-2 h-4 w-4 text-blue-500" />
                          Mark as Medium
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onSetPriority(company.company_id, "Maybe");
                        }}>
                          <CircleDashed className="mr-2 h-4 w-4 text-gray-500" />
                          Mark as Maybe
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onBlacklist(company.company_id);
                        }}>
                          <Trash className="mr-2 h-4 w-4 text-red-500" />
                          Remove
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
    </>
  );
};
