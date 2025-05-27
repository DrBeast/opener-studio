
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Save, 
  UserRound, 
  Calendar, 
  MessageCircle,
  Plus,
  Trash,
  ArrowUpDown,
  FileText,
  Pencil
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { ContactDetails } from "@/components/ContactDetails";
import { InteractionForm } from "@/components/InteractionForm";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
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

interface CompanyData {
  company_id: string;
  name: string;
  industry?: string;
  hq_location?: string;
  wfh_policy?: string;
  user_priority?: 'Top' | 'Medium' | 'Maybe';
  user_notes?: string;
  ai_description?: string;
  ai_match_reasoning?: string;
  estimated_headcount?: string;
  estimated_revenue?: string;
  website_url?: string;
  public_private?: string;
  match_quality_score?: number;
  updated_at?: string;
  contacts?: ContactData[];
  last_interaction?: {
    interaction_date: string;
    description: string;
  };
  next_action?: {
    follow_up_due_date: string;
    description: string;
  };
}

interface CompanyDetailsProps {
  company: CompanyData;
  isOpen: boolean;
  onClose: () => void;
  onCompanyUpdated: () => void;
}

export function CompanyDetails({ 
  company, 
  isOpen, 
  onClose, 
  onCompanyUpdated 
}: CompanyDetailsProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CompanyData>({...company});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [interactions, setInteractions] = useState<InteractionData[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [isPlanningMode, setIsPlanningMode] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<InteractionData | null>(null);
  const [isEditInteractionOpen, setIsEditInteractionOpen] = useState(false);
  
  // Fetch contacts and interactions when component mounts or company changes
  useEffect(() => {
    if (company.company_id) {
      fetchContacts();
      fetchInteractions();
    }
  }, [company.company_id]);

  // Fetch contacts for this company
  const fetchContacts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', company.company_id)
      .eq('user_id', user.id);
      
    if (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
    } else {
      setContacts(data);
    }
  };
  
  // Fetch interactions for this company
  const fetchInteractions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('company_id', company.company_id)
      .eq('user_id', user.id)
      .order('interaction_date', { ascending: false });
      
    if (error) {
      console.error("Error fetching interactions:", error);
      toast.error("Failed to load interactions");
    } else {
      setInteractions(data);
    }
  };

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit company details update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to update company details");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          industry: formData.industry,
          hq_location: formData.hq_location,
          wfh_policy: formData.wfh_policy,
          user_priority: formData.user_priority,
          user_notes: formData.user_notes,
          estimated_headcount: formData.estimated_headcount,
          estimated_revenue: formData.estimated_revenue,
          website_url: formData.website_url,
          public_private: formData.public_private,
          updated_at: new Date().toISOString(),
          user_id: user.id
        })
        .eq('company_id', company.company_id);
      
      if (error) throw error;
      
      toast.success("Company details updated successfully");
      onCompanyUpdated();
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company details");
    } finally {
      setIsLoading(false);
    }
  };
  
  // View contact details
  const handleViewContact = (contact: ContactData) => {
    setSelectedContact(contact);
    setIsContactDetailsOpen(true);
  };
  
  // Handle contact updated
  const handleContactUpdated = () => {
    fetchContacts();
    setIsContactDetailsOpen(false);
  };
  
  // Handle new interaction created
  const handleInteractionCreated = () => {
    fetchInteractions();
    setIsAddInteractionOpen(false);
    setIsEditInteractionOpen(false);
    setSelectedInteraction(null);
    onCompanyUpdated(); // Refresh parent component data as well
  };
  
  // Handle opening the interaction form for editing
  const handleEditInteraction = (interaction: InteractionData) => {
    setSelectedInteraction(interaction);
    setIsEditInteractionOpen(true);
  };
  
  // Handle marking a follow-up as complete
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
      fetchInteractions();
      onCompanyUpdated();
    } catch (error) {
      console.error("Error completing follow-up:", error);
      toast.error("Failed to update follow-up status");
    }
  };

  // Format a date nicely
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {company.name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Company Details</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
            <TabsTrigger value="interactions">History & Follow-ups</TabsTrigger>
          </TabsList>
          
          {/* Company Details Tab */}
          <TabsContent value="details" className="space-y-4 pt-4">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    name="industry"
                    value={formData.industry || ''}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hq_location">Location</Label>
                  <Input
                    id="hq_location"
                    name="hq_location"
                    value={formData.hq_location || ''}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wfh_policy">Work From Home Policy</Label>
                  <Input
                    id="wfh_policy"
                    name="wfh_policy"
                    value={formData.wfh_policy || ''}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="user_priority">Priority</Label>
                  <select
                    id="user_priority"
                    name="user_priority"
                    value={formData.user_priority || 'Maybe'}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Top">Top</option>
                    <option value="Medium">Medium</option>
                    <option value="Maybe">Maybe</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    name="website_url"
                    value={formData.website_url || ''}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estimated_headcount">Estimated Headcount</Label>
                  <Input
                    id="estimated_headcount"
                    name="estimated_headcount"
                    value={formData.estimated_headcount || ''}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estimated_revenue">Estimated Revenue</Label>
                  <Input
                    id="estimated_revenue"
                    name="estimated_revenue"
                    value={formData.estimated_revenue || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="public_private">Company Type</Label>
                  <Input
                    id="public_private"
                    name="public_private"
                    value={formData.public_private || ''}
                    onChange={handleChange}
                    placeholder="e.g., Public, Private, Startup"
                  />
                </div>

                {formData.match_quality_score && (
                  <div className="space-y-2">
                    <Label>Match Quality Score</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                      {formData.match_quality_score}%
                    </div>
                  </div>
                )}
                
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="user_notes">Notes</Label>
                  <Textarea
                    id="user_notes"
                    name="user_notes"
                    rows={4}
                    value={formData.user_notes || ''}
                    onChange={handleChange}
                    placeholder="Add your notes about this company..."
                  />
                </div>
                
                {formData.ai_description && (
                  <div className="col-span-2 space-y-2">
                    <Label>AI Description</Label>
                    <div className="rounded-md border p-3 bg-muted/20 text-sm">
                      {formData.ai_description}
                    </div>
                  </div>
                )}

                {formData.ai_match_reasoning && (
                  <div className="col-span-2 space-y-2">
                    <Label>AI Match Reasoning</Label>
                    <div className="rounded-md border p-3 bg-muted/20 text-sm">
                      {formData.ai_match_reasoning}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button type="submit" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Company Contacts</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
            
            {contacts.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(contact => (
                      <tr key={contact.contact_id} className="border-b">
                        <td className="p-3">
                          {contact.first_name || ''} {contact.last_name || ''}
                        </td>
                        <td className="p-3">{contact.role || 'N/A'}</td>
                        <td className="p-3 text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewContact(contact)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <UserRound className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-4">
                  No contacts added for this company yet
                </p>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Interactions Tab */}
          <TabsContent value="interactions" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Interaction History & Planned Actions</h3>
              <div className="space-x-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsPlanningMode(true);
                    setIsAddInteractionOpen(true);
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Plan Action
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    setIsPlanningMode(false);
                    setIsAddInteractionOpen(true);
                  }}
                >
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
                          {interaction.interaction_date ? formatDate(interaction.interaction_date) : 'Planned'}
                        </td>
                        <td className="p-3">
                          <Badge className={`
                            ${interaction.interaction_type === 'Planned Action' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : 
                              interaction.interaction_type === 'Cold Outreach' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' : 
                              interaction.interaction_type === 'Follow-up' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' : 
                              interaction.interaction_type === 'Job Application' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                              interaction.interaction_type === 'Interview' ? 'bg-pink-100 text-pink-800 hover:bg-pink-100' : 
                              'bg-blue-100 text-blue-800 hover:bg-blue-100'}
                          `}>
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
                                  interaction.follow_up_completed ? 'line-through text-muted-foreground' : 
                                  new Date(interaction.follow_up_due_date) < new Date() ? 'text-red-600 font-medium' : ''
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditInteraction(interaction)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
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
                  No interactions logged for this company yet
                </p>
                <Button 
                  size="sm"
                  onClick={() => {
                    setIsPlanningMode(false);
                    setIsAddInteractionOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Log Interaction
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
      
      {/* Contact Details Dialog */}
      {selectedContact && (
        <ContactDetails 
          contact={selectedContact}
          isOpen={isContactDetailsOpen}
          onClose={() => setIsContactDetailsOpen(false)}
          onContactUpdated={handleContactUpdated}
        />
      )}
      
      {/* Interaction Form Dialog */}
      <InteractionForm
        companyId={company.company_id}
        companyName={company.name}
        contacts={contacts}
        isOpen={isAddInteractionOpen}
        onClose={() => setIsAddInteractionOpen(false)}
        onInteractionCreated={handleInteractionCreated}
        isPlanningMode={isPlanningMode}
      />
      
      {/* Edit Interaction Dialog */}
      {selectedInteraction && (
        <InteractionForm
          companyId={company.company_id}
          companyName={company.name}
          contacts={contacts}
          isOpen={isEditInteractionOpen}
          onClose={() => setIsEditInteractionOpen(false)}
          onInteractionCreated={handleInteractionCreated}
          existingInteraction={{
            interaction_id: selectedInteraction.interaction_id,
            interaction_type: selectedInteraction.interaction_type,
            description: selectedInteraction.description,
            interaction_date: selectedInteraction.interaction_date,
            contact_id: selectedInteraction.contact_id,
            follow_up_due_date: selectedInteraction.follow_up_due_date,
            medium: selectedInteraction.medium
          }}
        />
      )}
    </Dialog>
  );
}
