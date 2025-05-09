
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
import { toast } from "@/components/ui/sonner";
import { ArrowRight, Save, AlertCircle, FileText, User, Edit } from "lucide-react";

// Import custom components
import CVUpload from "@/components/CVUpload";
import ProfessionalBackground from "@/components/ProfessionalBackground";
import AiAssistant from "@/components/AiAssistant";

const ProfileEnrichment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [linkedinContent, setLinkedinContent] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [uploadedCvUrl, setUploadedCvUrl] = useState("");
  const [uploadedCvName, setUploadedCvName] = useState("");
  
  // AI-generated summary state (this will be generated after submission)
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState({
    experience: "",
    education: "",
    expertise: "",
    achievements: ""
  });
  
  const handleUploadSuccess = (url: string, fileName: string) => {
    setUploadedCvUrl(url);
    setUploadedCvName(fileName);
    
    // Store CV reference in user_backgrounds
    saveUserBackground("cv_upload", `CV: ${fileName}`, url);
  };
  
  const handleUploadError = (error: string) => {
    console.error("CV upload error:", error);
  };
  
  const saveUserBackground = async (contentType: string, content: string, storageUrl?: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("user_backgrounds")
        .insert({
          user_id: user.id,
          content_type: contentType,
          content: content,
          storage_url: storageUrl || null,
          processed_data: {
            raw_content: true,
            status: "pending_processing"
          }
        });
        
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error(`Error saving ${contentType}:`, error.message);
      toast.error(`Failed to save ${contentType}: ${error.message}`);
    }
  };
  
  const handleSubmit = async () => {
    // Validation
    if (!linkedinContent.trim() && !additionalDetails.trim() && !uploadedCvUrl) {
      toast.error("Please provide at least one source of information: LinkedIn, additional details, or CV");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save LinkedIn content if provided
      if (linkedinContent.trim()) {
        await saveUserBackground("linkedin_profile", linkedinContent);
      }
      
      // Save additional details if provided
      if (additionalDetails.trim()) {
        await saveUserBackground("additional_details", additionalDetails);
      }
      
      // For demo purposes, create a simulated AI-processed summary
      // In a real implementation, this would come from an AI service like Gemini
      const simulatedSummary = {
        experience: "Your most recent roles appear to be in product management and leadership positions.",
        education: "You have a background in business and technology from reputable institutions.",
        expertise: "Your key skills include product strategy, team leadership, and business development.",
        achievements: "You've successfully led teams and delivered impactful products in your career."
      };
      
      // Save the generated summary to the database
      await saveUserBackground("generated_summary", JSON.stringify(simulatedSummary));
      
      // Update UI to show the summary
      setSummary(simulatedSummary);
      setShowSummary(true);
      
      toast.success("Profile information processed successfully!");
      
      // Auto-navigate after a brief delay to show the success message and summary
      setTimeout(() => {
        navigate("/profile");
      }, 5000);
    } catch (error: any) {
      console.error("Error submitting profile data:", error.message);
      toast.error(`Failed to process profile information: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isProcessing = isSubmitting || isUploading;
  const hasContent = linkedinContent.trim() || additionalDetails.trim() || uploadedCvUrl;
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Enrich Your Profile</CardTitle>
            <CardDescription>
              Provide details about your professional background to enhance your profile
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
                  isSubmitting={isProcessing}
                />
                
                {/* CV Upload Component */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Upload Your CV (Optional)
                  </h3>
                  
                  <CVUpload 
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                  />
                </div>
                
                {uploadedCvUrl && (
                  <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-green-800 flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      CV uploaded: {uploadedCvName}
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
              ) : (
                <>
                  Save Profile Information
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
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-green-800">Your Experience</h3>
                <p className="text-sm mt-2">{summary.experience}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-green-800">Your Education</h3>
                <p className="text-sm mt-2">{summary.education}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-green-800">Your Expertise</h3>
                <p className="text-sm mt-2">{summary.expertise}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-green-800">Key Achievements</h3>
                <p className="text-sm mt-2">{summary.achievements}</p>
              </div>
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

export default ProfileEnrichment;
