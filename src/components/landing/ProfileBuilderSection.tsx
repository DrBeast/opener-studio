
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Linkedin, FileText, MessageCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const ProfileBuilderSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileText, setProfileText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiProfile, setAiProfile] = useState<null | {
    summary: string;
    highlights: string[];
    skills: string[];
  }>(null);

  const handleInputOption = (option: string) => {
    let placeholderText = "";
    
    switch (option) {
      case "linkedin":
        placeholderText = "Paste your LinkedIn profile text here...";
        break;
      case "cv":
        placeholderText = "Paste your CV/resume content here...";
        break;
      case "freeform":
        placeholderText = "Tell us about your professional background, skills, and experience...";
        break;
    }
    
    setProfileText(placeholderText);
    // Focus the textarea
    const textarea = document.getElementById("profile-input");
    if (textarea) {
      textarea.focus();
    }
  };

  const processProfile = () => {
    if (!profileText || profileText.includes("Paste your") || profileText.includes("Tell us about")) {
      toast({
        title: "Please add your details",
        description: "We need some information about your professional background to generate a profile.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate AI processing with a mock response
    setTimeout(() => {
      setAiProfile({
        summary: "Experienced software engineer with 5+ years of expertise in full-stack development. Passionate about creating user-friendly applications that solve real-world problems. Skilled in React, Node.js, and cloud architecture with a track record of delivering high-quality solutions in agile environments.",
        highlights: [
          "Senior Software Engineer at TechCorp (2019-Present)",
          "Full Stack Developer at Innovate Solutions (2017-2019)",
          "Computer Science, BS from University of Technology (2013-2017)"
        ],
        skills: ["React", "Node.js", "TypeScript", "AWS", "Agile Methodologies", "CI/CD", "Database Design"]
      });
      setIsProcessing(false);
    }, 2000);
  };

  const handleSaveProfile = () => {
    if (user) {
      toast({
        title: "Profile saved!",
        description: "Your profile has been saved successfully.",
      });
    } else {
      toast({
        title: "Please sign up to save",
        description: "Create an account to save your profile and access all features.",
      });
      // Here you would redirect to sign up or show a sign-up modal
    }
  };

  return (
    <section id="profile-builder" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">See the Power of AI Yourself</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            To get started, share a bit about your professional background. Our AI will process it and show you how it builds your profile.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="mb-6">
              <label htmlFor="profile-input" className="block text-lg font-medium mb-4">
                Your Professional Background
              </label>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleInputOption("linkedin")}
                  className="flex items-center gap-2"
                >
                  <Linkedin className="h-4 w-4" />
                  Paste LinkedIn Profile
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleInputOption("cv")}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Paste CV Content
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleInputOption("freeform")}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Tell Us About Yourself
                </Button>
              </div>

              <Textarea
                id="profile-input"
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                placeholder="Paste your LinkedIn profile, CV content, or describe your professional background..."
                className="min-h-[200px]"
              />
            </div>

            <Button 
              onClick={processProfile} 
              disabled={isProcessing || !profileText}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Generate My Professional Profile"
              )}
            </Button>
          </div>

          {aiProfile && (
            <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-primary">
              <h3 className="text-2xl font-bold mb-4">Your AI-Generated Profile</h3>
              
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-500 mb-2">PROFESSIONAL SUMMARY</h4>
                <p className="text-lg">{aiProfile.summary}</p>
              </div>
              
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-500 mb-2">HIGHLIGHTS</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {aiProfile.highlights.map((highlight, index) => (
                    <li key={index} className="text-md">{highlight}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-500 mb-2">KEY SKILLS</h4>
                <div className="flex flex-wrap gap-2">
                  {aiProfile.skills.map((skill, index) => (
                    <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <Button onClick={handleSaveProfile} className="w-full">
                Save My Profile & Unlock Full Features
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProfileBuilderSection;
