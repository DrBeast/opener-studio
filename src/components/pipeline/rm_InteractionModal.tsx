
import React, { useState } from 'react';
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
import { Calendar, Clock, CheckCircle } from "lucide-react";

// Design System Imports
import {
  PrimaryAction,
  OutlineAction
} from "@/components/ui/design-system";
import { Modal } from "@/components/ui/design-system/modals";

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

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const suggestionOptions = mode === 'log' 
    ? ['Face-to-face conversation', 'Email sent', 'Applied for a role', 'Phone call', 'LinkedIn message']
    : ['Follow up on application', 'Send thank you note', 'Check application status', 'Schedule interview', 'Send additional materials'];

  const getModalIcon = () => {
    return mode === 'log' ? <CheckCircle /> : <Clock />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'log' ? 'Log New Interaction' : 'Schedule Follow-up Action'}
      icon={getModalIcon()}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={mode === 'log' ? "Describe what happened..." : "What action needs to be taken?"}
            className="min-h-[100px] border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 resize-none"
            required
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="type" className="text-sm font-medium text-gray-700">
            Type
          </Label>
          <Select value={interactionType} onValueChange={setInteractionType} required>
            <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-xl">
              {suggestionOptions.map((option) => (
                <SelectItem key={option} value={option} className="hover:bg-purple-50">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {mode === 'log' ? 'Interaction Date' : 'Due Date'}
          </Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <OutlineAction 
            type="button" 
            onClick={handleClose}
            className="px-6"
          >
            Cancel
          </OutlineAction>
          <PrimaryAction 
            type="submit" 
            disabled={isLoading}
            className="px-6"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              mode === 'log' ? 'Log Interaction' : 'Schedule Action'
            )}
          </PrimaryAction>
        </div>
      </form>
    </Modal>
  );
};
