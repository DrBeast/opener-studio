
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { v4 as uuidv4 } from "uuid";

interface TargetCriteriaProps {
  onCancel: () => void;
  onSaved: () => void;
  initialData?: any;
}

interface FormData {
  free_form_role_and_company_description: string;
  similar_companies: string;
  target_industries: string;
  target_locations: string;
  target_sizes: string;
  target_public_private: string;
  target_functions: string;
  target_wfh_preference: string;
}

export function TargetCriteriaForm({ onCancel, onSaved, initialData }: TargetCriteriaProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize form with either initial data or empty values
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      free_form_role_and_company_description: "",
      similar_companies: "",
      target_industries: "",
      target_locations: "",
      target_sizes: "",
      target_public_private: "",
      target_functions: "",
      target_wfh_preference: "",
    }
  });

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      setValue('free_form_role_and_company_description', initialData.free_form_role_and_company_description || "");
      
      // Convert JSON fields to comma-separated strings for editing
      if (initialData.similar_companies) {
        setValue('similar_companies', Object.keys(initialData.similar_companies).join(", "));
      }
      if (initialData.target_industries) {
        setValue('target_industries', Object.keys(initialData.target_industries).join(", "));
      }
      if (initialData.target_locations) {
        setValue('target_locations', Object.keys(initialData.target_locations).join(", "));
      }
      if (initialData.target_sizes) {
        setValue('target_sizes', Object.keys(initialData.target_sizes).join(", "));
      }
      if (initialData.target_public_private) {
        setValue('target_public_private', Object.keys(initialData.target_public_private).join(", "));
      }
      if (initialData.target_functions) {
        setValue('target_functions', Object.keys(initialData.target_functions).join(", "));
      }
      if (initialData.target_wfh_preference) {
        setValue('target_wfh_preference', Object.keys(initialData.target_wfh_preference).join(", "));
      }
    }
  }, [initialData, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!user?.id) {
      toast.error("You must be logged in to save criteria");
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert comma-separated strings to JSON objects for storage
      const formatStringToObject = (str: string) => {
        if (!str) return {};
        return str.split(',')
          .map(item => item.trim())
          .filter(Boolean)
          .reduce((obj, item) => ({ ...obj, [item]: true }), {});
      };
      
      const criteriaData = {
        user_id: user.id,
        free_form_role_and_company_description: data.free_form_role_and_company_description,
        similar_companies: formatStringToObject(data.similar_companies),
        target_industries: formatStringToObject(data.target_industries),
        target_locations: formatStringToObject(data.target_locations),
        target_sizes: formatStringToObject(data.target_sizes),
        target_public_private: formatStringToObject(data.target_public_private),
        target_functions: formatStringToObject(data.target_functions),
        target_wfh_preference: formatStringToObject(data.target_wfh_preference),
        updated_at: new Date().toISOString(),
      };

      // Check if we already have criteria for this user
      const { data: existingData, error: queryError } = await supabase
        .from('target_criteria')
        .select('criteria_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (queryError) {
        console.error("Error checking for existing criteria:", queryError);
        throw queryError;
      }
      
      let result;
      if (existingData?.criteria_id) {
        // Update existing record
        result = await supabase
          .from('target_criteria')
          .update(criteriaData)
          .eq('criteria_id', existingData.criteria_id);
      } else {
        // Insert new record with generated criteria_id and created_at
        const newCriteriaData = {
          ...criteriaData,
          criteria_id: uuidv4(),
          created_at: new Date().toISOString()
        };
        
        result = await supabase
          .from('target_criteria')
          .insert([newCriteriaData]);
      }
      
      if (result.error) throw result.error;
      
      toast.success("Target criteria saved successfully");
      onSaved();
    } catch (error) {
      console.error("Error saving target criteria:", error);
      toast.error("Failed to save target criteria");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Role & Company Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your target role and ideal company (e.g., 'Product Manager at a Series B fintech startup with remote work options')"
            rows={4}
            {...register("free_form_role_and_company_description", { required: "This field is required" })}
            className={errors.free_form_role_and_company_description ? "border-red-500" : ""}
          />
          {errors.free_form_role_and_company_description && (
            <p className="text-red-500 text-sm">{errors.free_form_role_and_company_description.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Be specific about role type, company stage, and any other important details.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="industries">Target Industries</Label>
            <Input
              id="industries"
              placeholder="Software, Fintech, Healthcare, etc."
              {...register("target_industries")}
            />
            <p className="text-sm text-muted-foreground">Comma-separated list</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="locations">Target Locations</Label>
            <Input
              id="locations"
              placeholder="New York, San Francisco, Remote, etc."
              {...register("target_locations")}
            />
            <p className="text-sm text-muted-foreground">Comma-separated list</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="functions">Target Functions/Departments</Label>
            <Input
              id="functions"
              placeholder="Product, Engineering, Marketing, etc."
              {...register("target_functions")}
            />
            <p className="text-sm text-muted-foreground">Comma-separated list</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sizes">Target Company Sizes</Label>
            <Input
              id="sizes"
              placeholder="Startup, Mid-size, Enterprise, etc."
              {...register("target_sizes")}
            />
            <p className="text-sm text-muted-foreground">Comma-separated list</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="publicPrivate">Public/Private Preference</Label>
            <Input
              id="publicPrivate"
              placeholder="Public, Private, Pre-IPO, etc."
              {...register("target_public_private")}
            />
            <p className="text-sm text-muted-foreground">Comma-separated list</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="wfh">Work From Home Policy</Label>
            <Input
              id="wfh"
              placeholder="Remote, Hybrid, Office-based, etc."
              {...register("target_wfh_preference")}
            />
            <p className="text-sm text-muted-foreground">Comma-separated list</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="similar">Similar Companies</Label>
          <Input
            id="similar"
            placeholder="Stripe, Airbnb, Plaid, etc."
            {...register("similar_companies")}
          />
          <p className="text-sm text-muted-foreground">
            Companies similar to where you'd like to work (comma-separated list)
          </p>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading || isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || isSubmitting}
        >
          {isLoading || isSubmitting ? "Saving..." : "Save Criteria"}
        </Button>
      </div>
    </form>
  );
}
