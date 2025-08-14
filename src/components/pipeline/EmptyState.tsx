import React from "react";
import { Button } from "@/components/ui/airtable-ds/button";
import { Building2, Plus, Sparkles } from "lucide-react";

interface EmptyStateProps {
  searchTerm: string;
  hasFilters: boolean;
  onAddCompany: () => void;
  onGenerateCompanies: () => void;
  isGeneratingCompanies: boolean;
}

export const EmptyState = ({
  searchTerm,
  hasFilters,
  onAddCompany,
  onGenerateCompanies,
  isGeneratingCompanies,
}: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
      <h3 className="mt-4 text-lg font-medium">No companies found</h3>
      <p className="mt-1 text-muted-foreground">
        {searchTerm || hasFilters
          ? "Try adjusting your search or filters"
          : "Start by adding your target companies"}
      </p>
      <div className="flex gap-2 justify-center mt-4">
        <Button
          onClick={onGenerateCompanies}
          disabled={isGeneratingCompanies}
          variant="outline"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isGeneratingCompanies ? "Generating..." : "Generate Companies"}
        </Button>
        <Button onClick={onAddCompany}>
          <Plus className="mr-2 h-4 w-4" /> Add Company
        </Button>
      </div>
    </div>
  );
};
