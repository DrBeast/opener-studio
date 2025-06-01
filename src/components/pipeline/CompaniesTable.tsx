
import React from 'react';
import { EnhancedButton } from "@/components/ui/enhanced-button";
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
      0% { background-color: rgba(139, 92, 246, 0.1); }
      100% { background-color: transparent; }
    }
  `;

  return (
    <>
      <style>{highlightAnimation}</style>
      <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-[300px] font-semibold text-gray-700">Name</TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-gray-700">Industry</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold text-gray-700">Location</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold text-gray-700">Description</TableHead>
              <TableHead className="w-[100px] font-semibold text-gray-700">Priority</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => {
              const isNewCompany = newCompanyIds.includes(company.company_id);
              return (
                <TableRow 
                  key={company.company_id} 
                  className={cn(
                    "cursor-pointer hover:bg-gray-50/80 transition-colors border-b border-gray-100",
                    isNewCompany && highlightNew ? "animate-[highlightFade_3s_ease-out]" : ""
                  )}
                  onClick={() => onCompanyClick(company)}
                >
                  <TableCell className="font-medium text-gray-900 py-4">{company.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-gray-600 py-4">{company.industry || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-gray-600 py-4">{company.hq_location || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell max-w-xs truncate text-gray-600 py-4">{company.ai_description || "-"}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center">
                      {company.user_priority === "Top" && (
                        <StatusBadge variant="success">Top</StatusBadge>
                      )}
                      {company.user_priority === "Medium" && (
                        <StatusBadge variant="info">Medium</StatusBadge>
                      )}
                      {company.user_priority === "Maybe" && (
                        <StatusBadge variant="outline">Maybe</StatusBadge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <EnhancedButton variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </EnhancedButton>
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
