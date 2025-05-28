
import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TargetCriteriaForm } from "@/components/TargetCriteriaForm";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";

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

  const TargetCriteriaDisplay = ({ targetCriteria, onEdit }: any) => {
    if (!targetCriteria) {
      return (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <p className="text-muted-foreground">
            No target criteria defined yet. Define your job search criteria to get started.
          </p>
          <Button onClick={onEdit}>
            Define Target Criteria
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Role & Company Description</h3>
            <p className="text-muted-foreground">
              {targetCriteria.free_form_role_and_company_description || 'No description provided'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {targetCriteria.target_industries && Object.keys(targetCriteria.target_industries).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Industries</h4>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(targetCriteria.target_industries).map((industry) => (
                    <Badge key={industry} variant="secondary">
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {targetCriteria.target_locations && Object.keys(targetCriteria.target_locations).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Locations</h4>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(targetCriteria.target_locations).map((location) => (
                    <Badge key={location} variant="secondary">
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {targetCriteria.target_functions && Object.keys(targetCriteria.target_functions).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Functions</h4>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(targetCriteria.target_functions).map((func) => (
                    <Badge key={func} variant="secondary">
                      {func}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {targetCriteria.target_sizes && Object.keys(targetCriteria.target_sizes).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Company Sizes</h4>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(targetCriteria.target_sizes).map((size) => (
                    <Badge key={size} variant="secondary">
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {targetCriteria.target_public_private && Object.keys(targetCriteria.target_public_private).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Public/Private</h4>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(targetCriteria.target_public_private).map((type) => (
                    <Badge key={type} variant="secondary">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {targetCriteria.target_wfh_preference && Object.keys(targetCriteria.target_wfh_preference).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Work Policy</h4>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(targetCriteria.target_wfh_preference).map((policy) => (
                    <Badge key={policy} variant="secondary">
                      {policy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {targetCriteria.similar_companies && Object.keys(targetCriteria.similar_companies).length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Similar Companies</h4>
              <div className="flex flex-wrap gap-1">
                {Object.keys(targetCriteria.similar_companies).map((company) => (
                  <Badge key={company} variant="outline">
                    {company}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Criteria
            </Button>
          </div>
        </div>
      </div>
    );
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
