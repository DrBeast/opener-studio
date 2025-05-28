
import React from 'react';
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { EditableSummary } from "@/components/profile/EditableSummary";
import { ProfessionalBackground } from "@/components/ProfessionalBackground";
import { CVUpload } from "@/components/CVUpload";
import { DevOptions } from "@/components/profile/DevOptions";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { FeedbackBox } from "@/components/FeedbackBox";

const Profile = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-muted-foreground">
            Build your professional profile to get better company and contact recommendations.
          </p>
        </div>

        <FeedbackBox viewName="Profile Page" className="mb-6" />

        <ProfileSummary />
        <EditableSummary />
        <ProfessionalBackground />
        <CVUpload />
        <DevOptions />
      </div>
    </div>
  );
};

export default Profile;
