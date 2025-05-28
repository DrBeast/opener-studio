
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

export const ContactInfoBox = () => {
  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Finding the Right Contacts is Essential</p>
            <p>
              AI-powered contact identification can only leverage publicly available information. 
              For best results, we strongly recommend manually adding contacts from your existing network 
              or new contacts you discover through LinkedIn research. This ensures you connect with the most 
              relevant people at your target companies.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
