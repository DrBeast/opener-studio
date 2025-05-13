
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCompany: (companyName: string) => void;
  isLoading?: boolean;
}

export function AddCompanyModal({ 
  isOpen, 
  onClose, 
  onAddCompany, 
  isLoading = false 
}: AddCompanyModalProps) {
  const [companyName, setCompanyName] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim()) {
      onAddCompany(companyName.trim());
      setCompanyName("");
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isLoading}
                autoComplete="off"
              />
              <p className="text-sm text-muted-foreground">
                Enter the name of the company you want to add. We'll generate additional details for you.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!companyName.trim() || isLoading}>
              {isLoading ? "Adding..." : "Add Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
