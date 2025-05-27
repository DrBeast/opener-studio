import React from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Calendar, MessageSquare, UserPlus, ChevronDown } from "lucide-react";
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
    const sortedContacts = [...contacts].sort((a, b) => {
      const dateA = a.latest_interaction_date ? new Date(a.latest_interaction_date).getTime() : 0;
      const dateB = b.latest_interaction_date ? new Date(b.latest_interaction_date).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 2);
    return sortedContacts.map(contact => {
      const firstName = contact.first_name || '';
      const lastInitial = contact.last_name ? contact.last_name.charAt(0) : '';
      return `${firstName} ${lastInitial}`;
    }).join(', ');
  };
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d');
    } catch {
      return '-';
    }
  };
  const formatLocationAndWFH = (location?: string, wfh?: string) => {
    const parts = [];
    if (location) parts.push(location);
    if (wfh) parts.push(wfh);
    return parts.length > 0 ? parts.join(' / ') : '-';
  };
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Top':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case 'Maybe':
        return 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200';
    }
  };
  const getPriorityOptions = (currentPriority?: string) => {
    const priorities = ['Top', 'Medium', 'Maybe'];
    return priorities.filter(p => p !== currentPriority);
  };
  const SortButton = ({
    field,
    children
  }: {
    field: string;
    children: React.ReactNode;
  }) => <button onClick={() => onSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>;
  const PriorityDropdown = ({
    company
  }: {
    company: Company;
  }) => {
    const otherPriorities = getPriorityOptions(company.user_priority);
    if (otherPriorities.length === 0) {
      return <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border cursor-pointer transition-colors", getPriorityColor(company.user_priority))}>
          {company.user_priority || 'Maybe'}
        </span>;
    }
    return <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border cursor-pointer transition-colors gap-1", getPriorityColor(company.user_priority))} onClick={e => e.stopPropagation()}>
            {company.user_priority || 'Maybe'}
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-20 p-1">
          {otherPriorities.map(priority => <DropdownMenuItem key={priority} onClick={e => {
          e.stopPropagation();
          onSetPriority(company.company_id, priority);
        }} className="p-1 hover:bg-transparent focus:bg-transparent">
              <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border cursor-pointer transition-colors w-full justify-center", getPriorityColor(priority))}>
                {priority}
              </span>
            </DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>;
  };
  return <>
      <style>{highlightAnimation}</style>
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox checked={selectedCompanies.size === companies.length && companies.length > 0} onCheckedChange={onSelectAll} />
                </TableHead>
                <TableHead className="w-20">
                  <SortButton field="priority">Priority</SortButton>
                </TableHead>
                <TableHead className="w-44">
                  <SortButton field="name">Company</SortButton>
                </TableHead>
                <TableHead className="w-64">Description</TableHead>
                <TableHead className="hidden md:table-cell w-32">Location / WFH</TableHead>
                <TableHead className="hidden xl:table-cell w-48">Match Reasoning</TableHead>
                <TableHead className="w-28">Contacts</TableHead>
                <TableHead className="w-32">Past Interactions</TableHead>
                <TableHead className="w-32">Planned Interactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map(company => {
              const isNewCompany = newCompanyIds.includes(company.company_id);
              const isSelected = selectedCompanies.has(company.company_id);
              return <TableRow key={company.company_id} className={cn("cursor-pointer hover:bg-muted/50", isNewCompany && highlightNew ? "animate-[highlightFade_3s_ease-out]" : "", isSelected ? "bg-muted/20" : "")} onClick={() => onCompanyClick(company)}>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onCheckedChange={() => onSelectCompany(company.company_id)} />
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <PriorityDropdown company={company} />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm leading-tight">{company.name}</div>
                        {company.industry && <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                            {company.industry}
                          </div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs leading-relaxed max-w-64 break-words">
                        {company.ai_description || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-xs break-words">
                        {formatLocationAndWFH(company.hq_location, company.wfh_policy)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="text-xs leading-relaxed max-w-48 break-words">
                        {company.ai_match_reasoning || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="text-xs min-w-0 flex-1">
                          {formatContacts(company.contacts)}
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={e => {
                      e.stopPropagation();
                      onCreateContact(company.company_id);
                    }}>
                          <UserPlus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="min-w-0 flex-1">
                          {company.latest_update ? <div>
                              <div className="text-xs truncate leading-tight">
                                {company.latest_update.description}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {formatDate(company.latest_update.interaction_date)}
                              </div>
                            </div> : <span className="text-xs text-muted-foreground">No updates</span>}
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={e => {
                      e.stopPropagation();
                      onLogInteraction(company.company_id);
                    }}>
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="min-w-0 flex-1">
                          {company.next_followup ? <div>
                              <div className="text-xs truncate leading-tight">
                                {company.next_followup.description}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {formatDate(company.next_followup.follow_up_due_date)}
                              </div>
                            </div> : <span className="text-xs text-muted-foreground">No follow-ups</span>}
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={e => {
                      e.stopPropagation();
                      onScheduleAction(company.company_id);
                    }}>
                          <Calendar className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>;
            })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>;
};
