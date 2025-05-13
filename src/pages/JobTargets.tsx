
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { X } from "lucide-react";

const formSchema = z.object({
  target_functions: z.array(z.string()).optional(),
  target_locations: z.array(z.string()).optional(),
  target_wfh_preference: z.array(z.string()).optional(),
  free_form_role_and_company_description: z.string().optional(),
  target_industries: z.array(z.string()).optional(),
  target_sizes: z.array(z.string()).optional(),
  target_public_private: z.array(z.string()).optional(),
  similar_companies: z.array(z.string()).optional(),
  visa_sponsorship_required: z.boolean().default(false)
});

type FormValues = z.infer<typeof formSchema>;

// Sample options for each select field
const functionOptions = [{
  value: "engineering",
  label: "Engineering"
}, {
  value: "product_management",
  label: "Product Management"
}, {
  value: "design",
  label: "Design"
}, {
  value: "sales",
  label: "Sales"
}, {
  value: "marketing",
  label: "Marketing"
}, {
  value: "finance",
  label: "Finance"
}, {
  value: "hr",
  label: "Human Resources"
}, {
  value: "operations",
  label: "Operations"
}, {
  value: "customer_support",
  label: "Customer Support"
}, {
  value: "data_science",
  label: "Data Science"
}];

const locationOptions = [{
  value: "san_francisco",
  label: "San Francisco"
}, {
  value: "new_york",
  label: "New York"
}, {
  value: "boston",
  label: "Boston"
}, {
  value: "seattle",
  label: "Seattle"
}, {
  value: "los_angeles",
  label: "Los Angeles"
}, {
  value: "chicago",
  label: "Chicago"
}, {
  value: "austin",
  label: "Austin"
}, {
  value: "remote_us",
  label: "Remote (US)"
}, {
  value: "remote_global",
  label: "Remote (Global)"
}];

const wfhOptions = [{
  value: "remote",
  label: "Remote"
}, {
  value: "hybrid",
  label: "Hybrid"
}, {
  value: "onsite",
  label: "On-site"
}];

const industryOptions = [{
  value: "tech",
  label: "Tech"
}, {
  value: "healthcare",
  label: "Healthcare"
}, {
  value: "finance",
  label: "Finance"
}, {
  value: "education",
  label: "Education"
}, {
  value: "retail",
  label: "Retail"
}, {
  value: "manufacturing",
  label: "Manufacturing"
}, {
  value: "media",
  label: "Media & Entertainment"
}, {
  value: "government",
  label: "Government"
}, {
  value: "non_profit",
  label: "Non-profit"
}];

const sizeOptions = [{
  value: "startup",
  label: "Startup (<50)"
}, {
  value: "small",
  label: "Small (50-200)"
}, {
  value: "mid",
  label: "Mid-sized (201-1000)"
}, {
  value: "large",
  label: "Large (1000+)"
}];

const publicPrivateOptions = [{
  value: "public",
  label: "Public"
}, {
  value: "private",
  label: "Private"
}];

// Helper function to safely cast JSON data to string arrays
const ensureStringArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return [];
};

const JobTargets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newFunction, setNewFunction] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target_functions: [],
      target_locations: [],
      target_wfh_preference: [],
      free_form_role_and_company_description: "",
      target_industries: [],
      target_sizes: [],
      target_public_private: [],
      similar_companies: [],
      visa_sponsorship_required: false
    }
  });
  
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("target_criteria")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        if (data) {
          setExistingData(data);
          setIsEditing(true);
          form.reset({
            target_functions: ensureStringArray(data.target_functions),
            target_locations: ensureStringArray(data.target_locations),
            target_wfh_preference: ensureStringArray(data.target_wfh_preference),
            free_form_role_and_company_description: data.free_form_role_and_company_description || "",
            target_industries: ensureStringArray(data.target_industries),
            target_sizes: ensureStringArray(data.target_sizes),
            target_public_private: ensureStringArray(data.target_public_private),
            similar_companies: ensureStringArray(data.similar_companies),
            visa_sponsorship_required: data.visa_sponsorship_required || false
          });
        }
      } catch (error: any) {
        console.error("Error fetching target criteria:", error.message);
        toast.error("Failed to load your job target preferences");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingData();
  }, [user, form]);
  
  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const submissionData = {
        user_id: user.id,
        ...values
      };
      
      const { error } = existingData 
        ? await supabase
            .from("target_criteria")
            .update(submissionData)
            .eq("criteria_id", existingData.criteria_id)
        : await supabase
            .from("target_criteria")
            .insert([submissionData]);
            
      if (error) throw error;
      
      toast.success(isEditing 
        ? "Job and company targets updated successfully!" 
        : "Job and company targets saved successfully!");

      // Navigate to companies after saving job targets
      navigate("/companies");
    } catch (error: any) {
      console.error("Error saving target criteria:", error.message);
      toast.error("Failed to save your preferences. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addCustomFunction = () => {
    if (!newFunction.trim()) return;
    
    const currentFunctions = form.getValues("target_functions") || [];
    if (!currentFunctions.includes(newFunction.trim())) {
      form.setValue("target_functions", [...currentFunctions, newFunction.trim()]);
      setNewFunction("");
    }
  };
  
  const removeFunction = (func: string) => {
    const currentFunctions = form.getValues("target_functions") || [];
    form.setValue("target_functions", currentFunctions.filter(f => f !== func));
  };
  
  const addCustomIndustry = () => {
    if (!newIndustry.trim()) return;
    
    const currentIndustries = form.getValues("target_industries") || [];
    if (!currentIndustries.includes(newIndustry.trim())) {
      form.setValue("target_industries", [...currentIndustries, newIndustry.trim()]);
      setNewIndustry("");
    }
  };
  
  const removeIndustry = (industry: string) => {
    const currentIndustries = form.getValues("target_industries") || [];
    form.setValue("target_industries", currentIndustries.filter(i => i !== industry));
  };
  
  // Chip component for selections
  const SelectionChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm mr-2 mb-2">
      <span>{label}</span>
      <button 
        type="button"
        onClick={onRemove} 
        className="ml-2 rounded-full hover:bg-primary/20 p-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
  
  const renderMultiSelectChips = (
    name: keyof FormValues, 
    options: { value: string; label: string; }[],
    label: string,
    description?: string
  ) => {
    const values = form.watch(name) as string[] || [];
    
    return (
      <FormField
        control={form.control}
        name={name as any}
        render={() => (
          <FormItem className="space-y-2">
            <FormLabel>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {options.map(option => (
                <FormField
                  key={option.value}
                  control={form.control}
                  name={name as any}
                  render={() => {
                    return (
                      <FormItem key={option.value} className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={values.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const updatedValues = checked
                                ? [...values, option.value]
                                : values.filter(val => val !== option.value);
                              form.setValue(name as any, updatedValues);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{option.label}</FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
            
            <div className="flex flex-wrap mt-2">
              {values.map(value => {
                const option = options.find(o => o.value === value);
                return option ? (
                  <SelectionChip 
                    key={value} 
                    label={option.label} 
                    onRemove={() => {
                      form.setValue(
                        name as any, 
                        values.filter(v => v !== value)
                      );
                    }} 
                  />
                ) : (
                  // This will display custom values that aren't in the predefined options
                  <SelectionChip 
                    key={value} 
                    label={value} 
                    onRemove={() => {
                      form.setValue(
                        name as any, 
                        values.filter(v => v !== value)
                      );
                    }} 
                  />
                );
              })}
            </div>
          </FormItem>
        )}
      />
    );
  };
  
  const renderFunctionsWithCustom = () => (
    <div className="space-y-4">
      {renderMultiSelectChips(
        "target_functions",
        functionOptions,
        "Target Job Functions",
        "What job functions are you interested in?"
      )}
      
      <div className="border-t pt-3">
        <FormLabel>Add Custom Job Functions</FormLabel>
        <FormDescription>Add job functions that aren't in the list above</FormDescription>
        
        <div className="flex mt-2">
          <Input 
            value={newFunction} 
            onChange={(e) => setNewFunction(e.target.value)} 
            placeholder="E.g. Business Development"
            className="mr-2"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={addCustomFunction}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
  
  const renderIndustriesWithCustom = () => (
    <div className="space-y-4">
      {renderMultiSelectChips(
        "target_industries",
        industryOptions,
        "Target Industries",
        "What industries are you interested in?"
      )}
      
      <div className="border-t pt-3">
        <FormLabel>Add Custom Industries</FormLabel>
        <FormDescription>Add industries that aren't in the list above</FormDescription>
        
        <div className="flex mt-2">
          <Input 
            value={newIndustry} 
            onChange={(e) => setNewIndustry(e.target.value)} 
            placeholder="E.g. Renewable Energy"
            className="mr-2"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={addCustomIndustry}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
  
  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                {isEditing ? "Update Your Job & Company Targets" : "Define Your Job & Company Targets"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {isEditing && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                      <h3 className="font-medium text-blue-800">Why This Matters</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        The more specific you are about your preferences, the better we can help you find relevant companies and contacts.
                        Your preferences aren't set in stone - you can always come back and update them as your job search evolves.
                      </p>
                    </div>
                  )}
                  
                  {/* Describe Your Ideal Role and Company */}
                  <FormField
                    control={form.control}
                    name="free_form_role_and_company_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Describe Your Ideal Role and Company</FormLabel>
                        <FormDescription>
                          Tell us what matters to you about your next job - in your own words or using the criteria below.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Example: I'm looking for a product management role in a sustainability-focused tech company..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                  {/* Target Job Functions with Custom Options */}
                  {renderFunctionsWithCustom()}
                  
                  {/* Preferred Locations */}
                  {renderMultiSelectChips(
                    "target_locations",
                    locationOptions,
                    "Preferred Locations",
                    "Where would you like to work?"
                  )}
                  
                  {/* Work From Home Preference */}
                  {renderMultiSelectChips(
                    "target_wfh_preference",
                    wfhOptions,
                    "Work From Home Preference",
                    "What is your preferred working arrangement?"
                  )}
                  
                  {/* Target Industries with Custom Options */}
                  {renderIndustriesWithCustom()}
                  
                  {/* Company Size Preference */}
                  {renderMultiSelectChips(
                    "target_sizes",
                    sizeOptions,
                    "Company Size Preference",
                    "What size of company would you prefer?"
                  )}
                  
                  {/* Public/Private Company Preference */}
                  {renderMultiSelectChips(
                    "target_public_private",
                    publicPrivateOptions,
                    "Public/Private Company Preference",
                    "Do you prefer public or private companies?"
                  )}
                  
                  {/* Similar Companies */}
                  <FormField
                    control={form.control}
                    name="similar_companies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Examples</FormLabel>
                        <FormDescription>We will use this to generate more examples</FormDescription>
                        <FormControl>
                          <Input
                            placeholder="Google, Apple, Microsoft, etc."
                            onChange={(e) => {
                              const companies = e.target.value
                                .split(",")
                                .map(company => company.trim())
                                .filter(company => company);
                              field.onChange(companies);
                            }}
                            value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : isEditing ? "Update Preferences" : "Save Preferences"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobTargets;
