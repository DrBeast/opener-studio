import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Target, Settings } from "lucide-react";
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

  const handleTargetsClick = () => {
    onClose();
    navigate("/job-targets");
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
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="targets">Job Targets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4 mt-6">
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
          </TabsContent>
          
          <TabsContent value="targets" className="space-y-4 mt-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Job Search Criteria</h3>
                <p className="text-sm text-gray-600">
                  Define your target roles, industries, and company preferences
                </p>
              </div>
            </div>
            <Button onClick={handleTargetsClick} className="w-full">
              Edit Job Targets
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;