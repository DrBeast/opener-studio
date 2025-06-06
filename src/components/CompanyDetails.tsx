
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, UserPlus, MessageCircle, User, Building, MapPin, Mail, Linkedin, Calendar, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedContactDetails } from "@/components/EnhancedContactDetails";
import { EnhancedContactModal } from "@/components/pipeline/EnhancedContactModal";
import { LogInteractionModal } from "@/components/LogInteractionModal";
import { PlanInteractionModal } from "@/components/PlanInteractionModal";
import type { Company } from "@/hooks/useCompanies";

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
  recent_activity_summary?: string;
  added_at?: string;
}

interface CompanyDetailsProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  onCompanyUpdated: () => void;
}

export function CompanyDetails({ company, isOpen, onClose, onCompanyUpdated }: CompanyDetailsProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: company.name || '',
    industry: company.industry || '',
    hq_location: company.hq_location || '',
    user_priority: company.user_priority || 'Maybe',
    user_notes: company.user_notes || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [isContactsLoading, setIsContactsLoading] = useState(true);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isLogInteractionOpen, setIsLogInteractionOpen] = useState(false);
  const [isPlanInteractionOpen, setIsPlanInteractionOpen] = useState(false);

  useEffect(() => {
    if (isOpen && company) {
      setFormData({
        name: company.name || '',
        industry: company.industry || '',
        hq_location: company.hq_location || '',
        user_priority: company.user_priority || 'Maybe',
        user_notes: company.user_notes || '',
      });
      fetchContacts();
    }
  }, [isOpen, company]);

  const fetchContacts = async () => {
    if (!user || !company?.company_id) return;
    
    setIsContactsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', company.company_id)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });
      
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setIsContactsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          industry: formData.industry,
          hq_location: formData.hq_location,
          user_priority: formData.user_priority,
          user_notes: formData.user_notes,
          updated_at: new Date().toISOString()
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

  const handleContactClick = (contactId: string) => {
    setSelectedContactId(contactId);
    setIsContactDetailsOpen(true);
  };

  const handleContactDetailClose = () => {
    setIsContactDetailsOpen(false);
    setSelectedContactId(null);
  };

  const handleContactUpdated = async () => {
    await fetchContacts();
    onCompanyUpdated();
  };

  const handleAddContactSuccess = () => {
    setIsAddContactOpen(false);
    fetchContacts();
    onCompanyUpdated();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Top': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Maybe': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {company.name}
              <Badge className={getPriorityColor(company.user_priority || 'Maybe')}>
                {company.user_priority || 'Maybe'}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Company Details</TabsTrigger>
              <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 pt-4">
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      value={formData.industry}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hq_location">Headquarters Location</Label>
                    <Input
                      id="hq_location"
                      name="hq_location"
                      value={formData.hq_location}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="user_priority">Priority</Label>
                    <select
                      id="user_priority"
                      name="user_priority"
                      value={formData.user_priority}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="Top">Top</option>
                      <option value="Medium">Medium</option>
                      <option value="Maybe">Maybe</option>
                    </select>
                  </div>
                </div>
                
                {company.ai_description && (
                  <div className="space-y-2">
                    <Label>AI Description</Label>
                    <div className="rounded-md border p-3 bg-muted/20">
                      {company.ai_description}
                    </div>
                  </div>
                )}
                
                {company.ai_match_reasoning && (
                  <div className="space-y-2">
                    <Label>AI Match Reasoning</Label>
                    <div className="rounded-md border p-3 bg-primary/5 border-primary/10">
                      {company.ai_match_reasoning}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="user_notes">Your Notes</Label>
                  <Textarea
                    id="user_notes"
                    name="user_notes"
                    rows={4}
                    value={formData.user_notes}
                    onChange={handleChange}
                    placeholder="Add your personal notes about this company..."
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="contacts" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Contacts</h3>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setIsLogInteractionOpen(true)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Log Interaction
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsPlanInteractionOpen(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Plan Interaction
                  </Button>
                  <Button size="sm" onClick={() => setIsAddContactOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              </div>

              {isContactsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading contacts...</p>
                </div>
              ) : contacts.length > 0 ? (
                <div className="space-y-3">
                  {contacts.map(contact => (
                    <div 
                      key={contact.contact_id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleContactClick(contact.contact_id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {contact.first_name} {contact.last_name}
                            </span>
                          </div>
                          
                          {contact.role && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{contact.role}</span>
                            </div>
                          )}
                          
                          {contact.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{contact.location}</span>
                            </div>
                          )}
                          
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{contact.email}</span>
                            </div>
                          )}
                          
                          {contact.linkedin_url && (
                            <div className="flex items-center gap-2">
                              <Linkedin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">LinkedIn Profile</span>
                            </div>
                          )}
                          
                          {contact.bio_summary && (
                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground">
                                {contact.bio_summary.length > 150 
                                  ? `${contact.bio_summary.substring(0, 150)}...`
                                  : contact.bio_summary
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-6 text-center">
                  <UserPlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">
                    No contacts added for this company yet
                  </p>
                  <Button onClick={() => setIsAddContactOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Contact
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Enhanced Contact Details Modal */}
      {selectedContactId && (
        <EnhancedContactDetails
          contactId={selectedContactId}
          isOpen={isContactDetailsOpen}
          onClose={handleContactDetailClose}
          onContactUpdated={handleContactUpdated}
        />
      )}

      {/* Add Contact Modal */}
      <EnhancedContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        companyId={company.company_id}
        companyName={company.name}
        onSuccess={handleAddContactSuccess}
      />

      {/* Log Interaction Modal */}
      <LogInteractionModal
        isOpen={isLogInteractionOpen}
        onClose={() => setIsLogInteractionOpen(false)}
        companyId={company.company_id}
        companyName={company.name}
        availableContacts={contacts}
        onSuccess={() => {
          setIsLogInteractionOpen(false);
          handleContactUpdated();
        }}
      />

      {/* Plan Interaction Modal */}
      <PlanInteractionModal
        isOpen={isPlanInteractionOpen}
        onClose={() => setIsPlanInteractionOpen(false)}
        companyId={company.company_id}
        companyName={company.name}
        availableContacts={contacts}
        onSuccess={() => {
          setIsPlanInteractionOpen(false);
          handleContactUpdated();
        }}
      />
    </>
  );
}
