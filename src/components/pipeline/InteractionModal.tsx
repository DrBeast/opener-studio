
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
import { Calendar, Clock, CheckCircle } from "lucide-react";

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
    return mode === 'log' ? CheckCircle : Clock;
  };

  const IconComponent = getModalIcon();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full ${
              mode === 'log' 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}>
              <IconComponent className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {mode === 'log' ? 'Log New Interaction' : 'Schedule Follow-up Action'}
          </DialogTitle>
        </DialogHeader>
        
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
              className="min-h-[100px] border-2 border-gray-200 focus:border-primary focus:ring-primary/20 resize-none"
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="type" className="text-sm font-medium text-gray-700">
              Type
            </Label>
            <Select value={interactionType} onValueChange={setInteractionType} required>
              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-primary">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                {suggestionOptions.map((option) => (
                  <SelectItem key={option} value={option} className="hover:bg-primary/5">
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
              className="h-12 border-2 border-gray-200 focus:border-primary focus:ring-primary/20"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="px-6 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className={`px-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${
                mode === 'log'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                mode === 'log' ? 'Log Interaction' : 'Schedule Action'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
