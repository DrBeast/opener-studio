import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Copy,
  Save,
  RotateCcw,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
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
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { MEDIUM_OPTIONS } from "@/shared/constants";
import { PrimaryAction } from "@/components/ui/design-system/buttons";

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
}

interface MessageGenerationProps {
  contact: ContactData | null;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onMessageSaved?: () => void;
  embedded?: boolean;
  disabled?: boolean;
}

interface GeneratedMessageResponse {
  status: string;
  message: string;
  generated_messages: {
    version1: string;
    version2: string;
    version3: string;
  };
}

export function MessageGeneration({
  contact,
  companyName,
  isOpen,
  onClose,
  onMessageSaved,
  embedded = false,
  disabled = false,
}: MessageGenerationProps) {
  // Generate a unique storage key based on contact to maintain separate states
  const storageKey = `messageGeneration_${contact?.contact_id || "default"}`;

  // Helper function to get initial state from localStorage
  const getInitialState = (key: string, defaultValue: any) => {
    try {
      const stored = localStorage.getItem(`${storageKey}_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // State with localStorage persistence
  const [medium, setMedium] = useState<string>(() =>
    getInitialState("medium", "LinkedIn connection note")
  );
  const [objective, setObjective] = useState<string>(() =>
    getInitialState("objective", "")
  );
  const [customObjective, setCustomObjective] = useState<string>(() =>
    getInitialState("customObjective", "")
  );
  const [additionalContext, setAdditionalContext] = useState<string>(() =>
    getInitialState("additionalContext", "")
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedMessages, setGeneratedMessages] = useState<{
    [key: string]: { text: string };
  }>(() => getInitialState("generatedMessages", {}));
  const [editedMessages, setEditedMessages] = useState<{
    [key: string]: string;
  }>(() => getInitialState("editedMessages", {}));
  const [maxLength, setMaxLength] = useState<number>(() =>
    getInitialState("maxLength", 300)
  );
  const [showAIReasoning, setShowAIReasoning] = useState<{
    [key: string]: boolean;
  }>(() => getInitialState("showAIReasoning", {}));
  const [isContextExpanded, setIsContextExpanded] = useState<boolean>(() =>
    getInitialState("isContextExpanded", false)
  );

  // Effect to save state to localStorage whenever it changes
  useEffect(() => {
    if (contact?.contact_id) {
      localStorage.setItem(`${storageKey}_medium`, JSON.stringify(medium));
    }
  }, [medium, storageKey, contact?.contact_id]);

  useEffect(() => {
    if (contact?.contact_id) {
      localStorage.setItem(
        `${storageKey}_objective`,
        JSON.stringify(objective)
      );
    }
  }, [objective, storageKey, contact?.contact_id]);

  useEffect(() => {
    if (contact?.contact_id) {
      localStorage.setItem(
        `${storageKey}_customObjective`,
        JSON.stringify(customObjective)
      );
    }
  }, [customObjective, storageKey, contact?.contact_id]);

  useEffect(() => {
    if (contact?.contact_id) {
      localStorage.setItem(
        `${storageKey}_additionalContext`,
        JSON.stringify(additionalContext)
      );
    }
  }, [additionalContext, storageKey, contact?.contact_id]);

  useEffect(() => {
    if (contact?.contact_id) {
      localStorage.setItem(
        `${storageKey}_generatedMessages`,
        JSON.stringify(generatedMessages)
      );
    }
  }, [generatedMessages, storageKey, contact?.contact_id]);

  useEffect(() => {
    if (contact?.contact_id) {
      localStorage.setItem(
        `${storageKey}_editedMessages`,
        JSON.stringify(editedMessages)
      );
    }
  }, [editedMessages, storageKey, contact?.contact_id]);

  useEffect(() => {
    if (contact?.contact_id) {
      localStorage.setItem(
        `${storageKey}_maxLength`,
        JSON.stringify(maxLength)
      );
    }
  }, [maxLength, storageKey, contact?.contact_id]);

  useEffect(() => {
    if (contact?.contact_id) {
      localStorage.setItem(
        `${storageKey}_showAIReasoning`,
        JSON.stringify(showAIReasoning)
      );
    }
  }, [showAIReasoning, storageKey, contact?.contact_id]);

  useEffect(() => {
    if (contact?.contact_id) {
      localStorage.setItem(
        `${storageKey}_isContextExpanded`,
        JSON.stringify(isContextExpanded)
      );
    }
  }, [isContextExpanded, storageKey, contact?.contact_id]);

  console.log("Debug - MessageGeneration received contact:", contact);

  const objectiveOptions = [
    "Explore roles, find hiring managers",
    "Request a referral for a role you applied for",
    "Get informational interview",
    "Build relationship, open-ended",
    "Follow up",
    "Custom objective",
  ];

  // Optimized event handlers with useCallback to prevent re-renders
  const handleMediumChange = useCallback((value: string) => {
    console.log("Medium changed to:", value);
    setMedium(value);
    const selectedOption = MEDIUM_OPTIONS.find((option) => option.id === value);
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
    if (!contact) {
      toast.error("Please create a contact first");
      return;
    }

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
        },
        "Version 2": {
          text: data.generated_messages.version2,
        },
        "Version 3": {
          text: data.generated_messages.version3,
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
  }, [contact?.contact_id, medium, getEffectiveObjective, additionalContext]);

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
            contact_id: contact?.contact_id,
            company_id: contact?.company_id,
            version_name: version,
            message_text: messageText,
            medium: medium,
            message_objective: effectiveObjective,
            message_additional_context: additionalContext || null,
          });

        if (error) throw error;

        const interactionDescription = `You sent a ${medium.toLowerCase()} to ${
          contact?.first_name || ""
        } ${contact?.last_name || ""}: "${messageText}"`;

        const { error: interactionError } = await supabase
          .from("interactions")
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            contact_id: contact?.contact_id,
            company_id: contact?.company_id,
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

  // Memorize the MessageContent to prevent unnecessary re-renders
  const MessageContent = useMemo(
    () => (
      <div className={`space-y-6 ${embedded ? "mt-0" : "mt-4"}`}>
        {/* Message Configuration */}
        <div className="space-y-4">
          {/* Message Objective - Chip Style */}
          <div className="space-y-3">
            <Label className={`font-medium ${embedded ? "text-sm" : ""}`}>
              What are you trying to achieve with this message?
            </Label>
            <div className="flex flex-wrap gap-2">
              {objectiveOptions.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={objective === option ? "default" : "outline"}
                  size="sm"
                  className={`h-8 px-3 rounded-full text-xs font-medium transition-all hover:scale-105 ${
                    objective === option 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:border-primary/50"
                  }`}
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
                className="mt-3 bg-white transition-all focus:ring-2 focus:ring-primary/20"
              />
            )}
          </div>

          {/* Medium Selection - Compact Single Line */}
          <div className="space-y-3">
            <Label className={`font-medium ${embedded ? "text-sm" : ""}`}>
              Communication Medium
            </Label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {MEDIUM_OPTIONS.map((option) => (
                <Card
                  key={option.id}
                  className={`p-2 cursor-pointer transition-all hover:shadow-md flex-shrink-0 min-w-fit ${
                    medium === option.id
                      ? "ring-2 ring-primary bg-primary/5 border-primary"
                      : "hover:border-primary/30"
                  }`}
                  onClick={() => handleMediumChange(option.id)}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full border-2 flex-shrink-0 ${
                        medium === option.id
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    />
                    <div className="flex flex-col gap-0.5">
                      <Label
                        className={`cursor-pointer font-medium leading-tight ${
                          embedded ? "text-xs" : "text-sm"
                        }`}
                      >
                        {option.label}
                      </Label>
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium w-fit"
                      >
                        {option.maxLength >= 1000
                          ? `${option.maxLength / 1000}k`
                          : option.maxLength}{" "}
                        chars
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Additional Context - Collapsible */}
          <Collapsible open={isContextExpanded} onOpenChange={setIsContextExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto hover:bg-transparent"
              >
                <Label className={`font-medium cursor-pointer ${embedded ? "text-sm" : ""}`}>
                  Additional context (optional)
                </Label>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isContextExpanded ? "transform rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <Textarea
                className={`bg-white transition-all focus:ring-2 focus:ring-primary/20 ${embedded ? "text-sm" : ""}`}
                id="additional-context"
                placeholder="Any specific details you'd like the AI to consider when crafting your message (e.g., previous interactions, specific interests, relevant projects, recent company news)"
                value={additionalContext}
                onChange={handleAdditionalContextChange}
                rows={embedded ? 3 : 4}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Generate Button */}
          <Button
            onClick={generateMessages}
            disabled={
              isGenerating || !getEffectiveObjective() || !contact?.contact_id
            }
            className="w-full bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
            size={embedded ? "sm" : "default"}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {isGenerating
              ? "Generating..."
              : !contact?.contact_id
              ? "Create contact first"
              : "Generate Messages"}
          </Button>
        </div>

        {/* Generated Messages - Tabbed Interface */}
        {Object.keys(generatedMessages).length > 0 && (
          <div className="space-y-4">
            <Tabs defaultValue="Version 1" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                {Object.keys(generatedMessages).map((version) => (
                  <TabsTrigger
                    key={version}
                    value={version}
                    className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    {version}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {Object.entries(generatedMessages).map(([version, content]) => (
                <TabsContent key={version} value={version} className="mt-4">
                  <Card className="p-4 border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-base text-foreground">{version}</h4>
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {(editedMessages[version] || content.text).length}/{maxLength}
                      </div>
                    </div>

                    {/* Editable Message Text */}
                    <div className="space-y-3">
                      <Textarea
                        value={editedMessages[version] || content.text}
                        onChange={(e) => handleMessageEdit(version, e.target.value)}
                        className="w-full resize-none bg-background border-muted-foreground/20 focus:border-primary transition-all"
                        rows={6}
                        maxLength={maxLength}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 mt-4">
                      <PrimaryAction
                        size="sm"
                        onClick={() => {
                          copyMessage(editedMessages[version] || content.text);
                          saveMessage(
                            version,
                            editedMessages[version] || content.text
                          );
                        }}
                        className="shadow-md hover:shadow-lg transition-all"
                      >
                        <Save className="mr-1 h-4 w-4" />
                        Copy and Save to History
                      </PrimaryAction>
                    </div>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    ),
    [
      disabled,
      contact,
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
      isContextExpanded,
      setIsContextExpanded,
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
            Generate Message for {contact?.first_name || ""}{" "}
            {contact?.last_name || ""}
            {contact?.role && ` (${contact.role})`} at {companyName}
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
