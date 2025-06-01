
import React from 'react';
import { cn } from "@/lib/utils";

interface AirtableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface AirtableCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface AirtableCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const AirtableCard = ({ className, children, ...props }: AirtableCardProps) => (
  <div 
    className={cn(
      "bg-white rounded-lg border border-gray-200 shadow-sm",
      className
    )} 
    {...props}
  >
    {children}
  </div>
);

export const AirtableCardHeader = ({ className, children, ...props }: AirtableCardHeaderProps) => (
  <div 
    className={cn(
      "px-6 py-4 border-b border-gray-200 bg-gray-50/50",
      className
    )} 
    {...props}
  >
    {children}
  </div>
);

export const AirtableCardContent = ({ className, children, ...props }: AirtableCardContentProps) => (
  <div 
    className={cn(
      "px-6 py-6",
      className
    )} 
    {...props}
  >
    {children}
  </div>
);
