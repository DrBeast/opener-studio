
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
}

export function InteractionForm({ 
  companyId,
  companyName,
  contacts,
  isOpen, 
  onClose,
  onInteractionCreated,
  existingInteraction
}: InteractionFormProps) {
  const [formData, setFormData] = useState({
    interaction_type: existingInteraction?.interaction_type || 'Email',
    description: existingInteraction?.description || '',
    interaction_date: existingInteraction?.interaction_date || new Date().toISOString(),
    contact_id: existingInteraction?.contact_id || '',
    medium: existingInteraction?.medium || '',
    follow_up_due_date: existingInteraction?.follow_up_due_date || null,
    follow_up_completed: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    existingInteraction?.interaction_date ? new Date(existingInteraction.interaction_date) : new Date()
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
      const interactionData = {
        company_id: companyId,
        interaction_type: formData.interaction_type,
        description: formData.description,
        interaction_date: formData.interaction_date,
        contact_id: formData.contact_id || null,
        medium: formData.medium || null,
        follow_up_due_date: formData.follow_up_due_date,
        follow_up_completed: false
      };
      
      if (existingInteraction) {
        // Update existing interaction
        const { error } = await supabase
          .from('interactions')
          .update(interactionData)
          .eq('interaction_id', existingInteraction.interaction_id);
          
        if (error) throw error;
        toast.success("Interaction updated successfully");
      } else {
        // Create new interaction
        const { error } = await supabase
          .from('interactions')
          .insert(interactionData);
          
        if (error) throw error;
        toast.success("Interaction logged successfully");
      }
      
      onInteractionCreated();
    } catch (error: any) {
      console.error("Error saving interaction:", error);
      toast.error("Failed to save interaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingInteraction ? "Edit Interaction" : "Log New Interaction"}
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
            <Label htmlFor="interaction_type">Interaction Type</Label>
            <select
              id="interaction_type"
              name="interaction_type"
              value={formData.interaction_type}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Email">Email</option>
              <option value="LinkedIn Message">LinkedIn Message</option>
              <option value="Call">Call</option>
              <option value="Meeting">Meeting</option>
              <option value="Coffee Chat">Coffee Chat</option>
              <option value="Interview">Interview</option>
              <option value="Other">Other</option>
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
            <Label htmlFor="interaction_date">Interaction Date</Label>
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
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
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
              placeholder="e.g., Zoom, Phone, In-person"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the interaction..."
              required
            />
          </div>
          
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
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={followUpDate}
                    onSelect={handleFollowUpDateSelect}
                    initialFocus
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
          
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : existingInteraction ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
