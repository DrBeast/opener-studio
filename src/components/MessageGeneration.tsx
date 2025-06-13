import { useState, useCallback, useMemo } from "react";
import {
  Copy,
  Save,
  RotateCcw,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
}

interface MessageGenerationProps {
  contact: ContactData;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onMessageSaved?: () => void;
  embedded?: boolean;
}

interface GeneratedMessageResponse {
  status: string;
  message: string;
  generated_messages: {
    version1: string;
    version2: string;
    version3: string;
  };
  ai_reasoning: string;
}

export function MessageGeneration({
  contact,
  companyName,
  isOpen,
  onClose,
  onMessageSaved,
  embedded = false,
}: MessageGenerationProps) {
  const [medium, setMedium] = useState<string>("LinkedIn connection note");
  const [objective, setObjective] = useState<string>("");
  const [customObjective, setCustomObjective] = useState<string>("");
  const [additionalContext, setAdditionalContext] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedMessages, setGeneratedMessages] = useState<{
    [key: string]: { text: string; reasoning: string };
  }>({});
  const [editedMessages, setEditedMessages] = useState<{
    [key: string]: string;
  }>({});
  const [maxLength, setMaxLength] = useState<number>(300);
  const [showAIReasoning, setShowAIReasoning] = useState<{
    [key: string]: boolean;
  }>({});

  const mediumOptions = [
    {
      id: "LinkedIn connection note",
      label: "LinkedIn Connection Note",
      maxLength: 300,
    },
    {
      id: "LinkedIn message to 1st connection",
      label: "LinkedIn Message to 1st Connection",
      maxLength: 400,
    },
    { id: "LinkedIn InMail", label: "LinkedIn InMail", maxLength: 400 },
    { id: "Cold email", label: "Email", maxLength: 500 },
    { id: "Forwardable intro", label: "Forwardable Intro", maxLength: 1000 },
  ];

  const objectiveOptions = [
    "Get to know and build relationship",
    "Get informational interview",
    "Ask for referral",
    "Explore roles",
    "Follow up on previous conversation",
    "Custom objective",
  ];

  // Optimized event handlers with useCallback to prevent re-renders
  const handleMediumChange = useCallback((value: string) => {
    console.log("Medium changed to:", value);
    setMedium(value);
    const selectedOption = mediumOptions.find((option) => option.id === value);
    if (selectedOption) {
      setMaxLength(selectedOption.maxLength);
    }
  }, []);

  const handleObjectiveChange = useCallback((value: string) => {
    console.log("Objective changed to:", value);
    setObjective(value);
    if (value !== "Custom objective") {
      setCustomObjective("");
    }
  }, []);

  const handleAdditionalContextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      console.log("Additional context change event triggered");
      const value = e.target.value;
      console.log("New additional context value:", value);
      setAdditionalContext(value);
    },
    []
  );

  const handleCustomObjectiveChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomObjective(e.target.value);
    },
    []
  );

  const getEffectiveObjective = useCallback(() => {
    return objective === "Custom objective" ? customObjective : objective;
  }, [objective, customObjective]);

  const generateMessages = useCallback(async () => {
    const effectiveObjective = getEffectiveObjective();
    if (!effectiveObjective) {
      toast.error("Please select or provide a message objective");
      return;
    }

    setIsGenerating(true);
    setGeneratedMessages({});
    setEditedMessages({});
    setShowAIReasoning({});

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!sessionData.session) {
        throw new Error("No active session found");
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        "generate_message",
        {
          body: {
            contact_id: contact.contact_id,
            medium,
            objective: effectiveObjective,
            additional_context: additionalContext || undefined,
          },
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        }
      );

      if (fnError) throw fnError;

      if (!data || data.status === "error" || !data.generated_messages) {
        throw new Error("Invalid response from generate_message function");
      }

      const messageVersions = {
        "Version 1": {
          text: data.generated_messages.version1,
          reasoning: data.ai_reasoning,
        },
        "Version 2": {
          text: data.generated_messages.version2,
          reasoning: data.ai_reasoning,
        },
        "Version 3": {
          text: data.generated_messages.version3,
          reasoning: data.ai_reasoning,
        },
      };

      setGeneratedMessages(messageVersions);

      const initialEditedMessages: { [key: string]: string } = {};
      Object.entries(messageVersions).forEach(([version, content]) => {
        if (content.text) {
          initialEditedMessages[version] = content.text;
        }
      });

      setEditedMessages(initialEditedMessages);

      toast.success("Messages generated successfully!");
    } catch (err: any) {
      console.error("Error generating messages:", err);
      toast.error(
        "Failed to generate messages: " + (err.message || "Unknown error")
      );
    } finally {
      setIsGenerating(false);
    }
  }, [contact.contact_id, medium, getEffectiveObjective, additionalContext]);

  const handleMessageEdit = useCallback(
    (version: string, text: string) => {
      setEditedMessages((prev) => ({
        ...prev,
        [version]: text.substring(0, maxLength),
      }));
    },
    [maxLength]
  );

  const copyMessage = useCallback((text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Message copied to clipboard!"))
      .catch((err) => {
        console.error("Failed to copy message:", err);
        toast.error("Failed to copy message to clipboard");
      });
  }, []);

  const saveMessage = useCallback(
    async (version: string, messageText: string) => {
      try {
        const effectiveObjective = getEffectiveObjective();
        const { data, error } = await supabase
          .from("saved_message_versions")
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            contact_id: contact.contact_id,
            company_id: contact.company_id,
            version_name: version,
            message_text: messageText,
            medium: medium,
            message_objective: effectiveObjective,
            message_additional_context: additionalContext || null,
          });

        if (error) throw error;

        const interactionDescription = `You sent a ${medium.toLowerCase()} to ${
          contact.first_name || ""
        } ${contact.last_name || ""}: "${messageText}"`;

        const { error: interactionError } = await supabase
          .from("interactions")
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            contact_id: contact.contact_id,
            company_id: contact.company_id,
            interaction_type: "message_draft",
            description: interactionDescription,
            medium: medium,
            message_objective: effectiveObjective,
            message_additional_context: additionalContext || null,
          });

        if (interactionError) throw interactionError;

        toast.success("Message saved to conversation history!");

        if (onMessageSaved) {
          onMessageSaved();
        }
      } catch (err: any) {
        console.error("Error saving message:", err);
        toast.error(
          "Failed to save message: " + (err.message || "Unknown error")
        );
      }
    },
    [getEffectiveObjective, contact, medium, additionalContext, onMessageSaved]
  );

  const toggleAIReasoning = useCallback((version: string) => {
    setShowAIReasoning((prev) => ({
      ...prev,
      [version]: !prev[version],
    }));
  }, []);

  console.log(
    "MessageGeneration component rendering, additionalContext:",
    additionalContext
  );

  // Memoize the MessageContent to prevent unnecessary re-renders
  const MessageContent = useMemo(
    () => (
      <div className="space-y-6 mt-4">
        {/* Message Configuration */}
        <div className="space-y-4">
          {/* Medium Selection */}
          <div className="space-y-2">
            <Label>Communication Medium</Label>
            <RadioGroup
              value={medium}
              onValueChange={handleMediumChange}
              className="grid grid-cols-1 gap-2"
            >
              {mediumOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="text-sm flex-1">
                    {option.label}
                  </Label>
                  <Badge variant="outline" className="text-xs">
                    {option.maxLength >= 1000
                      ? `${option.maxLength / 1000}k`
                      : option.maxLength}{" "}
                    chars
                  </Badge>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Message Objective */}
          <div className="space-y-3">
            <Label>
              Message Objective <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {objectiveOptions.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={objective === option ? "default" : "outline"}
                  size="sm"
                  className="justify-start text-left h-auto py-2 px-3 border-purple-400"
                  onClick={() => handleObjectiveChange(option)}
                >
                  {option}
                </Button>
              ))}
            </div>

            {objective === "Custom objective" && (
              <Input
                placeholder="Describe your custom objective..."
                value={customObjective}
                onChange={handleCustomObjectiveChange}
                className="mt-2 bg-white"
              />
            )}
          </div>

          {/* Additional Context */}
          <div className="space-y-2 ">
            <Label htmlFor="additional-context">
              Additional Context (Optional)
            </Label>
            <Textarea
              className="bg-white"
              id="additional-context"
              placeholder="Any specific details you'd like the AI to consider when crafting your message (e.g., previous interactions, specific interests, recent company news)..."
              value={additionalContext}
              onChange={handleAdditionalContextChange}
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateMessages}
            disabled={isGenerating || !getEffectiveObjective()}
            className="w-full"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating Your Message..." : "Generate Messages"}
          </Button>
        </div>

        {/* Generated Messages */}
        {Object.keys(generatedMessages).length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Your Message Options</h3>
            {Object.entries(generatedMessages).map(([version, content]) => (
              <Card key={version} className="p-4 relative">
                <div className="flex justify-between mb-2 items-center">
                  <h4 className="font-medium text-base">{version}</h4>
                  <div className="space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAIReasoning(version)}
                    >
                      {showAIReasoning[version] ? (
                        <ThumbsDown className="h-4 w-4" />
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                      <span className="ml-1 hidden sm:inline">
                        {showAIReasoning[version]
                          ? "Hide Insights"
                          : "Show AI Insights"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* AI Reasoning */}
                {showAIReasoning[version] && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                    <p className="font-medium mb-1 text-blue-900">
                      Why this approach works for you:
                    </p>
                    <p className="text-blue-800">{content.reasoning}</p>
                  </div>
                )}

                {/* Editable Message Text */}
                <div className="space-y-2">
                  <Textarea
                    value={editedMessages[version] || content.text}
                    onChange={(e) => handleMessageEdit(version, e.target.value)}
                    className="w-full resize-none"
                    rows={6}
                    maxLength={maxLength}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {(editedMessages[version] || content.text).length}/
                    {maxLength} characters
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyMessage(editedMessages[version] || content.text)
                    }
                  >
                    <Copy className="mr-1 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      saveMessage(
                        version,
                        editedMessages[version] || content.text
                      )
                    }
                  >
                    <Save className="mr-1 h-4 w-4" />
                    Save to History
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMessageEdit(version, content.text)}
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
    ),
    [
      medium,
      objective,
      customObjective,
      additionalContext,
      isGenerating,
      generatedMessages,
      editedMessages,
      maxLength,
      showAIReasoning,
      handleMediumChange,
      handleObjectiveChange,
      handleAdditionalContextChange,
      handleCustomObjectiveChange,
      getEffectiveObjective,
      generateMessages,
      handleMessageEdit,
      copyMessage,
      saveMessage,
      toggleAIReasoning,
    ]
  );

  if (embedded) {
    return MessageContent;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Generate Message for {contact.first_name || ""}{" "}
            {contact.last_name || ""}
            {contact.role && ` (${contact.role})`} at {companyName}
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              You are creating a personalized outreach message that highlights
              your value proposition and builds authentic connections.
            </p>
            <p className="text-sm text-primary">
              <strong>Your approach:</strong> You are framing this outreach
              around genuine interest and mutual value, focusing on how your
              experience can contribute rather than what you need. This
              authentic approach helps avoid the "sales-y" feeling and creates
              meaningful professional connections.
            </p>
          </DialogDescription>
        </DialogHeader>

        {MessageContent}
      </DialogContent>
    </Dialog>
  );
}
