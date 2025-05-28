
import React from 'react';
import { TargetCriteriaForm } from "@/components/TargetCriteriaForm";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { FeedbackBox } from "@/components/FeedbackBox";

const JobTargets = () => {
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

        <FeedbackBox viewName="Job Targets Page" className="mb-6" />

        <TargetCriteriaForm />
      </div>
    </div>
  );
};

export default JobTargets;
