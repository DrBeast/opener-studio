
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

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

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          session_id: uuidv4(), // Generate a session ID for this feedback
          view_name: viewName,
          feedback_text: feedback.trim()
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

  if (!user) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Beta Feedback
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="absolute top-12 right-0 z-50 w-80 bg-white border border-green-200 rounded-lg shadow-lg p-4">
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">Help us improve! Share your thoughts:</p>
            <ul className="text-xs space-y-1 text-gray-500">
              <li>• What did you find valuable?</li>
              <li>• What felt irrelevant?</li>
              <li>• What invoked emotions? What kind?</li>
              <li>• Any other thoughts and comments?</li>
            </ul>
          </div>
          <Textarea
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
