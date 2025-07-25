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

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { MEDIUM_OPTIONS } from "@/shared/constants";
import {
  PrimaryAction,
  Chip,
  Button,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/design-system";

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
    navigator.clipboard.writeText(text).catch((err) => {
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

        toast.success("Message copied and saved to conversation history!");

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
        <div className="space-y-4">
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-foreground">
              What are you trying to achieve?
            </Label>
            <div className="flex flex-wrap gap-3">
              {objectiveOptions.map((option) => (
                <Chip
                  key={option}
                  isSelected={objective === option}
                  onClick={() => handleObjectiveChange(option)}
                >
                  {option}
                </Chip>
              ))}
            </div>

            {objective === "Custom objective" && (
              <Input
                placeholder="Describe your custom objective..."
                value={customObjective}
                onChange={handleCustomObjectiveChange}
                className="mt-4 border-2 border-input-border focus:border-primary"
              />
            )}
          </div>

          {/* Additional Context - Flat Collapsible */}
          <Collapsible
            open={isContextExpanded}
            onOpenChange={setIsContextExpanded}
          >
            <CollapsibleTrigger asChild>
              <Button className="w-full flex justify-between items-center p-2 border-2 border-border bg-background text-foreground hover:bg-primary-muted  transition-colors shadow-none hover:shadow-none">
                <Label className="text-sm font-semibold cursor-pointer">
                  Additional context (optional)
                </Label>
                <ChevronDown
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isContextExpanded ? "transform rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Textarea
                className="bg-background border-border "
                id="additional-context"
                placeholder="Any specific details you'd like the AI to consider when crafting your message: projects you want to highlight, recent interactions, personal relationships, common interests, etc."
                value={additionalContext}
                onChange={handleAdditionalContextChange}
                rows={4}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Medium Selection - Flat Cards */}
          <div className="space-y-2 mt-2">
            <div className="">
              <div className="flex gap-3">
                {MEDIUM_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    variant={option}
                    className={`flex-1 p-1 transition-colors cursor-pointer ${
                      medium === option.id
                        ? "bg-secondary text-primary"
                        : "bg-secondary text-secondary-foreground/80 hover:text-primary/60"
                    }`}
                    onClick={() => handleMediumChange(option.id)}
                  >
                    <div className="text-center space-y-1 font-semibold text-xs">
                      {option.label} /{" "}
                      {option.maxLength >= 1000
                        ? `${option.maxLength / 1000}k`
                        : option.maxLength}{" "}
                      chars
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Generate Button - Flat */}
            <PrimaryAction
              onClick={generateMessages}
              disabled={
                isGenerating || !getEffectiveObjective() || !contact?.contact_id
              }
              className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold border-0 transition-colors"
              size="lg"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              {isGenerating
                ? "Generating..."
                : !contact?.contact_id
                ? "Create contact first"
                : "Generate Messages"}
            </PrimaryAction>
          </div>
        </div>

        {/* Generated Messages - Tabbed Interface */}
        {Object.keys(generatedMessages).length > 0 && (
          <div className="space-y-4">
            <Tabs defaultValue="Version 1" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary">
                {Object.keys(generatedMessages).map((version) => (
                  <TabsTrigger
                    key={version}
                    value={version}
                    className="w-[98%] rounded-lg mx-auto text-sm font-medium bg-background data-[state=active]:bg-primary-muted data-[state=active]:border-primary-muted border-2 border-border"
                  >
                    {version}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Generated Messages - Preview */}
              {Object.entries(generatedMessages).map(([version, content]) => (
                <TabsContent key={version} value={version} className="">
                  <Card className=" bg-inherit border-none">
                    {/* Editable Message Text */}
                    <div className="space-y-3">
                      <Textarea
                        value={editedMessages[version] || content.text}
                        onChange={(e) =>
                          handleMessageEdit(version, e.target.value)
                        }
                        className="w-full resize-none bg-background border-border transition-colors"
                        rows={6}
                        maxLength={maxLength}
                      />
                    </div>

                    {/* Char Count and Action Buttons */}
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-xs text-muted-foreground  px-2 ">
                        {(editedMessages[version] || content.text).length}/
                        {maxLength}
                      </div>

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
    // It is possible that this part is never used, as it is always embedded
    // But keeping it for consistency with the original code structure
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Generate Message for {contact?.first_name || ""}{" "}
            {contact?.last_name || ""}
          </DialogTitle>
          <DialogDescription>
            Select your medium and objective to craft a personalized message.
          </DialogDescription>
        </DialogHeader>
        {MessageContent}
      </DialogContent>
    </Dialog>
  );
}
