
import React from 'react';
import { Button } from "@/components/ui/button";
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

  return (
    <>
      <style>{highlightAnimation}</style>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead className="hidden md:table-cell">Industry</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead className="hidden lg:table-cell">Description</TableHead>
              <TableHead className="w-[100px]">Priority</TableHead>
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
                    "cursor-pointer hover:bg-muted/50",
                    isNewCompany && highlightNew ? "animate-[highlightFade_3s_ease-out]" : ""
                  )}
                  onClick={() => onCompanyClick(company)}
                >
                  <TableCell>{company.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{company.industry || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{company.hq_location || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell max-w-xs truncate">{company.ai_description || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {company.user_priority === "Top" && (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Top
                        </span>
                      )}
                      {company.user_priority === "Medium" && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          Medium
                        </span>
                      )}
                      {company.user_priority === "Maybe" && (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          Maybe
                        </span>
                      )}
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
