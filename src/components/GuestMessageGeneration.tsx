import React, { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/airtable-ds/textarea";
import { Input } from "@/components/ui/airtable-ds/input";
import { Label } from "@/components/ui/airtable-ds/label";
import { PrimaryAction } from "@/components/ui/design-system";
import { Button } from "@/components/ui/design-system/buttons";
import { Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/airtable-ds/sonner";
import { MEDIUM_OPTIONS } from "@/shared/constants";

interface GuestMessageGenerationProps {
  sessionId: string;
  guestContactId: string;
  userProfileId: string;
  onMessagesGenerated: (messages: any) => void;
  onClose: () => void;
}

export const GuestMessageGeneration: React.FC<GuestMessageGenerationProps> = ({
  sessionId,
  guestContactId,
  userProfileId,
  onMessagesGenerated,
  onClose,
}) => {
  const [medium, setMedium] = useState<string>(
    "LinkedIn message, email, InMail"
  );
  const [objective, setObjective] = useState<string>("");
  const [customObjective, setCustomObjective] = useState<string>("");
  const [additionalContext, setAdditionalContext] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessages, setGeneratedMessages] = useState<any>(null);
  const [copiedMessage, setCopiedMessage] = useState<string>("");

  const objectiveOptions = [
    "Explore roles, find hiring managers",
    "Request a referral for a role you applied for",
    "Get informational interview",
    "Build relationship, open-ended",
    "Follow up",
    "Custom objective",
  ];

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
    setGeneratedMessages(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate_message",
        {
          body: {
            medium,
            objective: effectiveObjective,
            additional_context: additionalContext || undefined,
            is_guest: true,
            session_id: sessionId,
            guest_contact_id: guestContactId,
            user_profile_id: userProfileId,
          },
        }
      );

      if (error) throw error;

      if (!data || data.status === "error" || !data.generated_messages) {
        throw new Error("Invalid response from generate_message function");
      }

      setGeneratedMessages(data.generated_messages);
      onMessagesGenerated(data.generated_messages);
      toast.success("Messages generated successfully!");
    } catch (error) {
      console.error("Error generating messages:", error);
      toast.error("Failed to generate messages. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [
    medium,
    getEffectiveObjective,
    additionalContext,
    sessionId,
    guestContactId,
    userProfileId,
    onMessagesGenerated,
  ]);

  const copyToClipboard = async (text: string, version: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessage(version);
      toast.success("Message copied to clipboard!");
      setTimeout(() => setCopiedMessage(""), 2000);
    } catch (error) {
      toast.error("Failed to copy message");
    }
  };

  const selectedMedium = MEDIUM_OPTIONS.find((option) => option.id === medium);
  const maxLength = selectedMedium?.maxLength || 2000;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Message Generation</h3>

        {/* Medium Selection */}
        <div className="space-y-2">
          <Label htmlFor="medium">Communication Medium</Label>
          <select
            id="medium"
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {MEDIUM_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} ({option.maxLength} chars)
              </option>
            ))}
          </select>
        </div>

        {/* Objective Selection */}
        <div className="space-y-2">
          <Label htmlFor="objective">Message Objective</Label>
          <select
            id="objective"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select an objective</option>
            {objectiveOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Objective Input */}
        {objective === "Custom objective" && (
          <div className="space-y-2">
            <Label htmlFor="customObjective">Custom Objective</Label>
            <Input
              id="customObjective"
              value={customObjective}
              onChange={(e) => setCustomObjective(e.target.value)}
              placeholder="Describe your specific objective..."
              className="w-full"
            />
          </div>
        )}

        {/* Additional Context */}
        <div className="space-y-2">
          <Label htmlFor="additionalContext">
            Additional Context (Optional)
          </Label>
          <Textarea
            id="additionalContext"
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Any additional context that might help personalize the message..."
            className="min-h-[100px] resize-none"
          />
        </div>

        {/* Generate Button */}
        <PrimaryAction
          onClick={generateMessages}
          disabled={isGenerating || !getEffectiveObjective()}
          className="w-full"
          size="default"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Messages...
            </>
          ) : (
            "Generate Messages"
          )}
        </PrimaryAction>
      </div>

      {/* Success Message */}
      {generatedMessages && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-green-800 mb-2">
            Messages Generated Successfully!
          </h4>
          <p className="text-sm text-green-700">
            Your personalized messages have been generated. You can now select
            your preferred message below.
          </p>
        </div>
      )}

      {/* Close Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};
