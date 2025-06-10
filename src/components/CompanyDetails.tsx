import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, MessageCircle, Calendar, Plus, Building, MapPin, Users, Globe, RefreshCw, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { InteractionForm } from "@/components/InteractionForm";
import { LogInteractionModal } from "@/components/LogInteractionModal";
import { PlanInteractionModal } from "@/components/PlanInteractionModal";
import { useAuth } from "@/hooks/useAuth";
import { useInteractionOverview } from "@/hooks/useInteractionOverview";
import { format } from "date-fns";

interface CompanyData {
  company_id: string;
  name: string;
  industry?: string;
  hq_location?: string;
  website_url?: string;
  description?: string;
  notes?: string;
}

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
}

interface InteractionData {
  interaction_id: string;
  interaction_type: string;
  description?: string;
  interaction_date: string;
  follow_up_due_date?: string;
  follow_up_completed?: boolean;
  medium?: string;
  company_id?: string;
  contact_id?: string;
  contacts?: {
    first_name?: string;
    last_name?: string;
  };
}

interface CompanyDetailsProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onCompanyUpdated: () => void;
  defaultTab?: string;
}

export function CompanyDetails({ 
  companyId, 
  isOpen, 
  onClose, 
  onCompanyUpdated,
  defaultTab = "details" 
}: CompanyDetailsProps) {
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [formData, setFormData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [interactions, setInteractions] = useState<InteractionData[]>([]);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [isPlanningMode, setIsPlanningMode] = useState(false);
  const [isLogInteractionOpen, setIsLogInteractionOpen] = useState(false);
  const [isPlanInteractionOpen, setIsPlanInteractionOpen] = useState(false);

  const {
    overview,
    isLoading: isOverviewLoading,
    error: overviewError,
    regenerateOverview
  } = useInteractionOverview(companyId);

  useEffect(() => {
    if (companyId && isOpen) {
      fetchCompanyDetails();
      fetchCompanyInteractions();
      fetchCompanyContacts();
    }
  }, [companyId, isOpen]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const fetchCompanyDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      if (error) throw error;
      
      setCompany(data);
      setFormData(data);
    } catch (error) {
      console.error("Error fetching company details:", error);
      toast.error("Failed to load company details");
    }
  };

  const fetchCompanyInteractions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          *,
          contacts (
            first_name,
            last_name
          )
        `)
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .order('interaction_date', { ascending: false });
      
      if (error) throw error;
      
      setInteractions(data || []);
    } catch (error) {
      console.error("Error fetching company interactions:", error);
      toast.error("Failed to load interactions");
    }
  };

  const fetchCompanyContacts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, role, company_id')
        .eq('company_id', companyId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching company contacts:", error);
      toast.error("Failed to load contacts");
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
        .from('companies')
        .update({
          name: formData.name,
          industry: formData.industry,
          hq_location: formData.hq_location,
          website_url: formData.website_url,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', companyId);
      
      if (error) throw error;
      
      toast.success("Company details updated successfully");
      onCompanyUpdated();
      await fetchCompanyDetails();
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company details: " + (error.message || "Unknown error"));
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
      fetchCompanyInteractions();
      onCompanyUpdated();
    } catch (error) {
      console.error("Error completing follow-up:", error);
      toast.error("Failed to update follow-up status");
    }
  };

  const handleInteractionCreated = async () => {
    await fetchCompanyInteractions();
    setIsAddInteractionOpen(false);
    onCompanyUpdated();
    // Regenerate interaction summary
    await regenerateOverview();
  };

  const handleLogInteractionSuccess = async () => {
    await fetchCompanyInteractions();
    setIsLogInteractionOpen(false);
    onCompanyUpdated();
    // Regenerate interaction summary
    await regenerateOverview();
  };

  const handlePlanInteractionSuccess = async () => {
    await fetchCompanyInteractions();
    setIsPlanInteractionOpen(false);
    onCompanyUpdated();
    // Regenerate interaction summary
    await regenerateOverview();
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

  if (!company || !formData) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-medium flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              {formData.name}
              {formData.industry && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-0">
                  {formData.industry}
                </Badge>
              )}
            </DialogTitle>
            {(formData.hq_location || formData.website_url) && (
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                {formData.hq_location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {formData.hq_location}
                  </div>
                )}
                {formData.website_url && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <a href={formData.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                      Website
                    </a>
                  </div>
                )}
              </div>
            )}
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 h-10 bg-gray-100 p-0.5 rounded-lg mb-6">
              <TabsTrigger 
                value="details" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-medium rounded-md h-9"
              >
                Company Details
              </TabsTrigger>
              <TabsTrigger 
                value="interactions" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-medium rounded-md h-9"
              >
                Interactions
              </TabsTrigger>
              <TabsTrigger 
                value="contacts" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-medium rounded-md h-9"
              >
                Contacts
              </TabsTrigger>
            </TabsList>
            
            {/* Company Details Tab */}
            <TabsContent value="details" className="flex-1 overflow-y-auto space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Company Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-sm font-medium text-gray-700">Industry</Label>
                    <Input
                      id="industry"
                      name="industry"
                      value={formData.industry || ''}
                      onChange={handleChange}
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hq_location" className="text-sm font-medium text-gray-700">Headquarters</Label>
                    <Input
                      id="hq_location"
                      name="hq_location"
                      value={formData.hq_location || ''}
                      onChange={handleChange}
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website_url" className="text-sm font-medium text-gray-700">Website</Label>
                    <Input
                      id="website_url"
                      name="website_url"
                      value={formData.website_url || ''}
                      onChange={handleChange}
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Your Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    value={formData.notes || ''}
                    onChange={handleChange}
                    placeholder="Add your personal notes about this company..."
                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
                
                {formData.description && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Company Description</Label>
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 text-sm text-gray-700">
                      {formData.description}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Interactions Tab */}
            <TabsContent value="interactions" className="flex-1 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Interaction Summary</Label>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  {renderInteractionSummary()}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Interactions</h3>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setIsLogInteractionOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
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
                        <div>
                          <div className="text-sm font-medium text-gray-600">
                            {formatDate(interaction.interaction_date)}
                            {interaction.contacts && interaction.contacts.first_name && (
                              <span className="ml-2">
                                with {interaction.contacts.first_name} {interaction.contacts.last_name}
                              </span>
                            )}
                          </div>
                          <div className="text-sm mt-1 text-gray-700">
                            {interaction.description}
                          </div>
                          
                          {interaction.follow_up_due_date && !interaction.follow_up_completed && (
                            <div className="mt-3 flex items-center">
                              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                Follow-up due: {formatDate(interaction.follow_up_due_date)}
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleCompleteFollowUp(interaction.interaction_id)}
                                className="ml-2 h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Mark Complete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    No interactions logged for this company yet
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={() => setIsLogInteractionOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
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
            
            {/* Contacts Tab */}
            <TabsContent value="contacts" className="flex-1 overflow-y-auto space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Contacts</h3>
                <Button size="sm" onClick={() => window.location.href = `/contacts?company=${companyId}`} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              {contacts.length > 0 ? (
                <div className="space-y-4">
                  {contacts.map(contact => (
                    <div key={contact.contact_id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </div>
                          {contact.role && (
                            <div className="text-sm text-gray-600">
                              {contact.role}
                            </div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = `/contacts/${contact.contact_id}`}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    No contacts added for this company yet
                  </p>
                  <Button onClick={() => window.location.href = `/contacts?company=${companyId}`} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Log Interaction Modal */}
      <LogInteractionModal
        isOpen={isLogInteractionOpen}
        onClose={() => setIsLogInteractionOpen(false)}
        companyId={companyId}
        companyName={company.name}
        availableContacts={contacts}
        onSuccess={handleLogInteractionSuccess}
      />

      {/* Plan Interaction Modal */}
      <PlanInteractionModal
        isOpen={isPlanInteractionOpen}
        onClose={() => setIsPlanInteractionOpen(false)}
        companyId={companyId}
        companyName={company.name}
        availableContacts={contacts}
        onSuccess={handlePlanInteractionSuccess}
      />

      {/* Old Interaction Form Dialog - keeping for legacy support */}
      <InteractionForm
        companyId={companyId}
        companyName={company.name}
        contacts={contacts}
        isOpen={isAddInteractionOpen}
        onClose={() => setIsAddInteractionOpen(false)}
        onInteractionCreated={handleInteractionCreated}
        isPlanningMode={isPlanningMode}
      />
    </>
  );
}
