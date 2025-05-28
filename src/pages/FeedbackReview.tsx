
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

interface FeedbackEntry {
  feedback_id: string;
  user_email: string;
  session_id: string;
  view_name: string;
  feedback_text: string | null;
  created_at: string;
}

const FeedbackReview = () => {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEntries: 0,
    uniqueUsers: 0,
    viewBreakdown: {} as Record<string, number>
  });

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      // Get feedback entries
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('user_feedback')
        .select(`
          feedback_id,
          session_id,
          view_name,
          feedback_text,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      // Get current user's session to check if we can access user data
      const { data: { session } } = await supabase.auth.getSession();
      
      // For each unique user_id, try to get the email from the session or profile
      const uniqueUserIds = [...new Set(feedbackData?.map(f => f.user_id).filter(Boolean))];
      const userEmailMap: Record<string, string> = {};
      
      // If we have a session and it's the same user, we can get their email
      if (session?.user) {
        userEmailMap[session.user.id] = session.user.email || 'Unknown';
      }
      
      // For other users, we'll show the user_id truncated as we can't access their emails
      // due to privacy/security restrictions
      uniqueUserIds.forEach(userId => {
        if (!userEmailMap[userId]) {
          userEmailMap[userId] = `User-${userId.slice(0, 8)}...`;
        }
      });

      const feedbackWithEmails = feedbackData?.map(entry => ({
        ...entry,
        user_email: userEmailMap[entry.user_id] || 'Unknown User'
      })) || [];

      setFeedback(feedbackWithEmails);

      // Calculate stats
      const uniqueUsers = new Set(feedbackWithEmails.map(f => f.user_email)).size;
      const viewBreakdown = feedbackWithEmails.reduce((acc, entry) => {
        acc[entry.view_name] = (acc[entry.view_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setStats({
        totalEntries: feedbackWithEmails.length,
        uniqueUsers,
        viewBreakdown
      });

    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const truncateText = (text: string | null, maxLength: number = 200) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Beta Feedback Review</h1>
        <p className="text-muted-foreground">Review feedback collected from beta users</p>
        <p className="text-sm text-muted-foreground mt-1">
          Note: User emails are only shown for your own feedback due to privacy restrictions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {Object.entries(stats.viewBreakdown)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([view, count]) => (
                  <div key={view} className="flex justify-between">
                    <span>{view}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Feedback Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                    <TableCell className="text-xs">
                      {format(new Date(entry.created_at), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {entry.user_email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {entry.view_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[400px]" title={entry.feedback_text || ''}>
                      {truncateText(entry.feedback_text)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {feedback.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No feedback entries found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackReview;
