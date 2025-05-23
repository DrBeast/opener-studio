import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase, cleanupDuplicateTargetCriteria } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { X, Plus, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  target_functions: z.array(z.string()).optional(),
  target_locations: z.array(z.string()).optional(),
  target_wfh_preference: z.array(z.string()).optional(),
  free_form_role_and_company_description: z.string().optional(),
  target_industries: z.array(z.string()).optional(),
  target_sizes: z.array(z.string()).optional(),
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

// Updated industry options with the new chips
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
}, {
  value: "energy",
  label: "Energy"
}, {
  value: "biotech",
  label: "Biotech"
}, {
  value: "crypto",
  label: "Crypto"
}, {
  value: "ai_llm",
  label: "AI / LLM"
}, {
  value: "automotive",
  label: "Automotive"
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newFunction, setNewFunction] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [filteredLocations, setFilteredLocations] = useState(locationOptions);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target_functions: [],
      target_locations: [],
      target_wfh_preference: [],
      free_form_role_and_company_description: "",
      target_industries: [],
      target_sizes: [],
      similar_companies: [],
      visa_sponsorship_required: false
    }
  });

  useEffect(() => {
    const fetchExistingData = async () => {
      if (!user) return;
      setIsLoading(true);
      
      try {
        // Clean up duplicate target criteria first and get the most recent one
        const cleanedCriteria = await cleanupDuplicateTargetCriteria(user.id);
        
        // Fetch user profile to get location data - using the correct table name "user_profiles"
        const {
          data: profileData,
          error: profileError
        } = await supabase
          .from("user_profiles")
          .select("location")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (profileData && !profileError) {
          setUserProfile(profileData);
        }
        
        // Use the returned cleaned criteria instead of making another query
        if (cleanedCriteria) {
          setExistingData(cleanedCriteria);
          setIsEditing(true);
          const targetLocations = ensureStringArray(cleanedCriteria.target_locations);
          
          // If user has no locations set but we have their profile location, use that
          const userLocation = profileData?.location;
          const locations = targetLocations.length > 0 ? targetLocations : userLocation ? [userLocation] : [];
          form.reset({
            target_functions: ensureStringArray(cleanedCriteria.target_functions),
            target_locations: locations,
            target_wfh_preference: ensureStringArray(cleanedCriteria.target_wfh_preference),
            free_form_role_and_company_description: cleanedCriteria.free_form_role_and_company_description || "",
            target_industries: ensureStringArray(cleanedCriteria.target_industries),
            target_sizes: ensureStringArray(cleanedCriteria.target_sizes),
            similar_companies: ensureStringArray(cleanedCriteria.similar_companies),
            visa_sponsorship_required: cleanedCriteria.visa_sponsorship_required || false
          });
        } else if (profileData?.location) {
          // No existing data but we have user location
          form.setValue("target_locations", [profileData.location]);
        }
      } catch (error: any) {
        console.error("Error fetching target criteria:", error.message);
        toast({
          title: "Error",
          description: "Failed to load your job target preferences",
          variant: "destructive"
        });
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
      const {
        error
      } = existingData ? await supabase.from("target_criteria").update(submissionData).eq("criteria_id", existingData.criteria_id) : await supabase.from("target_criteria").insert([submissionData]);
      if (error) throw error;
      toast({
        title: "Success",
        description: isEditing ? "Job and company targets updated successfully!" : "Job and company targets saved successfully!"
      });
    } catch (error: any) {
      console.error("Error saving target criteria:", error.message);
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chip component for selections
  const SelectionChip = ({
    label,
    onRemove
  }: {
    label: string;
    onRemove: () => void;
  }) => <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm mr-2 mb-2">
      <span>{label}</span>
      <button type="button" onClick={onRemove} className="ml-2 rounded-full hover:bg-primary/20 p-0.5">
        <X className="h-3 w-3" />
      </button>
    </div>;

  // Common function to handle chip selections for both functions and industries
  const renderChipSelector = (name: "target_functions" | "target_industries", options: {
    value: string;
    label: string;
  }[], label: string, description: string, placeholder: string, newValue: string, setNewValue: React.Dispatch<React.SetStateAction<string>>, addCustomValue: () => void) => {
    const values = form.watch(name) || [];
    const handleOptionClick = (option: string) => {
      const currentValues = form.getValues(name) || [];
      if (currentValues.includes(option)) {
        form.setValue(name, currentValues.filter(v => v !== option));
      } else {
        form.setValue(name, [...currentValues, option]);
      }
    };
    return <FormField control={form.control} name={name} render={() => <FormItem className="space-y-2">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
            
            <div className="relative">
              <div className="flex flex-wrap p-2 border rounded-md min-h-[80px] bg-background">
                {values.map(value => {
            const option = options.find(o => o.value === value);
            const displayLabel = option ? option.label : value;
            return <SelectionChip key={value} label={displayLabel} onRemove={() => handleOptionClick(value)} />;
          })}
                
                <div className="flex items-center">
                  <input type="text" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder={placeholder} className="ml-1 py-1 px-2 outline-none border-none text-sm bg-transparent w-32" onKeyDown={e => {
              if (e.key === 'Enter' && newValue.trim()) {
                e.preventDefault();
                addCustomValue();
              }
            }} />
                  {newValue.trim() && <button type="button" onClick={addCustomValue} className="p-1 ml-1 text-primary">
                      <Plus className="h-4 w-4" />
                    </button>}
                </div>
              </div>
              
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {options.map(option => <button key={option.value} type="button" onClick={() => handleOptionClick(option.value)} className={cn("text-left px-3 py-1.5 rounded-md text-sm", values.includes(option.value) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                    {option.label}
                  </button>)}
              </div>
            </div>
          </FormItem>} />;
  };
  const addCustomFunction = () => {
    if (!newFunction.trim()) return;
    const currentFunctions = form.getValues("target_functions") || [];
    if (!currentFunctions.includes(newFunction.trim())) {
      form.setValue("target_functions", [...currentFunctions, newFunction.trim()]);
      setNewFunction("");
    }
  };
  const addCustomIndustry = () => {
    if (!newIndustry.trim()) return;
    const currentIndustries = form.getValues("target_industries") || [];
    if (!currentIndustries.includes(newIndustry.trim())) {
      form.setValue("target_industries", [...currentIndustries, newIndustry.trim()]);
      setNewIndustry("");
    }
  };
  const addCustomLocation = () => {
    if (!newLocation.trim()) return;
    const currentLocations = form.getValues("target_locations") || [];
    if (!currentLocations.includes(newLocation.trim())) {
      form.setValue("target_locations", [...currentLocations, newLocation.trim()]);
      setNewLocation("");
      setLocationSearchOpen(false);
    }
  };

  // Filter locations based on search input
  useEffect(() => {
    if (newLocation.trim() === "") {
      setFilteredLocations(locationOptions);
    } else {
      const filtered = locationOptions.filter(location => location.label.toLowerCase().includes(newLocation.toLowerCase()));
      setFilteredLocations(filtered);
    }
  }, [newLocation]);
  const handleLocationSelect = (location: string) => {
    const currentLocations = form.getValues("target_locations") || [];
    if (!currentLocations.includes(location)) {
      form.setValue("target_locations", [...currentLocations, location]);
    }
    setNewLocation("");
    setLocationSearchOpen(false);
  };
  const renderWFHPreference = () => {
    const values = form.watch("target_wfh_preference") || [];
    return <FormField control={form.control} name="target_wfh_preference" render={() => <FormItem className="space-y-2">
            <FormLabel>Work From Home Preference</FormLabel>
            <FormDescription>What is your preferred working arrangement?</FormDescription>
            
            <div className="flex flex-wrap gap-2">
              {wfhOptions.map(option => <button key={option.value} type="button" onClick={() => {
          const currentValues = form.getValues("target_wfh_preference") || [];
          if (currentValues.includes(option.value)) {
            form.setValue("target_wfh_preference", currentValues.filter(v => v !== option.value));
          } else {
            form.setValue("target_wfh_preference", [...currentValues, option.value]);
          }
        }} className={cn("px-3 py-1.5 rounded-md text-sm", values.includes(option.value) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                  {option.label}
                </button>)}
            </div>
            
            <div className="flex flex-wrap mt-2">
              {values.map(value => {
          const option = wfhOptions.find(o => o.value === value);
          return option && <SelectionChip key={value} label={option.label} onRemove={() => {
            form.setValue("target_wfh_preference", values.filter(v => v !== value));
          }} />;
        })}
            </div>
          </FormItem>} />;
  };
  const renderSizePreference = () => {
    const values = form.watch("target_sizes") || [];
    return <FormField control={form.control} name="target_sizes" render={() => <FormItem className="space-y-2">
            <FormLabel>Company Size Preference</FormLabel>
            <FormDescription>What size of company would you prefer?</FormDescription>
            
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map(option => <button key={option.value} type="button" onClick={() => {
          const currentValues = form.getValues("target_sizes") || [];
          if (currentValues.includes(option.value)) {
            form.setValue("target_sizes", currentValues.filter(v => v !== option.value));
          } else {
            form.setValue("target_sizes", [...currentValues, option.value]);
          }
        }} className={cn("px-3 py-1.5 rounded-md text-sm", values.includes(option.value) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                  {option.label}
                </button>)}
            </div>
            
            <div className="flex flex-wrap mt-2">
              {values.map(value => {
          const option = sizeOptions.find(o => o.value === value);
          return option && <SelectionChip key={value} label={option.label} onRemove={() => {
            form.setValue("target_sizes", values.filter(v => v !== value));
          }} />;
        })}
            </div>
          </FormItem>} />;
  };
  const renderLocationSelector = () => {
    const locations = form.watch("target_locations") || [];
    return <FormField control={form.control} name="target_locations" render={() => <FormItem className="space-y-2">
            <FormLabel>Preferred Locations</FormLabel>
            <FormDescription>Where would you like to work?</FormDescription>
            
            <div className="relative">
              <div className="flex flex-wrap p-2 border rounded-md min-h-[42px] bg-background" onClick={() => {
          setLocationSearchOpen(true);
          setTimeout(() => {
            locationInputRef.current?.focus();
          }, 100);
        }}>
                {locations.map(location => {
            const option = locationOptions.find(o => o.value === location);
            const displayLabel = option ? option.label : location;
            return <SelectionChip key={location} label={displayLabel} onRemove={() => {
              form.setValue("target_locations", locations.filter(l => l !== location));
            }} />;
          })}
                
                <div className="flex items-center flex-grow">
                  <input ref={locationInputRef} type="text" value={newLocation} onChange={e => {
              setNewLocation(e.target.value);
              setLocationSearchOpen(true);
            }} placeholder={locations.length ? "Add another location..." : "Search locations..."} className="ml-1 py-1 px-2 outline-none border-none text-sm bg-transparent flex-grow" onFocus={() => setLocationSearchOpen(true)} onKeyDown={e => {
              if (e.key === 'Enter' && newLocation.trim()) {
                e.preventDefault();
                addCustomLocation();
              }
            }} />
                  <button type="button" className="p-1 text-muted-foreground" onClick={() => setLocationSearchOpen(!locationSearchOpen)}>
                    <ChevronsUpDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {locationSearchOpen && <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[200px] overflow-y-auto">
                  {filteredLocations.length > 0 ? filteredLocations.map(location => <button key={location.value} type="button" className="w-full text-left px-3 py-2 hover:bg-accent text-sm" onClick={() => handleLocationSelect(location.value)}>
                        {location.label}
                      </button>) : <div className="p-3 text-sm text-muted-foreground">
                      <div className="flex justify-between items-center">
                        <span>No locations found</span>
                        {newLocation.trim() && <Button type="button" variant="ghost" size="sm" onClick={addCustomLocation}>
                            Add "{newLocation}"
                          </Button>}
                      </div>
                    </div>}
                </div>}
            </div>
          </FormItem>} />;
  };

  const handleGenerateCompanies = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    
    try {
      // First save the current form data
      const values = form.getValues();
      const submissionData = {
        user_id: user.id,
        ...values
      };
      
      const { error: saveError } = existingData 
        ? await supabase.from("target_criteria").update(submissionData).eq("criteria_id", existingData.criteria_id)
        : await supabase.from("target_criteria").insert([submissionData]);
      
      if (saveError) throw saveError;

      // Call the generate companies edge function
      const { data, error } = await supabase.functions.invoke('generate_companies');
      
      if (error) {
        console.error('Error generating companies:', error);
        toast({
          title: "Error",
          description: "Failed to generate companies. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Generated ${data?.companies?.length || 0} new companies successfully!`
      });

      // Navigate to pipeline with a flag to highlight new companies
      navigate("/pipeline", { 
        state: { 
          newCompanies: data?.companies || [],
          highlightNew: true 
        } 
      });
      
    } catch (error: any) {
      console.error("Error generating companies:", error);
      toast({
        title: "Error",
        description: "Failed to generate companies. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }
  const handleSaveAndContinue = () => {
    form.handleSubmit(values => {
      onSubmit(values).then(() => {
        // Navigate to pipeline after saving
        navigate("/pipeline");
      });
    })();
  };

  return <div className="container mx-auto py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Define Your Job & Company Targets</h1>
        <Button 
          onClick={handleGenerateCompanies} 
          disabled={isSubmitting || isGenerating} 
          className="bg-primary"
        >
          {isGenerating ? "Generating..." : "Generate Companies"}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-8">
          <Card>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {isEditing && <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                      <h3 className="font-medium text-blue-800">Why This Matters</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        The more specific you are about your preferences, the better we can help you find relevant companies and contacts.
                        Your preferences aren't set in stone - you can always come back and update them as your job search evolves.
                      </p>
                    </div>}
                  
                  {/* Describe Your Ideal Role and Company */}
                  <FormField control={form.control} name="free_form_role_and_company_description" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Describe Your Ideal Role and Company</FormLabel>
                        <FormDescription>
                          Tell us what matters to you about your next job - in your own words or using the criteria below.
                        </FormDescription>
                        <FormControl>
                          <Textarea placeholder="Example: I'm looking for a product management role in a sustainability-focused tech company..." className="min-h-[150px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                
                  {/* Target Job Functions with Custom Options */}
                  {renderChipSelector("target_functions", functionOptions, "Target Job Functions", "What job functions are you interested in?", "Add function...", newFunction, setNewFunction, addCustomFunction)}
                  
                  {/* Target Industries with Custom Options */}
                  {renderChipSelector("target_industries", industryOptions, "Target Industries", "What industries are you interested in?", "Add industry...", newIndustry, setNewIndustry, addCustomIndustry)}
                  
                  {/* Preferred Locations */}
                  {renderLocationSelector()}
                  
                  {/* Work From Home Preference */}
                  {renderWFHPreference()}
                  
                  {/* Company Size Preference */}
                  {renderSizePreference()}
                  
                  {/* Similar Companies */}
                  <FormField control={form.control} name="similar_companies" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Company Examples</FormLabel>
                        <FormDescription>We will use this to generate more examples</FormDescription>
                        <FormControl>
                          <Input placeholder="Google, Apple, Microsoft, etc." onChange={e => {
                      const companies = e.target.value.split(",").map(company => company.trim()).filter(company => company);
                      field.onChange(companies);
                    }} value={Array.isArray(field.value) ? field.value.join(", ") : ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      onClick={handleGenerateCompanies}
                      disabled={isSubmitting || isGenerating}
                    >
                      {isGenerating ? "Generating..." : "Generate Companies"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};

export default JobTargets;
