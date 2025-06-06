import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, UserRound, Calendar, MessageCircle, Plus, Trash, FileText, Pencil, ChevronDown, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { EnhancedContactDetails } from "@/components/EnhancedContactDetails";
import { InteractionForm } from "@/components/InteractionForm";
import { LogInteractionModal } from "@/components/LogInteractionModal";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useInteractionOverview } from "@/hooks/useInteractionOverview";
import { PlanInteractionModal } from "@/components/PlanInteractionModal";

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
  defaultTab?: string;
}
export function CompanyDetails({
  company,
  isOpen,
  onClose,
  onCompanyUpdated,
  defaultTab = "details"
}: CompanyDetailsProps) {
  const {
    user
  } = useAuth();
  const [formData, setFormData] = useState<CompanyData>({
    ...company
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [interactions, setInteractions] = useState<InteractionData[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [isPlanningMode, setIsPlanningMode] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<InteractionData | null>(null);
  const [isEditInteractionOpen, setIsEditInteractionOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState<string>('');
  const [isLogInteractionOpen, setIsLogInteractionOpen] = useState(false);
  const [isPlanInteractionOpen, setIsPlanInteractionOpen] = useState(false);
  const {
    overview,
    isLoading: isOverviewLoading,
    error: overviewError,
    regenerateOverview
  } = useInteractionOverview(company.company_id);

  // Update formData when company prop changes
  useEffect(() => {
    setFormData({
      ...company
    });
  }, [company]);

  // Fetch contacts and interactions when component mounts or company changes
  useEffect(() => {
    if (company.company_id) {
      fetchContacts();
      fetchInteractions();
      fetchFullCompanyDetails();
    }
  }, [company.company_id]);

  // Fetch full company details to ensure we have all the data
  const fetchFullCompanyDetails = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('companies').select('*').eq('company_id', company.company_id).eq('user_id', user.id).single();
      if (error) throw error;
      if (data) {
        // Ensure user_priority is properly typed
        const companyData: CompanyData = {
          ...data,
          user_priority: data.user_priority as 'Top' | 'Medium' | 'Maybe' || 'Maybe'
        };
        setFormData(companyData);
      }
    } catch (error) {
      console.error("Error fetching full company details:", error);
    }
  };

  // Fetch contacts for this company
  const fetchContacts = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('contacts').select('*').eq('company_id', company.company_id).eq('user_id', user.id);
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
    const {
      data,
      error
    } = await supabase.from('interactions').select('*').eq('company_id', company.company_id).eq('user_id', user.id).order('interaction_date', {
      ascending: false
    });
    if (error) {
      console.error("Error fetching interactions:", error);
      toast.error("Failed to load interactions");
    } else {
      setInteractions(data);
    }
  };

  // Helper function to check if a field has meaningful data
  const hasData = (value: string | null | undefined): boolean => {
    return value !== null && value !== undefined && value.trim() !== '';
  };

  // Helper function to get priority color classes (same as Pipeline view)
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Top':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case 'Maybe':
        return 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200';
    }
  };

  // Get priority options excluding the current one
  const getPriorityOptions = (currentPriority?: string) => {
    const priorities = ['Top', 'Medium', 'Maybe'];
    return priorities.filter(p => p !== currentPriority);
  };

  // Handle priority change
  const handlePriorityChange = (newPriority: string) => {
    setFormData(prev => ({
      ...prev,
      user_priority: newPriority as 'Top' | 'Medium' | 'Maybe'
    }));
  };

  // Priority dropdown component (same style as Pipeline view)
  const PriorityDropdown = () => {
    const otherPriorities = getPriorityOptions(formData.user_priority);
    if (otherPriorities.length === 0) {
      return <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border cursor-pointer transition-colors", getPriorityColor(formData.user_priority))}>
          {formData.user_priority || 'Maybe'}
        </span>;
    }
    return <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border cursor-pointer transition-colors gap-1", getPriorityColor(formData.user_priority))}>
            {formData.user_priority || 'Maybe'}
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-20 p-1">
          {otherPriorities.map(priority => <DropdownMenuItem key={priority} onClick={() => handlePriorityChange(priority)} className="p-1 hover:bg-transparent focus:bg-transparent">
              <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border cursor-pointer transition-colors w-full justify-center", getPriorityColor(priority))}>
                {priority}
              </span>
            </DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>;
  };

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
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
      const {
        error
      } = await supabase.from('companies').update({
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
      }).eq('company_id', company.company_id);
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
    setSelectedContactId(contact.contact_id);
    setIsContactDetailsOpen(true);
  };

  // Handle contact updated
  const handleContactUpdated = () => {
    fetchContacts();
    setIsContactDetailsOpen(false);
    setSelectedContactId(null);
  };

  // Handle new interaction created - regenerate summary
  const handleInteractionCreated = async () => {
    await fetchInteractions();
    setIsAddInteractionOpen(false);
    setIsEditInteractionOpen(false);
    setSelectedInteraction(null);
    onCompanyUpdated();
    // Regenerate interaction summary
    await regenerateOverview();
  };

  const handleLogInteractionSuccess = async () => {
    await fetchInteractions();
    setIsLogInteractionOpen(false);
    onCompanyUpdated();
    // Regenerate interaction summary
    await regenerateOverview();
  };

  const handlePlanInteractionSuccess = async () => {
    await fetchInteractions();
    setIsPlanInteractionOpen(false);
    onCompanyUpdated();
    // Regenerate interaction summary
    await regenerateOverview();
  };

  // Handle interaction updated - regenerate summary
  const handleSaveInlineEdit = async (interactionId: string) => {
    try {
      const { error } = await supabase
        .from('interactions')
        .update({ description: editingDescription })
        .eq('interaction_id', interactionId);
      
      if (error) throw error;
      
      toast.success("Interaction updated");
      setEditingInteraction(null);
      await fetchInteractions();
      onCompanyUpdated();
      // Regenerate interaction summary
      await regenerateOverview();
    } catch (error) {
      console.error("Error updating interaction:", error);
      toast.error("Failed to update interaction");
    }
  };

  // Handle interaction deleted - regenerate summary
  const handleDeleteInteraction = async (interactionId: string) => {
    try {
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('interaction_id', interactionId);
      
      if (error) throw error;
      
      toast.success("Interaction deleted");
      await fetchInteractions();
      onCompanyUpdated();
      // Regenerate interaction summary
      await regenerateOverview();
    } catch (error) {
      console.error("Error deleting interaction:", error);
      toast.error("Failed to delete interaction");
    }
  };

  // Handle opening the interaction form for editing
  const handleEditInteraction = (interaction: InteractionData) => {
    setSelectedInteraction(interaction);
    setIsEditInteractionOpen(true);
  };

  // Handle marking a follow-up as complete
  const handleCompleteFollowUp = async (interactionId: string) => {
    try {
      const {
        error
      } = await supabase.from('interactions').update({
        follow_up_completed: true,
        follow_up_completed_date: new Date().toISOString()
      }).eq('interaction_id', interactionId);
      if (error) throw error;
      toast.success("Follow-up marked as completed");
      fetchInteractions();
      onCompanyUpdated();
    } catch (error) {
      console.error("Error completing follow-up:", error);
      toast.error("Failed to update follow-up status");
    }
  };
  const handleEditInteractionInline = (interactionId: string, currentDescription: string) => {
    setEditingInteraction(interactionId);
    setEditingDescription(currentDescription || '');
  };
  const handleCancelInlineEdit = () => {
    setEditingInteraction(null);
    setEditingDescription('');
  };

  // Format a date nicely
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Render the interaction summary section consistently
  const renderInteractionSummary = () => {
    if (isOverviewLoading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Generating interaction summary...
        </div>
      );
    }
    
    if (overviewError) {
      return (
        <div className="flex flex-col">
          <div className="text-red-500">Error loading interaction summary</div>
          <Button variant="outline" size="sm" onClick={regenerateOverview} className="mt-2 self-start">
            <RefreshCw className="mr-2 h-3 w-3" /> Try again
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col">
        <div className="flex items-start justify-between">
          <div>
            {overview?.overview ? (
              <p className="text-sm">{overview.overview}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No interaction summary available</p>
            )}
            
            {overview?.interactionCount !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                {overview.interactionCount} total
                {overview.pastCount !== undefined && overview.plannedCount !== undefined && 
                  ` (${overview.pastCount} past, ${overview.plannedCount} planned)`
                }
              </p>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={regenerateOverview} 
            className="ml-2 h-8 w-8 p-0" 
            title="Regenerate summary"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{company.name}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Company Details</TabsTrigger>
              <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
            </TabsList>
            
            {/* Company Details Tab */}
            <TabsContent value="details" className="space-y-4 pt-4">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <div className="flex h-10 w-full items-center">
                      <PriorityDropdown />
                    </div>
                  </div>
                  
                  {hasData(formData.industry) && <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input id="industry" name="industry" value={formData.industry || ''} onChange={handleChange} />
                    </div>}
                  
                  {hasData(formData.hq_location) && <div className="space-y-2">
                      <Label htmlFor="hq_location">Location</Label>
                      <Input id="hq_location" name="hq_location" value={formData.hq_location || ''} onChange={handleChange} />
                    </div>}
                  
                  {hasData(formData.wfh_policy) && <div className="space-y-2">
                      <Label htmlFor="wfh_policy">Work From Home Policy</Label>
                      <Input id="wfh_policy" name="wfh_policy" value={formData.wfh_policy || ''} onChange={handleChange} />
                    </div>}
                  
                  {hasData(formData.website_url) && <div className="space-y-2">
                      <Label htmlFor="website_url">Website URL</Label>
                      <Input id="website_url" name="website_url" value={formData.website_url || ''} onChange={handleChange} />
                    </div>}
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimated_headcount">Estimated Headcount</Label>
                    <Input id="estimated_headcount" name="estimated_headcount" value={formData.estimated_headcount || ''} onChange={handleChange} placeholder="e.g., 100-500" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimated_revenue">Estimated Revenue</Label>
                    <Input id="estimated_revenue" name="estimated_revenue" value={formData.estimated_revenue || ''} onChange={handleChange} placeholder="e.g., $10M-50M" />
                  </div>

                  {hasData(formData.public_private) && <div className="space-y-2">
                      <Label htmlFor="public_private">Company Type</Label>
                      <Input id="public_private" name="public_private" value={formData.public_private || ''} onChange={handleChange} placeholder="e.g., Public, Private, Startup" />
                    </div>}
                  
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="user_notes">Notes</Label>
                    <Textarea id="user_notes" name="user_notes" rows={4} value={formData.user_notes || ''} onChange={handleChange} placeholder="Add your notes about this company..." />
                  </div>
                  
                  {hasData(formData.ai_description) && <div className="col-span-2 space-y-2">
                      <Label>AI Description</Label>
                      <div className="rounded-md border p-3 bg-muted/20 text-sm">
                        {formData.ai_description}
                      </div>
                    </div>}

                  {hasData(formData.ai_match_reasoning) && <div className="col-span-2 space-y-2">
                      <Label>AI Match Reasoning</Label>
                      <div className="rounded-md border p-3 bg-muted/20 text-sm">
                        {formData.ai_match_reasoning}
                      </div>
                    </div>}
                  
                  {/* Interaction Summary Section */}
                  <div className="col-span-2 space-y-2">
                    <Label className="flex items-center justify-between">
                      
                    </Label>
                    
                  </div>
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
                            <Button variant="outline" size="sm" onClick={() => handleViewContact(contact)}>
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
              {/* Interaction Summary Section */}
              <div className="space-y-2">
                <Label>Interaction Summary</Label>
                <div className="rounded-md border p-3 bg-muted/20">
                  {renderInteractionSummary()}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Interactions</h3>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setIsLogInteractionOpen(true)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Log Interaction
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsPlanInteractionOpen(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Plan Interaction
                  </Button>
                </div>
              </div>
              
              {interactions.length > 0 ? (
                <div className="space-y-3">
                  {interactions.map(interaction => (
                    <div key={interaction.interaction_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">
                            {formatDate(interaction.interaction_date)}
                          </div>
                          
                          {editingInteraction === interaction.interaction_id ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editingDescription}
                                onChange={(e) => setEditingDescription(e.target.value)}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSaveInlineEdit(interaction.interaction_id)}>
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelInlineEdit}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                              onClick={() => handleEditInteractionInline(interaction.interaction_id, interaction.description || '')}
                            >
                              {interaction.description}
                            </div>
                          )}
                        </div>
                        
                        {editingInteraction !== interaction.interaction_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteInteraction(interaction.interaction_id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-6 text-center">
                  <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">
                    No interactions logged for this company yet
                  </p>
                  <Button size="sm" onClick={() => setIsLogInteractionOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Interaction
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
        
        {/* Enhanced Contact Details Dialog */}
        {selectedContactId && (
          <EnhancedContactDetails
            contactId={selectedContactId}
            isOpen={isContactDetailsOpen}
            onClose={() => setIsContactDetailsOpen(false)}
            onContactUpdated={handleContactUpdated}
          />
        )}
        
        {/* Log Interaction Modal */}
        {company && (
          <LogInteractionModal
            isOpen={isLogInteractionOpen}
            onClose={() => setIsLogInteractionOpen(false)}
            companyId={company.company_id}
            companyName={company.name || 'Unknown Company'}
            availableContacts={contacts}
            onSuccess={handleLogInteractionSuccess}
          />
        )}
        
        {/* Plan Interaction Modal */}
        {company && (
          <PlanInteractionModal
            isOpen={isPlanInteractionOpen}
            onClose={() => setIsPlanInteractionOpen(false)}
            companyId={company.company_id}
            companyName={company.name || 'Unknown Company'}
            availableContacts={contacts}
            onSuccess={handlePlanInteractionSuccess}
          />
        )}
        
        {/* Legacy Interaction Form Dialog */}
        <InteractionForm companyId={company.company_id} companyName={company.name} contacts={contacts} isOpen={isAddInteractionOpen} onClose={() => setIsAddInteractionOpen(false)} onInteractionCreated={handleInteractionCreated} isPlanningMode={isPlanningMode} />
        
        {/* Edit Interaction Dialog */}
        {selectedInteraction && <InteractionForm companyId={company.company_id} companyName={company.name} contacts={contacts} isOpen={isEditInteractionOpen} onClose={() => setIsEditInteractionOpen(false)} onInteractionCreated={handleInteractionCreated} existingInteraction={{
        interaction_id: selectedInteraction.interaction_id,
        interaction_type: selectedInteraction.interaction_type,
        description: selectedInteraction.description,
        interaction_date: selectedInteraction.interaction_date,
        contact_id: selectedInteraction.contact_id,
        follow_up_due_date: selectedInteraction.follow_up_due_date,
        medium: selectedInteraction.medium
      }} />}
      </Dialog>
    </>
  );
}
