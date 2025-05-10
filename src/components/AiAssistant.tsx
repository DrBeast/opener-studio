
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";

interface AiAssistantProps {
  showSummary: boolean;
  summary: {
    experience: string;
    education: string;
    expertise: string;
    achievements: string;
    overall_blurb?: string;
    combined_experience_highlights?: string[];
    combined_education_highlights?: string[];
    key_skills?: string[];
    domain_expertise?: string[];
    technical_expertise?: string[];
    value_proposition_summary?: string;
  };
}

const AiAssistant = ({ showSummary, summary }: AiAssistantProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useAuth();
  const location = useLocation();
  
  // Determine which assistant content to show based on the current path
  const isJobTargetsPage = location.pathname === "/profile/job-targets";
  const isProfileEnrichmentPage = location.pathname === "/profile/enrich";
  
  // Helper function to render arrays safely
  const renderArrayItems = (items?: string[]) => {
    if (!items || !Array.isArray(items) || items.length === 0) return null;
    return (
      <ul className="list-disc list-inside text-xs space-y-1 pl-2">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  };
  
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
          {isJobTargetsPage ? (
            <>
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Welcome to Job Targets{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}!</strong> I'll help you define what kinds of roles and companies you're interested in.
                </p>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm">
                  Select your preferences for job functions, locations, industries, and other criteria. Be as specific as possible to get the most relevant recommendations.
                </p>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm">
                  Don't worry about being too narrow - you can always update these preferences later as your job search evolves.
                </p>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm">
                  The "Similar Companies" field is particularly valuable - listing companies you admire helps me understand what kind of workplace culture and industry you prefer.
                </p>
              </div>
            </>
          ) : isProfileEnrichmentPage ? (
            <>
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
            </>
          ) : (
            <div className="bg-primary/5 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Hello{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}!</strong> I'm your EngageAI assistant, ready to help you with your networking and job search. How can I assist you today?
              </p>
            </div>
          )}
          
          {showSummary && (
            <Card className="bg-green-50 border-l-4 border-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-md text-green-800">Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {summary.overall_blurb && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-sm">Overview</h4>
                    <p className="text-xs text-green-800">{summary.overall_blurb}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold text-sm">Experience</h4>
                  <p className="text-xs text-green-800">{summary.experience}</p>
                  {renderArrayItems(summary.combined_experience_highlights)}
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm">Education</h4>
                  <p className="text-xs text-green-800">{summary.education}</p>
                  {renderArrayItems(summary.combined_education_highlights)}
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm">Expertise</h4>
                  <p className="text-xs text-green-800">{summary.expertise}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm">Achievements</h4>
                  <p className="text-xs text-green-800">{summary.achievements}</p>
                </div>
                
                {(summary.key_skills && summary.key_skills.length > 0) && (
                  <div>
                    <h4 className="font-semibold text-sm">Key Skills</h4>
                    {renderArrayItems(summary.key_skills)}
                  </div>
                )}
                
                {(summary.domain_expertise && summary.domain_expertise.length > 0) && (
                  <div>
                    <h4 className="font-semibold text-sm">Domain Expertise</h4>
                    {renderArrayItems(summary.domain_expertise)}
                  </div>
                )}
                
                {(summary.technical_expertise && summary.technical_expertise.length > 0) && (
                  <div>
                    <h4 className="font-semibold text-sm">Technical Expertise</h4>
                    {renderArrayItems(summary.technical_expertise)}
                  </div>
                )}
                
                {summary.value_proposition_summary && (
                  <div>
                    <h4 className="font-semibold text-sm">Value Proposition</h4>
                    <p className="text-xs text-green-800">{summary.value_proposition_summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AiAssistant;
