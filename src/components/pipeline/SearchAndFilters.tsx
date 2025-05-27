
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, Search, CircleDot, Trash2 } from "lucide-react";

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    priority: string[];
  };
  onPriorityFilter: (priority: string) => void;
  onClearFilters: () => void;
  selectedCount: number;
  onBulkRemove: () => void;
}

export const SearchAndFilters = ({
  searchTerm,
  onSearchChange,
  filters,
  onPriorityFilter,
  onClearFilters,
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedCount} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkRemove}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Selected
            </Button>
          </div>
        )}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onPriorityFilter('Top')} className="flex items-center justify-between">
            Top
            {filters.priority.includes('Top') && <CircleDot className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPriorityFilter('Medium')} className="flex items-center justify-between">
            Medium
            {filters.priority.includes('Medium') && <CircleDot className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPriorityFilter('Maybe')} className="flex items-center justify-between">
            Maybe
            {filters.priority.includes('Maybe') && <CircleDot className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onClearFilters}>
            Clear Filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
