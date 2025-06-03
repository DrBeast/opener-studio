import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InfoBox } from "@/components/ui/design-system";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ProfileInput = () => {
  const { user, linkUserProfile } = useAuth();
  const navigate = useNavigate();
  const [backgroundInput, setBackgroundInput] = useState("");
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
      const storedSessionId = localStorage.getItem("profile-session-id");
      if (storedSessionId) {
        console.log(
          "ProfileInput: Using existing session ID:",
          storedSessionId
        );
        setSessionId(storedSessionId);
      } else {
        const newSessionId = uuidv4();
        console.log("ProfileInput: Created new session ID:", newSessionId);
        localStorage.setItem("profile-session-id", newSessionId);
        setSessionId(newSessionId);
      }
    };
    getOrCreateSessionId();
  }, []);

  // Check if user is logged in and has a temporary profile that needs to be linked
  useEffect(() => {
    const attemptProfileLinking = async () => {
      if (user && sessionId && !profileLinked && !profileLinkingAttempted) {
        setProfileLinkingAttempted(true);
        setLinkingInProgress(true);
        try {
          console.log(
            "ProfileInput: Attempting to link guest profile to authenticated user"
          );
          const linked = await linkUserProfile(user.id, sessionId);
          if (linked) {
            console.log("ProfileInput: Successfully linked profile");
            setProfileLinked(true);

            // Wait a moment to let the toast show, then redirect
            setTimeout(() => {
              navigate("/profile");
            }, 2000);
          } else {
            console.log("ProfileInput: Profile linking attempt failed");
            // Try again one more time after a delay
            setTimeout(async () => {
              const secondAttempt = await linkUserProfile(user.id, sessionId);
              if (secondAttempt) {
                console.log("ProfileInput: Second linking attempt succeeded");
                setProfileLinked(true);

                // Wait a moment to let the toast show, then redirect
                setTimeout(() => {
                  navigate("/profile");
                }, 2000);
              }
            }, 2000);
          }
          setLinkingInProgress(false);
        } catch (err) {
          console.error("ProfileInput: Failed to link guest profile:", err);
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
    linkUserProfile,
  ]);

  const processProfile = async () => {
    if (!backgroundInput.trim()) {
      toast.error(
        "Please add your background information: We need some information about your professional background to generate a profile."
      );
      return;
    }

    if (!sessionId) {
      // If somehow we don't have a session ID, create one
      const newSessionId = uuidv4();
      localStorage.setItem("profile-session-id", newSessionId);
      setSessionId(newSessionId);
      toast.info("Created a new session for your profile");
    }

    setIsProcessing(true);
    try {
      const payload = {
        sessionId,
        backgroundInput: backgroundInput.trim(),
      };

      console.log(
        "ProfileInput: Sending profile data for processing with session ID:",
        sessionId
      );

      // Call the edge function
      const { data, error } = await supabase.functions.invoke(
        "generate_guest_profile",
        {
          body: payload,
        }
      );

      if (error) {
        throw new Error(
          `Edge function error: ${error.message || "Unknown error"}`
        );
      }

      if (!data || !data.summary) {
        throw new Error("No profile data received from the server");
      }

      // Store the generated profile
      setGeneratedProfile(data.summary);

      // Convert to UI format
      setAiProfile({
        summary: data.summary.overall_blurb || data.summary.experience,
        highlights:
          data.summary.combined_experience_highlights ||
          [
            data.summary.experience,
            data.summary.education,
            data.summary.achievements,
          ].filter(Boolean),
        skills: data.summary.key_skills || [],
      });

      toast.success(
        "Profile generated! Your professional profile has been generated successfully."
      );

      // If user is already logged in, try linking the profile
      if (user && sessionId) {
        console.log(
          "ProfileInput: User is logged in. Attempting to link newly created guest profile."
        );
        setLinkingInProgress(true);
        try {
          const linked = await linkUserProfile(user.id, sessionId);
          if (linked) {
            setProfileLinked(true);
            console.log(
              "ProfileInput: Auto-linking succeeded after profile generation"
            );
          }
        } catch (linkErr) {
          console.error("ProfileInput: Error during auto-linking:", linkErr);
        } finally {
          setLinkingInProgress(false);
        }
      }
    } catch (error: any) {
      console.error("ProfileInput: Profile generation error:", error);
      toast.error(
        `Error generating profile: ${
          error.message || "Something went wrong. Please try again."
        }`
      );

      // Set fallback profile for better user experience
      setAiProfile({
        summary:
          "Experienced professional with a background in their field. Further details pending.",
        highlights: [
          "Profile generation is currently unavailable",
          "Please try again later",
        ],
        skills: ["Profile Analysis", "Data Processing"],
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
        console.log(
          "ProfileInput: Attempting to link profile before navigating to profile page"
        );
        setLinkingInProgress(true);
        linkUserProfile(user.id, sessionId)
          .then((linked) => {
            setLinkingInProgress(false);
            if (linked) {
              setProfileLinked(true);
            }
            navigate("/profile");
          })
          .catch((err) => {
            console.error("ProfileInput: Error linking on save:", err);
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

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text py-1 inline-block">
          Get Started: Generate Your Profile
        </h2>
        <p className="text-xl text-gray-600">
          Share your professional background in one simple step. Copy your
          LinkedIn profile, CV content, or tell us about yourself. Our AI will
          process it and show you how it builds your profile.
        </p>
      </div>
      <Textarea
        placeholder="Paste your LinkedIn profile, CV content, or describe your professional background..."
        className="min-h-[200px]"
        value={backgroundInput}
        onChange={(e) => setBackgroundInput(e.target.value)}
      />
      <div className="space-y-4">
        <InfoBox>
          <p className="font-medium mb-2">
            How to add your background information:
          </p>
          <ul className="text-sm space-y-1">
            <li>
              <strong>LinkedIn Profile:</strong> Go to your LinkedIn profile,
              select everything (CMD/CTRL + A) and copy it (CMD/CTRL + C) into
              the text box below (CMD/CTRL + V). Don't worry about formatting,
              just copy everything - AI will figure it out.
            </li>
            <li>
              <strong>CV/Resume:</strong> Copy your CV contents (CMD/CTRL + A)
              and paste it (CMD/CTRL + V) into the text box below. Don't worry
              about formatting.
            </li>
            <li>
              <strong>Tell us about yourself:</strong> Write about your bio,
              education, key skills, success stories, achievements, or any other
              professional information.
            </li>
          </ul>
          <p className="text-sm mt-2 font-medium">
            We will use the AI-generated summary of your profile for company
            matching and message generation. The AI analyzes your background to
            highlight your value proposition for specific roles and companies,
            helping you articulate how you can add value and overcome self-doubt
            in networking.
          </p>
        </InfoBox>

        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <p className="text-sm text-blue-700">
            <strong>Privacy Note:</strong> Your information is securely
            processed to generate your professional profile.
            {!user && " Sign up to save your profile and access all features."}
          </p>

          {user && !profileLinked && sessionId && (
            <p className="text-sm text-blue-700 mt-1">
              <strong>Note:</strong> You're logged in but your profile data
              hasn't been linked yet. We'll attempt to link it when you
              continue.
            </p>
          )}
          {linkingInProgress && (
            <p className="text-sm text-blue-700 mt-1 flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              <span>Linking your profile data...</span>
            </p>
          )}
        </div>

        <Button
          onClick={processProfile}
          disabled={
            isProcessing ||
            !backgroundInput.trim() ||
            !sessionId ||
            linkingInProgress
          }
          className="w-full mt-4"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Generate My Profile"
          )}
        </Button>
      </div>

      {aiProfile && (
        <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-primary mt-8">
          <h3 className="text-2xl font-bold mb-4">Your AI-Generated Profile</h3>

          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-500 mb-2">
              PROFESSIONAL SUMMARY
            </h4>
            <p className="text-lg">{aiProfile.summary}</p>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-500 mb-2">
              HIGHLIGHTS
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              {aiProfile.highlights.map((highlight, index) => (
                <li key={index} className="text-md">
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-500 mb-2">
              KEY SKILLS
            </h4>
            <div className="flex flex-wrap gap-2">
              {aiProfile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            className="w-full"
            disabled={linkingInProgress}
          >
            {linkingInProgress ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Linking Profile...
              </>
            ) : user ? (
              "Save My Profile"
            ) : (
              "Sign Up to Save Profile & Unlock Features"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfileInput;
