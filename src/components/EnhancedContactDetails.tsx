
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, MessageCircle, Calendar, Plus, Pencil, Trash, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { MessageGeneration } from "@/components/MessageGeneration";
import { InteractionForm } from "@/components/InteractionForm";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  location?: string;
  email?: string;
  linkedin_url?: string;
  user_notes?: string;
  bio_summary?: string;
  how_i_can_help?: string;
  company_id?: string;
  companies?: {
    name: string;
  };
}

interface InteractionData {
  interaction_id: string;
  interaction_type: string;
  description?: string;
  interaction_date: string;
  follow_up_due_date?: string;
  follow_up_completed?: boolean;
  medium?: string;
  contact_id?: string;
}

interface EnhancedContactDetailsProps {
  contactId: string;
  isOpen: boolean;
  onClose: () => void;
  onContactUpdated: () => void;
}

export function EnhancedContactDetails({ 
  contactId, 
  isOpen, 
  onClose, 
  onContactUpdated 
}: EnhancedContactDetailsProps) {
  const { user } = useAuth();
  const [contact, setContact] = useState<ContactData | null>(null);
  const [formData, setFormData] = useState<ContactData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [interactions, setInteractions] = useState<InteractionData[]>([]);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [isPlanningMode, setIsPlanningMode] = useState(false);

  useEffect(() => {
    if (contactId && isOpen) {
      fetchContactDetails();
      fetchContactInteractions();
    }
  }, [contactId, isOpen]);

  const fetchContactDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          companies (
            name
          )
        `)
        .eq('contact_id', contactId)
        .single();
      
      if (error) throw error;
      
      setContact(data);
      setFormData(data);
    } catch (error) {
      console.error("Error fetching contact details:", error);
      toast.error("Failed to load contact details");
    }
  };

  const fetchContactInteractions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('interaction_date', { ascending: false });
      
      if (error) throw error;
      
      setInteractions(data || []);
    } catch (error) {
      console.error("Error fetching contact interactions:", error);
      toast.error("Failed to load interactions");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          location: formData.location,
          email: formData.email,
          linkedin_url: formData.linkedin_url,
          user_notes: formData.user_notes,
          updated_at: new Date().toISOString()
        })
        .eq('contact_id', contactId);
      
      if (error) throw error;
      
      toast.success("Contact details updated successfully");
      onContactUpdated();
      await fetchContactDetails();
    } catch (error: any) {
      console.error("Error updating contact:", error);
      toast.error("Failed to update contact details: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteFollowUp = async (interactionId: string) => {
    try {
      const { error } = await supabase
        .from('interactions')
        .update({
          follow_up_completed: true,
          follow_up_completed_date: new Date().toISOString()
        })
        .eq('interaction_id', interactionId);
      
      if (error) throw error;
      
      toast.success("Follow-up marked as completed");
      fetchContactInteractions();
      onContactUpdated();
    } catch (error) {
      console.error("Error completing follow-up:", error);
      toast.error("Failed to update follow-up status");
    }
  };

  const handleInteractionCreated = () => {
    fetchContactInteractions();
    setIsAddInteractionOpen(false);
    onContactUpdated();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  if (!contact || !formData) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {formData.first_name || ''} {formData.last_name || ''}
              {formData.companies?.name && (
                <Badge variant="outline">
                  {formData.companies.name}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Contact Details</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
            </TabsList>
            
            {/* Contact Details Tab */}
            <TabsContent value="details" className="space-y-4 pt-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      name="role"
                      value={formData.role || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input
                      id="linkedin_url"
                      name="linkedin_url"
                      value={formData.linkedin_url || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="user_notes">Your Notes</Label>
                  <Textarea
                    id="user_notes"
                    name="user_notes"
                    rows={4}
                    value={formData.user_notes || ''}
                    onChange={handleChange}
                    placeholder="Add your personal notes about this contact..."
                  />
                </div>
                
                {formData.bio_summary && (
                  <div className="space-y-2">
                    <Label>Background Summary</Label>
                    <div className="rounded-md border p-3 bg-muted/20">
                      {formData.bio_summary}
                    </div>
                  </div>
                )}
                
                {formData.how_i_can_help && (
                  <div className="space-y-2">
                    <Label>How I Can Help</Label>
                    <div className="rounded-md border p-3 bg-primary/5 border-primary/10">
                      {formData.how_i_can_help}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Generate Message</h3>
                <Button onClick={() => setIsMessageDialogOpen(true)}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Generate New Message
                </Button>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-4">
                  Generate personalized messages for this contact
                </p>
                <Button onClick={() => setIsMessageDialogOpen(true)}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Start Message Generation
                </Button>
              </div>
            </TabsContent>
            
            {/* Interactions Tab */}
            <TabsContent value="interactions" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Interaction History</h3>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsPlanningMode(true);
                    setIsAddInteractionOpen(true);
                  }}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Plan Action
                  </Button>
                  <Button size="sm" onClick={() => {
                    setIsPlanningMode(false);
                    setIsAddInteractionOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Interaction
                  </Button>
                </div>
              </div>
              
              {interactions.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Follow-up</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interactions.map(interaction => (
                        <tr key={interaction.interaction_id} className="border-b">
                          <td className="p-3">
                            {formatDate(interaction.interaction_date)}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {interaction.interaction_type}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div>{interaction.description}</div>
                            {interaction.medium && (
                              <div className="text-xs text-muted-foreground mt-1">
                                via {interaction.medium}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {interaction.follow_up_due_date ? (
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  <span className={`text-sm ${
                                    interaction.follow_up_completed 
                                      ? 'line-through text-muted-foreground' 
                                      : new Date(interaction.follow_up_due_date) < new Date() 
                                        ? 'text-red-600 font-medium' 
                                        : ''
                                  }`}>
                                    {formatDate(interaction.follow_up_due_date)}
                                  </span>
                                </div>
                                {interaction.follow_up_completed ? (
                                  <span className="text-xs text-muted-foreground mt-0.5">Completed</span>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start px-0 py-0 h-6 text-xs hover:bg-transparent hover:text-primary"
                                    onClick={() => handleCompleteFollowUp(interaction.interaction_id)}
                                  >
                                    Mark as complete
                                  </Button>
                                )}
                              </div>
                            ) : 'None'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end space-x-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-6 text-center">
                  <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">
                    No interactions logged for this contact yet
                  </p>
                  <Button size="sm" onClick={() => {
                    setIsPlanningMode(false);
                    setIsAddInteractionOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Interaction
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Message Generation Dialog */}
      {contact && (
        <MessageGeneration
          contact={contact}
          companyName={contact.companies?.name || 'Unknown Company'}
          isOpen={isMessageDialogOpen}
          onClose={() => setIsMessageDialogOpen(false)}
        />
      )}

      {/* Interaction Form Dialog */}
      {contact && (
        <InteractionForm
          companyId={contact.company_id || ''}
          companyName={contact.companies?.name || 'Unknown Company'}
          contacts={contact ? [contact] : []}
          isOpen={isAddInteractionOpen}
          onClose={() => setIsAddInteractionOpen(false)}
          onInteractionCreated={handleInteractionCreated}
          isPlanningMode={isPlanningMode}
        />
      )}
    </>
  );
}
