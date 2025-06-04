import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MessageCircle,
  Users,
  Building,
  Target,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContactSelectionModal } from "@/components/ContactSelectionModal";
import { CompanySelectionModal } from "@/components/CompanySelectionModal";
import { InfoBox } from "@/components/ui/design-system/infobox"; // Adjust path as needed

// Design System Imports
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  PageTitle,
  PageDescription,
} from "@/components/ui/design-system";

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
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [isContactSelectionOpen, setIsContactSelectionOpen] = useState(false);
  const [isCompanySelectionOpen, setIsCompanySelectionOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch contacts count
        const { count: contactsCount } = await supabase
          .from("contacts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Fetch companies count
        const { count: companiesCount } = await supabase
          .from("companies")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Fetch messages count
        const { count: messagesCount } = await supabase
          .from("saved_message_versions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Fetch recent interactions with correct column name
        const { data: recentInteractions } = await supabase
          .from("interactions")
          .select("interaction_type, description, interaction_date")
          .eq("user_id", user.id)
          .order("interaction_date", { ascending: false })
          .limit(5);

        setStats({
          totalContacts: contactsCount || 0,
          totalCompanies: companiesCount || 0,
          messagesSent: messagesCount || 0,
          recentActivity:
            recentInteractions?.map((item) => ({
              type: item.interaction_type,
              description: item.description || "No description",
              date: new Date(item.interaction_date).toLocaleDateString(),
            })) || [],
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleGenerateMessage = () => {
    setIsContactSelectionOpen(true);
  };

  const handleFindContacts = () => {
    setIsCompanySelectionOpen(true);
  };

  const handleGetStarted = () => {
    if (stats.totalCompanies === 0) {
      // Guide to add companies first
      window.location.href = "/job-targets";
    } else if (stats.totalContacts === 0) {
      // Guide to add contacts
      setIsCompanySelectionOpen(true);
    } else {
      // Guide to generate first message
      setIsContactSelectionOpen(true);
    }
  };

  const completionPercentage = Math.min(
    (stats.totalContacts > 0 ? 25 : 0) +
      (stats.totalCompanies > 0 ? 25 : 0) +
      (stats.messagesSent > 0 ? 50 : 0),
    100
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  /*
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto py-8 max-w-4xl"> 
      <ProfileBreadcrumbs />

      <div className="grid gap-8"> 
        <div className="space-y-8">
       
        </div>
      </div>
    </div>
  </div>
*/

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 max-w-4xl">
          <div className="grid gap-8">
            {/* Welcome Header */}
            <div className="mb-8">
              <PageTitle className="mb-2">
                Welcome back! Ready to expand your network?
              </PageTitle>
              <PageDescription>
                Discover companies, add people, craft messages, and build
                meaningful connections with AI-powered tools.
              </PageDescription>
            </div>
          </div>

          {/* Quick Tips */}
          <InfoBox
            title="💡 Pro Tip"
            description="Once you have your profile and job targets set up, add more companies to your list, then let AI find the
                    perfect contacts for you. Our message generator creates
                    personalized outreach that gets responses."
            // You can add an icon or badges here if you want:
            // icon={<Zap className="h-6 w-6 text-blue-600" />}
            // badges={["Quick Setup", "AI-Powered"]}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Quick Action Card - Target Companies */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-700 border-blue-200 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Building className="h-6 w-6" />
                      <CardTitle className="text-lg font-semibold text-primary-foreground">
                        Target Companies
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm text-primary-foreground">
                      Identify ideal employers
                    </CardDescription>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full mt-4 border-blue-600 text-blue-800"
                >
                  <Link to="/job-targets">
                    Find Companies
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Action Card - Find Contacts */}
            <Card className="bg-gradient-to-br from-green-500 to-green-700 border-green-200 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-6 w-6" />
                      <CardTitle className="text-lg font-semibold text-primary-foreground">
                        Find Contacts
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm text-primary-foreground">
                      Add relevant people
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={handleFindContacts}
                  variant="outline"
                  className="w-full mt-4 border-green-600 text-green-900"
                >
                  Discover People
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Action Card - Generate Messages */}
            <Card className="bg-gradient-to-br from-purple-500 to-violet-700 border-purple-200 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <MessageCircle className="h-6 w-6" />
                      <CardTitle className="text-lg font-semibold text-primary-foreground">
                        Generate Messages
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm text-primary-foreground">
                      Start conversations
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateMessage}
                  variant="outline"
                  className="w-full mt-4 border-primary"
                >
                  Start Writing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Progress & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* <Target className="h-5 w-5 text-purple-600" /> */}
                  Your Networking Progress
                </CardTitle>
                <CardDescription>
                  Track your journey to meaningful connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Overall Progress
                    </span>
                    <span className="text-sm">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700">
                        {stats.totalCompanies}
                      </div>
                      <div className="text-sm text-secondary-foreground">
                        Target Companies
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.totalContacts}
                      </div>
                      <div className="text-sm text-secondary-foreground">
                        Key Contacts
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats.messagesSent}
                      </div>
                      <div className="text-sm text-secondary-foreground">
                        Messages Crafted
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentActivity.slice(0, 4).map((activity, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-2">
                      No recent activity
                    </p>
                    <Button
                      onClick={handleGetStarted}
                      size="sm"
                      variant="outline"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ContactSelectionModal
        isOpen={isContactSelectionOpen}
        onClose={() => setIsContactSelectionOpen(false)}
      />

      <CompanySelectionModal
        isOpen={isCompanySelectionOpen}
        onClose={() => setIsCompanySelectionOpen(false)}
      />
    </>
  );
};

export default Dashboard;
