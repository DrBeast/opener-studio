
import React from 'react';
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { EnhancedStatusBadge } from "@/components/ui/enhanced-status-badge";
import { 
  AirtableTable,
  AirtableTableHeader,
  AirtableTableBody,
  AirtableTableRow,
  AirtableTableHead,
  AirtableTableCell
} from "@/components/ui/airtable-table";
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
  MessageSquare,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Company } from '@/hooks/useCompanies';

interface CompaniesTableProps {
  companies: Company[];
  onCompanyClick: (company: Company) => void;
  onSetPriority: (companyId: string, priority: string) => void;
  onBlacklist: (companyId: string) => void;
  newCompanyIds: string[];
  highlightNew: boolean;
}

export const CompaniesTable = ({
  companies,
  onCompanyClick,
  onSetPriority,
  onBlacklist,
  newCompanyIds,
  highlightNew
}: CompaniesTableProps) => {
  const getPriorityBadgeVariant = (priority: string | null) => {
    switch (priority) {
      case "Top":
        return "top";
      case "Medium":
        return "medium";
      case "Maybe":
        return "maybe";
      default:
        return "maybe";
    }
  };

  return (
    <AirtableTable>
      <AirtableTableHeader>
        <AirtableTableRow>
          <AirtableTableHead className="w-[300px]">Company Name</AirtableTableHead>
          <AirtableTableHead className="hidden md:table-cell">Industry</AirtableTableHead>
          <AirtableTableHead className="hidden lg:table-cell">Location</AirtableTableHead>
          <AirtableTableHead className="hidden lg:table-cell">Description</AirtableTableHead>
          <AirtableTableHead className="w-[120px]">Priority</AirtableTableHead>
          <AirtableTableHead className="w-[200px]">Actions</AirtableTableHead>
        </AirtableTableRow>
      </AirtableTableHeader>
      <AirtableTableBody>
        {companies.map((company) => {
          const isNewCompany = newCompanyIds.includes(company.company_id);
          return (
            <AirtableTableRow 
              key={company.company_id} 
              isNew={isNewCompany && highlightNew}
              onClick={() => onCompanyClick(company)}
            >
              <AirtableTableCell className="font-medium">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-medium text-sm">
                      {company.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-900">{company.name}</span>
                </div>
              </AirtableTableCell>
              <AirtableTableCell className="hidden md:table-cell text-gray-600">
                {company.industry || "-"}
              </AirtableTableCell>
              <AirtableTableCell className="hidden lg:table-cell text-gray-600">
                {company.hq_location || "-"}
              </AirtableTableCell>
              <AirtableTableCell className="hidden lg:table-cell text-gray-600 max-w-xs">
                <div className="truncate" title={company.ai_description || ""}>
                  {company.ai_description || "-"}
                </div>
              </AirtableTableCell>
              <AirtableTableCell>
                {company.user_priority && (
                  <EnhancedStatusBadge 
                    variant={getPriorityBadgeVariant(company.user_priority)}
                    size="sm"
                  >
                    {company.user_priority}
                  </EnhancedStatusBadge>
                )}
              </AirtableTableCell>
              <AirtableTableCell>
                <div className="flex items-center gap-2">
                  <ActionButton
                    variant="outline"
                    size="sm"
                    icon={UserPlus}
                    onClick={(e) => {
                      e.stopPropagation();
                      // This will be connected to your existing add contact functionality
                      console.log("Add contact for", company.company_id);
                    }}
                  >
                    Add Contact
                  </ActionButton>
                  <ActionButton
                    variant="outline"
                    size="sm"
                    icon={MessageSquare}
                    onClick={(e) => {
                      e.stopPropagation();
                      // This will be connected to your existing generate message functionality
                      console.log("Generate message for", company.company_id);
                    }}
                  >
                    Message
                  </ActionButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded-md">
                      <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2">
                        Set Priority
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetPriority(company.company_id, "Top");
                        }}
                        className="text-sm text-gray-700 hover:bg-gray-50 px-3 py-2"
                      >
                        <Star className="mr-2 h-4 w-4 text-emerald-600" />
                        Mark as Top
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetPriority(company.company_id, "Medium");
                        }}
                        className="text-sm text-gray-700 hover:bg-gray-50 px-3 py-2"
                      >
                        <CircleDot className="mr-2 h-4 w-4 text-blue-600" />
                        Mark as Medium
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetPriority(company.company_id, "Maybe");
                        }}
                        className="text-sm text-gray-700 hover:bg-gray-50 px-3 py-2"
                      >
                        <CircleDashed className="mr-2 h-4 w-4 text-gray-500" />
                        Mark as Maybe
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlacklist(company.company_id);
                        }}
                        className="text-sm text-red-600 hover:bg-red-50 px-3 py-2"
                      >
                        <Trash className="mr-2 h-4 w-4 text-red-500" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </AirtableTableCell>
            </AirtableTableRow>
          );
        })}
      </AirtableTableBody>
    </AirtableTable>
  );
};
