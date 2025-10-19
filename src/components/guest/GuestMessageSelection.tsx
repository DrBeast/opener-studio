import React from "react";
import { Button } from "@/components/ui/design-system/buttons";
import { PrimaryAction } from "@/components/ui/design-system";
import { Copy, Check, MessageCircle } from "lucide-react";
import { toast } from "@/components/ui/airtable-ds/sonner";

interface GuestMessageSelectionProps {
  generatedMessages: {
    version1: string;
    version2: string;
    version3: string;
  };
  selectedMessage: string | null;
  selectedVersion: string | null;
  onMessageSelect: (message: string, version: string) => void;
  onSignup: () => void;
  className?: string;
}

export const GuestMessageSelection: React.FC<GuestMessageSelectionProps> = ({
  generatedMessages,
  selectedMessage,
  selectedVersion,
  onMessageSelect,
  onSignup,
  className = "",
}) => {
  const [copiedMessage, setCopiedMessage] = React.useState<string>("");

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

  const messageVersions = [
    {
      key: "version1",
      label: "Version 1",
      message: generatedMessages.version1,
    },
    {
      key: "version2",
      label: "Version 2",
      message: generatedMessages.version2,
    },
    {
      key: "version3",
      label: "Version 3",
      message: generatedMessages.version3,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Generated Messages</h3>
      </div>

      <div className="space-y-4">
        {messageVersions.map(({ key, label, message }) => (
          <div key={key} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{label}</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(message, key)}
                >
                  {copiedMessage === key ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant={selectedVersion === label ? "default" : "outline"}
                  size="sm"
                  onClick={() => onMessageSelect(message, label)}
                >
                  {selectedVersion === label ? "Selected" : "Select"}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {message}
            </p>
            <div className="text-xs text-gray-500">
              {`${message.length} characters`}
            </div>
          </div>
        ))}
      </div>

      {selectedMessage && (
        <div className="border-t pt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-green-800 mb-2">
              Selected Message
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {selectedMessage}
            </p>
          </div>

          <PrimaryAction onClick={onSignup} className="w-full" size="default">
            Sign Up for Free to Save Your Message And Craft More Openers!
          </PrimaryAction>
        </div>
      )}
    </div>
  );
};
