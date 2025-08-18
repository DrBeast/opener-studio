import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/airtable-ds/dialog";
import { Button } from "@/components/ui/airtable-ds/button";
import { User, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    onClose();
    navigate("/profile");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <User className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-semibold">Professional Profile</h3>
              <p className="text-sm text-gray-600">
                Update your experience, education, and professional story
              </p>
            </div>
          </div>
          <Button onClick={handleProfileClick} className="w-full">
            Edit Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
