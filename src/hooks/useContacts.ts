import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/airtable-ds/use-toast";

export interface Contact {
  contact_id: string;
  user_id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  role: string;
  location: string;
  email: string;
  linkedin_url: string;
  user_notes: string;
  bio_summary: string;
  how_i_can_help: string;
  recent_activity_summary: string;
  added_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
  // Extended with company info from join
  company_name?: string;
  company_industry?: string;
  last_interaction_date?: string;
}

export const useContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showInactive, setShowInactive] = useState(false);

  const fetchContacts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          companies!contacts_company_id_fkey (
            name,
            industry
          )
        `)
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });

      if (error) throw error;

      // Transform the data to flatten company info
      const transformedContacts = data?.map((contact: any) => ({
        ...contact,
        company_name: contact.companies?.name,
        company_industry: contact.companies?.industry,
      })) || [];

      setContacts(transformedContacts);
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === contacts.length && contacts.length > 0) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.contact_id)));
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleContactStatus = async (contactId: string, newStatus: 'active' | 'inactive') => {
    try {
      const { error } = await supabase
        .from("contacts")
        .update({ status: newStatus })
        .eq("contact_id", contactId)
        .eq("user_id", user?.id);

      if (error) throw error;

      await fetchContacts();
      toast({
        title: "Success",
        description: `Contact marked as ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating contact status:", error);
      toast({
        title: "Error",
        description: "Failed to update contact status",
        variant: "destructive",
      });
    }
  };

  // Filter contacts based on showInactive toggle
  const filteredContacts = showInactive 
    ? contacts 
    : contacts.filter(contact => contact.status === 'active');

  useEffect(() => {
    fetchContacts();
  }, [user]);

  return {
    contacts: filteredContacts,
    allContacts: contacts,
    isLoading,
    fetchContacts,
    selectedContacts,
    handleSelectContact,
    handleSelectAll,
    sortField,
    sortDirection,
    handleSort,
    showInactive,
    setShowInactive,
    toggleContactStatus,
  };
};