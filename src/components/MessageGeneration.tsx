import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
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
} from "@/components/ui/airtable-ds/dialog";

import { Card } from "@/components/ui/airtable-ds/card";
import { Input } from "@/components/ui/airtable-ds/input";
import { Textarea } from "@/components/ui/airtable-ds/textarea";
import { Label } from "@/components/ui/airtable-ds/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/airtable-ds/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/airtable-ds/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/airtable-ds/sonner";
import { MEDIUM_OPTIONS } from "@/shared/constants";
import {
  PrimaryAction,
  OutlineAction,
  Chip,
  Button,
} from "@/components/ui/design-system";
import { objectiveSchema, additionalContextSchema } from "@/lib/validation";

const MessageSkeleton = () => (
  <div className="space-y-4 animate-pulse pt-4">
    {/* Tabs Skeleton */}
    <div className="grid w-full grid-cols-3 gap-2">
      <div className="h-10 bg-gray-200 rounded-lg" />
      <div className="h-10 bg-gray-200 rounded-lg" />
      <div className="h-10 bg-gray-200 rounded-lg" />
    </div>
    {/* Text Area Skeleton */}
    <div className="space-y-2">
      <div className="h-24 w-full bg-gray-200 rounded-lg" />
      <div className="h-4 w-1/4 bg-gray-200 rounded-md" />
    </div>
  </div>
);

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
}

interface GeneratedMessageData {
  version1: string;
  version2: string;
  version3: string;
}

interface MessageGenerationProps {
  contact: ContactData | null;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onMessageSaved?: () => void;
  embedded?: boolean;
  disabled?: boolean;

  // Guest mode props (all optional)
  isGuest?: boolean;
  sessionId?: string;
  guestContactId?: string;
  userProfileId?: string;
  onMessagesGenerated?: (messages: GeneratedMessageData) => void;
  biosAreReady?: boolean;
  onGenerateClick?: () => void;
  isCrafting?: boolean;
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

export const MessageGeneration = forwardRef(
  (
    {
      contact,
      companyName,
      isOpen,
      onClose,
      onMessageSaved,
      embedded = false,
      disabled = false,
      isGuest = false,
      sessionId,
      guestContactId,
      userProfileId,
      onMessagesGenerated,
      biosAreReady = false,
      onGenerateClick,
      isCrafting = false,
    }: MessageGenerationProps,
    ref
  ) => {
    // Generate a unique storage key based on contact to maintain separate states
    const storageKey = `messageGeneration_${contact?.contact_id || "default"}`;

    // Helper function to get initial state from localStorage
    const getInitialState = <T,>(key: string, defaultValue: T): T => {
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
      getInitialState("objective", "Explore roles, find hiring managers")
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
    const [activeTab, setActiveTab] = useState<string>("Version 1");
    // Whether messages are present and generation has completed
    const hasMessagesAny =
      !isGenerating && Object.keys(generatedMessages).length > 0;
    // Guest-only alias preserved for clarity in guest-specific UI below
    const hasMessages = isGuest && hasMessagesAny;
    // Sentinel for auto-scrolling the view to the latest content
    const bottomRef = useRef<HTMLDivElement | null>(null);

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
      setMedium(value);
      const selectedOption = MEDIUM_OPTIONS.find(
        (option) => option.id === value
      );
      if (selectedOption) {
        setMaxLength(selectedOption.maxLength);
      }
    }, []);

    const handleObjectiveChange = useCallback((value: string) => {
      setObjective(value);
      if (value !== "Custom objective") {
        setCustomObjective("");
      }
    }, []);

    const handleAdditionalContextChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
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

    // Handle tab change for guests - persist selection to backend
    const handleTabChange = useCallback(
      async (newTab: string) => {
        setActiveTab(newTab);

        // For guests, persist the selection to the backend
        if (isGuest && sessionId && generatedMessages[newTab]) {
          try {
            const { error } = await supabase.functions.invoke(
              "guest_message_selection",
              {
                body: {
                  sessionId: sessionId,
                  selectedVersion: newTab,
                  guestContactId: guestContactId,
                },
              }
            );

            if (error) {
              console.error("Error saving message selection:", error);
              // Don't show error toast - this is background operation
            } else {
              console.log(`Message selection saved: ${newTab}`);
            }
          } catch (error) {
            console.error("Error calling guest_message_selection:", error);
          }
        }
      },
      [isGuest, sessionId, generatedMessages, guestContactId]
    );

    const generateMessages = useCallback(async () => {
      if (!contact) {
        toast.error("Please create a contact first");
        return;
      }

      const effectiveObjective = getEffectiveObjective();

      // Validate inputs before making API call
      if (objective === "Custom objective") {
        const objectiveResult = objectiveSchema.safeParse(customObjective);
        if (!objectiveResult.success) {
          toast.error(objectiveResult.error.errors[0].message);
          return;
        }
      }

      if (additionalContext) {
        const contextResult =
          additionalContextSchema.safeParse(additionalContext);
        if (!contextResult.success) {
          toast.error(contextResult.error.errors[0].message);
          return;
        }
      }

      setIsGenerating(true);
      setGeneratedMessages({});
      setEditedMessages({});
      setShowAIReasoning({});

      try {
        let data, fnError;

        if (isGuest) {
          // Guest mode: No auth session required
          const response = await supabase.functions.invoke("generate_message", {
            body: {
              medium,
              objective: effectiveObjective,
              additional_context: additionalContext || undefined,
              is_guest: true,
              session_id: sessionId,
              guest_contact_id: guestContactId,
              user_profile_id: userProfileId,
            },
          });

          data = response.data;
          fnError = response.error;
        } else {
          // Registered mode: Requires auth session
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();

          if (sessionError) throw sessionError;

          if (!sessionData.session) {
            throw new Error("No active session found");
          }

          const response = await supabase.functions.invoke("generate_message", {
            body: {
              contact_id: contact.contact_id,
              medium,
              objective: effectiveObjective,
              additional_context: additionalContext || undefined,
            },
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
          });

          data = response.data;
          fnError = response.error;
        }

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

        // Call guest callback if provided
        if (isGuest && onMessagesGenerated) {
          onMessagesGenerated(data.generated_messages);
        }
      } catch (err) {
        console.error("Error generating messages:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        toast.error(`Failed to generate messages: ${errorMessage}`);
      } finally {
        setIsGenerating(false);
      }
    }, [
      contact,
      medium,
      getEffectiveObjective,
      additionalContext,
      isGuest,
      sessionId,
      guestContactId,
      userProfileId,
      onMessagesGenerated,
    ]);

    useImperativeHandle(ref, () => ({
      generateMessages,
    }));

    // Smoothly scroll to the bottom once messages are available/updated
    useEffect(() => {
      if (!isGenerating && Object.keys(generatedMessages).length > 0) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, [generatedMessages, isGenerating]);

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
          const { data, error } = await supabase.from("saved_messages").insert({
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
        } catch (err) {
          console.error("Error saving message:", err);
          const errorMessage =
            err instanceof Error ? err.message : "An unknown error occurred";
          toast.error(`Failed to save message: ${errorMessage}`);
        }
      },
      [
        getEffectiveObjective,
        contact,
        medium,
        additionalContext,
        onMessageSaved,
      ]
    );

    const toggleAIReasoning = useCallback((version: string) => {
      setShowAIReasoning((prev) => ({
        ...prev,
        [version]: !prev[version],
      }));
    }, []);

    // Memorize the MessageContent to prevent unnecessary re-renders
    const MessageContent = useMemo(() => {
      const objectiveOptions = [
        "Explore roles, find hiring managers",
        "Request a referral for a role you applied for",
        "Get informational interview",
        "Build relationship, open-ended",
        "Follow up",
        "Custom objective",
      ];
      return (
        <div className={`flex flex-col h-full ${embedded ? "mt-0" : "mt-4"}`}>
          <div className="flex-1 space-y-4">
            <div className="space-y-4">
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

            {/* Additional Context - Only show for registered users */}
            {!isGuest && (
              <Collapsible
                open={isContextExpanded}
                onOpenChange={setIsContextExpanded}
              >
                <CollapsibleTrigger asChild>
                  <Button className="w-full flex justify-between items-center p-2 border-2 border-border bg-secondary text-foreground hover:bg-primary-muted  transition-colors shadow-none hover:shadow-none">
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
                    className="bg-secondary border-border "
                    id="additional-context"
                    placeholder="Any specific details you'd like the AI to consider when crafting your message: projects you want to highlight, recent interactions, personal relationships, common interests, etc."
                    value={additionalContext}
                    onChange={handleAdditionalContextChange}
                    rows={4}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* Medium Selection and Generate Button - Anchored to bottom */}
          <div className="space-y-4 mt-6 p-4">
            {/* Medium Selection - Flat Cards */}
            <div className="space-y-2">
              <div className="">
                <div className="flex gap-3">
                  {MEDIUM_OPTIONS.map((option) => (
                    <Button
                      key={option.id}
                      variant="option"
                      className={`bg-inherit hover:bg-inherit flex-1 p-2 border-none transition-colors cursor-pointer min-w-0 ${
                        medium === option.id
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                      onClick={() => handleMediumChange(option.id)}
                    >
                      <div
                        className={`text-center space-y-1 leading-tight ${
                          medium === option.id
                            ? "font-semibold text-sm"
                            : "font-medium text-xs"
                        }`}
                      >
                        <div className="whitespace-nowrap">{option.label}</div>
                        <div className="whitespace-nowrap">
                          {option.maxLength >= 1000
                            ? `${option.maxLength / 1000}k`
                            : option.maxLength}{" "}
                          chars
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Generate Button - Flat */}
              {hasMessagesAny ? (
                <OutlineAction
                  onClick={onGenerateClick || generateMessages}
                  disabled={
                    isGenerating ||
                    isCrafting ||
                    (isGuest
                      ? !biosAreReady
                      : !getEffectiveObjective() || !contact?.contact_id)
                  }
                  className="w-full h-10"
                  size="default"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {isGenerating ? "Crafting..." : "Regenerate"}
                </OutlineAction>
              ) : (
                <PrimaryAction
                  onClick={onGenerateClick || generateMessages}
                  disabled={
                    isGenerating ||
                    isCrafting ||
                    (isGuest
                      ? !biosAreReady
                      : !getEffectiveObjective() || !contact?.contact_id)
                  }
                  className="w-full h-12"
                  size="lg"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {isGenerating ? "Crafting..." : "Craft Your Opener"}
                </PrimaryAction>
              )}
            </div>
          </div>

          {/* Generated Messages - Tabbed Interface */}
          {isGenerating ? (
            <MessageSkeleton />
          ) : (
            Object.keys(generatedMessages).length > 0 && (
              <div className="space-y-4">
                <Tabs
                  defaultValue="Version 1"
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
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
                  {Object.entries(generatedMessages).map(
                    ([version, content]) => (
                      <TabsContent key={version} value={version} className="">
                        <Card className=" bg-inherit border-none">
                          {/* Editable Message Text (read-only for guests) */}
                          <div className="space-y-3">
                            <Textarea
                              value={editedMessages[version] || content.text}
                              onChange={(e) =>
                                handleMessageEdit(version, e.target.value)
                              }
                              className="w-full resize-none bg-background border-border transition-colors"
                              rows={6}
                              maxLength={maxLength}
                              readOnly={isGuest}
                            />
                          </div>

                          {/* Char Count and Action Buttons */}
                          <div className="flex justify-between items-center mt-4">
                            <div className="text-xs text-muted-foreground  px-2 ">
                              {(editedMessages[version] || content.text).length}
                              /{maxLength}
                            </div>

                            {!isGuest && (
                              <PrimaryAction
                                size={hasMessagesAny ? "default" : "sm"}
                                onClick={() => {
                                  copyMessage(
                                    editedMessages[version] || content.text
                                  );
                                  saveMessage(
                                    version,
                                    editedMessages[version] || content.text
                                  );
                                }}
                                className={`transition-all ${
                                  hasMessagesAny
                                    ? "ring-2 ring-primary shadow-lg scale-[1.02]"
                                    : "shadow-md hover:shadow-lg"
                                }`}
                              >
                                <Save className="mr-1 h-4 w-4" />
                                Copy and Save to History
                              </PrimaryAction>
                            )}
                          </div>
                        </Card>
                      </TabsContent>
                    )
                  )}
                </Tabs>

                {/* Guest CTA Button - Only shown for guests */}
                {isGuest && (
                  <div className="border-t pt-6 mt-6 pb-12">
                    <PrimaryAction
                      onClick={async () => {
                        // Get the currently selected message
                        const selectedMessage =
                          editedMessages[activeTab] ||
                          generatedMessages[activeTab]?.text;

                        if (selectedMessage) {
                          // Copy to clipboard
                          try {
                            await navigator.clipboard.writeText(
                              selectedMessage
                            );
                            toast.success("Message copied to clipboard!");
                          } catch (err) {
                            console.error("Failed to copy:", err);
                            toast.error("Failed to copy message");
                          }
                        }

                        // Redirect to signup
                        window.location.href = "/auth/signup";
                      }}
                      className={`w-full h-16 ${
                        hasMessages
                          ? "ring-2 ring-primary shadow-lg scale-[1.02] transition-transform text-lg"
                          : ""
                      }`}
                      size="default"
                    >
                      Sign up to copy and save your message!
                    </PrimaryAction>
                  </div>
                )}
              </div>
            )
          )}
          {/* Auto-scroll sentinel */}
          <div ref={bottomRef} />
        </div>
      );
    }, [
      contact,
      medium,
      objective,
      customObjective,
      additionalContext,
      isGenerating,
      generatedMessages,
      editedMessages,
      maxLength,
      handleMediumChange,
      handleObjectiveChange,
      handleAdditionalContextChange,
      handleCustomObjectiveChange,
      getEffectiveObjective,
      handleMessageEdit,
      copyMessage,
      saveMessage,
      isContextExpanded,
      setIsContextExpanded,
      isGuest,
      activeTab,
      handleTabChange,
      biosAreReady,
      onGenerateClick,
      isCrafting,
      embedded,
      generateMessages,
      hasMessages,
    ]);

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
);
