import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Copy, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/airtable-ds/dialog";

import { Input } from "@/components/ui/airtable-ds/input";
import { Textarea } from "@/components/ui/airtable-ds/textarea";
import { Label } from "@/components/ui/airtable-ds/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/airtable-ds/collapsible";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/airtable-ds/sonner";
import { cn } from "@/lib/utils";
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
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    // Whether messages are present and generation has completed
    // Sentinel for auto-scrolling the view to the latest content
    const bottomRef = useRef<HTMLDivElement | null>(null);
    // Track previous contact_id to detect changes
    const prevContactIdRef = useRef<string | undefined>(contact?.contact_id);

    // Effect to reload state when contact changes
    useEffect(() => {
      const currentContactId = contact?.contact_id;
      const prevContactId = prevContactIdRef.current;

      // If contact_id changed, reload state from localStorage for the new contact
      if (currentContactId !== prevContactId) {
        if (currentContactId) {
          const newStorageKey = `messageGeneration_${currentContactId}`;

          // Helper to get state from localStorage
          const getState = <T,>(key: string, defaultValue: T): T => {
            try {
              const stored = localStorage.getItem(`${newStorageKey}_${key}`);
              return stored ? JSON.parse(stored) : defaultValue;
            } catch {
              return defaultValue;
            }
          };

          // Reload all state from the new contact's storage
          setMedium(getState("medium", "LinkedIn connection note"));
          setObjective(
            getState("objective", "Explore roles, find hiring managers")
          );
          setCustomObjective(getState("customObjective", ""));
          setAdditionalContext(getState("additionalContext", ""));
          setGeneratedMessages(getState("generatedMessages", {}));
          setEditedMessages(getState("editedMessages", {}));
          setMaxLength(getState("maxLength", 300));
          setShowAIReasoning(getState("showAIReasoning", {}));
          setIsContextExpanded(getState("isContextExpanded", false));
          setSelectedVersion(null);
          setIsGenerating(false); // Stop any in-progress generation
        } else {
          // Contact is null - reset to defaults
          setMedium("LinkedIn connection note");
          setObjective("Explore roles, find hiring managers");
          setCustomObjective("");
          setAdditionalContext("");
          setGeneratedMessages({});
          setEditedMessages({});
          setMaxLength(300);
          setShowAIReasoning({});
          setIsContextExpanded(false);
          setSelectedVersion(null);
          setIsGenerating(false);
        }
      }

      // Update ref for next comparison
      prevContactIdRef.current = currentContactId;
    }, [contact?.contact_id]);

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

    useEffect(() => {
      const versions = Object.keys(generatedMessages);
      if (versions.length === 0) {
        setSelectedVersion(null);
        return;
      }
      if (!selectedVersion || !generatedMessages[selectedVersion]) {
        setSelectedVersion(versions[0]);
      }
    }, [generatedMessages, selectedVersion]);

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
      setSelectedVersion(null);

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
      objective,
      customObjective,
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
      navigator.clipboard
        .writeText(text)
        .then(() => {
          toast.success("Message copied");
        })
        .catch((err) => {
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

    const handleSaveSelected = useCallback(() => {
      if (!selectedVersion) {
        toast.error("Select a version to save.");
        return;
      }

      const messageText =
        editedMessages[selectedVersion] ||
        generatedMessages[selectedVersion]?.text ||
        "";

      if (!messageText) {
        toast.error("This version is empty.");
        return;
      }

      copyMessage(messageText);
      saveMessage(selectedVersion, messageText);
    }, [
      selectedVersion,
      editedMessages,
      generatedMessages,
      copyMessage,
      saveMessage,
    ]);

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
      const versionEntries = Object.entries(generatedMessages);
      const hasGeneratedMessages = versionEntries.length > 0;
      const selectedMessageText =
        (selectedVersion &&
          (editedMessages[selectedVersion] ||
            generatedMessages[selectedVersion]?.text)) ||
        "";
      const generationDisabled =
        isGenerating ||
        isCrafting ||
        (isGuest
          ? !biosAreReady
          : !getEffectiveObjective() || !contact?.contact_id);

      return (
        <div
          className={`flex flex-col h-full ${
            embedded ? "mt-0" : "mt-4"
          } overflow-hidden`}
        >
          <div className="flex-1 space-y-6 overflow-auto pr-1 pb-2">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 sm:gap-3">
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
                  className="border-2 border-input-border focus:border-primary"
                />
              )}
            </div>

            {!isGuest && (
              <Collapsible
                open={isContextExpanded}
                onOpenChange={setIsContextExpanded}
              >
                <CollapsibleTrigger asChild>
                  <Button className="w-full flex justify-between items-center p-3 border border-border bg-secondary text-foreground hover:bg-primary-muted transition-colors shadow-none hover:shadow-none">
                    <Label className="text-sm font-semibold cursor-pointer">
                      Additional context (optional)
                    </Label>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-200 ${
                        isContextExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <Textarea
                    className="bg-secondary border-border"
                    id="additional-context"
                    placeholder="Any specific details you'd like the AI to consider when crafting your message: projects you want to highlight, recent interactions, personal relationships, common interests, etc."
                    value={additionalContext}
                    onChange={handleAdditionalContextChange}
                    rows={4}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}

            <div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {MEDIUM_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    variant="option"
                    className={cn(
                      "bg-inherit hover:bg-inherit flex-1 p-2 border border-border rounded-lg min-w-[140px] transition-colors",
                      medium === option.id
                        ? "border-primary text-primary"
                        : "text-muted-foreground"
                    )}
                    onClick={() => handleMediumChange(option.id)}
                  >
                    <div className="text-center space-y-1 leading-tight">
                      <div className="whitespace-nowrap text-sm font-semibold">
                        {option.label}
                      </div>
                      <div className="whitespace-nowrap text-xs">
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

            {isGenerating ? (
              <MessageSkeleton />
            ) : hasGeneratedMessages ? (
              <div className="flex flex-col xl:flex-row xl:gap-4 space-y-4 xl:space-y-0">
                {versionEntries.map(([version, content]) => {
                  const value =
                    editedMessages[version] !== undefined
                      ? editedMessages[version]
                      : content.text;
                  const isSelected = selectedVersion === version;

                  return (
                    <div
                      key={version}
                      className={cn(
                        "flex-1 rounded-xl border bg-background shadow-sm transition-colors",
                        isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center justify-between px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setSelectedVersion(version)}
                          className={cn(
                            "text-sm font-semibold transition-colors",
                            isSelected ? "text-primary" : "text-foreground"
                          )}
                        >
                          {version}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyMessage(value)}
                          className="rounded-md p-2 text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                          aria-label={`Copy ${version}`}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-2 px-3 pb-3">
                        <Textarea
                          value={value}
                          onFocus={() => setSelectedVersion(version)}
                          onChange={(e) =>
                            handleMessageEdit(version, e.target.value)
                          }
                          className="w-full resize-y bg-background border-border min-h-[220px] focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0"
                          maxLength={maxLength}
                          readOnly={isGuest}
                        />
                        <div className="flex justify-end text-xs text-muted-foreground">
                          {value.length}/{maxLength}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              !isGenerating && (
                <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                  {contact
                    ? "Choose an objective and craft an opener to see AI-generated drafts."
                    : "Select or create a contact to start crafting an opener."}
                </div>
              )
            )}

            {isGuest && hasGeneratedMessages && (
              <div className="rounded-lg border border-border bg-secondary/50 px-6 py-4 text-sm text-muted-foreground">
                Sign up to copy and save your personalized opener, keep history,
                and track follow-ups.
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="sticky bottom-0 left-0 right-0 bg-background">
            <div className="flex flex-col items-stretch gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2 pb-2">
              {hasGeneratedMessages ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <Button
                      variant="option"
                      className="sm:w-auto h-10 text-sm "
                      onClick={() => {
                        setGeneratedMessages({});
                        setEditedMessages({});
                        setSelectedVersion(null);
                      }}
                      disabled={isGenerating}
                    >
                      Clear
                    </Button>
                    <OutlineAction
                      onClick={onGenerateClick || generateMessages}
                      disabled={generationDisabled}
                      className="sm:w-auto h-10"
                    >
                      {isGenerating ? "Crafting..." : "Regenerate"}
                    </OutlineAction>
                    {isGuest ? (
                      <PrimaryAction
                        onClick={() => (window.location.href = "/auth/signup")}
                        className="sm:w-auto h-10"
                      >
                        Sign up to copy and save
                      </PrimaryAction>
                    ) : (
                      <PrimaryAction
                        onClick={handleSaveSelected}
                        disabled={
                          generationDisabled ||
                          !selectedVersion ||
                          !selectedMessageText
                        }
                        className="sm:w-auto h-10"
                      >
                        Save to History
                      </PrimaryAction>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <PrimaryAction
                    onClick={onGenerateClick || generateMessages}
                    disabled={generationDisabled}
                    className="w-full sm:w-auto h-10"
                  >
                    {isGenerating ? "Crafting..." : "Craft Your Opener"}
                  </PrimaryAction>
                </div>
              )}
            </div>
          </div>
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
      handleSaveSelected,
      isContextExpanded,
      setIsContextExpanded,
      isGuest,
      biosAreReady,
      onGenerateClick,
      isCrafting,
      embedded,
      generateMessages,
      selectedVersion,
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
