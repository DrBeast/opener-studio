
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

interface FeedbackBoxProps {
  viewName: string;
  className?: string;
}

export const FeedbackBox = ({ viewName, className = "" }: FeedbackBoxProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  
  const [feedback, setFeedback] = useState({
    valuable: '',
    irrelevant: '',
    emotions: '',
    emotionType: '',
    otherComments: ''
  });

  const handleSubmit = async () => {
    if (!user) return;

    // Check if at least one field has content
    const hasContent = Object.values(feedback).some(value => value.trim() !== '');
    if (!hasContent) {
      toast({
        title: "No feedback provided",
        description: "Please fill in at least one field before submitting.",
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
          valuable: feedback.valuable || null,
          irrelevant: feedback.irrelevant || null,
          emotions: feedback.emotions || null,
          emotion_type: feedback.emotionType || null,
          other_comments: feedback.otherComments || null
        });

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully."
      });

      // Reset form
      setFeedback({
        valuable: '',
        irrelevant: '',
        emotions: '',
        emotionType: '',
        otherComments: ''
      });
      setIsOpen(false);
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

  return (
    <Card className={`bg-amber-50 border-amber-200 ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-between p-3 h-auto text-amber-800 hover:bg-amber-100"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">Beta Feedback</span>
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 p-3 space-y-3">
            <p className="text-xs text-amber-700 mb-3">
              Help us improve! Share your thoughts on this {viewName.toLowerCase()} experience:
            </p>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor={`valuable-${viewName}`} className="text-xs text-amber-800">
                  What did you find valuable?
                </Label>
                <Textarea
                  id={`valuable-${viewName}`}
                  value={feedback.valuable}
                  onChange={(e) => setFeedback(prev => ({ ...prev, valuable: e.target.value }))}
                  placeholder="What worked well for you?"
                  className="min-h-[60px] text-xs"
                />
              </div>

              <div>
                <Label htmlFor={`irrelevant-${viewName}`} className="text-xs text-amber-800">
                  What felt irrelevant or unhelpful?
                </Label>
                <Textarea
                  id={`irrelevant-${viewName}`}
                  value={feedback.irrelevant}
                  onChange={(e) => setFeedback(prev => ({ ...prev, irrelevant: e.target.value }))}
                  placeholder="What didn't meet your needs?"
                  className="min-h-[60px] text-xs"
                />
              </div>

              <div>
                <Label htmlFor={`emotions-${viewName}`} className="text-xs text-amber-800">
                  What emotions did this invoke?
                </Label>
                <Textarea
                  id={`emotions-${viewName}`}
                  value={feedback.emotions}
                  onChange={(e) => setFeedback(prev => ({ ...prev, emotions: e.target.value }))}
                  placeholder="How did this make you feel?"
                  className="min-h-[60px] text-xs"
                />
              </div>

              <div>
                <Label htmlFor={`emotionType-${viewName}`} className="text-xs text-amber-800">
                  What kind of emotions? (positive, negative, neutral, mixed)
                </Label>
                <Textarea
                  id={`emotionType-${viewName}`}
                  value={feedback.emotionType}
                  onChange={(e) => setFeedback(prev => ({ ...prev, emotionType: e.target.value }))}
                  placeholder="e.g., excited, frustrated, confident, confused..."
                  className="min-h-[40px] text-xs"
                />
              </div>

              <div>
                <Label htmlFor={`otherComments-${viewName}`} className="text-xs text-amber-800">
                  Any other thoughts or comments?
                </Label>
                <Textarea
                  id={`otherComments-${viewName}`}
                  value={feedback.otherComments}
                  onChange={(e) => setFeedback(prev => ({ ...prev, otherComments: e.target.value }))}
                  placeholder="Anything else you'd like to share?"
                  className="min-h-[60px] text-xs"
                />
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="sm"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
