
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building, Target, Plus, Sparkles, Users, MessageCircle, ArrowRight, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { AddCompanyModal } from "@/components/AddCompanyModal";
import { CompanySelectionModal } from "@/components/CompanySelectionModal";

interface JobTargetsStats {
  totalCompanies: number;
  totalContacts: number;
  messagesSent: number;
}

const JobTargets = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<JobTargetsStats>({
    totalCompanies: 0,
    totalContacts: 0,
    messagesSent: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [isCompanySelectionOpen, setIsCompanySelectionOpen] = useState(false);
  const [isGeneratingCompanies, setIsGeneratingCompanies] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch companies count
        const { count: companiesCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch contacts count
        const { count: contactsCount } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch messages count
        const { count: messagesCount } = await supabase
          .from('saved_message_versions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setStats({
          totalCompanies: companiesCount || 0,
          totalContacts: contactsCount || 0,
          messagesSent: messagesCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const handleAddCompany = () => {
    setIsAddCompanyModalOpen(true);
  };

  const handleCompanyAdded = async (companyName: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke('add_company_by_name', {
        body: { companyName }
      });
      if (error) throw error;
      
      // Refresh stats
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setStats(prev => ({ ...prev, totalCompanies: companiesCount || 0 }));
      setIsAddCompanyModalOpen(false);
      
      toast({
        title: "Success",
        description: "Company added successfully"
      });
    } catch (error: any) {
      console.error("Error adding company:", error);
      toast({
        title: "Error",
        description: "Failed to add company",
        variant: "destructive"
      });
    }
  };

  const handleGenerateCompanies = async () => {
    if (!user) return;
    setIsGeneratingCompanies(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate_companies');
      if (error) throw error;
      
      if (data?.status === 'success') {
        // Refresh stats
        const { count: companiesCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        setStats(prev => ({ ...prev, totalCompanies: companiesCount || 0 }));
        
        toast({
          title: "Success",
          description: `Generated ${data.companies?.length || 0} new companies successfully`
        });
      } else if (data?.status === 'warning') {
        toast({
          title: "Notice",
          description: data.message
        });
      }
    } catch (error: any) {
      console.error("Error generating companies:", error);
      toast({
        title: "Error",
        description: "Failed to generate companies",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCompanies(false);
    }
  };

  const handleFindContacts = () => {
    setIsCompanySelectionOpen(true);
  };

  const completionPercentage = Math.min(
    ((stats.totalCompanies > 0 ? 40 : 0) + 
     (stats.totalContacts > 0 ? 30 : 0) + 
     (stats.messagesSent > 0 ? 30 : 0)), 100
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/60 rounded-full animate-ping mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Loading your job targets</h3>
            <p className="text-sm text-gray-600">Preparing your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Job Target Companies
            </h1>
            <p className="text-lg text-gray-600">
              Discover and track companies where you want to work
            </p>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Add Company</h3>
                    <p className="text-sm opacity-90">Add specific target companies</p>
                  </div>
                  <Building className="h-8 w-8" />
                </div>
                <Button 
                  onClick={handleAddCompany}
                  variant="secondary" 
                  className="w-full mt-4 bg-white/90 text-purple-600 hover:bg-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Target
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">AI Generation</h3>
                    <p className="text-sm opacity-90">Let AI find perfect companies</p>
                  </div>
                  <Sparkles className="h-8 w-8" />
                </div>
                <Button 
                  onClick={handleGenerateCompanies}
                  disabled={isGeneratingCompanies}
                  variant="secondary" 
                  className="w-full mt-4 bg-white/90 text-green-600 hover:bg-white"
                >
                  {isGeneratingCompanies ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Find Contacts</h3>
                    <p className="text-sm opacity-90">Discover key people to reach</p>
                  </div>
                  <Users className="h-8 w-8" />
                </div>
                <Button 
                  onClick={handleFindContacts}
                  variant="secondary" 
                  className="w-full mt-4 bg-white/90 text-blue-600 hover:bg-white"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Discover
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Progress & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Your Job Search Progress
                </CardTitle>
                <CardDescription>
                  Track your journey to finding the perfect opportunity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-sm text-gray-600 font-medium">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-3" />
                  
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">{stats.totalCompanies}</div>
                      <div className="text-sm text-purple-700 font-medium">Target Companies</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{stats.totalContacts}</div>
                      <div className="text-sm text-green-700 font-medium">Key Contacts</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{stats.messagesSent}</div>
                      <div className="text-sm text-blue-700 font-medium">Messages Crafted</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => window.location.href = '/pipeline'}
                  variant="outline" 
                  className="w-full justify-start border-primary/20 text-primary hover:bg-primary/10"
                >
                  <Building className="mr-2 h-4 w-4" />
                  View All Companies
                </Button>
                <Button 
                  onClick={handleFindContacts}
                  variant="outline" 
                  className="w-full justify-start border-green-200 text-green-600 hover:bg-green-50"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Find More Contacts
                </Button>
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline" 
                  className="w-full justify-start border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Generate Messages
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Strategy Tips */}
          <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-primary to-primary/80 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 Job Search Strategy</h3>
                  <p className="text-gray-700 mb-4">
                    Start by adding 10-15 target companies where you'd love to work. Then let our AI generate 
                    additional similar companies based on your preferences. Once you have a solid list, 
                    use our contact finder to identify key people at these companies.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Target 15+ Companies</Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">AI-Powered Discovery</Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Strategic Networking</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddCompanyModal
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        onAddCompany={handleCompanyAdded}
        isLoading={false}
      />

      <CompanySelectionModal
        isOpen={isCompanySelectionOpen}
        onClose={() => setIsCompanySelectionOpen(false)}
      />
    </>
  );
};

export default JobTargets;
