
import React from 'react';
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
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
  CircleDot
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
  const highlightAnimation = `
    @keyframes highlightFade {
      0% { background-color: rgba(var(--primary-rgb), 0.3); }
      100% { background-color: transparent; }
    }
  `;

  const getPriorityBadgeVariant = (priority: string | null) => {
    switch (priority) {
      case "Top":
        return "green";
      case "Medium":
        return "blue";
      case "Maybe":
        return "gray";
      default:
        return "gray";
    }
  };

  return (
    <>
      <style>{highlightAnimation}</style>
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
        <Table className="airtable-table">
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50">
              <TableHead className="w-[300px] text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Name
              </TableHead>
              <TableHead className="hidden md:table-cell text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Industry
              </TableHead>
              <TableHead className="hidden lg:table-cell text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Location
              </TableHead>
              <TableHead className="hidden lg:table-cell text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Description
              </TableHead>
              <TableHead className="w-[100px] text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Priority
              </TableHead>
              <TableHead className="w-[70px] text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => {
              const isNewCompany = newCompanyIds.includes(company.company_id);
              return (
                <TableRow 
                  key={company.company_id} 
                  className={cn(
                    "cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors",
                    isNewCompany && highlightNew ? "animate-[highlightFade_3s_ease-out]" : ""
                  )}
                  onClick={() => onCompanyClick(company)}
                >
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-900">
                    {company.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">
                    {company.industry || "-"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600">
                    {company.hq_location || "-"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {company.ai_description || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center">
                      {company.user_priority && (
                        <StatusBadge 
                          variant={getPriorityBadgeVariant(company.user_priority)}
                          size="sm"
                        >
                          {company.user_priority}
                        </StatusBadge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
                        <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-200" />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetPriority(company.company_id, "Top");
                          }}
                          className="text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Star className="mr-2 h-4 w-4 text-green-500" />
                          Mark as Top
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetPriority(company.company_id, "Medium");
                          }}
                          className="text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <CircleDot className="mr-2 h-4 w-4 text-blue-500" />
                          Mark as Medium
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetPriority(company.company_id, "Maybe");
                          }}
                          className="text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <CircleDashed className="mr-2 h-4 w-4 text-gray-500" />
                          Mark as Maybe
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-200" />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onBlacklist(company.company_id);
                          }}
                          className="text-sm text-red-600 hover:bg-red-50"
                        >
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
