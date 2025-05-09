
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AiAssistant from "@/components/AiAssistant";

const formSchema = z.object({
  target_functions: z.array(z.string()).optional(),
  target_locations: z.array(z.string()).optional(),
  target_wfh_preference: z.array(z.string()).optional(),
  free_form_role_and_company_description: z.string().optional(),
  target_industries: z.array(z.string()).optional(),
  target_sizes: z.array(z.string()).optional(),
  target_public_private: z.array(z.string()).optional(),
  similar_companies: z.array(z.string()).optional(),
  visa_sponsorship_required: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

// Sample options for each select field
const functionOptions = [
  { value: "engineering", label: "Engineering" },
  { value: "product_management", label: "Product Management" },
  { value: "design", label: "Design" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "Human Resources" },
  { value: "operations", label: "Operations" },
  { value: "customer_support", label: "Customer Support" },
  { value: "data_science", label: "Data Science" },
];

const locationOptions = [
  { value: "san_francisco", label: "San Francisco" },
  { value: "new_york", label: "New York" },
  { value: "boston", label: "Boston" },
  { value: "seattle", label: "Seattle" },
  { value: "los_angeles", label: "Los Angeles" },
  { value: "chicago", label: "Chicago" },
  { value: "austin", label: "Austin" },
  { value: "remote_us", label: "Remote (US)" },
  { value: "remote_global", label: "Remote (Global)" },
];

const wfhOptions = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const industryOptions = [
  { value: "tech", label: "Tech" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "media", label: "Media & Entertainment" },
  { value: "government", label: "Government" },
  { value: "non_profit", label: "Non-profit" },
];

const sizeOptions = [
  { value: "startup", label: "Startup (<50)" },
  { value: "small", label: "Small (50-200)" },
  { value: "mid", label: "Mid-sized (201-1000)" },
  { value: "large", label: "Large (1000+)" },
];

const publicPrivateOptions = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

const JobTargets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);

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
      visa_sponsorship_required: false,
    },
  });

  useEffect(() => {
    const fetchExistingData = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("target_criteria")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        if (data) {
          setExistingData(data);
          form.reset({
            target_functions: data.target_functions || [],
            target_locations: data.target_locations || [],
            target_wfh_preference: data.target_wfh_preference || [],
            free_form_role_and_company_description: data.free_form_role_and_company_description || "",
            target_industries: data.target_industries || [],
            target_sizes: data.target_sizes || [],
            target_public_private: data.target_public_private || [],
            similar_companies: data.similar_companies || [],
            visa_sponsorship_required: data.visa_sponsorship_required || false,
          });
        }
      } catch (error: any) {
        console.error("Error fetching target criteria:", error.message);
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
        ...values,
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
      
      toast.success("Job and company targets saved successfully!");
      navigate("/profile");
    } catch (error: any) {
      console.error("Error saving target criteria:", error.message);
      toast.error("Failed to save your preferences. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMultiSelect = (
    name: keyof FormValues, 
    options: { value: string; label: string }[],
    label: string,
    description: string
  ) => {
    if (typeof form.watch(name) !== 'object') return null;
    
    return (
      <FormField
        control={form.control}
        name={name as any}
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {options.map((option) => (
                <FormField
                  key={option.value}
                  control={form.control}
                  name={name as any}
                  render={({ field }) => {
                    const values = field.value as string[] || [];
                    return (
                      <FormItem
                        key={option.value}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={values.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const updatedValues = checked
                                ? [...values, option.value]
                                : values.filter((val) => val !== option.value);
                              field.onChange(updatedValues);
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
          </FormItem>
        )}
      />
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Define Your Job & Company Targets</CardTitle>
              <CardDescription>
                Tell us what roles and companies you're interested in. This helps us provide tailored recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {renderMultiSelect(
                    "target_functions",
                    functionOptions,
                    "Target Job Functions",
                    "What job functions are you interested in?"
                  )}
                  
                  {renderMultiSelect(
                    "target_locations",
                    locationOptions,
                    "Preferred Locations",
                    "Where would you like to work?"
                  )}
                  
                  {renderMultiSelect(
                    "target_wfh_preference",
                    wfhOptions,
                    "Work From Home Preference",
                    "What is your preferred working arrangement?"
                  )}
                  
                  {renderMultiSelect(
                    "target_industries",
                    industryOptions,
                    "Target Industries",
                    "What industries are you interested in?"
                  )}
                  
                  {renderMultiSelect(
                    "target_sizes",
                    sizeOptions,
                    "Company Size Preference",
                    "What size of company would you prefer?"
                  )}
                  
                  {renderMultiSelect(
                    "target_public_private",
                    publicPrivateOptions,
                    "Public/Private Company Preference",
                    "Do you prefer public or private companies?"
                  )}

                  <FormField
                    control={form.control}
                    name="free_form_role_and_company_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Describe Your Ideal Role and Company</FormLabel>
                        <FormDescription>
                          Provide any additional details about your dream job or the companies you'd like to work for
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
                  
                  <FormField
                    control={form.control}
                    name="similar_companies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Similar Companies</FormLabel>
                        <FormDescription>
                          Enter names of companies you admire or would like to work for (comma separated)
                        </FormDescription>
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
                  
                  <FormField
                    control={form.control}
                    name="visa_sponsorship_required"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Visa Sponsorship Required</FormLabel>
                          <FormDescription>
                            Do you require visa sponsorship from employers?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => navigate("/profile")}>
                      Skip for Now
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <AiAssistant 
            showSummary={false} 
            summary={{
              experience: "",
              education: "",
              expertise: "",
              achievements: ""
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default JobTargets;
