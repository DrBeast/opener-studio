
import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TargetCriteriaForm } from "@/components/TargetCriteriaForm";
import { TargetCriteriaDisplay } from "@/components/TargetCriteriaDisplay";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";

interface TargetCriteriaData {
  criteria_id?: string;
  free_form_role_and_company_description?: string;
  target_industries?: any;
  target_locations?: any;
  target_sizes?: any;
  target_public_private?: any;
  target_wfh_preference?: any;
  target_functions?: any;
  similar_companies?: any;
}

const JobTargets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch target criteria
  const { data: targetCriteria, isLoading } = useQuery({
    queryKey: ['target-criteria'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('target_criteria')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as TargetCriteriaData;
    },
    enabled: !!user
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSaved = () => {
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ['target-criteria'] });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ProfileBreadcrumbs />
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Job Search Targets</h1>
            <p className="text-muted-foreground">
              Define your target roles, companies, and preferences to get personalized recommendations.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Target Criteria</CardTitle>
              <CardDescription>
                Define your target role and company criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Search Targets</h1>
          <p className="text-muted-foreground">
            Define your target roles, companies, and preferences to get personalized recommendations.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Target Criteria</CardTitle>
            <CardDescription>
              Define your target role and company criteria
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!isEditing ? (
              <TargetCriteriaDisplay 
                targetCriteria={targetCriteria}
                onEdit={handleEdit}
              />
            ) : (
              <TargetCriteriaForm 
                onCancel={handleCancel}
                onSaved={handleSaved}
                initialData={targetCriteria}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobTargets;
