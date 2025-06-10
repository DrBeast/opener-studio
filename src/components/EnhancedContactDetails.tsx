import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, MessageCircle, Calendar, Plus, Pencil, Trash, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { MessageGeneration } from "@/components/MessageGeneration";
import { InteractionForm } from "@/components/InteractionForm";
import { LogInteractionModal } from "@/components/LogInteractionModal";
import { PlanInteractionModal } from "@/components/PlanInteractionModal";
import { useAuth } from "@/hooks/useAuth";
import { useContactInteractionOverview } from "@/hooks/useContactInteractionOverview";
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
  defaultTab?: string;
}

export function EnhancedContactDetails({ 
  contactId, 
  isOpen, 
  onClose, 
  onContactUpdated,
  defaultTab = "details" 
}: EnhancedContactDetailsProps) {
  const { user } = useAuth();
  const [contact, setContact] = useState<ContactData | null>(null);
  const [formData, setFormData] = useState<ContactData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [interactions, setInteractions] = useState<InteractionData[]>([]);
  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [isPlanningMode, setIsPlanningMode] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{[key: string]: {date: string, description: string}}>({});
  const [isLogInteractionOpen, setIsLogInteractionOpen] = useState(false);
  const [isPlanInteractionOpen, setIsPlanInteractionOpen] = useState(false);
  const [companyContacts, setCompanyContacts] = useState<ContactData[]>([]);

  const {
    overview,
    isLoading: isOverviewLoading,
    error: overviewError,
    regenerateOverview
  } = useContactInteractionOverview(contactId);

  useEffect(() => {
    if (contactId && isOpen) {
      fetchContactDetails();
      fetchContactInteractions();
    }
  }, [contactId, isOpen]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

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
      
      // Fetch other contacts from the same company
      if (data.company_id) {
        fetchCompanyContacts(data.company_id);
      }
    } catch (error) {
      console.error("Error fetching contact details:", error);
      toast.error("Failed to load contact details");
    }
  };

  const fetchCompanyContacts = async (companyId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, role')
        .eq('company_id', companyId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setCompanyContacts(data || []);
    } catch (error) {
      console.error("Error fetching company contacts:", error);
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

  const handleInteractionCreated = async () => {
    await fetchContactInteractions();
    setIsAddInteractionOpen(false);
    onContactUpdated();
    // Regenerate interaction summary
    await regenerateOverview();
  };

  const handleLogInteractionSuccess = async () => {
    await fetchContactInteractions();
    setIsLogInteractionOpen(false);
    onContactUpdated();
    // Regenerate interaction summary
    await regenerateOverview();
  };

  const handlePlanInteractionSuccess = async () => {
    await fetchContactInteractions();
    setIsPlanInteractionOpen(false);
    onContactUpdated();
    // Regenerate interaction summary
    await regenerateOverview();
  };

  const handleMessageSaved = async () => {
    await fetchContactInteractions();
    onContactUpdated();
    // Regenerate interaction summary
    await regenerateOverview();
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    try {
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('interaction_id', interactionId);
      
      if (error) throw error;
      
      toast.success("Interaction deleted");
      await fetchContactInteractions();
      onContactUpdated();
      // Regenerate interaction summary
      await regenerateOverview();
    } catch (error) {
      console.error("Error deleting interaction:", error);
      toast.error("Failed to delete interaction");
    }
  };

  const handleEditInteraction = (interactionId: string, currentDate: string, currentDescription: string) => {
    setEditingInteraction(interactionId);
    setEditingValues({
      ...editingValues,
      [interactionId]: {
        date: format(new Date(currentDate), 'yyyy-MM-dd'),
        description: currentDescription || ''
      }
    });
  };

  const handleSaveInteraction = async (interactionId: string) => {
    const values = editingValues[interactionId];
    if (!values) return;

    try {
      const { error } = await supabase
        .from('interactions')
        .update({
          interaction_date: new Date(values.date).toISOString(),
          description: values.description
        })
        .eq('interaction_id', interactionId);
      
      if (error) throw error;
      
      toast.success("Interaction updated");
      setEditingInteraction(null);
      fetchContactInteractions();
      onContactUpdated();
      // Regenerate interaction summary
      await regenerateOverview();
    } catch (error) {
      console.error("Error updating interaction:", error);
      toast.error("Failed to update interaction");
    }
  };

  const handleCancelEdit = () => {
    setEditingInteraction(null);
    setEditingValues({});
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

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

  if (!contact || !formData) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              {formData.first_name || ''} {formData.last_name || ''}
              {formData.companies?.name && (
                <Badge variant="outline" className="text-gray-600 border-gray-300">
                  {formData.companies.name}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-lg">
              <TabsTrigger 
                value="details" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-medium"
              >
                Contact Details
              </TabsTrigger>
              <TabsTrigger 
                value="messages" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-medium"
              >
                Messages
              </TabsTrigger>
              <TabsTrigger 
                value="interactions" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-medium"
              >
                Interactions
              </TabsTrigger>
            </TabsList>
            
            {/* Contact Details Tab */}
            <TabsContent value="details" className="space-y-6 pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name || ''}
                      onChange={handleChange}
                      className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name || ''}
                      onChange={handleChange}
                      className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
                    <Input
                      id="role"
                      name="role"
                      value={formData.role || ''}
                      onChange={handleChange}
                      className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location || ''}
                      onChange={handleChange}
                      className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="text-sm font-medium text-gray-700">LinkedIn URL</Label>
                    <Input
                      id="linkedin_url"
                      name="linkedin_url"
                      value={formData.linkedin_url || ''}
                      onChange={handleChange}
                      className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="user_notes" className="text-sm font-medium text-gray-700">Your Notes</Label>
                  <Textarea
                    id="user_notes"
                    name="user_notes"
                    rows={4}
                    value={formData.user_notes || ''}
                    onChange={handleChange}
                    placeholder="Add your personal notes about this contact..."
                    className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                
                {formData.bio_summary && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Background Summary</Label>
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 text-sm text-gray-700">
                      {formData.bio_summary}
                    </div>
                  </div>
                )}
                
                {formData.how_i_can_help && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">How I Can Help</Label>
                    <div className="rounded-lg border border-purple-200 p-4 bg-purple-50 text-sm text-purple-800">
                      {formData.how_i_can_help}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Enhanced Messages Tab */}
            <TabsContent value="messages" className="space-y-6 pt-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Generate Outreach Message</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You are crafting a personalized message to build genuine connections and articulate your value proposition authentically, focusing on mutual learning rather than just asking for opportunities.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong className="text-blue-900">How AI helps you succeed:</strong>
                      <p className="text-blue-800 mt-1">
                        Your experience and skills are analyzed in relation to this contact's role and company needs. The AI helps you frame your outreach around genuine interest and mutual value, avoiding the "sales-y" feeling by focusing on how you can contribute rather than what you need.
                      </p>
                    </div>
                    
                    <div>
                      <strong className="text-blue-900">Your value proposition approach:</strong>
                      <p className="text-blue-800 mt-1">
                        You are positioning yourself as someone who can bring value to their work and company goals. Your professional background is leveraged to demonstrate authentic interest in their industry and challenges, making the connection feel natural and mutually beneficial.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <MessageGeneration
                contact={contact}
                companyName={contact.companies?.name || 'Unknown Company'}
                isOpen={true}
                onClose={() => {}}
                onMessageSaved={handleMessageSaved}
                embedded={true}
              />
            </TabsContent>
            
            {/* Simplified Interactions Tab */}
            <TabsContent value="interactions" className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Interaction Summary</Label>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  {renderInteractionSummary()}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Interactions</h3>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setIsLogInteractionOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Log Interaction
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsPlanInteractionOpen(true)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Calendar className="h-4 w-4 mr-2" />
                    Plan Interaction
                  </Button>
                </div>
              </div>

              {interactions.length > 0 ? (
                <div className="space-y-4">
                  {interactions.map(interaction => (
                    <div key={interaction.interaction_id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          {editingInteraction === interaction.interaction_id ? (
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor={`date-${interaction.interaction_id}`} className="text-sm font-medium text-gray-700">Date</Label>
                                <Input
                                  id={`date-${interaction.interaction_id}`}
                                  type="date"
                                  value={editingValues[interaction.interaction_id]?.date || ''}
                                  onChange={(e) => setEditingValues({
                                    ...editingValues,
                                    [interaction.interaction_id]: {
                                      ...editingValues[interaction.interaction_id],
                                      date: e.target.value
                                    }
                                  })}
                                  className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`desc-${interaction.interaction_id}`} className="text-sm font-medium text-gray-700">Description</Label>
                                <Textarea
                                  id={`desc-${interaction.interaction_id}`}
                                  value={editingValues[interaction.interaction_id]?.description || ''}
                                  onChange={(e) => setEditingValues({
                                    ...editingValues,
                                    [interaction.interaction_id]: {
                                      ...editingValues[interaction.interaction_id],
                                      description: e.target.value
                                    }
                                  })}
                                  rows={3}
                                  className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveInteraction(interaction.interaction_id)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div 
                                className="text-sm font-medium text-gray-600 cursor-pointer hover:text-purple-600 transition-colors"
                                onClick={() => handleEditInteraction(
                                  interaction.interaction_id, 
                                  interaction.interaction_date, 
                                  interaction.description || ''
                                )}
                              >
                                {formatDate(interaction.interaction_date)}
                              </div>
                              <div 
                                className="text-sm mt-1 cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 transition-colors text-gray-700"
                                onClick={() => handleEditInteraction(
                                  interaction.interaction_id, 
                                  interaction.interaction_date, 
                                  interaction.description || ''
                                )}
                              >
                                {interaction.description}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {editingInteraction !== interaction.interaction_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
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
                <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    No interactions logged for this contact yet
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={() => setIsLogInteractionOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Log Interaction
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsPlanInteractionOpen(true)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                      <Calendar className="h-4 w-4 mr-2" />
                      Plan Interaction
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Log Interaction Modal */}
      {contact && (
        <LogInteractionModal
          isOpen={isLogInteractionOpen}
          onClose={() => setIsLogInteractionOpen(false)}
          companyId={contact.company_id || ''}
          companyName={contact.companies?.name || 'Unknown Company'}
          availableContacts={companyContacts}
          preSelectedContact={contact}
          onSuccess={handleLogInteractionSuccess}
        />
      )}

      {/* Plan Interaction Modal */}
      {contact && (
        <PlanInteractionModal
          isOpen={isPlanInteractionOpen}
          onClose={() => setIsPlanInteractionOpen(false)}
          companyId={contact.company_id || ''}
          companyName={contact.companies?.name || 'Unknown Company'}
          availableContacts={companyContacts}
          preSelectedContact={contact}
          onSuccess={handlePlanInteractionSuccess}
        />
      )}

      {/* Old Interaction Form Dialog - keeping for legacy support */}
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
