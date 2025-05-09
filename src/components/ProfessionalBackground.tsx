
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ArrowDown, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ProfessionalBackgroundProps {
  linkedinContent: string;
  setLinkedinContent: (value: string) => void;
  additionalDetails: string;
  setAdditionalDetails: (value: string) => void;
  cvContent: string;
  setCvContent: (value: string) => void;
  isSubmitting: boolean;
  isEditing?: boolean;
  existingData?: {
    linkedin?: string;
    additional?: string;
    cv?: string;
  };
}

const ProfessionalBackground = ({
  linkedinContent,
  setLinkedinContent,
  additionalDetails,
  setAdditionalDetails,
  cvContent,
  setCvContent,
  isSubmitting,
  isEditing = false,
  existingData = {}
}: ProfessionalBackgroundProps) => {
  const [linkedinExpanded, setLinkedinExpanded] = useState(false);
  const [additionalExpanded, setAdditionalExpanded] = useState(false);
  const [cvExpanded, setCvExpanded] = useState(false);

  const toggleLinkedin = () => setLinkedinExpanded(!linkedinExpanded);
  const toggleAdditional = () => setAdditionalExpanded(!additionalExpanded);
  const toggleCv = () => setCvExpanded(!cvExpanded);

  return (
    <div className="space-y-6">
      {/* LinkedIn Section */}
      <div className="relative">
        <Card 
          className={`bg-primary/5 p-6 rounded-lg ${linkedinExpanded ? 'border-primary' : ''}`}
          onClick={toggleLinkedin}
        >
          <div className="flex items-center justify-between cursor-pointer">
            <h3 className="text-lg font-semibold mb-0">LinkedIn Profile</h3>
            {linkedinExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {!linkedinExpanded && (
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <ArrowDown className="mr-2 h-4 w-4 text-primary animate-bounce" />
              <span>Click to edit LinkedIn content</span>
            </div>
          )}
        </Card>
        
        {linkedinExpanded && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {isEditing && existingData.linkedin 
                ? "Update your LinkedIn profile information or add more details below."
                : "Go to your LinkedIn profile, select everything (CMD/CTRL + A) and copy it into the text box below. This will help us understand your professional background better."
              }
            </p>
            
            {isEditing && existingData.linkedin && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800 border border-blue-200">
                <p>Your current LinkedIn content is shown below. You can keep it as is or update it.</p>
              </div>
            )}
            
            <Textarea
              placeholder="Paste your LinkedIn profile content here..."
              className="min-h-[200px] w-full"
              value={linkedinContent}
              onChange={(e) => setLinkedinContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>
      
      {/* Additional Details Section */}
      <div className="relative">
        <Card 
          className={`bg-primary/5 p-6 rounded-lg ${additionalExpanded ? 'border-primary' : ''}`}
          onClick={toggleAdditional}
        >
          <div className="flex items-center justify-between cursor-pointer">
            <h3 className="text-lg font-semibold mb-0">Additional Details</h3>
            {additionalExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {!additionalExpanded && (
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <ArrowDown className="mr-2 h-4 w-4 text-primary animate-bounce" />
              <span>Click to edit additional professional details</span>
            </div>
          )}
        </Card>
        
        {additionalExpanded && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {isEditing && existingData.additional
                ? "Update or add to your additional professional details below."
                : "Add any additional details about your professional background, specific strengths, or key successes that might not be captured in your LinkedIn profile."
              }
            </p>
            
            {isEditing && existingData.additional && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800 border border-blue-200">
                <p>Your current additional details are shown below. You can keep them as is or update them.</p>
              </div>
            )}
            
            <Textarea
              placeholder="Tell us more about your professional stories, specific strengths, or key successes..."
              className="min-h-[200px] w-full"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>

      {/* CV Content Section */}
      <div className="relative">
        <Card 
          className={`bg-primary/5 p-6 rounded-lg ${cvExpanded ? 'border-primary' : ''}`}
          onClick={toggleCv}
        >
          <div className="flex items-center justify-between cursor-pointer">
            <h3 className="text-lg font-semibold mb-0 flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Resume Content
            </h3>
            {cvExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {!cvExpanded && (
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <ArrowDown className="mr-2 h-4 w-4 text-primary animate-bounce" />
              <span>Click to edit resume content</span>
            </div>
          )}
        </Card>
        
        {cvExpanded && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {isEditing && existingData.cv
                ? "Update your resume content below."
                : "Copy and paste the content of your resume into the text box below. This helps us understand your professional background better."
              }
            </p>
            
            {isEditing && existingData.cv && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800 border border-blue-200">
                <p>Your resume content is shown below. You can keep it as is or update it.</p>
              </div>
            )}
            
            <Textarea
              placeholder="Paste your resume content here..."
              className="min-h-[200px] w-full"
              value={cvContent}
              onChange={(e) => setCvContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalBackground;
