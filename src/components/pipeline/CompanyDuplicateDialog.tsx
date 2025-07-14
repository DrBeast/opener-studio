import { useState } from "react";
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
import { Building2, AlertTriangle } from "lucide-react";

interface PotentialDuplicate {
  company_id: string;
  name: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface CompanyDuplicateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  potentialDuplicates: PotentialDuplicate[];
  onCreateNew: () => void;
  onUseExisting: (companyId: string) => void;
}

export function CompanyDuplicateDialog({
  isOpen,
  onClose,
  companyName,
  potentialDuplicates,
  onCreateNew,
  onUseExisting,
}: CompanyDuplicateDialogProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const handleUseExisting = () => {
    if (selectedCompanyId) {
      onUseExisting(selectedCompanyId);
    }
  };

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Possible Duplicate Company</DialogTitle>
          </div>
          <DialogDescription>
            We found existing companies that might be the same as "{companyName}". 
            Please review and choose an option.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">New Company:</span>
            </div>
            <p className="text-blue-800">{companyName}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Potential Matches:</h4>
            {potentialDuplicates.map((duplicate) => (
              <div
                key={duplicate.company_id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCompanyId === duplicate.company_id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedCompanyId(duplicate.company_id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="company"
                      value={duplicate.company_id}
                      checked={selectedCompanyId === duplicate.company_id}
                      onChange={() => setSelectedCompanyId(duplicate.company_id)}
                      className="mt-0.5"
                    />
                    <span className="font-medium">{duplicate.name}</span>
                  </div>
                  <Badge variant={getConfidenceBadgeVariant(duplicate.confidence)}>
                    {duplicate.confidence} confidence
                  </Badge>
                </div>
                <p className={`text-sm ml-5 ${getConfidenceColor(duplicate.confidence)}`}>
                  {duplicate.reasoning}
                </p>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onCreateNew}>
            Create New Company
          </Button>
          <Button 
            onClick={handleUseExisting}
            disabled={!selectedCompanyId}
          >
            Use Selected Company
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}