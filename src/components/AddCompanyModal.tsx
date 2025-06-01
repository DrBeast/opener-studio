
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Building, Sparkles } from "lucide-react";

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

  const handleClose = () => {
    setCompanyName('');
    setInputError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-primary to-primary/80 rounded-full">
              <Building className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">Add Target Company</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Enter a company name to add it to your networking targets
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-3">
            <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
              Company Name
            </Label>
            <div className="relative">
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  if (inputError) setInputError('');
                }}
                placeholder="e.g., Google, Microsoft, Apple..."
                className={`h-12 pl-4 pr-12 border-2 transition-all duration-200 ${
                  inputError 
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200" 
                    : "border-gray-200 focus:border-primary focus:ring-primary/20"
                }`}
                disabled={isLoading}
              />
              <Building className="absolute right-4 top-4 h-4 w-4 text-gray-400" />
            </div>
            {inputError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {inputError}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !companyName.trim()}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 relative"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Add Company
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
