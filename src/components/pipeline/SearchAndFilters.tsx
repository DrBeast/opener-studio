
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2 } from "lucide-react";

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  onBulkRemove: () => void;
}

export const SearchAndFilters = ({
  searchTerm,
  onSearchChange,
  selectedCount,
  onBulkRemove
}: SearchAndFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 relative z-10">
            <span className="text-sm text-muted-foreground">
              {selectedCount} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkRemove}
              className="relative z-10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Selected
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
