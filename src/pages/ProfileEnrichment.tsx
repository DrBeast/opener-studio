import { useState, useEffect } from "react";
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
import { toast } from "@/components/ui/sonner";
import { ArrowRight, Save, AlertCircle, FileText, Edit, UserCheck, ShieldAlert } from "lucide-react";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";

// Import custom components
import CVUpload from "@/components/CVUpload";
import ProfessionalBackground from "@/components/ProfessionalBackground";
import AiAssistant from "@/components/AiAssistant";

const ProfileEnrichment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingWithAI, setIsProcessingWithAI] = useState(false);
  
  // Form state
  const [linkedinContent, setLinkedinContent] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [cvContent, setCvContent] = useState("");
  const [uploadedCvUrl, setUploadedCvUrl] = useState("");
  const [uploadedCvName, setUploadedCvName] = useState("");
  const [existingData, setExistingData] = useState<{
    linkedin?: string;
    additional?: string;
    cv?: { name: string; url: string };
  }>({});
  
  // AI-generated summary state
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState({
    experience: "",
    education: "",
    expertise: "",
    achievements: "",
    overall_blurb: "",
    combined_experience_highlights: [] as string[],
    combined_education_highlights: [] as string[],
    key_skills: [] as string[],
    domain_expertise: [] as string[],
    technical_expertise: [] as string[],
    value_proposition_summary: ""
  });

  // Add state to store authenticated user email for confirmation
  const [userEmail, setUserEmail] = useState("");
  
  // Fetch existing data when component mounts
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!user) {
        navigate("/auth/login");
        return;
      }
      
      // Set user email for confirmation
      setUserEmail(user.email || "");
      
      setIsLoading(true);
      try {
        // Fetch existing profile data from new user_profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (profileError && profileError.code !== "PGRST116") {
          // Only throw if it's not a "not found" error
          throw profileError;
        }
        
        const existingBackgrounds: {
          linkedin?: string;
          additional?: string;
          cv?: { name: string; url: string };
        } = {};
        
        // Process profile data if it exists
        if (profileData) {
          if (profileData.linkedin_content) {
            existingBackgrounds.linkedin = profileData.linkedin_content;
            setLinkedinContent(profileData.linkedin_content);
          }
          
          if (profileData.additional_details) {
            existingBackgrounds.additional = profileData.additional_details;
            setAdditionalDetails(profileData.additional_details);
          }
          
          if (profileData.cv_content) {
            existingBackgrounds.cv = {
              name: 'Uploaded CV', // We don't store the name in the new schema
              url: '' // We don't store URLs in the new schema
            };
            setCvContent(profileData.cv_content);
          }
        } else {
          console.log("No existing profile data found for user");
        }
        
        // Fetch AI-generated summary from user_summaries table
        const { data: summaryData, error: summaryError } = await supabase
          .from("user_summaries")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (summaryError && summaryError.code !== "PGRST116") {
          // Only throw if it's not a "not found" error
          throw summaryError;
        }
        
        if (summaryData) {
          setSummary({
            experience: summaryData.experience || "Experience data could not be processed.",
            education: summaryData.education || "Education data could not be processed.",
            expertise: summaryData.expertise || "Expertise data could not be processed.",
            achievements: summaryData.achievements || "Achievements data could not be processed.",
            overall_blurb: summaryData.overall_blurb || "",
            combined_experience_highlights: summaryData.combined_experience_highlights || [],
            combined_education_highlights: summaryData.combined_education_highlights || [],
            key_skills: summaryData.key_skills || [],
            domain_expertise: summaryData.domain_expertise || [],
            technical_expertise: summaryData.technical_expertise || [],
            value_proposition_summary: summaryData.value_proposition_summary || ""
          });
          setShowSummary(true);
        }
        
        setExistingData(existingBackgrounds);
        
      } catch (error: any) {
        console.error("Error fetching profile data:", error.message);
        toast.error("Failed to load your existing profile data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingData();
  }, [user, navigate]);
  
  const handleUploadSuccess = (url: string, fileName: string) => {
    setUploadedCvUrl(url);
    setUploadedCvName(fileName);
    
    // In the new approach, we'd need to convert the CV to text content
    // This is a placeholder - in a real implementation, you might want to
    // process the uploaded CV and extract text content
    setCvContent(`Uploaded CV: ${fileName}`);
  };
  
  const handleUploadError = (error: string) => {
    console.error("CV upload error:", error);
  };
  
  const saveUserProfile = async () => {
    if (!user) {
      toast.error("Authentication error. Please log in again.");
      navigate("/auth/login");
      return;
    }
    
    try {
      console.log(`Saving profile data for user: ${user.id} (${user.email})`);
      
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }
      
      let upsertError;
      
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("user_profiles")
          .update({
            linkedin_content: linkedinContent || null,
            additional_details: additionalDetails || null,
            cv_content: cvContent || null,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id);
          
        upsertError = error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,
            linkedin_content: linkedinContent || null,
            additional_details: additionalDetails || null,
            cv_content: cvContent || null
          });
          
        upsertError = error;
      }
      
      if (upsertError) throw upsertError;
      
      return true;
      
    } catch (error: any) {
      console.error(`Error saving profile data:`, error.message);
      toast.error(`Failed to save profile data: ${error.message}`);
      throw error;
    }
  };
  
  const handleSubmit = async () => {
    // Verify user is authenticated
    if (!user) {
      toast.error("Authentication error. Please log in again.");
      navigate("/auth/login");
      return;
    }

    // Refresh authentication session to ensure the token is valid
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error("Session validation error:", sessionError || "No active session");
        toast.error("Your login session has expired. Please log in again.");
        navigate("/auth/login");
        return;
      }

      // Double-check the user is still the same
      if (sessionData.session.user.id !== user.id) {
        console.error("User mismatch:", {
          currentUserId: user.id,
          sessionUserId: sessionData.session.user.id
        });
        toast.error("User identity changed. Please log in again to continue.");
        navigate("/auth/login");
        return;
      }

      console.log(`Confirmed user identity: ${user.id} (${user.email})`);
    } catch (error: any) {
      console.error("Error validating session:", error.message);
      toast.error("Failed to validate your session. Please log in again.");
      navigate("/auth/login");
      return;
    }

    // Validation
    if (!linkedinContent.trim() && !additionalDetails.trim() && !uploadedCvUrl && !cvContent.trim()) {
      toast.error("Please provide at least one source of information: LinkedIn, additional details, or CV");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save profile data
      await saveUserProfile();
      
      // Process with generate_profile edge function
      setIsProcessingWithAI(true);
      
      try {
        console.log(`Calling generate_profile with userId: ${user.id}`);
        
        // Call the edge function to process the profile data
        const { data, error } = await supabase.functions.invoke("generate_profile", {
          body: {
            userId: user.id,
            userEmail: user.email
          }
        });
        
        if (error) {
          throw new Error(`Edge function error: ${error.message}`);
        }
        
        console.log("Edge function response:", data);
        
        if (data && data.summary) {
          // Update the summary state with the response from the edge function
          setSummary({
            experience: data.summary.experience || "Experience data could not be processed.",
            education: data.summary.education || "Education data could not be processed.",
            expertise: data.summary.expertise || "Expertise data could not be processed.",
            achievements: data.summary.achievements || "Achievements data could not be processed.",
            overall_blurb: data.summary.overall_blurb || "",
            combined_experience_highlights: data.summary.combined_experience_highlights || [],
            combined_education_highlights: data.summary.combined_education_highlights || [],
            key_skills: data.summary.key_skills || [],
            domain_expertise: data.summary.domain_expertise || [],
            technical_expertise: data.summary.technical_expertise || [],
            value_proposition_summary: data.summary.value_proposition_summary || ""
          });
          
          setShowSummary(true);
          toast.success("Profile information processed successfully!");
        } else {
          throw new Error("Invalid or missing summary data from edge function");
        }
      } catch (error: any) {
        console.error("Error calling generate_profile edge function:", error);
        toast.error(`AI processing failed: ${error.message}`);
        
        // Fallback to simulated summary if edge function fails
        const simulatedSummary = {
          experience: "Your most recent roles appear to be in product management and leadership positions.",
          education: "You have a background in business and technology from reputable institutions.",
          expertise: "Your key skills include product strategy, team leadership, and business development.",
          achievements: "You've successfully led teams and delivered impactful products in your career."
        };
        
        setSummary(simulatedSummary);
        setShowSummary(true);
      } finally {
        setIsProcessingWithAI(false);
      }
      
      // Check if user has job targets
      const { data: targetData, error: targetError } = await supabase
        .from("target_criteria")
        .select("criteria_id")
        .eq("user_id", user?.id)
        .limit(1);
        
      if (targetError) {
        console.error("Error checking target criteria:", targetError);
      }
      
      const hasJobTargets = targetData && targetData.length > 0;
      
      // Redirect to appropriate next step
      const nextStep = hasJobTargets ? "/profile" : "/profile/job-targets";
      
      // Auto-navigate after a brief delay to show the success message and summary
      setTimeout(() => {
        navigate(nextStep);
      }, 3000);
    } catch (error: any) {
      console.error("Error submitting profile data:", error.message);
      toast.error(`Failed to process profile information: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isProcessing = isSubmitting || isUploading || isProcessingWithAI;
  const hasContent = linkedinContent.trim() || additionalDetails.trim() || uploadedCvUrl || cvContent.trim();
  const isEditing = Object.keys(existingData).length > 0;
  
  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <div className="space-y-8">
        {/* User Identity Confirmation Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
          <UserCheck className="text-blue-500 mr-3 h-5 w-5" />
          <div>
            <p className="text-blue-800 font-medium">
              Logged in as: {userEmail}
            </p>
            <p className="text-blue-600 text-sm">
              All profile data will be saved for this account
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {isEditing ? "Update Your Professional Background" : "Enrich Your Profile"}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? "Update your professional background information to keep your profile current"
                : "Provide details about your professional background to enhance your profile"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {/* Professional Background Component */}
                <ProfessionalBackground 
                  linkedinContent={linkedinContent}
                  setLinkedinContent={setLinkedinContent}
                  additionalDetails={additionalDetails}
                  setAdditionalDetails={setAdditionalDetails}
                  cvContent={cvContent}
                  setCvContent={setCvContent}
                  isSubmitting={isProcessing}
                  isEditing={isEditing}
                  existingData={existingData}
                />
                
                {/* CV Upload Component */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    {existingData.cv ? "Update Your CV (Optional)" : "Upload Your CV (Optional)"}
                  </h3>
                  
                  {existingData.cv && (
                    <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-blue-800 flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        Current CV: {existingData.cv.name}
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        Upload a new CV to replace the current one, or keep the existing one.
                      </p>
                    </div>
                  )}
                  
                  <CVUpload 
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                  />
                </div>
                
                {uploadedCvUrl && uploadedCvUrl !== existingData.cv?.url && (
                  <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-green-800 flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      New CV uploaded: {uploadedCvName}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="md:col-span-1">
                {/* AI Assistant Component */}
                <AiAssistant 
                  showSummary={showSummary}
                  summary={summary}
                />
                
                {/* Processing Tips */}
                <Card className="mt-6 bg-blue-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md text-blue-800 flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5" />
                      Tips for Better Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside text-sm text-blue-800">
                      <li>Include your full LinkedIn profile</li>
                      <li>Mention specific achievements and metrics</li>
                      <li>Add details about specialized skills</li>
                      <li>Upload an up-to-date CV if available</li>
                      <li>Include career goals and interests</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!hasContent || isProcessing}
              className="flex items-center"
            >
              {isSubmitting ? (
                <>
                  Processing... 
                  <span className="ml-2 animate-spin">⟳</span>
                </>
              ) : isProcessingWithAI ? (
                <>
                  AI Processing...
                  <span className="ml-2 animate-spin">⟳</span>
                </>
              ) : (
                <>
                  {isEditing ? "Update Profile Information" : "Save Profile Information"}
                  <Save className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {showSummary && (
          <Card className="bg-green-50 border border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Profile Enrichment Complete!</CardTitle>
              <CardDescription className="text-green-700">
                We've processed your information and updated your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              {summary.overall_blurb && (
                <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
                  <h3 className="font-semibold text-green-800">Overview</h3>
                  <p className="text-sm mt-2">{summary.overall_blurb}</p>
                </div>
              )}
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-green-800">Your Experience</h3>
                <p className="text-sm mt-2">{summary.experience}</p>
                {renderArrayItems(summary.combined_experience_highlights)}
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-green-800">Your Education</h3>
                <p className="text-sm mt-2">{summary.education}</p>
                {renderArrayItems(summary.combined_education_highlights)}
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-green-800">Your Expertise</h3>
                <p className="text-sm mt-2">{summary.expertise}</p>
                {summary.key_skills && summary.key_skills.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-green-800">Key Skills:</h4>
                    {renderArrayItems(summary.key_skills)}
                  </div>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-green-800">Key Achievements</h3>
                <p className="text-sm mt-2">{summary.achievements}</p>
              </div>
              
              {summary.value_proposition_summary && (
                <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
                  <h3 className="font-semibold text-green-800">Value Proposition</h3>
                  <p className="text-sm mt-2">{summary.value_proposition_summary}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => navigate("/profile")}
                className="w-full flex items-center justify-center"
              >
                Go to Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

// Helper function to render arrays safely
const renderArrayItems = (items?: string[]) => {
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="list-disc list-inside text-sm space-y-1 pl-2">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
};

export default ProfileEnrichment;
