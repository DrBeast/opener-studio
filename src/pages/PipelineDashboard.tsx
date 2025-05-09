
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const PipelineDashboard = () => {
  const [freeFormDescription, setFreeFormDescription] = useState('');

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <div className="space-y-6">
        {/* Free-form description field at the top */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Describe Your Ideal Role and Company</CardTitle>
            <CardDescription>
              Tell us about your dream job and the kind of company you want to work for
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Textarea 
              placeholder="Describe your ideal role and company in your own words... For example: 'I'm looking for a senior product management role at a mission-driven fintech company with remote-friendly culture.'"
              className="min-h-[150px]"
              value={freeFormDescription}
              onChange={(e) => setFreeFormDescription(e.target.value)}
            />
          </CardContent>
        </Card>
        
        {/* Main pipeline content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Pipeline Overview</CardTitle>
            <CardDescription>
              Track your job search progress across companies
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-muted/30 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                This feature is currently in development. You'll soon be able to view your job search pipeline analytics here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PipelineDashboard;
