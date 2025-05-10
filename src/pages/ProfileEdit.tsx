
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";

interface ProfileFormValues {
  first_name: string;
  last_name: string;
  job_role: string;
  current_company: string;
  location: string;
}

const ProfileEdit = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormValues>();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        navigate("/auth/login");
        return;
      }

      try {
        // Updated to fetch from user_profiles instead of profiles
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setValue("first_name", data.first_name || "");
          setValue("last_name", data.last_name || "");
          setValue("job_role", data.job_role || "");
          setValue("current_company", data.current_company || "");
          setValue("location", data.location || "");
        }
      } catch (error: any) {
        console.error("Error fetching user profile:", error.message);
        toast.error("Failed to load profile information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, navigate, setValue]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // Updated to save to user_profiles instead of profiles
      const { error } = await supabase
        .from("user_profiles")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          job_role: data.job_role,
          current_company: data.current_company,
          location: data.location,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      toast.success("Profile updated successfully");
      navigate("/profile");
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Edit Profile</CardTitle>
          <CardDescription>
            Update your profile information to help us personalize your experience
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  placeholder="Enter your first name"
                  {...register("first_name")}
                  className={errors.first_name ? "border-destructive" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  placeholder="Enter your last name"
                  {...register("last_name")}
                  className={errors.last_name ? "border-destructive" : ""}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="job_role">Current Role</Label>
              <Input
                id="job_role"
                placeholder="e.g., Product Manager, Software Engineer"
                {...register("job_role")}
                className={errors.job_role ? "border-destructive" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current_company">Current Company</Label>
              <Input
                id="current_company"
                placeholder="e.g., Google, Microsoft, Freelance"
                {...register("current_company")}
                className={errors.current_company ? "border-destructive" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA"
                {...register("location")}
                className={errors.location ? "border-destructive" : ""}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/profile")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ProfileEdit;
