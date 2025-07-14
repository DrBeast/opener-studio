import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User, Building } from "lucide-react";

interface PotentialContactDuplicate {
  contact_id: string;
  first_name: string;
  last_name: string;
  role: string;
  company_name?: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface ContactDuplicateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUseExisting: (contactId: string) => void;
  onCreateNew: () => void;
  potentialDuplicates: PotentialContactDuplicate[];
  newContactName: string;
}

export function ContactDuplicateDialog({
  isOpen,
  onClose,
  onUseExisting,
  onCreateNew,
  potentialDuplicates,
  newContactName,
}: ContactDuplicateDialogProps) {
  const [selectedContactId, setSelectedContactId] = useState<string>("");

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleUseExisting = () => {
    if (selectedContactId) {
      onUseExisting(selectedContactId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Possible Duplicate Contact</DialogTitle>
          <DialogDescription>
            We found existing contacts that might be the same as "{newContactName}". 
            Please review and choose an action:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              New Contact: {newContactName}
            </h4>
            <p className="text-blue-700 text-sm">
              You're about to add this contact to your pipeline.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Potential duplicates found:</h4>
            
            <RadioGroup value={selectedContactId} onValueChange={setSelectedContactId}>
              {potentialDuplicates.map((duplicate) => (
                <div
                  key={duplicate.contact_id}
                  className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedContactId === duplicate.contact_id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedContactId(duplicate.contact_id)}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <RadioGroupItem
                      value={duplicate.contact_id}
                      checked={selectedContactId === duplicate.contact_id}
                      onChange={() => setSelectedContactId(duplicate.contact_id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {duplicate.first_name} {duplicate.last_name}
                        </span>
                        <Badge variant={getConfidenceBadgeVariant(duplicate.confidence)}>
                          {duplicate.confidence} confidence
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                        <User className="h-3 w-3" />
                        <span>{duplicate.role}</span>
                        {duplicate.company_name && (
                          <>
                            <span className="mx-1">•</span>
                            <Building className="h-3 w-3" />
                            <span>{duplicate.company_name}</span>
                          </>
                        )}
                      </div>
                      <p className={`text-sm ${getConfidenceColor(duplicate.confidence)}`}>
                        {duplicate.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onCreateNew}
              className="flex-1 sm:flex-none"
            >
              Add as New Contact
            </Button>
            <Button
              onClick={handleUseExisting}
              disabled={!selectedContactId}
              className="flex-1 sm:flex-none"
            >
              Use Selected Contact
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}