
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface TargetCriteriaDisplayProps {
  targetCriteria: any;
  onEdit: () => void;
}

export function TargetCriteriaDisplay({ targetCriteria, onEdit }: TargetCriteriaDisplayProps) {
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
}
