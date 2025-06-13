
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
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { MessageSquare, Users, Calendar } from "lucide-react";

// Design System Imports
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageTitle,
  PageDescription
} from "@/components/ui/design-system";

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
        console.log('Fetching feedback data with user emails from user_profiles...');
        
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

        if (feedbackError) throw feedbackError;

        console.log('Feedback data received:', feedbackData);

        const userIds = feedbackData?.map(item => item.user_id).filter(Boolean) || [];
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, email')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        console.log('Profiles data received:', profilesData);

        const emailMap = new Map();
        profilesData?.forEach(profile => {
          if (profile.user_id && profile.email) {
            emailMap.set(profile.user_id, profile.email);
          }
        });

        const feedbackWithEmails: FeedbackEntry[] = (feedbackData || []).map(item => ({
          feedback_id: item.feedback_id,
          email: emailMap.get(item.user_id) || 'No email available',
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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-300 rounded-full animate-ping mx-auto"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Loading feedback data</h3>
                <p className="text-sm text-gray-600">Please wait while we gather user insights...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="p-3 bg-red-100 rounded-full w-fit mx-auto">
                  <MessageSquare className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <PageTitle className="mb-2">
            Beta User Feedback Review
          </PageTitle>
          <PageDescription className="text-lg">
            Insights and suggestions from our beta testing community
          </PageDescription>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-purple-600 border-purple-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-white">Total Feedback</h3>
                  <p className="text-2xl font-bold text-white">{feedback.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-white opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-600 border-green-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-white">Unique Users</h3>
                  <p className="text-2xl font-bold text-white">{new Set(feedback.map(f => f.email)).size}</p>
                </div>
                <Users className="h-8 w-8 text-white opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-600 border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-white">Latest Entry</h3>
                  <p className="text-sm font-medium text-white">
                    {feedback.length > 0 ? format(new Date(feedback[0].created_at), 'MMM dd') : 'N/A'}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-white opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Feedback Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {feedback.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No feedback entries found</p>
                <p className="text-sm text-gray-400 mt-1">Check back later for user insights</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700">Date & Time</TableHead>
                    <TableHead className="font-semibold text-gray-700">User Email</TableHead>
                    <TableHead className="font-semibold text-gray-700">View</TableHead>
                    <TableHead className="font-semibold text-gray-700">Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((entry) => (
                    <TableRow key={entry.feedback_id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="text-sm">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {format(new Date(entry.created_at), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {format(new Date(entry.created_at), 'HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium text-gray-900">
                          {entry.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <StatusBadge variant="info">
                          {entry.view_name}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-sm max-w-md">
                        <div className="whitespace-pre-wrap break-words leading-relaxed text-gray-700">
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
    </div>
  );
};

export default FeedbackReview;
