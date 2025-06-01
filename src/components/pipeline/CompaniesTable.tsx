
import React from 'react';
import { 
  MoreVertical, 
  Trash, 
  Star, 
  CircleDashed, 
  CircleDot
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Company } from '@/hooks/useCompanies';

// Design System Imports
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  GhostAction,
  SuccessBadge,
  InfoBadge,
  NeutralBadge
} from "@/components/ui/design-system";

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
  const highlightAnimation = `
    @keyframes highlightFade {
      0% { background-color: rgba(139, 92, 246, 0.1); }
      100% { background-color: transparent; }
    }
  `;

  return (
    <>
      <style>{highlightAnimation}</style>
      <DataTable>
        <DataTableHeader>
          <DataTableRow className="bg-gray-50/50">
            <DataTableHead className="w-[300px]">Name</DataTableHead>
            <DataTableHead className="hidden md:table-cell">Industry</DataTableHead>
            <DataTableHead className="hidden lg:table-cell">Location</DataTableHead>
            <DataTableHead className="hidden lg:table-cell">Description</DataTableHead>
            <DataTableHead className="w-[100px]">Priority</DataTableHead>
            <DataTableHead className="w-[70px]"></DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {companies.map((company) => {
            const isNewCompany = newCompanyIds.includes(company.company_id);
            return (
              <DataTableRow 
                key={company.company_id} 
                className={cn(
                  isNewCompany && highlightNew ? "animate-[highlightFade_3s_ease-out]" : ""
                )}
                onClick={() => onCompanyClick(company)}
              >
                <DataTableCell className="font-medium text-gray-900">{company.name}</DataTableCell>
                <DataTableCell className="hidden md:table-cell text-gray-600">{company.industry || "-"}</DataTableCell>
                <DataTableCell className="hidden lg:table-cell text-gray-600">{company.hq_location || "-"}</DataTableCell>
                <DataTableCell className="hidden lg:table-cell max-w-xs truncate text-gray-600">{company.ai_description || "-"}</DataTableCell>
                <DataTableCell>
                  <div className="flex items-center">
                    {company.user_priority === "Top" && (
                      <SuccessBadge>Top</SuccessBadge>
                    )}
                    {company.user_priority === "Medium" && (
                      <InfoBadge>Medium</InfoBadge>
                    )}
                    {company.user_priority === "Maybe" && (
                      <NeutralBadge>Maybe</NeutralBadge>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <GhostAction size="icon" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </GhostAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white shadow-xl border-gray-200">
                      <DropdownMenuLabel className="text-gray-900">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-100" />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onSetPriority(company.company_id, "Top");
                      }} className="hover:bg-gray-50">
                        <Star className="mr-2 h-4 w-4 text-yellow-500" />
                        Mark as Top
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onSetPriority(company.company_id, "Medium");
                      }} className="hover:bg-gray-50">
                        <CircleDot className="mr-2 h-4 w-4 text-blue-500" />
                        Mark as Medium
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onSetPriority(company.company_id, "Maybe");
                      }} className="hover:bg-gray-50">
                        <CircleDashed className="mr-2 h-4 w-4 text-gray-500" />
                        Mark as Maybe
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-100" />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onBlacklist(company.company_id);
                      }} className="hover:bg-gray-50">
                        <Trash className="mr-2 h-4 w-4 text-red-500" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>
    </>
  );
};
