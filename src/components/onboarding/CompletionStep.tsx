
import { CheckCircle, Edit, Building, Users, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const CompletionStep = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Congratulations!</h3>
        <p className="text-muted-foreground">
          You're all set up and ready to start networking effectively.
        </p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <p className="text-green-800 text-center font-medium">
          🎉 Your networking toolkit is ready! You've generated your first companies, contacts, and messages.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-center">What you can do next:</h4>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Edit className="h-5 w-5 text-blue-600" />
              <div>
                <h5 className="font-medium">Adjust Your Profile</h5>
                <p className="text-sm text-muted-foreground">
                  Edit your professional summary and regenerate it based on new information
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-green-600" />
              <div>
                <h5 className="font-medium">Modify Job Criteria</h5>
                <p className="text-sm text-muted-foreground">
                  Update your target role, industry, or location to generate new companies and contacts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <h5 className="font-medium">Add Companies & Contacts Manually</h5>
                <p className="text-sm text-muted-foreground">
                  Add specific companies you're interested in and find contacts within them
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <div>
                <h5 className="font-medium">Track Your Outreach</h5>
                <p className="text-sm text-muted-foreground">
                  Use the pipeline dashboard to monitor your networking progress and follow-ups
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
