
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

interface FeedbackBoxProps {
  viewName: string;
  className?: string;
  variant?: 'header' | 'modal';
}

export const FeedbackBox = ({ viewName, className = "", variant = 'header' }: FeedbackBoxProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async () => {
    if (!user) return;

    if (!feedback.trim()) {
      toast({
        title: "No feedback provided",
        description: "Please provide some feedback before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          view_name: viewName,
          feedback_text: feedback
        });

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully."
      });

      setFeedback('');
      setIsExpanded(false);
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  if (variant === 'header') {
    return (
      <div className={`relative ${className}`}>
        {!isExpanded ? (
          <Button
            onClick={() => setIsExpanded(true)}
            variant="outline"
            size="sm"
            className="text-xs bg-green-100"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Feedback
          </Button>
        ) : (
          <div className="absolute top-0 right-0 z-50 bg-white border rounded-md p-3 shadow-lg w-80">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={`Share your thoughts on this ${viewName.toLowerCase()} - what's working well? What could be improved? What are you feeling?`}
              className="text-xs mb-3 min-h-[120px] resize-none"
              rows={5}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsExpanded(false);
                  setFeedback('');
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsExpanded(false);
                  setFeedback('');
                }}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="sm"
                className="text-xs"
              >
                {isSubmitting ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modal variant - top right corner
  return (
    <div className={`absolute top-4 right-4 z-10 ${className}`}>
      {!isExpanded ? (
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="text-xs bg-white/90 backdrop-blur-sm bg-green-100"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Feedback
        </Button>
      ) : (
        <div className="bg-white border rounded-md p-3 shadow-lg w-80">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={`Share your thoughts on this ${viewName.toLowerCase()} - what's working well? What could be improved? What are you feeling?`}
            className="text-xs mb-3 min-h-[120px] resize-none"
            rows={5}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsExpanded(false);
                setFeedback('');
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setIsExpanded(false);
                setFeedback('');
              }}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="sm"
              className="text-xs"
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
