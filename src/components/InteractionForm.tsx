
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
}

interface InteractionFormProps {
  companyId: string;
  companyName: string;
  contacts: ContactData[];
  isOpen: boolean;
  onClose: () => void;
  onInteractionCreated: () => void;
  existingInteraction?: {
    interaction_id: string;
    interaction_type: string;
    description?: string;
    interaction_date: string;
    contact_id?: string;
    follow_up_due_date?: string;
    medium?: string;
  };
  isPlanningMode?: boolean;
}

export function InteractionForm({ 
  companyId,
  companyName,
  contacts,
  isOpen, 
  onClose,
  onInteractionCreated,
  existingInteraction,
  isPlanningMode = false
}: InteractionFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    interaction_type: existingInteraction?.interaction_type || (isPlanningMode ? 'Planned Action' : 'Email'),
    description: existingInteraction?.description || '',
    interaction_date: existingInteraction?.interaction_date || (isPlanningMode ? null : new Date().toISOString()),
    contact_id: existingInteraction?.contact_id || '',
    medium: existingInteraction?.medium || '',
    follow_up_due_date: existingInteraction?.follow_up_due_date || null,
    follow_up_completed: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    existingInteraction?.interaction_date ? 
    new Date(existingInteraction.interaction_date) : 
    isPlanningMode ? undefined : new Date()
  );
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(
    existingInteraction?.follow_up_due_date ? new Date(existingInteraction.follow_up_due_date) : undefined
  );

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormData(prev => ({
        ...prev,
        interaction_date: date.toISOString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        interaction_date: null
      }));
    }
  };

  // Handle follow-up date selection
  const handleFollowUpDateSelect = (date: Date | undefined) => {
    setFollowUpDate(date);
    if (date) {
      setFormData(prev => ({
        ...prev,
        follow_up_due_date: date.toISOString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        follow_up_due_date: null
      }));
    }
  };

  // Submit interaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!user) {
        throw new Error("You must be logged in to perform this action");
      }

      const interactionData = {
        company_id: companyId,
        user_id: user.id,  // Add user ID from auth context
        interaction_type: formData.interaction_type,
        description: formData.description,
        interaction_date: formData.interaction_date || null,
        contact_id: formData.contact_id || null,
        medium: formData.medium || null,
        follow_up_due_date: formData.follow_up_due_date,
        follow_up_completed: false
      };
      
      console.log("Saving interaction:", interactionData);
      
      if (existingInteraction) {
        // Update existing interaction
        const { error } = await supabase
          .from('interactions')
          .update(interactionData)
          .eq('interaction_id', existingInteraction.interaction_id);
          
        if (error) {
          console.error("Error updating interaction:", error);
          throw error;
        }
        
        toast.success("Interaction updated successfully");
      } else {
        // Create new interaction
        const { data, error } = await supabase
          .from('interactions')
          .insert([interactionData])
          .select();
          
        if (error) {
          console.error("Error creating interaction:", error);
          throw error;
        }
        
        console.log("Created interaction:", data);
        toast.success(isPlanningMode ? "Action scheduled successfully" : "Interaction logged successfully");
      }
      
      onInteractionCreated();
      onClose();
    } catch (error: any) {
      console.error("Error saving interaction:", error);
      toast.error(`Failed to save: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get interaction type options based on mode
  const getInteractionTypeOptions = () => {
    if (isPlanningMode) {
      return [
        { value: "Planned Action", label: "Planned Action" },
        { value: "Cold Outreach", label: "Cold Outreach" },
        { value: "Follow-up", label: "Follow-up" },
        { value: "Job Application", label: "Job Application" },
        { value: "Interview", label: "Interview" },
        { value: "Call", label: "Call" },
        { value: "Meeting", label: "Meeting" },
        { value: "Other", label: "Other" }
      ];
    } else {
      return [
        { value: "Email", label: "Email" },
        { value: "LinkedIn Message", label: "LinkedIn Message" },
        { value: "Call", label: "Call" },
        { value: "Meeting", label: "Meeting" },
        { value: "Coffee Chat", label: "Coffee Chat" },
        { value: "Interview", label: "Interview" },
        { value: "Other", label: "Other" }
      ];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingInteraction ? "Edit Interaction" : isPlanningMode ? "Plan New Action" : "Log New Interaction"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={companyName}
              disabled
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interaction_type">
              {isPlanningMode ? "Action Type" : "Interaction Type"}
            </Label>
            <select
              id="interaction_type"
              name="interaction_type"
              value={formData.interaction_type}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {getInteractionTypeOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact_id">Contact (Optional)</Label>
            <select
              id="contact_id"
              name="contact_id"
              value={formData.contact_id}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a contact</option>
              {contacts.map(contact => (
                <option key={contact.contact_id} value={contact.contact_id}>
                  {contact.first_name || ''} {contact.last_name || ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interaction_date">
              {isPlanningMode ? "Scheduled Date" : "Interaction Date"}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>{isPlanningMode ? "Select a date" : "Pick a date"}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="medium">Medium (Optional)</Label>
            <Input
              id="medium"
              name="medium"
              value={formData.medium}
              onChange={handleChange}
              placeholder={isPlanningMode ? "e.g., Email, LinkedIn, Phone" : "e.g., Zoom, Phone, In-person"}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">
              {isPlanningMode ? "Action Details" : "Description"}
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder={isPlanningMode ? "Describe what you plan to do..." : "Describe the interaction..."}
              required
            />
          </div>
          
          {!isPlanningMode && (
            <div className="space-y-2">
              <Label htmlFor="follow_up_date">Follow-up Date (Optional)</Label>
              <div className="flex items-start space-x-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !followUpDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {followUpDate ? (
                        format(followUpDate, "PPP")
                      ) : (
                        <span>Set follow-up</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50">
                    <Calendar
                      mode="single"
                      selected={followUpDate}
                      onSelect={handleFollowUpDateSelect}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                {followUpDate && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFollowUpDateSelect(undefined)}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isPlanningMode ? "Schedule" : existingInteraction ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
