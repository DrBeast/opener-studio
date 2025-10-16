import React from "react";
import { Building2 } from "lucide-react";

interface EmptyStateProps {
  searchTerm: string;
  hasFilters: boolean;
}

export const EmptyState = ({ searchTerm, hasFilters }: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
      <h3 className="mt-4 text-lg font-medium">No companies found</h3>
      <p className="mt-1 text-muted-foreground">
        {searchTerm || hasFilters
          ? "Try adjusting your search or filters"
          : "Start by adding contacts and their profiles above."}
      </p>
    </div>
  );
};
