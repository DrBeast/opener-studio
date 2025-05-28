
import React from 'react';
import { Info } from "lucide-react";

interface InfoBoxProps {
  children: React.ReactNode;
  className?: string;
}

export const InfoBox = ({ children, className = "" }: InfoBoxProps) => {
  return (
    <div className={`bg-blue-50 p-4 rounded-lg border border-blue-200 ${className}`}>
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          {children}
        </div>
      </div>
    </div>
  );
};
