
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface FeedbackEntry {
  feedback_id: string;
  email: string;
  view_name: string;
  feedback_text: string;
  created_at: string;
}

const FeedbackReview = () => {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        console.log('Fetching feedback data with user emails...');
        
        // Get feedback data
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('user_feedback')
          .select(`
            feedback_id,
            view_name,
            feedback_text,
            created_at,
            user_id
          `)
          .order('created_at', { ascending: false });

        console.log('Feedback data received:', feedbackData);
        console.log('Feedback error:', feedbackError);

        if (feedbackError) throw feedbackError;

        // Get unique user IDs
        const userIds = [...new Set(feedbackData?.map(item => item.user_id).filter(Boolean) || [])];
        
        // Fetch user emails using edge function
        const { data: emailData, error: emailError } = await supabase.functions.invoke('get_user_emails', {
          body: { userIds }
        });

        if (emailError) {
          console.error('Error fetching emails:', emailError);
          throw emailError;
        }

        const userEmails = emailData?.userEmails || {};

        // Map feedback data with emails
        const feedbackWithEmails: FeedbackEntry[] = (feedbackData || []).map(item => ({
          feedback_id: item.feedback_id,
          email: userEmails[item.user_id] || 'Anonymous',
          view_name: item.view_name,
          feedback_text: item.feedback_text,
          created_at: item.created_at
        }));

        setFeedback(feedbackWithEmails);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to load feedback data');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading feedback...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Beta User Feedback Review</CardTitle>
          <p className="text-sm text-gray-600">
            Total feedback entries: {feedback.length}
          </p>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No feedback entries found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>View</TableHead>
                  <TableHead>Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((entry) => (
                  <TableRow key={entry.feedback_id}>
                    <TableCell className="text-sm">
                      {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.email}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {entry.view_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm max-w-md">
                      <div className="whitespace-pre-wrap break-words">
                        {entry.feedback_text}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackReview;
