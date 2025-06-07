import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  Loader2,
  Sparkles,
  User,
  Award,
  GraduationCap,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Ensure Alert and AlertDescription are correctly imported and used
import {
  Card,
  CardContent,
  PrimaryAction,
} from "@/components/ui/design-system";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";

// Define the expected structure for the AI's complete output (profile_data + summary_data)
interface GeneratedProfileAndSummary {
  profile_data: {
    first_name?: string;
    last_name?: string;
    job_role?: string;
    current_company?: string;
    location?: string;
  };
  summary_data: {
    overall_blurb?: string;
    experience?: string;
    education?: string;
    expertise?: string;
    achievements?: string;
    combined_experience_highlights?: string[];
    combined_education_highlights?: string[];
    key_skills?: string[];
    domain_expertise?: string[];
    technical_expertise?: string[];
    value_proposition_summary?: string;
  };
}

// Helper function to render arrays safely (copied from ProfileSummary)
const renderArrayItems = (items?: string[]) => {
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="list-disc list-inside text-sm space-y-1 pl-2 text-gray-700">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
};

const HeroSection = () => {
  const { user, linkUserProfile } = useAuth();
  const navigate = useNavigate();

  // State for background input and processing
  const [backgroundInput, setBackgroundInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [profileLinked, setProfileLinked] = useState(false);
  const [profileLinkingAttempted, setProfileLinkingAttempted] = useState(false);
  const [linkingInProgress, setLinkingInProgress] = useState(false);
  const [generatedProfileOutput, setGeneratedProfileOutput] = useState<
    GeneratedProfileAndSummary["summary_data"] | null
  >(null);
  const [extractedProfileData, setExtractedProfileData] = useState<
    GeneratedProfileAndSummary["profile_data"] | null
  >(null);

  // Generate or retrieve session ID on component mount
  useEffect(() => {
    const getOrCreateSessionId = () => {
      const storedSessionId = localStorage.getItem("profile-session-id");
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else {
        const newSessionId = uuidv4();
        localStorage.setItem("profile-session-id", newSessionId);
        setSessionId(newSessionId);
      }
    };
    getOrCreateSessionId();
  }, []);

  // Attempt to link guest profile to authenticated user on login/session change
  useEffect(() => {
    const attemptProfileLinking = async () => {
      if (
        user &&
        sessionId &&
        !profileLinked &&
        !profileLinkingAttempted &&
        !linkingInProgress
      ) {
        setProfileLinkingAttempted(true);
        setLinkingInProgress(true);
        try {
          const linked = await linkUserProfile(user.id, sessionId);
          if (linked) {
            setProfileLinked(true);
            toast.success(
              "Profile linked successfully! Redirecting to your dashboard..."
            );
            setTimeout(() => {
              navigate("/dashboard");
            }, 2000);
          } else {
            console.log(
              "ProfileInput: Profile linking attempt failed. Will try again if needed."
            );
          }
        } catch (err: any) {
          console.error(
            "ProfileInput: Failed to link guest profile automatically:",
            err.message
          );
          toast.error(
            "Failed to auto-link profile. Please try saving again or manually link."
          );
        } finally {
          setLinkingInProgress(false);
        }
      }
    };
    attemptProfileLinking();
  }, [
    user,
    sessionId,
    navigate,
    profileLinked,
    profileLinkingAttempted,
    linkingInProgress,
    linkUserProfile,
  ]);

  // Handles the primary action: processing background text with AI
  const processBackgroundWithAI = async () => {
    if (!backgroundInput.trim()) {
      toast.error(
        "Please paste your professional background information to generate your profile."
      );
      return;
    }

    if (!sessionId) {
      const newSessionId = uuidv4();
      localStorage.setItem("profile-session-id", newSessionId);
      setSessionId(newSessionId);
      toast.info("A new session was created for your profile");
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        sessionId: sessionId,
        additionalDetails: backgroundInput.trim(),
        userId: user?.id || null,
      };

      console.log(
        "ProfileInput: Sending profile data for processing with session ID:",
        sessionId
      );

      const { data, error } = await supabase.functions.invoke(
        "generate_profile",
        {
          body: payload,
        }
      );

      if (error) {
        throw new Error(
          `Edge function error: ${error.message || "Unknown error"}`
        );
      }
      if (!data || !data.summary_data || !data.profile_data) {
        throw new Error("No complete profile data received from the server");
      }

      setGeneratedProfileOutput(data.summary_data);
      setExtractedProfileData(data.profile_data);

      toast.success("Your AI-powered profile preview is ready!");

      if (user) {
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (error: any) {
      console.error("HeroSection: Profile generation error:", error);
      toast.error(
        `Error generating profile: ${
          error.message || "Something went wrong. Please try again."
        }`
      );
      setGeneratedProfileOutput({
        overall_blurb:
          "Failed to generate detailed summary. Basic profile data based on your input is shown.",
        experience: "",
        education: "",
        expertise: "",
        achievements: "",
        combined_experience_highlights: ["Error during AI processing."],
        combined_education_highlights: [],
        key_skills: [],
        domain_expertise: [],
        technical_expertise: [],
        value_proposition_summary: "Please try again later.",
      });
      setExtractedProfileData({});
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveProfileAndContinue = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth/signup");
    }
  };

  return (
    <section className="py-16 lg:py-24 relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Background abstract illustration */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-primary/10 via-transparent"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Early Access Alert */}
        {/* FIX: Ensure Alert is a self-contained component if it's the root of a JSX fragment that's directly returned */}
        <Alert className="mb-6 border-yellow-200 bg-yellow-50 max-w-3xl mx-auto">
          <AlertDescription className="text-yellow-800">
            <strong>Limited Early Access DEV:</strong> Thank you for being part
            of our early access! Please don't share this link yet as we're still
            refining the experience. We appreciate your patience and feedback.
            Your data is privately and securely stored, though it may be used
            for product improvement purposes.
          </AlertDescription>
        </Alert>

        {/* Main Consolidated Card */}
        <Card className="text-center rounded-lg shadow-xl p-8 md:p-12 max-w-4xl mx-auto border border-gray-200 bg-gradient-to-br from-green-500 to-emerald-400">
          {/* Header & Value Proposition */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gray-900">
            Break Through. Connect with Humans.
            <span className="block text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2 p-2">
              Your AI Copilot for Job Search Networking.
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            ConnectorAI helps you craft messages that get responses and build
            relationships that truly open doors — at scale and without the
            awkwardness.
          </p>

          {/* Profile Input & Generate Button - Initial State */}
          {!generatedProfileOutput && (
            <div className="space-y-6">
              <Textarea
                placeholder="Copy your professional story from your LinkedIn profile or CV. Simply select everything (CMD/CTRL + A) and copy it (CMD/CTRL + C) here (CMD/CTRL + V). Don't worry about formatting - AI will figure it out. Feel free to type in or add anything about yourself that feels relevant."
                className="min-h-[200px] text-base p-4 border-2 focus:border-primary transition-colors duration-200 bg-gray-50"
                value={backgroundInput}
                onChange={(e) => setBackgroundInput(e.target.value)}
                disabled={isProcessing || linkingInProgress}
              />
              <div className="flex justify-center gap-4">
                <Button
                  onClick={processBackgroundWithAI}
                  disabled={
                    isProcessing ||
                    !backgroundInput.trim() ||
                    !sessionId ||
                    linkingInProgress
                  }
                  className="w-full sm:w-auto px-8 py-3 text-lg font-semibold bg-primary hover:from-primary/90 hover:to-primary/70 transform transition-all duration-300 hover:scale-105"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate My Profile
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Your data is secure and privately processed. No signup required
                to see your profile preview.
              </p>
            </div>
          )}

          {/* AI-Generated Profile Summary Display - Post-Processing State */}
          {generatedProfileOutput && (
            <div className="mt-8 pt-8 border-t border-gray-100 text-left">
              <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                Your AI-Powered Profile Preview
              </h3>

              {/* Profile Overview Card */}
              <div className="mb-6 bg-gradient-to-br from-purple-50 to-purple-200 border-purple-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-6 w-6 text-purple-600" />
                  <h4 className="font-semibold text-lg text-purple-800">
                    Professional Overview
                  </h4>
                </div>
                <p className="text-gray-700 leading-relaxed text-base">
                  {generatedProfileOutput.overall_blurb}
                </p>
                {extractedProfileData?.job_role &&
                  extractedProfileData?.current_company && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Current:</strong> {extractedProfileData.job_role}{" "}
                      at {extractedProfileData.current_company}
                      {extractedProfileData.location &&
                        ` (${extractedProfileData.location})`}
                    </p>
                  )}
              </div>

              {/* Value Proposition Card */}
              <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-200 border-green-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-6 w-6 text-green-600" />
                  <h4 className="font-semibold text-lg text-green-800">
                    Your Unique Value Proposition
                  </h4>
                </div>
                <p className="text-gray-700 leading-relaxed text-base">
                  {generatedProfileOutput.value_proposition_summary}
                </p>
              </div>

              {/* Highlights Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {generatedProfileOutput.combined_experience_highlights && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-200 border-blue-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Star className="h-6 w-6 text-blue-600" />
                      <h4 className="font-semibold text-lg text-blue-800">
                        Experience Highlights
                      </h4>
                    </div>
                    {renderArrayItems(
                      generatedProfileOutput.combined_experience_highlights
                    )}
                  </div>
                )}
                {generatedProfileOutput.combined_education_highlights && (
                  <div className="bg-gradient-to-br from-purple-50 to-violet-200 border-purple-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <GraduationCap className="h-6 w-6 text-purple-600" />
                      <h4 className="font-semibold text-lg text-purple-800">
                        Education Highlights
                      </h4>
                    </div>
                    {renderArrayItems(
                      generatedProfileOutput.combined_education_highlights
                    )}
                  </div>
                )}
              </div>

              {/* Key Skills & Expertise Section */}
              <div className="bg-gradient-to-br from-orange-50 to-red-200 border-orange-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="h-6 w-6 text-orange-600" />
                  <h4 className="font-semibold text-lg text-orange-800">
                    Key Skills & Expertise
                  </h4>
                </div>
                {generatedProfileOutput.key_skills &&
                  generatedProfileOutput.key_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {generatedProfileOutput.key_skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm border border-orange-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                {generatedProfileOutput.domain_expertise &&
                  generatedProfileOutput.domain_expertise.length > 0 && ( // Corrected variable name from domain_analysis
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-orange-700 mb-2">
                        Domain Expertise:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {generatedProfileOutput.domain_expertise.map(
                          (domain, index) => (
                            <span
                              key={index}
                              className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm border border-orange-200"
                            >
                              {domain}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                {generatedProfileOutput.technical_expertise &&
                  generatedProfileOutput.technical_expertise.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-orange-700 mb-2">
                        Technical Expertise:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {generatedProfileOutput.technical_expertise.map(
                          (tech, index) => (
                            <span
                              key={index}
                              className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm border border-orange-200"
                            >
                              {tech}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Call to Action for Saving/Signup */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <Button
                  onClick={handleSaveProfileAndContinue}
                  className="w-full sm:w-auto px-8 py-3 text-lg font-semibold transform transition-all duration-300 hover:scale-105"
                  disabled={linkingInProgress}
                >
                  {linkingInProgress ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Linking Profile...
                    </>
                  ) : user ? (
                    "Save My Profile & Continue"
                  ) : (
                    "Sign Up to Save Profile & Unlock Features"
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  Your profile preview is temporary until you sign up or save.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default HeroSection;
