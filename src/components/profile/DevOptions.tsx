
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DevOptionsProps {
  showDevOptions: boolean;
  isResetting: boolean;
  onResetUserData: () => void;
}

const DevOptions = ({ showDevOptions, isResetting, onResetUserData }: DevOptionsProps) => {
  if (!showDevOptions) return null;
  
  return (
    <CardContent>
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">Reset User Data</h3>
          <p className="text-xs text-red-700 mb-4">
            Warning: This will delete all your profile data, background information, and job target criteria.
            Use this option to test the new user onboarding flow.
          </p>
          <Button variant="destructive" size="sm" onClick={onResetUserData} disabled={isResetting}>
            {isResetting ? "Resetting..." : "Reset All User Data"}
          </Button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Email Verification</h3>
          <p className="text-xs text-blue-700 mb-2">
            Email verification is required by default. For testing purposes, you can disable it in the Supabase dashboard.
          </p>
        </div>
      </div>
    </CardContent>
  );
};

export default DevOptions;
