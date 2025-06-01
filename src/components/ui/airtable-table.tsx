
import React from 'react';
import { cn } from "@/lib/utils";

interface AirtableTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface AirtableTableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

interface AirtableTableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

interface AirtableTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  isNew?: boolean;
  isSelected?: boolean;
}

interface AirtableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  sortable?: boolean;
}

interface AirtableTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export const AirtableTable = ({ className, children, ...props }: AirtableTableProps) => (
  <div className={cn("rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden", className)} {...props}>
    <table className="w-full border-separate border-spacing-0">
      {children}
    </table>
  </div>
);

export const AirtableTableHeader = ({ className, children, ...props }: AirtableTableHeaderProps) => (
  <thead className={cn("bg-gray-50", className)} {...props}>
    {children}
  </thead>
);

export const AirtableTableBody = ({ className, children, ...props }: AirtableTableBodyProps) => (
  <tbody className={cn("divide-y divide-gray-200", className)} {...props}>
    {children}
  </tbody>
);

export const AirtableTableRow = ({ className, children, isNew = false, isSelected = false, ...props }: AirtableTableRowProps) => (
  <tr 
    className={cn(
      "transition-colors hover:bg-gray-50 cursor-pointer",
      isNew && "bg-blue-50",
      isSelected && "bg-blue-100",
      className
    )} 
    {...props}
  >
    {children}
  </tr>
);

export const AirtableTableHead = ({ className, children, sortable = false, ...props }: AirtableTableHeadProps) => (
  <th 
    className={cn(
      "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50",
      sortable && "hover:bg-gray-100 cursor-pointer",
      className
    )} 
    {...props}
  >
    {children}
  </th>
);

export const AirtableTableCell = ({ className, children, ...props }: AirtableTableCellProps) => (
  <td 
    className={cn(
      "px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200",
      className
    )} 
    {...props}
  >
    {children}
  </td>
);
