import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { Briefcase, Building, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { ContactRecommendation } from "@/components/ContactRecommendation";

const CompaniesDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [hasCompanies, setHasCompanies] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkProfileCompletion = async () => {
      try {
        // Optimize by combining the queries into a single call
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .limit(1);

        const { data: targetData, error: targetError } = await supabase
          .from("target_criteria")
          .select("criteria_id")
          .eq("user_id", user.id)
          .limit(1);

        if (profileError || targetError) {
          throw new Error(profileError?.message || targetError?.message);
        }

        const hasBackground = profileData && profileData.length > 0;
        const hasTargets = targetData && targetData.length > 0;

        setProfileComplete(hasBackground && hasTargets);

        if (!(hasBackground && hasTargets)) {
          toast.info(
            "Complete your profile to get personalized company recommendations"
          );
        }

        // Check if user has any companies
        if (hasBackground && hasTargets) {
          const { data: companiesData, error: companiesError } = await supabase
            .from("companies")
            .select("company_id")
            .eq("user_id", user.id)
            .limit(1);

          if (!companiesError && companiesData && companiesData.length > 0) {
            setHasCompanies(true);
            fetchCompanies();
          }
        }
      } catch (error) {
        // Simplified error handling without excessive logging
        toast.error("Failed to check profile completion.");
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileCompletion();
  }, [user]);

  const fetchCompanies = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .order("match_quality_score", { ascending: false });

      if (error) throw error;

      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const handleGenerateCompanies = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      // Get the current session for authentication
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!sessionData.session) {
        throw new Error("No active session found");
      }

      // Include authentication in the function call
      const { data, error } = await supabase.functions.invoke(
        "generate_companies",
        {
          body: { user_id: user.id },
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        }
      );

      if (error) throw error;

      if (!data || !data.companies || !Array.isArray(data.companies)) {
        throw new Error("Invalid response from generate_companies function");
      }

      // Fix: Remove the onConflict parameter to avoid the constraint error
      const { error: insertError } = await supabase.from("companies").upsert(
        data.companies.map((company) => ({
          ...company,
          user_id: user.id,
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
        // Removed the onConflict parameter
      );

      if (insertError) throw insertError;

      // Refresh the companies list
      fetchCompanies();
      setHasCompanies(true);

      toast.success("Companies generated and saved successfully!");
    } catch (error) {
      console.error("Error generating companies:", error);
      toast.error(
        "Failed to generate companies: " + (error.message || "Unknown error")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profileComplete) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <ProfileBreadcrumbs />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              You need to complete your profile before we can recommend target
              companies - CompaniesDashboard.tsx
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-amber-800">
                To provide you with personalized company recommendations, we
                need more information about your background and job targets.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <Card className="bg-primary/5 p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <Briefcase className="mr-2 h-5 w-5" />
                    Professional Background
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-4">
                  <p className="text-sm">
                    Share your professional experience, skills, and achievements
                    so we can match you with relevant companies.
                  </p>
                </CardContent>
                <CardFooter className="p-0">
                  <Button onClick={() => navigate("/profile/enrich")}>
                    Complete Background
                  </Button>
                </CardFooter>
              </Card>

              <Card className="bg-primary/5 p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <Search className="mr-2 h-5 w-5" />
                    Job Targets
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-4">
                  <p className="text-sm">
                    Define your job preferences, target industries, and desired
                    company characteristics.
                  </p>
                </CardContent>
                <CardFooter className="p-0">
                  <Button onClick={() => navigate("/profile/job-targets")}>
                    Set Job Targets
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ProfileBreadcrumbs />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Target Companies</h1>
        <Button
          className="flex items-center"
          onClick={handleGenerateCompanies}
          disabled={isGenerating}
        >
          <Building className="mr-2 h-5 w-5" />
          {isGenerating ? "Generating..." : "Generate Companies"}
        </Button>
      </div>

      {!hasCompanies ? (
        <Card>
          <CardHeader>
            <CardTitle>Companies Dashboard</CardTitle>
            <CardDescription>
              Based on your profile and preferences, we'll help you identify
              ideal companies to target
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-center">
              <Building className="h-16 w-16 mx-auto text-blue-500 mb-4" />
              <h3 className="text-xl font-medium text-blue-800">
                Ready to Generate Company Recommendations
              </h3>
              <p className="text-blue-600 mt-2 mb-6">
                Click the button below to generate a list of target companies
                based on your background and preferences.
              </p>
              <Button
                size="lg"
                onClick={handleGenerateCompanies}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Target Companies"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Target Companies</CardTitle>
              <CardDescription>
                Here are the companies that match your profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companies.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No companies found. Try generating new recommendations.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {companies.map((company) => (
                    <Card
                      key={company.company_id}
                      className="p-4 hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-lg">
                            {company.name}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {company.industry || "Industry not specified"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Match: {company.match_quality_score || "N/A"}%
                          </span>
                        </div>
                      </div>
                      {company.ai_description && (
                        <p className="mt-2 text-sm">{company.ai_description}</p>
                      )}

                      {/* Add contact recommendation button */}
                      <div className="mt-4 flex justify-end">
                        <ContactRecommendation
                          companyId={company.company_id}
                          companyName={company.name}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CompaniesDashboard;
