import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const ProfileInput = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState("linkedin");
  const [linkedinContent, setLinkedinContent] = useState("");
  const [cvContent, setCvContent] = useState("");
  const [freeformContent, setFreeformContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiProfile, setAiProfile] = useState<null | {
    summary: string;
    highlights: string[];
    skills: string[];
  }>(null);
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
  const processProfile = () => {
    const content = getActiveContent();
    if (!content) {
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
        highlights: ["Senior Software Engineer at TechCorp (2019-Present)", "Full Stack Developer at Innovate Solutions (2017-2019)", "Computer Science, BS from University of Technology (2013-2017)"],
        skills: ["React", "Node.js", "TypeScript", "AWS", "Agile Methodologies", "CI/CD", "Database Design"]
      });
      setIsProcessing(false);
    }, 2000);
  };
  const handleSaveProfile = () => {
    if (user) {
      toast({
        title: "Profile saved!",
        description: "Your profile has been saved successfully."
      });
    } else {
      toast({
        title: "Please sign up to save",
        description: "Create an account to save your profile and access all features."
      });
      // Here you would redirect to sign up or show a sign-up modal
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
            Save My Profile & Unlock Full Features
          </Button>
        </div>}
    </div>;
};
export default ProfileInput;
