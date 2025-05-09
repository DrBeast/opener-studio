
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";

const TrackingDashboard = () => {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Interaction Tracking</CardTitle>
          <CardDescription>
            Track your interactions with companies and contacts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">
              This feature is currently in development. You'll soon be able to track all your interactions with companies and contacts here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackingDashboard;
