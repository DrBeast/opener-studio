import { useState } from "react";
import { Button } from "@/components/ui/design-system/buttons";
import { DsTextarea } from "@/components/ui/design-system";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/airtable-ds/collapsible";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { OutlineAction } from "./ui/design-system";
import { feedbackFormSchema } from "@/lib/validation";

interface FeedbackBoxProps {
  viewName: string;
}

const FeedbackBox = ({ viewName }: FeedbackBoxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!feedback.trim() || !user) return;

    // Validate input using Zod schema
    const validationResult = feedbackFormSchema.safeParse({
      feedback: feedback.trim(),
    });

    if (!validationResult.success) {
      const errors = validationResult.error.format();
      toast.error(errors.feedback?._errors[0] || "Invalid feedback");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("user_feedback").insert({
        user_id: user.id,
        session_id: uuidv4(), // Generate a session ID for this feedback
        view_name: viewName,
        feedback_text: feedback.trim(),
      });

      if (error) throw error;

      toast.success("Thank you for your feedback!");
      setFeedback("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // FIX: Added 'relative' class to the Collapsible component
    // This makes the Collapsible the positioning context for its absolutely positioned content.
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative">
      <CollapsibleTrigger asChild>
        <OutlineAction
          size="sm"
          className=" bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Beta Feedback
        </OutlineAction>
      </CollapsibleTrigger>
      {/* Adjusted top positioning slightly to account for button height */}
      <CollapsibleContent className="absolute top-10 right-0 z-50 w-80 bg-white border border-green-200 rounded-lg shadow-lg p-4">
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">
              Help us improve! Share your thoughts:
            </p>
            <ul className="text-xs space-y-1 text-gray-500">
              <li>• What did you find valuable?</li>
              <li>• What felt irrelevant?</li>
              <li>• What invoked emotions? What kind?</li>
              <li>• Any other thoughts and comments?</li>
            </ul>
          </div>
          <DsTextarea
            tone="white"
            placeholder="Your feedback helps us build a better product..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[120px] text-sm"
          />
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-gray-500"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!feedback.trim() || isSubmitting}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 mr-1" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FeedbackBox;
