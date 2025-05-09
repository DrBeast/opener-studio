
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { User, Edit, ArrowRight, Check } from "lucide-react";

const ProfileEnrichment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [linkedinContent, setLinkedinContent] = useState("");
  const [showAssistant, setShowAssistant] = useState(true);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [step, setStep] = useState(1);
  
  // Placeholder for AI-generated summaries (will be replaced with actual API calls later)
  const [summary, setSummary] = useState({
    experience: "",
    education: "",
    expertise: "",
    achievements: ""
  });
  
  const handleLinkedinSubmit = async () => {
    if (!linkedinContent.trim()) {
      toast.error("Please paste your LinkedIn profile content");
      return;
    }
    
    setLoading(true);
    
    try {
      // Save raw LinkedIn content to user_backgrounds table
      const { error } = await supabase
        .from("user_backgrounds")
        .insert({
          user_id: user?.id,
          content_type: "linkedin_profile",
          content: linkedinContent,
          // In the future, processed_data will be populated by Gemini API
          processed_data: {
            raw_content: true,
            // This is just a placeholder until we integrate with Gemini API
            status: "pending_processing"
          }
        });
        
      if (error) {
        throw error;
      }
      
      // For now, just simulate the AI processing with placeholder summaries
      // This will be replaced with actual AI-generated content later
      setSummary({
        experience: "Your most recent roles appear to be in product management and leadership positions.",
        education: "You have a background in business and technology from reputable institutions.",
        expertise: "Your key skills include product strategy, team leadership, and business development.",
        achievements: "You've successfully led teams and delivered impactful products in your career."
      });
      
      toast.success("LinkedIn profile information saved");
      setStep(2);
    } catch (error: any) {
      console.error("Error saving LinkedIn content:", error.message);
      toast.error(`Failed to save profile content: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAdditionalDetailsSubmit = async () => {
    if (!additionalDetails.trim()) {
      // If user doesn't want to add additional details, just continue
      completeEnrichment();
      return;
    }
    
    setLoading(true);
    
    try {
      // Save additional details to user_backgrounds table
      const { error } = await supabase
        .from("user_backgrounds")
        .insert({
          user_id: user?.id,
          content_type: "additional_details",
          content: additionalDetails,
          processed_data: {
            raw_content: true,
            status: "pending_processing"
          }
        });
        
      if (error) {
        throw error;
      }
      
      toast.success("Additional details saved");
      completeEnrichment();
    } catch (error: any) {
      console.error("Error saving additional details:", error.message);
      toast.error(`Failed to save additional details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const completeEnrichment = () => {
    toast.success("Profile enrichment complete!");
    navigate("/profile");
  };
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="grid gap-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Enrich Your Profile</CardTitle>
            <CardDescription>
              Provide more details about your background to get personalized recommendations
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="bg-primary/5 p-6 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    LinkedIn Profile
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Go to your LinkedIn profile, select everything (CMD/CTRL + A) and copy it into the text box below.
                    This will help us understand your professional background better.
                  </p>
                  <Textarea
                    placeholder="Paste your LinkedIn profile content here..."
                    className="min-h-[200px]"
                    value={linkedinContent}
                    onChange={(e) => setLinkedinContent(e.target.value)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleLinkedinSubmit} 
                    disabled={loading || !linkedinContent.trim()}
                    className="flex items-center"
                  >
                    {loading ? "Processing..." : "Continue"}
                    {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Step 2: Show summary and collect additional details */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="font-semibold">Your Experience</h3>
                    <p className="text-sm mt-2">{summary.experience}</p>
                  </div>
                  
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="font-semibold">Your Education</h3>
                    <p className="text-sm mt-2">{summary.education}</p>
                  </div>
                  
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="font-semibold">Your Expertise</h3>
                    <p className="text-sm mt-2">{summary.expertise}</p>
                  </div>
                  
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="font-semibold">Key Achievements</h3>
                    <p className="text-sm mt-2">{summary.achievements}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center">
                    <Edit className="mr-2 h-5 w-5" />
                    Additional Details
                  </h3>
                  <p className="text-muted-foreground">
                    Add any additional details about your professional background, specific strengths, 
                    or key successes that might not be captured in your LinkedIn profile.
                  </p>
                  <Textarea
                    placeholder="Tell us more about your professional stories, specific strengths, or key successes..."
                    className="min-h-[150px]"
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={completeEnrichment}
                  >
                    Skip
                  </Button>
                  <Button 
                    onClick={handleAdditionalDetailsSubmit} 
                    disabled={loading}
                    className="flex items-center"
                  >
                    {loading ? "Saving..." : "Complete Profile"}
                    {!loading && <Check className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* AI Assistant sidebar */}
      <Sheet open={showAssistant} onOpenChange={setShowAssistant}>
        <SheetContent side="right" className="w-[350px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>EngageAI Assistant</SheetTitle>
            <SheetDescription>
              I'm here to help you set up your profile
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="bg-primary/5 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Welcome{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}!</strong> I'll need some information about your profile to get us started.
              </p>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-lg">
              <p className="text-sm">
                Go to your LinkedIn profile, select everything (CMD/CTRL + A) and copy it into the text box here. 
                I will generate your background profile from that information.
              </p>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-lg">
              <p className="text-sm">
                The more context you provide, the better I can assist you in crafting effective outreach and finding the right opportunities.
              </p>
            </div>
            
            {step === 2 && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-sm text-green-800">
                  <strong>Great start!</strong> I've processed your LinkedIn profile. Now you can add any additional details about your professional background that might not be on LinkedIn.
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProfileEnrichment;
