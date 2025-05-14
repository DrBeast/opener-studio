
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCompany: (companyName: string) => void;
  isLoading: boolean;
}

export const AddCompanyModal = ({
  isOpen,
  onClose,
  onAddCompany,
  isLoading = false,
}: AddCompanyModalProps) => {
  const [companyName, setCompanyName] = useState('');
  const [inputError, setInputError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      setInputError('Please enter a company name');
      return;
    }
    
    setInputError('');
    onAddCompany(companyName.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Company</DialogTitle>
          <DialogDescription>
            Enter a company name to add it to your target list.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (inputError) setInputError('');
              }}
              placeholder="Enter company name"
              className={inputError ? "border-destructive" : ""}
              disabled={isLoading}
            />
            {inputError && (
              <div className="flex items-center text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mr-1" />
                {inputError}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !companyName.trim()}
              className="relative"
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">Add Company</span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </span>
                </>
              ) : (
                <>
                  Add Company
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
