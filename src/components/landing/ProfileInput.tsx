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
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("linkedin");
  const [linkedinContent, setLinkedinContent] = useState("");
  const [cvContent, setCvContent] = useState("");
  const [freeformContent, setFreeformContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [profileLinked, setProfileLinked] = useState(false);
  const [profileLinkingAttempted, setProfileLinkingAttempted] = useState(false);
  const [linkingInProgress, setLinkingInProgress] = useState(false);
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
    const getOrCreateSessionId = () => {
      const storedSessionId = localStorage.getItem('profile-session-id');
      if (storedSessionId) {
        console.log("ProfileInput: Using existing session ID:", storedSessionId);
        setSessionId(storedSessionId);
      } else {
        const newSessionId = uuidv4();
        console.log("ProfileInput: Created new session ID:", newSessionId);
        localStorage.setItem('profile-session-id', newSessionId);
        setSessionId(newSessionId);
      }
    };
    getOrCreateSessionId();
  }, []);

  // Check if user is logged in and has a temporary profile that needs to be linked
  useEffect(() => {
    const linkGuestProfile = async () => {
      if (user && sessionId && !profileLinked && !profileLinkingAttempted) {
        setProfileLinkingAttempted(true);
        setLinkingInProgress(true);
        try {
          // Create a unique key for this specific user and session
          const linkStatusKey = `linked-profile-${sessionId}-${user.id}`;
          const linkStatusData = localStorage.getItem(linkStatusKey);
          if (linkStatusData) {
            console.log("ProfileInput: This profile has already been linked to the current user");
            setProfileLinked(true);
            setLinkingInProgress(false);
            try {
              // Verify that the profile actually exists
              const {
                data: profileData
              } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle();
              if (!profileData) {
                console.log("ProfileInput: Profile marked as linked but not found. Will trigger linking again.");
                localStorage.removeItem(linkStatusKey);
                setProfileLinked(false);
                setProfileLinkingAttempted(false);
                setLinkingInProgress(false);
              }
            } catch (err) {
              console.error("ProfileInput: Error verifying linked profile exists:", err);
              setLinkingInProgress(false);
            }
            return;
          }
          console.log("ProfileInput: Attempting to link guest profile to authenticated user");
          const {
            data,
            error
          } = await supabase.functions.invoke("link_guest_profile", {
            body: {
              userId: user.id,
              sessionId
            }
          });
          if (error) {
            console.error("ProfileInput: Error linking guest profile:", error);
            // No error toast shown anymore
            setLinkingInProgress(false);
            return;
          }
          if (data?.success) {
            // Mark this session as linked for this specific user
            localStorage.setItem(linkStatusKey, JSON.stringify({
              linked: true,
              timestamp: new Date().toISOString(),
              success: true
            }));
            console.log("ProfileInput: Guest profile successfully linked to user account");
            setProfileLinked(true);
            setLinkingInProgress(false);
            toast.success("Profile successfully linked to your account");

            // Wait a moment to let the toast show, then redirect
            setTimeout(() => {
              navigate("/profile");
            }, 2000);
          } else {
            console.log("ProfileInput: Profile linking attempt failed or returned no data");
            setLinkingInProgress(false);
          }
        } catch (err) {
          console.error("ProfileInput: Failed to link guest profile:", err);
          // No error toast shown anymore
          setLinkingInProgress(false);
        }
      }
    };
    linkGuestProfile();
  }, [user, sessionId, navigate, profileLinked, profileLinkingAttempted]);
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
      // If somehow we don't have a session ID, create one
      const newSessionId = uuidv4();
      localStorage.setItem('profile-session-id', newSessionId);
      setSessionId(newSessionId);
      toast.info("Created a new session for your profile");
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
      console.log("ProfileInput: Sending profile data for processing with session ID:", sessionId);

      // Call the edge function
      const {
        data,
        error
      } = await supabase.functions.invoke("generate_guest_profile", {
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
        highlights: data.summary.combined_experience_highlights || [data.summary.experience, data.summary.education, data.summary.achievements].filter(Boolean),
        skills: data.summary.key_skills || []
      });
      toast.success("Profile generated! Your professional profile has been generated successfully.");

      // If user is already logged in, try linking the profile
      if (user && sessionId) {
        console.log("ProfileInput: User is logged in. Attempting to link newly created guest profile.");
        setLinkingInProgress(true);
        try {
          const {
            data: linkData,
            error: linkError
          } = await supabase.functions.invoke("link_guest_profile", {
            body: {
              userId: user.id,
              sessionId
            }
          });
          if (linkError) {
            console.error("ProfileInput: Error during auto-linking:", linkError);
            // No error toast shown anymore
          } else if (linkData?.success) {
            // Mark profile as linked
            const linkStatusKey = `linked-profile-${sessionId}-${user.id}`;
            localStorage.setItem(linkStatusKey, JSON.stringify({
              linked: true,
              timestamp: new Date().toISOString(),
              autoLinked: true
            }));
            setProfileLinked(true);
            toast.success("Profile successfully linked to your account");
            console.log("ProfileInput: Auto-linking succeeded after profile generation");
          }
        } catch (linkErr) {
          console.error("ProfileInput: Error during auto-linking:", linkErr);
        } finally {
          setLinkingInProgress(false);
        }
      }
    } catch (error: any) {
      console.error("ProfileInput: Profile generation error:", error);
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
      // If profile isn't linked yet, try to link it once more
      if (!profileLinked && sessionId) {
        console.log("ProfileInput: Attempting to link profile before navigating to profile page");
        setLinkingInProgress(true);
        supabase.functions.invoke("link_guest_profile", {
          body: {
            userId: user.id,
            sessionId
          }
        }).then(({
          data,
          error
        }) => {
          // Mark as linked to prevent repeated attempts
          const linkStatusKey = `linked-profile-${sessionId}-${user.id}`;
          if (error) {
            console.error("ProfileInput: Error linking on save:", error);
            // No error toast shown anymore
          } else if (data?.success) {
            localStorage.setItem(linkStatusKey, JSON.stringify({
              linked: true,
              timestamp: new Date().toISOString(),
              onSave: true
            }));
            toast.success("Profile successfully linked to your account");
          }
          setLinkingInProgress(false);
          navigate("/profile");
        }).catch(err => {
          console.error("ProfileInput: Error linking on save:", err);
          // No error toast shown anymore
          setLinkingInProgress(false);
          navigate("/profile");
        });
      } else {
        navigate("/profile");
      }
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
          <p className="text-sm text-muted-foreground">Copy and paste the content of your CV or resume into the text box below. This helps us extract your key skills and experience. Don't worry about formatting - the AI will sort it out.</p>
          <Textarea placeholder="Paste your CV content here..." className="min-h-[200px]" value={cvContent} onChange={e => setCvContent(e.target.value)} />
        </TabsContent>
        
        <TabsContent value="freeform" className="space-y-4">
          <p className="text-sm text-muted-foreground">Paste any information you have about your professional background here.</p>
          <Textarea placeholder="Bio, education, key skills, success cases, STAR-stories for interviews, blurbs, cover letters - everything works!" className="min-h-[200px]" value={freeformContent} onChange={e => setFreeformContent(e.target.value)} />
        </TabsContent>

        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <p className="text-sm text-blue-700">
            <strong>Privacy Note:</strong> Your information is securely processed to generate your professional profile. 
            {!user && " Sign up to save your profile and access all features."}
          </p>
          
          {user && !profileLinked && sessionId && <p className="text-sm text-blue-700 mt-1">
              <strong>Note:</strong> You're logged in but your profile data hasn't been linked yet. We'll attempt to link it when you continue.
            </p>}
          {linkingInProgress && <p className="text-sm text-blue-700 mt-1 flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              <span>Linking your profile data...</span>
            </p>}
        </div>

        <Button onClick={processProfile} disabled={isProcessing || !getActiveContent() || !sessionId || linkingInProgress} className="w-full mt-4">
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
          
          <Button onClick={handleSaveProfile} className="w-full" disabled={linkingInProgress}>
            {linkingInProgress ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Linking Profile...
              </> : user ? "Save My Profile" : "Sign Up to Save Profile & Unlock Features"}
          </Button>
        </div>}
    </div>;
};
export default ProfileInput;
