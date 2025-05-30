
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Users, Building, Target, Plus, ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalContacts: number;
  totalCompanies: number;
  messagesSent: number;
  recentActivity: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    totalCompanies: 0,
    messagesSent: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch contacts count
        const { count: contactsCount } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch companies count
        const { count: companiesCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch messages count
        const { count: messagesCount } = await supabase
          .from('saved_message_versions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch recent interactions
        const { data: recentInteractions } = await supabase
          .from('interactions')
          .select('interaction_type, description, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalContacts: contactsCount || 0,
          totalCompanies: companiesCount || 0,
          messagesSent: messagesCount || 0,
          recentActivity: recentInteractions?.map(item => ({
            type: item.interaction_type,
            description: item.description,
            date: new Date(item.created_at).toLocaleDateString()
          })) || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const completionPercentage = Math.min(
    ((stats.totalContacts > 0 ? 25 : 0) + 
     (stats.totalCompanies > 0 ? 25 : 0) + 
     (stats.messagesSent > 0 ? 50 : 0)), 100
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back! Ready to expand your network?
          </h1>
          <p className="text-lg text-gray-600">
            Your AI-powered networking assistant is here to help you connect with the right people.
          </p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Generate Message</h3>
                  <p className="text-sm opacity-90">AI-crafted outreach messages</p>
                </div>
                <MessageCircle className="h-8 w-8" />
              </div>
              <Button asChild variant="secondary" className="w-full mt-4">
                <Link to="/pipeline">
                  Start Writing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Find Contacts</h3>
                  <p className="text-sm opacity-90">AI-recommended people to reach</p>
                </div>
                <Users className="h-8 w-8" />
              </div>
              <Button asChild variant="secondary" className="w-full mt-4">
                <Link to="/pipeline">
                  Discover People
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Target Companies</h3>
                  <p className="text-sm opacity-90">Find your ideal employers</p>
                </div>
                <Building className="h-8 w-8" />
              </div>
              <Button asChild variant="secondary" className="w-full mt-4">
                <Link to="/job-targets">
                  Explore Companies
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Progress & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Your Networking Progress
              </CardTitle>
              <CardDescription>
                Track your journey to building meaningful professional connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalCompanies}</div>
                    <div className="text-sm text-muted-foreground">Target Companies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.totalContacts}</div>
                    <div className="text-sm text-muted-foreground">Key Contacts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.messagesSent}</div>
                    <div className="text-sm text-muted-foreground">Messages Crafted</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 4).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No recent activity</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/pipeline">Get Started</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Tips */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Pro Tip</h3>
                <p className="text-blue-800 mb-3">
                  Start by adding your target companies, then let AI find the perfect contacts for you. 
                  Our message generator creates personalized outreach that gets responses.
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Quick Setup</Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">AI-Powered</Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">High Success Rate</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
