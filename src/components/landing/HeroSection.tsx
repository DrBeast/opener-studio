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
  CheckCircle,
  Target,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    <section className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12 relative z-10">
        {/* Early Access Alert */}
        <Alert className="mb-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 max-w-4xl mx-auto shadow-sm">
          <Zap className="h-4 w-4 text-rose-600" />
          <AlertDescription className="text-rose-800">
            <strong>Limited Early Access DEV:</strong> Thank you for being part
            of our early access! Please don't share this link yet as we're still
            refining the experience. We appreciate your patience and feedback.
            Your data is privately and securely stored, though it may be used
            for product improvement purposes.
          </AlertDescription>
        </Alert>

        {/* Main Content Card */}
        <Card className="max-w-5xl mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
          <div className="relative">
            {/* Header Section with Gradient */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-indigo-600/20"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-4 rounded-full backdrop-blur-sm shadow-lg">
                    <Target className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                  Break Through. Connect with Humans.
                  <span className="block text-3xl md:text-4xl font-semibold mt-4 bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
                    Your AI Copilot for Job Search Networking.
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
                  ConnectorAI helps you craft messages that get responses and
                  build relationships — at scale and without the awkwardness.
                </p>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8 md:p-12">
              {/* Profile Input & Generate Button - Initial State */}
              {!generatedProfileOutput && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <div className="flex justify-center items-center gap-3 mb-4">
                      <Sparkles className="h-8 w-8 text-violet-600" />
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                        Get Started in 30 Seconds
                      </h2>
                    </div>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                      Simply paste your professional background and watch AI
                      write your story
                    </p>
                  </div>

                  <div className="relative">
                    <Textarea
                      placeholder="Copy your professional bio from your LinkedIn profile or CV. Simply select everything (CMD/CTRL + A) and copy it (CMD/CTRL + C) here (CMD/CTRL + V). Don't worry about formatting - AI will figure it out. Feel free to type in or add anything about yourself that feels relevant."
                      className="min-h-[200px] text-base p-6 border-2 border-slate-200 focus:border-violet-500 transition-all duration-300 bg-slate-50/50 rounded-xl shadow-inner resize-none"
                      value={backgroundInput}
                      onChange={(e) => setBackgroundInput(e.target.value)}
                      disabled={isProcessing || linkingInProgress}
                    />
                    <div className="absolute bottom-4 right-4 text-sm text-slate-400">
                      {backgroundInput.length} characters
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={processBackgroundWithAI}
                      disabled={
                        isProcessing ||
                        !backgroundInput.trim() ||
                        !sessionId ||
                        linkingInProgress
                      }
                      className="group relative px-12 py-6 text-xl font-bold text-white rounded-2xl min-w-[280px] overflow-hidden transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      style={{
                        background: isProcessing
                          ? "linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #8b5cf6 100%)"
                          : "linear-gradient(135deg, #7c3aed 0%, #a855f7 25%, #c084fc 50%, #8b5cf6 75%, #7c3aed 100%)",
                        boxShadow: isProcessing
                          ? "0 10px 20px rgba(168, 85, 247, 0.6), 0 8px 15px rgba(192, 132, 252, 0.4)"
                          : "0 15px 20px rgba(124, 58, 237, 0.8), 0 10px 20px rgba(168, 85, 247, 0.5), 0 3px 10px rgba(192, 132, 252, 0.3)",
                        animation: isProcessing ? "pulse 2s infinite" : "none",
                      }}
                    >
                      {/* Animated shimmer effect 
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>*/}

                      {/* Animated border glow */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>

                      {/* Button content */}
                      <div className="relative z-10 flex items-center justify-center">
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-3 h-6 w-6 animate-pulse" />
                            Generate My Profile
                          </>
                        )}
                      </div>
                    </button>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>
                        Your data is secure and privately processed. No signup
                        required to see your profile preview.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI-Generated Profile Summary Display - Post-Processing State */}
              {generatedProfileOutput && (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="flex justify-center items-center gap-3 mb-4">
                      <Award className="h-8 w-8 text-emerald-600" />
                      <h3 className="text-3xl md:text-4xl font-bold text-slate-800">
                        Your AI-Powered Profile Preview
                      </h3>
                    </div>
                    <p className="text-lg text-slate-600">
                      Here's how AI interprets your professional background
                    </p>
                  </div>

                  <div className="grid gap-6">
                    {/* Profile Overview Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-100 border border-indigo-200 rounded-xl p-8 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-indigo-100 p-3 rounded-full">
                          <User className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h4 className="font-bold text-xl text-indigo-800">
                          Professional Overview
                        </h4>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-lg">
                        {generatedProfileOutput.overall_blurb}
                      </p>
                      {extractedProfileData?.job_role &&
                        extractedProfileData?.current_company && (
                          <div className="mt-4 p-4 bg-white/70 rounded-lg">
                            <p className="text-sm text-slate-600">
                              <strong>Current Position:</strong>{" "}
                              {extractedProfileData.job_role} at{" "}
                              {extractedProfileData.current_company}
                              {extractedProfileData.location &&
                                ` • ${extractedProfileData.location}`}
                            </p>
                          </div>
                        )}
                    </div>

                    {/* Value Proposition Card */}
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-100 border border-teal-200 rounded-xl p-8 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-teal-100 p-3 rounded-full">
                          <Award className="h-6 w-6 text-teal-600" />
                        </div>
                        <h4 className="font-bold text-xl text-teal-800">
                          Your Unique Value Proposition
                        </h4>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-lg">
                        {generatedProfileOutput.value_proposition_summary}
                      </p>
                    </div>

                    {/* Highlights Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {generatedProfileOutput.combined_experience_highlights && (
                        <div className="bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200 rounded-xl p-8 shadow-sm">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="bg-sky-100 p-3 rounded-full">
                              <Star className="h-6 w-6 text-sky-600" />
                            </div>
                            <h4 className="font-bold text-xl text-sky-800">
                              Experience Highlights
                            </h4>
                          </div>
                          {renderArrayItems(
                            generatedProfileOutput.combined_experience_highlights
                          )}
                        </div>
                      )}
                      {generatedProfileOutput.combined_education_highlights && (
                        <div className="bg-gradient-to-br from-rose-50 to-pink-100 border border-rose-200 rounded-xl p-8 shadow-sm">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="bg-rose-100 p-3 rounded-full">
                              <GraduationCap className="h-6 w-6 text-rose-600" />
                            </div>
                            <h4 className="font-bold text-xl text-rose-800">
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
                    <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 rounded-xl p-8 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-amber-100 p-3 rounded-full">
                          <Zap className="h-6 w-6 text-amber-600" />
                        </div>
                        <h4 className="font-bold text-xl text-amber-800">
                          Key Skills & Expertise
                        </h4>
                      </div>
                      {generatedProfileOutput.key_skills &&
                        generatedProfileOutput.key_skills.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-6">
                            {generatedProfileOutput.key_skills.map(
                              (skill, index) => (
                                <span
                                  key={index}
                                  className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium border border-amber-200 shadow-sm"
                                >
                                  {skill}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      {generatedProfileOutput.domain_expertise &&
                        generatedProfileOutput.domain_expertise.length > 0 && (
                          <div className="mt-6">
                            <h5 className="text-sm font-bold text-amber-700 mb-3">
                              Domain Expertise:
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {generatedProfileOutput.domain_expertise.map(
                                (domain, index) => (
                                  <span
                                    key={index}
                                    className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm border border-amber-300"
                                  >
                                    {domain}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      {generatedProfileOutput.technical_expertise &&
                        generatedProfileOutput.technical_expertise.length >
                          0 && (
                          <div className="mt-6">
                            <h5 className="text-sm font-bold text-amber-700 mb-3">
                              Technical Expertise:
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {generatedProfileOutput.technical_expertise.map(
                                (tech, index) => (
                                  <span
                                    key={index}
                                    className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm border border-amber-300"
                                  >
                                    {tech}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Call to Action for Saving/Signup */}
                  <div className="text-center pt-8 border-t border-slate-100">
                    <Button
                      onClick={handleSaveProfileAndContinue}
                      className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 min-w-[250px]"
                      disabled={linkingInProgress}
                    >
                      {linkingInProgress ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Linking Profile...
                        </>
                      ) : user ? (
                        <>
                          <CheckCircle className="mr-3 h-5 w-5" />
                          Save My Profile & Continue
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-3 h-5 w-5" />
                          Sign Up to Save Profile & Unlock Features
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-slate-500 mt-4">
                      Your profile preview is temporary until you sign up or
                      save.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default HeroSection;
