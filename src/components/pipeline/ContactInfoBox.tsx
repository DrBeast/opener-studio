
import React from 'react';
import { InfoBox } from "@/components/ui/info-box";

export const ContactInfoBox = () => {
  return (
    <InfoBox className="mb-6">
      <p className="font-medium mb-1">Finding the Right Contacts is Essential</p>
      <p>
        AI-powered contact identification can only leverage publicly available information. 
        For best results, we strongly recommend manually adding contacts from your existing network 
        or new contacts you discover through LinkedIn research. This ensures you connect with the most 
        relevant people at your target companies.
      </p>
    </InfoBox>
  );
};
