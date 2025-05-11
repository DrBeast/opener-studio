
import { useState } from "react";
import { Copy, Save, RotateCcw, MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface ContactData {
  contact_id: string;
  first_name: string;
  last_name: string;
  role?: string;
  company_id?: string;
}

interface MessageGenerationProps {
  contact: ContactData;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface GeneratedMessage {
  version_name: string;
  message_text: string;
  ai_reasoning: string;
}

export function MessageGeneration({ contact, companyName, isOpen, onClose }: MessageGenerationProps) {
  const [medium, setMedium] = useState<string>("linkedin_connection");
  const [objective, setObjective] = useState<string>("");
  const [additionalContext, setAdditionalContext] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [editedMessages, setEditedMessages] = useState<{[key: string]: string}>({});
  const [maxLength, setMaxLength] = useState<number>(300);
  const [showAIReasoning, setShowAIReasoning] = useState<{[key: string]: boolean}>({});

  const mediumOptions = [
    { id: "linkedin_connection", label: "LinkedIn Connection Note (max 300 symbols)", maxLength: 300 },
    { id: "linkedin_inmail", label: "LinkedIn InMail (max 400 symbols)", maxLength: 400 },
    { id: "linkedin_message", label: "LinkedIn Message to 1st Connection (max 400 symbols)", maxLength: 400 },
    { id: "email", label: "Cold Email (max 500 symbols)", maxLength: 500 }
  ];

  const handleMediumChange = (value: string) => {
    setMedium(value);
    const selectedOption = mediumOptions.find(option => option.id === value);
    if (selectedOption) {
      setMaxLength(selectedOption.maxLength);
    }
  };

  const generateMessages = async () => {
    if (!objective) {
      toast.error("Please provide a message objective");
      return;
    }

    setIsGenerating(true);
    setGeneratedMessages([]);
    setEditedMessages({});
    setShowAIReasoning({});

    try {
      // Get the current session for authentication
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!sessionData.session) {
        throw new Error("No active session found");
      }

      // Make the call to our edge function
      const { data, error: fnError } = await supabase.functions.invoke("generate_message", {
        body: { 
          contact_id: contact.contact_id,
          medium,
          objective,
          additional_context: additionalContext || undefined
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });
      
      if (fnError) throw fnError;
      
      if (!data || !data.messages || !Array.isArray(data.messages)) {
        throw new Error("Invalid response from generate_message function");
      }
      
      setGeneratedMessages(data.messages);
      
      // Initialize edited messages with the generated ones
      const initialEditedMessages: {[key: string]: string} = {};
      data.messages.forEach((message: GeneratedMessage, index: number) => {
        initialEditedMessages[`${index}`] = message.message_text;
      });
      setEditedMessages(initialEditedMessages);
      
      if (data.maxLength) {
        setMaxLength(data.maxLength);
      }
      
      toast.success("Messages generated successfully!");
    } catch (err: any) {
      console.error("Error generating messages:", err);
      toast.error("Failed to generate messages: " + (err.message || "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleMessageEdit = (index: number, text: string) => {
    setEditedMessages(prev => ({
      ...prev,
      [`${index}`]: text.substring(0, maxLength)
    }));
  };
  
  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Message copied to clipboard!"))
      .catch(err => {
        console.error("Failed to copy message:", err);
        toast.error("Failed to copy message to clipboard");
      });
  };
  
  const saveMessage = async (message: GeneratedMessage, index: number) => {
    try {
      const editedText = editedMessages[`${index}`] || message.message_text;
      
      // Save to saved_message_versions table
      const { data, error } = await supabase
        .from('saved_message_versions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          contact_id: contact.contact_id,
          company_id: contact.company_id,
          version_name: message.version_name,
          message_text: editedText,
          medium: medium,
          message_objective: objective,
          message_additional_context: additionalContext || null
        });
        
      if (error) throw error;
      
      // Also log an interaction
      const { error: interactionError } = await supabase
        .from('interactions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          contact_id: contact.contact_id,
          company_id: contact.company_id,
          interaction_type: 'message_draft',
          description: editedText,
          medium: medium,
          message_objective: objective,
          message_additional_context: additionalContext || null
        });
        
      if (interactionError) throw interactionError;
      
      toast.success("Message saved to conversation history!");
    } catch (err: any) {
      console.error("Error saving message:", err);
      toast.error("Failed to save message: " + (err.message || "Unknown error"));
    }
  };
  
  const toggleAIReasoning = (index: number) => {
    setShowAIReasoning(prev => ({
      ...prev,
      [`${index}`]: !prev[`${index}`]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Generate Messages for {contact.first_name} {contact.last_name}
            {contact.role && ` (${contact.role})`} at {companyName}
          </DialogTitle>
          <DialogDescription>
            Create personalized outreach messages based on your profile and contact details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Message Configuration */}
          <div className="space-y-4">
            {/* Medium Selection */}
            <div className="space-y-2">
              <Label>Communication Medium</Label>
              <RadioGroup 
                value={medium}
                onValueChange={handleMediumChange}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {mediumOptions.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="text-sm">{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            {/* Message Objective */}
            <div className="space-y-2">
              <Label htmlFor="objective">Message Objective <span className="text-red-500">*</span></Label>
              <Input
                id="objective"
                placeholder="e.g., Explore job opportunities, Request informational interview, Connect for industry insights"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
            </div>
            
            {/* Additional Context */}
            <div className="space-y-2">
              <Label htmlFor="additional-context">Additional Context (Optional)</Label>
              <Textarea
                id="additional-context"
                placeholder="Any specific details you'd like the AI to consider when crafting your message"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Generate Button */}
            <Button 
              onClick={generateMessages} 
              disabled={isGenerating || !objective}
              className="w-full"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Messages"}
            </Button>
          </div>
          
          {/* Generated Messages */}
          {generatedMessages.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Message Options</h3>
              {generatedMessages.map((message, index) => (
                <Card key={index} className="p-4 relative">
                  <div className="flex justify-between mb-2 items-center">
                    <h4 className="font-medium text-base">{message.version_name}</h4>
                    <div className="space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAIReasoning(index)}
                      >
                        {showAIReasoning[`${index}`] ? <ThumbsDown className="h-4 w-4" /> : <ThumbsUp className="h-4 w-4" />}
                        <span className="ml-1 hidden sm:inline">
                          {showAIReasoning[`${index}`] ? "Hide Reasoning" : "Show Reasoning"}
                        </span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* AI Reasoning */}
                  {showAIReasoning[`${index}`] && (
                    <div className="mb-3 p-3 bg-muted/50 rounded-md text-sm">
                      <p className="font-medium mb-1">Why this approach works:</p>
                      <p>{message.ai_reasoning}</p>
                    </div>
                  )}
                  
                  {/* Editable Message Text */}
                  <div className="space-y-2">
                    <Textarea
                      value={editedMessages[`${index}`] || message.message_text}
                      onChange={(e) => handleMessageEdit(index, e.target.value)}
                      className="w-full resize-none"
                      rows={5}
                      maxLength={maxLength}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {(editedMessages[`${index}`] || message.message_text).length}/{maxLength} symbols
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyMessage(editedMessages[`${index}`] || message.message_text)}
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveMessage(message, index)}
                    >
                      <Save className="mr-1 h-4 w-4" />
                      Save to History
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMessageEdit(index, message.message_text)}
                    >
                      <RotateCcw className="mr-1 h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
