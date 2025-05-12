
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ProfileInput = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("linkedin");
  const [linkedinContent, setLinkedinContent] = useState("");
  const [cvContent, setCvContent] = useState("");
  const [freeformContent, setFreeformContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [aiProfile, setAiProfile] = useState<null | {
    summary: string;
    highlights: string[];
    skills: string[];
  }>(null);
  const [generatedProfile, setGeneratedProfile] = useState<null | {
    overall_blurb?: string;
    experience: string;
    education: string;
    expertise: string;
    achievements: string;
    combined_experience_highlights?: string[];
    combined_education_highlights?: string[];
    key_skills?: string[];
    domain_expertise?: string[];
    technical_expertise?: string[];
    value_proposition_summary?: string;
  }>(null);
  
  // Generate or retrieve session ID on component mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem('profile-session-id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = uuidv4();
      localStorage.setItem('profile-session-id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Check if user is logged in and has a temporary profile that needs to be linked
  useEffect(() => {
    const linkGuestProfile = async () => {
      if (user && sessionId) {
        try {
          // Create a unique key for this specific user and session
          const linkStatusKey = `linked-profile-${sessionId}-${user.id}`;
          const alreadyLinked = localStorage.getItem(linkStatusKey);
          
          if (alreadyLinked) {
            console.log("This profile has already been linked to the current user");
            return;
          }

          console.log("Attempting to link guest profile to authenticated user");
          
          const { data, error } = await supabase.functions.invoke("link_guest_profile", {
            body: { userId: user.id, sessionId }
          });

          if (error) {
            console.error("Error linking guest profile:", error);
            toast.error("Failed to link your profile data");
            return;
          }

          if (data?.success) {
            // Mark this session as linked for this specific user
            localStorage.setItem(linkStatusKey, 'true');
            console.log("Guest profile successfully linked to user account");
            
            toast.success("Profile Linked: Your temporary profile has been linked to your account");
            
            // Redirect to profile page after successful linking
            navigate("/profile");
          }
        } catch (err) {
          console.error("Failed to link guest profile:", err);
          toast.error("Failed to link your profile data");
        }
      }
    };

    linkGuestProfile();
  }, [user, sessionId, navigate]);

  const getActiveContent = () => {
    switch (activeTab) {
      case "linkedin":
        return linkedinContent;
      case "cv":
        return cvContent;
      case "freeform":
        return freeformContent;
      default:
        return "";
    }
  };

  const processProfile = async () => {
    const content = getActiveContent();
    if (!content) {
      toast.error("Please add your details: We need some information about your professional background to generate a profile.");
      return;
    }

    if (!sessionId) {
      toast.error("Session error: Unable to create a temporary session. Please try refreshing the page.");
      return;
    }

    setIsProcessing(true);

    try {
      // Determine which content to send based on active tab
      const payload: Record<string, any> = {
        sessionId
      };
      
      switch (activeTab) {
        case "linkedin":
          payload.linkedinContent = content;
          break;
        case "cv":
          payload.cvContent = content;
          break;
        case "freeform":
          payload.additionalDetails = content;
          break;
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke("generate_guest_profile", {
        body: payload
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message || "Unknown error"}`);
      }

      if (!data || !data.summary) {
        throw new Error("No profile data received from the server");
      }

      // Store the generated profile
      setGeneratedProfile(data.summary);

      // Convert to UI format
      setAiProfile({
        summary: data.summary.overall_blurb || data.summary.experience,
        highlights: data.summary.combined_experience_highlights || 
                   [data.summary.experience, data.summary.education, data.summary.achievements].filter(Boolean),
        skills: data.summary.key_skills || []
      });

      toast.success("Profile generated! Your professional profile has been generated successfully.");
      
    } catch (error: any) {
      console.error("Profile generation error:", error);
      toast.error(`Error generating profile: ${error.message || "Something went wrong. Please try again."}`);
      
      // Set fallback profile for better user experience
      setAiProfile({
        summary: "Experienced professional with a background in their field. Further details pending.",
        highlights: ["Profile generation is currently unavailable", "Please try again later"],
        skills: ["Profile Analysis", "Data Processing"]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveProfile = () => {
    if (user) {
      // If user is logged in, redirect to profile page
      navigate("/profile");
    } else {
      // Redirect to signup page
      navigate("/auth/signup");
    }
  };

  return <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text py-1 inline-block">
          Get Started: Generate Your Profile
        </h2>
        <p className="text-xl text-gray-600">
          To get started, share a bit about your professional background. Our AI will process it and show you how it builds your profile.
        </p>
      </div>

      <Tabs defaultValue="linkedin" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="linkedin">LinkedIn Profile</TabsTrigger>
          <TabsTrigger value="cv">CV Content</TabsTrigger>
          <TabsTrigger value="freeform">Tell Us About Yourself</TabsTrigger>
        </TabsList>
        
        <TabsContent value="linkedin" className="space-y-4">
          <p className="text-sm text-muted-foreground">Go to your LinkedIn profile, select everything (CMD/CTRL + A) and copy it into the text box below. Don't worry about formatting - copy everything. This will help us understand your professional background better.</p>
          <Textarea placeholder="Paste your LinkedIn profile content here..." className="min-h-[200px]" value={linkedinContent} onChange={e => setLinkedinContent(e.target.value)} />
        </TabsContent>
        
        <TabsContent value="cv" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy and paste the content of your CV or resume into the text box below.
            This helps us extract your key skills and experience.
          </p>
          <Textarea placeholder="Paste your CV content here..." className="min-h-[200px]" value={cvContent} onChange={e => setCvContent(e.target.value)} />
        </TabsContent>
        
        <TabsContent value="freeform" className="space-y-4">
          <p className="text-sm text-muted-foreground">Tell us about your professional background, bio, education, key skills, and experience in your own words.</p>
          <Textarea placeholder="Describe your professional background..." className="min-h-[200px]" value={freeformContent} onChange={e => setFreeformContent(e.target.value)} />
        </TabsContent>

        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <p className="text-sm text-blue-700">
            <strong>Privacy Note:</strong> Your information is securely processed to generate your professional profile. 
            {!user && " Sign up to save your profile and access all features."}
          </p>
        </div>

        <Button onClick={processProfile} disabled={isProcessing || !getActiveContent()} className="w-full mt-4">
          {isProcessing ? <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </> : "Generate My Professional Profile"}
        </Button>
      </Tabs>

      {aiProfile && <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-primary mt-8">
          <h3 className="text-2xl font-bold mb-4">Your AI-Generated Profile</h3>
          
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-500 mb-2">PROFESSIONAL SUMMARY</h4>
            <p className="text-lg">{aiProfile.summary}</p>
          </div>
          
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-500 mb-2">HIGHLIGHTS</h4>
            <ul className="list-disc pl-5 space-y-1">
              {aiProfile.highlights.map((highlight, index) => <li key={index} className="text-md">{highlight}</li>)}
            </ul>
          </div>
          
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-500 mb-2">KEY SKILLS</h4>
            <div className="flex flex-wrap gap-2">
              {aiProfile.skills.map((skill, index) => <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>)}
            </div>
          </div>
          
          <Button onClick={handleSaveProfile} className="w-full">
            {user ? "Save My Profile" : "Sign Up to Save Profile & Unlock Features"}
          </Button>
        </div>}
    </div>;
};

export default ProfileInput;
