
import React from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ChevronDown, UserPlus, MessageCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactRecommendation } from "@/components/ContactRecommendation";
import { useInteractionOverview } from "@/hooks/useInteractionOverview";
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
  onCreateContact: (companyId: string) => void;
  onContactClick: (contactId: string) => void;
  onGenerateMessage: (contactId: string) => void;
}

const InteractionOverviewCell = ({ companyId }: { companyId: string }) => {
  const { overview, isLoading, error, regenerateOverview } = useInteractionOverview(companyId);

  console.log(`InteractionOverviewCell for ${companyId}:`, { overview, isLoading, error });

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
        <div>No overview available</div>
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
          {overview.pastCount !== undefined && overview.plannedCount !== undefined && 
            ` (${overview.pastCount} past, ${overview.plannedCount} planned)`
          }
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
  onCreateContact,
  onContactClick,
  onGenerateMessage
}: EnhancedCompaniesTableProps) => {
  const highlightAnimation = `
    @keyframes highlightFade {
      0% { background-color: rgba(var(--primary-rgb), 0.3); }
      100% { background-color: transparent; }
    }
  `;

  const abbreviateRole = (role: string): string => {
    if (!role) return '';
    
    const abbreviations: { [key: string]: string } = {
      'Chief Executive Officer': 'CEO',
      'Chief Operating Officer': 'COO',
      'Chief Technology Officer': 'CTO',
      'Chief Financial Officer': 'CFO',
      'Chief Marketing Officer': 'CMO',
      'Chief Human Resources Officer': 'CHRO',
      'Chief Product Officer': 'CPO',
      'Chief Data Officer': 'CDO',
      'Chief Security Officer': 'CSO',
      'Vice President': 'VP',
      'Senior Vice President': 'SVP',
      'Executive Vice President': 'EVP',
      'Vice President of Product': 'VP Product',
      'Vice President of Engineering': 'VP Engineering',
      'Vice President of Sales': 'VP Sales',
      'Vice President of Marketing': 'VP Marketing',
      'Senior Director': 'Sr Director',
      'Senior Manager': 'Sr Manager',
      'Senior Engineer': 'Sr Engineer',
      'Senior Developer': 'Sr Developer',
      'Senior Software Engineer': 'Sr SWE',
      'Software Engineer': 'SWE',
      'Product Manager': 'PM',
      'Senior Product Manager': 'Sr PM',
      'Principal Product Manager': 'Principal PM',
      'Engineering Manager': 'EM',
      'Senior Engineering Manager': 'Sr EM',
      'Technical Lead': 'Tech Lead',
      'Lead Engineer': 'Lead Eng',
      'Staff Engineer': 'Staff Eng',
      'Principal Engineer': 'Principal Eng',
      'Distinguished Engineer': 'Distinguished Eng',
      'Human Resources': 'HR',
      'Business Development': 'Biz Dev',
      'Customer Success': 'CS',
      'Account Manager': 'AM',
      'Senior Account Manager': 'Sr AM',
      'Sales Representative': 'Sales Rep',
      'Business Analyst': 'BA',
      'Data Scientist': 'Data Scientist',
      'Data Analyst': 'Data Analyst',
      'UX Designer': 'UX Designer',
      'UI Designer': 'UI Designer',
      'Product Designer': 'Product Designer',
      'Marketing Manager': 'Marketing Mgr',
      'Content Manager': 'Content Mgr',
      'Operations Manager': 'Ops Mgr',
      'Project Manager': 'Project Mgr',
      'Program Manager': 'Program Mgr',
      'Recruiter': 'Recruiter',
      'Talent Acquisition': 'TA'
    };

    if (abbreviations[role]) {
      return abbreviations[role];
    }

    let abbreviated = role;
    Object.entries(abbreviations).forEach(([full, abbrev]) => {
      abbreviated = abbreviated.replace(new RegExp(full, 'gi'), abbrev);
    });

    if (abbreviated.length > 15) {
      abbreviated = abbreviated.substring(0, 15) + '...';
    }

    return abbreviated;
  };

  const formatContacts = (contacts?: any[]) => {
    if (!contacts || contacts.length === 0) return null;

    const sortedContacts = [...contacts].sort((a, b) => {
      const dateA = a.latest_interaction_date ? new Date(a.latest_interaction_date).getTime() : 0;
      const dateB = b.latest_interaction_date ? new Date(b.latest_interaction_date).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 2);

    return sortedContacts.map(contact => {
      const firstName = contact.first_name || '';
      const lastInitial = contact.last_name ? contact.last_name.charAt(0) + '.' : '';
      const abbreviatedRole = contact.role ? abbreviateRole(contact.role) : '';

      return {
        id: contact.contact_id,
        displayName: `${firstName} ${lastInitial}`.trim(),
        role: abbreviatedRole
      };
    });
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
  }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  const PriorityDropdown = ({
    company
  }: {
    company: Company;
  }) => {
    const otherPriorities = getPriorityOptions(company.user_priority);

    if (otherPriorities.length === 0) {
      return (
        <span className={cn(
          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border cursor-pointer transition-colors",
          getPriorityColor(company.user_priority)
        )}>
          {company.user_priority || 'Maybe'}
        </span>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border cursor-pointer transition-colors gap-1",
              getPriorityColor(company.user_priority)
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {company.user_priority || 'Maybe'}
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-20 p-1">
          {otherPriorities.map((priority) => (
            <DropdownMenuItem
              key={priority}
              onClick={(e) => {
                e.stopPropagation();
                onSetPriority(company.company_id, priority);
              }}
              className="p-1 hover:bg-transparent focus:bg-transparent"
            >
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border cursor-pointer transition-colors w-full justify-center",
                getPriorityColor(priority)
              )}>
                {priority}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <>
      <style>{highlightAnimation}</style>
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox
                    checked={selectedCompanies.size === companies.length && companies.length > 0}
                    onCheckedChange={onSelectAll}
                  />
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
                <TableHead className="w-64">Interactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => {
                const isNewCompany = newCompanyIds.includes(company.company_id);
                const isSelected = selectedCompanies.has(company.company_id);
                const contactsData = formatContacts(company.contacts);
                const existingContactsCount = company.contacts?.length || 0;

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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <PriorityDropdown company={company} />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm leading-tight">{company.name}</div>
                        {company.industry && (
                          <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                            {company.industry}
                          </div>
                        )}
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
                    <TableCell className="">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="text-blue-500">
                            <ContactRecommendation 
                              companyId={company.company_id} 
                              companyName={company.name}
                              existingContactsCount={existingContactsCount}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-3 shrink-0 hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateContact(company.company_id);
                            }}
                            title="Add contact manually"
                          >
                            <UserPlus className="h-6 w-6 text-blue-500" style={{ transform: 'scale(2)' }} />
                          </Button>
                        </div>
                        
                        <div className="text-sm min-w-0">
                          {contactsData && contactsData.length > 0 ? (
                            <div className="space-y-2">
                              {contactsData.map((contact) => (
                                <div key={contact.id} className="flex items-center gap-2">
                                  <div className="flex-1 min-w-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onContactClick(contact.id);
                                      }}
                                      className="block text-left text-base font-medium text-primary hover:underline w-full truncate"
                                    >
                                      {contact.displayName}
                                    </button>
                                    {contact.role && (
                                      <div className="text-xs text-muted-foreground truncate">
                                        {contact.role}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="p-3 shrink-0 hover:bg-primary/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onGenerateMessage(contact.id);
                                    }}
                                    title="Generate message for this contact"
                                  >
                                    <MessageCircle className="h-6 w-6 text-blue-500" style={{ transform: 'scale(2)' }} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No contacts</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <InteractionOverviewCell companyId={company.company_id} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};
