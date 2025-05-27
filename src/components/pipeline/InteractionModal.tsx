
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  mode: 'log' | 'schedule';
  onSuccess: () => void;
}

export const InteractionModal = ({
  isOpen,
  onClose,
  companyId,
  mode,
  onSuccess
}: InteractionModalProps) => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [interactionType, setInteractionType] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description || !interactionType) return;

    setIsLoading(true);
    try {
      const interactionData = {
        user_id: user.id,
        company_id: companyId,
        description,
        interaction_type: interactionType,
        ...(mode === 'log' ? {
          interaction_date: new Date(date).toISOString(),
          follow_up_completed: true
        } : {
          follow_up_due_date: date,
          follow_up_completed: false
        })
      };

      const { error } = await supabase
        .from('interactions')
        .insert(interactionData);

      if (error) throw error;

      toast({
        title: "Success",
        description: mode === 'log' ? "Interaction logged successfully" : "Follow-up scheduled successfully",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error saving interaction:", error);
      toast({
        title: "Error",
        description: "Failed to save interaction",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setInteractionType('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const suggestionOptions = mode === 'log' 
    ? ['Face-to-face conversation', 'Email sent', 'Applied for a role', 'Phone call', 'LinkedIn message']
    : ['Follow up on application', 'Send thank you note', 'Check application status', 'Schedule interview', 'Send additional materials'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'log' ? 'Log New Interaction' : 'Schedule Follow-up Action'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={mode === 'log' ? "Describe what happened..." : "What action needs to be taken?"}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={interactionType} onValueChange={setInteractionType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {suggestionOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">
              {mode === 'log' ? 'Interaction Date' : 'Due Date'}
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (mode === 'log' ? 'Log Interaction' : 'Schedule Action')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
