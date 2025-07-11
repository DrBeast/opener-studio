import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ContactCreationStepProps {
  onContactCreated: () => void;
}

const ContactCreationStep = ({ onContactCreated }: ContactCreationStepProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [contactData, setContactData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    role: "",
    linkedinUrl: "",
    bio: "",
  });

  const handleSubmit = async () => {
    if (!user || !contactData.firstName || !contactData.lastName) {
      toast.error("Please fill in the required fields");
      return;
    }

    setIsLoading(true);
    try {
      // First, check if company exists or create it
      let companyId = "";
      if (contactData.company) {
        const { data: existingCompany } = await supabase
          .from("companies")
          .select("company_id")
          .eq("name", contactData.company)
          .eq("user_id", user.id)
          .single();

        if (existingCompany) {
          companyId = existingCompany.company_id;
        } else {
          // Create new company
          const { data: newCompany, error: companyError } = await supabase
            .from("companies")
            .insert({
              name: contactData.company,
              user_id: user.id,
            })
            .select("company_id")
            .single();

          if (companyError) throw companyError;
          companyId = newCompany.company_id;
        }
      }

      // Create the contact
      const { error: contactError } = await supabase
        .from("contacts")
        .insert({
          first_name: contactData.firstName,
          last_name: contactData.lastName,
          company_id: companyId || null,
          role: contactData.role || null,
          linkedin_url: contactData.linkedinUrl || null,
          bio_summary: contactData.bio || null,
          user_id: user.id,
        });

      if (contactError) throw contactError;

      toast.success("Contact created successfully!");
      onContactCreated();
    } catch (error) {
      console.error("Error creating contact:", error);
      toast.error("Failed to create contact");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Users className="h-5 w-5" />
            Create Your First Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800">
            Add someone from your network - a colleague, alumni, or someone you'd like to connect with on LinkedIn.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={contactData.firstName}
              onChange={(e) => setContactData({ ...contactData, firstName: e.target.value })}
              placeholder="e.g., John"
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={contactData.lastName}
              onChange={(e) => setContactData({ ...contactData, lastName: e.target.value })}
              placeholder="e.g., Smith"
            />
          </div>
          
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={contactData.company}
              onChange={(e) => setContactData({ ...contactData, company: e.target.value })}
              placeholder="e.g., Google"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="role">Role/Title</Label>
            <Input
              id="role"
              value={contactData.role}
              onChange={(e) => setContactData({ ...contactData, role: e.target.value })}
              placeholder="e.g., Software Engineer"
            />
          </div>
          
          <div>
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              value={contactData.linkedinUrl}
              onChange={(e) => setContactData({ ...contactData, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/in/johnsmith"
            />
          </div>
          
          <div>
            <Label htmlFor="bio">Bio/Notes</Label>
            <Textarea
              id="bio"
              value={contactData.bio}
              onChange={(e) => setContactData({ ...contactData, bio: e.target.value })}
              placeholder="Brief background or notes about this person..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSubmit}
        disabled={isLoading || !contactData.firstName || !contactData.lastName}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating Contact...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Contact
          </div>
        )}
      </Button>
    </div>
  );
};

export default ContactCreationStep;