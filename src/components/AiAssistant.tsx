
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AiAssistantProps {
  showSummary: boolean;
  summary: {
    experience: string;
    education: string;
    expertise: string;
    achievements: string;
  };
}

const AiAssistant = ({ showSummary, summary }: AiAssistantProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useAuth();
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full border rounded-lg shadow-sm"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full flex justify-between p-4 h-auto">
          <div className="flex items-center">
            <MessageCircle className="mr-2 h-5 w-5" />
            <span className="font-medium">EngageAI Assistant</span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 space-y-4">
          <div className="bg-primary/5 p-4 rounded-lg">
            <p className="text-sm">
              <strong>Welcome{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}!</strong> I'll help you enrich your profile with detailed information about your background.
            </p>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-lg">
            <p className="text-sm">
              Start by pasting your LinkedIn profile content, adding any additional professional details, and uploading your CV if available. This will help us create a comprehensive profile to assist in your networking and job search.
            </p>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-lg">
            <p className="text-sm">
              The more context you provide, the better I can assist you in crafting effective outreach messages and finding the right opportunities.
            </p>
          </div>
          
          {showSummary && (
            <Card className="bg-green-50 border-l-4 border-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-md text-green-800">Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div>
                  <h4 className="font-semibold text-sm">Experience</h4>
                  <p className="text-xs text-green-800">{summary.experience}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Education</h4>
                  <p className="text-xs text-green-800">{summary.education}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Expertise</h4>
                  <p className="text-xs text-green-800">{summary.expertise}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Achievements</h4>
                  <p className="text-xs text-green-800">{summary.achievements}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AiAssistant;
