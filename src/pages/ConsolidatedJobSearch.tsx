import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Icons
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Plus, 
  Filter, 
  RefreshCw, 
  Trash2, 
  ArrowUpDown,
  FileText,
  UserRound,
  Calendar,
  AlertCircle,
  MessageCircle,
  CheckCircle,
  X,
  ChevronsUpDown
} from "lucide-react";

// Job Target Components
import { CompanyDetails } from "@/components/CompanyDetails";
import { ContactDetails } from "@/components/ContactDetails";
import { InteractionForm } from "@/components/InteractionForm";
import { MessageGeneration } from "@/components/MessageGeneration";

// Target Criteria Form Schema
const targetCriteriaSchema = z.object({
  target_functions: z.array(z.string()).optional(),
  target_locations: z.array(z.string()).optional(),
  target_wfh_preference: z.array(z.string()).optional(),
  free_form_role_and_company_description: z.string().optional(),
  target_industries: z.array(z.string()).optional(),
  target_sizes: z.array(z.string()).optional(),
  similar_companies: z.array(z.string()).optional(),
  visa_sponsorship_required: z.boolean().default(false)
});

type TargetCriteriaValues = z.infer<typeof targetCriteriaSchema>;

// Sample options for each select field (copied from JobTargets.tsx)
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

// Interfaces
interface CompanyData {
  company_id: string;
  name: string;
  industry?: string;
  hq_location?: string;
  wfh_policy?: string;
  ai_description?: string;
  match_quality_score?: number;
  ai_match_reasoning?: string;
  user_priority?: 'Top' | 'Medium' | 'Maybe'; // This aligns with the database values
  latest_update: {
    interaction_id: string;
    description: string;
    interaction_date: string;
    interaction_type: string;
  };
  next_followup: {
    interaction_id: string;
    description: string;
    follow_up_due_date: string;
    interaction_type: string;
  };
  contacts: Array<{
    contact_id: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    latest_interaction?: {
      interaction_date: string;
      description: string;
    };
  }>;
}

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
  linkedin_url?: string;
  email?: string;
  bio_summary?: string;
  companies?: {
    name: string;
  };
}

interface TargetCriteriaData {
  free_form_role_and_company_description?: string;
  target_industries?: any;
  target_locations?: any;
  target_sizes?: any;
  target_public_private?: any;
  target_wfh_preference?: any;
  target_functions?: any;
  similar_companies?: any;
  criteria_id?: string; // Adding the missing criteria_id property
  created_at?: string; // Adding the missing created_at property
  updated_at?: string; // Also adding updated_at for consistency
  user_id?: string; // Adding user_id as it's likely needed
}

// Modals
import { AddCompanyModal } from "@/components/AddCompanyModal";
import { TargetCriteriaForm } from "@/components/TargetCriteriaForm";

const ConsolidatedJobSearch = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [openCriteria, setOpenCriteria] = useState(false); // Initially collapsed
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [sortField, setSortField] = useState("user_priority");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isGeneratingCompanies, setIsGeneratingCompanies] = useState(false);

  // Modals state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);

  // Target criteria Form state
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [newFunction, setNewFunction] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [filteredLocations, setFilteredLocations] = useState(locationOptions);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Initialize the form
  const criteriaForm = useForm<TargetCriteriaValues>({
    resolver: zodResolver(targetCriteriaSchema),
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

  // Fetch companies overview
  const { data: companiesData, isLoading, error, refetch } = useQuery({
    queryKey: ['companies-overview', filterPriority, sortField, sortDirection],
    queryFn: async () => {
      try {
        // Call the get_companies_overview edge function
        const { data, error } = await supabase.functions.invoke('get_companies_overview', {});
        
        if (error) throw error;
        return data.companies;
      } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }
    },
    enabled: !!user
  });

  // Fetch target criteria
  const { data: targetCriteria } = useQuery({
    queryKey: ['target-criteria'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('target_criteria')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as TargetCriteriaData;
    },
    enabled: !!user
  });

  // Effect to set form values when target criteria data is loaded
  useEffect(() => {
    if (targetCriteria) {
      criteriaForm.reset({
        target_functions: ensureStringArray(targetCriteria.target_functions),
        target_locations: ensureStringArray(targetCriteria.target_locations),
        target_wfh_preference: ensureStringArray(targetCriteria.target_wfh_preference),
        free_form_role_and_company_description: targetCriteria.free_form_role_and_company_description || "",
        target_industries: ensureStringArray(targetCriteria.target_industries),
        target_sizes: ensureStringArray(targetCriteria.target_sizes),
        similar_companies: ensureStringArray(targetCriteria.similar_companies),
        visa_sponsorship_required: false // Default value
      });
    }
  }, [targetCriteria, criteriaForm]);

  // Remove companies mutation
  const removeCompaniesMutation = useMutation({
    mutationFn: async (companyIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('remove_companies', {
        body: { companyIds }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: 'Selected companies removed'
      });
      setSelectedCompanyIds([]);
      queryClient.invalidateQueries({ queryKey: ['companies-overview'] });
    },
    onError: (error) => {
      console.error('Error removing companies:', error);
      toast({
        title: "Error",
        description: 'Failed to remove companies',
        variant: "destructive"
      });
    }
  });

  // Add company by name mutation
  const addCompanyMutation = useMutation({
    mutationFn: async (companyName: string) => {
      const { data, error } = await supabase.functions.invoke('add_company_by_name', {
        body: { companyName }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Company ${data.company.name} added successfully`
      });
      queryClient.invalidateQueries({ queryKey: ['companies-overview'] });
    },
    onError: (error: any) => {
      console.error('Error adding company:', error);
      if (error.message === 'Company already exists') {
        toast({
          title: "Error",
          description: 'This company already exists in your list',
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: 'Failed to add company',
          variant: "destructive"
        });
      }
    }
  });

  // Filter companies based on search query
  const filteredCompanies = companiesData?.filter((company: CompanyData) => {
    if (!searchQuery) return true;
    
    // Apply priority filter if set
    if (filterPriority && company.user_priority !== filterPriority) return false;
    
    const query = searchQuery.toLowerCase();
    const contactNames = company.contacts
      ?.map(c => `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase())
      .join(' ') || '';
    
    return (
      company.name.toLowerCase().includes(query) ||
      (company.industry || "").toLowerCase().includes(query) ||
      (company.hq_location || "").toLowerCase().includes(query) ||
      (company.user_priority || "").toLowerCase().includes(query) ||
      contactNames.includes(query)
    );
  });

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle company selection
  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanyIds(prev => {
      if (prev.includes(companyId)) {
        return prev.filter(id => id !== companyId);
      } else {
        return [...prev, companyId];
      }
    });
  };

  // Handle select all companies
  const handleSelectAll = () => {
    if (selectedCompanyIds.length === (filteredCompanies?.length || 0)) {
      setSelectedCompanyIds([]);
    } else {
      const allIds = filteredCompanies?.map((company: CompanyData) => company.company_id) || [];
      setSelectedCompanyIds(allIds);
    }
  };

  // Handle removing selected companies
  const handleRemoveSelected = () => {
    if (selectedCompanyIds.length === 0) {
      toast({
        title: "Error",
        description: 'No companies selected',
        variant: "destructive"
      });
      return;
    }
    
    removeCompaniesMutation.mutate(selectedCompanyIds);
  };

  // Handle viewing company details
  const handleViewCompany = (company: CompanyData) => {
    setSelectedCompany(company);
    setIsDetailsOpen(true);
  };

  // Handle company updated
  const handleCompanyUpdated = () => {
    refetch();
    setIsDetailsOpen(false);
  };

  // Handle planning interaction
  const handlePlanInteraction = (company: CompanyData) => {
    setSelectedCompany(company);
    setIsAddInteractionOpen(true);
  };

  // Target criteria submission handler
  const onTargetCriteriaSubmit = async (values: TargetCriteriaValues) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save criteria",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingCompanies(true);
    
    try {
      // Convert arrays to objects for storage
      const formatArrayToObject = (arr: string[] | undefined) => {
        if (!arr) return {};
        return arr.reduce((obj, item) => ({ ...obj, [item]: true }), {});
      };
      
      const criteriaData = {
        criteria_id: targetCriteria?.criteria_id || crypto.randomUUID(),
        user_id: user.id,
        free_form_role_and_company_description: values.free_form_role_and_company_description,
        similar_companies: formatArrayToObject(values.similar_companies),
        target_industries: formatArrayToObject(values.target_industries),
        target_locations: formatArrayToObject(values.target_locations),
        target_sizes: formatArrayToObject(values.target_sizes),
        target_functions: formatArrayToObject(values.target_functions),
        target_wfh_preference: formatArrayToObject(values.target_wfh_preference),
        updated_at: new Date().toISOString(),
        created_at: targetCriteria?.created_at || new Date().toISOString(),
      };
      
      const { error } = targetCriteria
        ? await supabase
            .from('target_criteria')
            .update(criteriaData)
            .eq('criteria_id', criteriaData.criteria_id)
        : await supabase
            .from('target_criteria')
            .insert([criteriaData]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Target criteria saved successfully"
      });
      
      // After saving, generate more companies and refresh criteria data
      queryClient.invalidateQueries({ queryKey: ['target-criteria'] });
      handleGenerateMoreCompanies();
      setShowTargetForm(false);
    } catch (error: any) {
      console.error("Error saving target criteria:", error);
      toast({
        title: "Error",
        description: "Failed to save target criteria",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCompanies(false);
    }
  };

  // Handle generate more companies
  const handleGenerateMoreCompanies = async (useDifferentCriteria = false) => {
    // This is a placeholder - in a real implementation, you would call 
    // the generate_companies edge function with the current criteria
    setIsGeneratingCompanies(true);
    toast({
      title: "Info", 
      description: 'Generating more companies...'
    });
    
    try {
      // Mock delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (useDifferentCriteria) {
        setShowTargetForm(true);
      } else {
        // In real implementation, call generate_companies
        toast({
          title: "Success",
          description: '10 more companies generated'
        });
        refetch();
      }
    } catch (error) {
      console.error('Error generating companies:', error);
      toast({
        title: "Error",
        description: 'Failed to generate companies',
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCompanies(false);
    }
  };

  // Format a date nicely
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Format contact name with initial
  const formatContactName = (contact: { first_name?: string, last_name?: string }) => {
    const firstName = contact.first_name || '';
    const lastInitial = contact.last_name ? `${contact.last_name.charAt(0)}` : '';
    return firstName + (lastInitial ? ` ${lastInitial}.` : '');
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
  
  // Common function to handle chip selections for both functions and industries
  const renderChipSelector = (
    name: "target_functions" | "target_industries", 
    options: { value: string; label: string }[],
    label: string,
    description: string,
    placeholder: string,
    newValue: string,
    setNewValue: React.Dispatch<React.SetStateAction<string>>,
    addCustomValue: () => void
  ) => {
    const values = criteriaForm.watch(name) || [];
    
    const handleOptionClick = (option: string) => {
      const currentValues = criteriaForm.getValues(name) || [];
      if (currentValues.includes(option)) {
        criteriaForm.setValue(name, currentValues.filter(v => v !== option));
      } else {
        criteriaForm.setValue(name, [...currentValues, option]);
      }
    };
    
    return (
      <FormField
        control={criteriaForm.control}
        name={name}
        render={() => (
          <FormItem className="space-y-2">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
            
            <div className="relative">
              <div className="flex flex-wrap p-2 border rounded-md min-h-[80px] bg-background">
                {values.map(value => {
                  const option = options.find(o => o.value === value);
                  const displayLabel = option ? option.label : value;
                  
                  return (
                    <SelectionChip 
                      key={value} 
                      label={displayLabel} 
                      onRemove={() => handleOptionClick(value)} 
                    />
                  );
                })}
                
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={placeholder}
                    className="ml-1 py-1 px-2 outline-none border-none text-sm bg-transparent w-32"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newValue.trim()) {
                        e.preventDefault();
                        addCustomValue();
                      }
                    }}
                  />
                  {newValue.trim() && (
                    <button 
                      type="button"
                      onClick={addCustomValue}
                      className="p-1 ml-1 text-primary"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {options.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionClick(option.value)}
                    className={cn(
                      "text-left px-3 py-1.5 rounded-md text-sm",
                      values.includes(option.value) 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </FormItem>
        )}
      />
    );
  };
  
  const addCustomFunction = () => {
    if (!newFunction.trim()) return;
    
    const currentFunctions = criteriaForm.getValues("target_functions") || [];
    if (!currentFunctions.includes(newFunction.trim())) {
      criteriaForm.setValue("target_functions", [...currentFunctions, newFunction.trim()]);
      setNewFunction("");
    }
  };
  
  const addCustomIndustry = () => {
    if (!newIndustry.trim()) return;
    
    const currentIndustries = criteriaForm.getValues("target_industries") || [];
    if (!currentIndustries.includes(newIndustry.trim())) {
      criteriaForm.setValue("target_industries", [...currentIndustries, newIndustry.trim()]);
      setNewIndustry("");
    }
  };
  
  const addCustomLocation = () => {
    if (!newLocation.trim()) return;
    
    const currentLocations = criteriaForm.getValues("target_locations") || [];
    if (!currentLocations.includes(newLocation.trim())) {
      criteriaForm.setValue("target_locations", [...currentLocations, newLocation.trim()]);
      setNewLocation("");
      setLocationSearchOpen(false);
    }
  };
  
  // Filter locations based on search input
  useEffect(() => {
    if (newLocation.trim() === "") {
      setFilteredLocations(locationOptions);
    } else {
      const filtered = locationOptions.filter(location => 
        location.label.toLowerCase().includes(newLocation.toLowerCase())
      );
      setFilteredLocations(filtered);
    }
  }, [newLocation]);
  
  const handleLocationSelect = (location: string) => {
    const currentLocations = criteriaForm.getValues("target_locations") || [];
    if (!currentLocations.includes(location)) {
      criteriaForm.setValue("target_locations", [...currentLocations, location]);
    }
    setNewLocation("");
    setLocationSearchOpen(false);
  };
  
  const renderWFHPreference = () => {
    const values = criteriaForm.watch("target_wfh_preference") || [];
    
    return (
      <FormField
        control={criteriaForm.control}
        name="target_wfh_preference"
        render={() => (
          <FormItem className="space-y-2">
            <FormLabel>Work From Home Preference</FormLabel>
            <FormDescription>What is your preferred working arrangement?</FormDescription>
            
            <div className="flex flex-wrap gap-2">
              {wfhOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    const currentValues = criteriaForm.getValues("target_wfh_preference") || [];
                    if (currentValues.includes(option.value)) {
                      criteriaForm.setValue("target_wfh_preference", currentValues.filter(v => v !== option.value));
                    } else {
                      criteriaForm.setValue("target_wfh_preference", [...currentValues, option.value]);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm",
                    values.includes(option.value)
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <div className="flex flex-wrap mt-2">
              {values.map(value => {
                const option = wfhOptions.find(o => o.value === value);
                return option && (
                  <SelectionChip 
                    key={value} 
                    label={option.label} 
                    onRemove={() => {
                      criteriaForm.setValue(
                        "target_wfh_preference", 
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
  
  const renderSizePreference = () => {
    const values = criteriaForm.watch("target_sizes") || [];
    
    return (
      <FormField
        control={criteriaForm.control}
        name="target_sizes"
        render={() => (
          <FormItem className="space-y-2">
            <FormLabel>Company Size Preference</FormLabel>
            <FormDescription>What size of company would you prefer?</FormDescription>
            
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    const currentValues = criteriaForm.getValues("target_sizes") || [];
                    if (currentValues.includes(option.value)) {
                      criteriaForm.setValue("target_sizes", currentValues.filter(v => v !== option.value));
                    } else {
                      criteriaForm.setValue("target_sizes", [...currentValues, option.value]);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm",
                    values.includes(option.value)
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <div className="flex flex-wrap mt-2">
              {values.map(value => {
                const option = sizeOptions.find(o => o.value === value);
                return option && (
                  <SelectionChip 
                    key={value} 
                    label={option.label} 
                    onRemove={() => {
                      criteriaForm.setValue(
                        "target_sizes", 
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
  
  const renderLocationSelector = () => {
    const locations = criteriaForm.watch("target_locations") || [];
    
    return (
      <FormField
        control={criteriaForm.control}
        name="target_locations"
        render={() => (
          <FormItem className="space-y-2">
            <FormLabel>Preferred Locations</FormLabel>
            <FormDescription>Where would you like to work?</FormDescription>
            
            <div className="relative">
              <div 
                className="flex flex-wrap p-2 border rounded-md min-h-[42px] bg-background"
                onClick={() => {
                  setLocationSearchOpen(true);
                  setTimeout(() => {
                    locationInputRef.current?.focus();
                  }, 100);
                }}
              >
                {locations.map(location => {
                  const option = locationOptions.find(o => o.value === location);
                  const displayLabel = option ? option.label : location;
                  
                  return (
                    <SelectionChip 
                      key={location} 
                      label={displayLabel} 
                      onRemove={() => {
                        criteriaForm.setValue(
                          "target_locations", 
                          locations.filter(l => l !== location)
                        );
                      }} 
                    />
                  );
                })}
                
                <div className="flex items-center flex-grow">
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={newLocation}
                    onChange={(e) => {
                      setNewLocation(e.target.value);
                      setLocationSearchOpen(true);
                    }}
                    placeholder={locations.length ? "Add another location..." : "Search locations..."}
                    className="ml-1 py-1 px-2 outline-none border-none text-sm bg-transparent flex-grow"
                    onFocus={() => setLocationSearchOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLocation.trim()) {
                        e.preventDefault();
                        addCustomLocation();
                      }
                    }}
                  />
                  <button 
                    type="button"
                    className="p-1 text-muted-foreground"
                    onClick={() => setLocationSearchOpen(!locationSearchOpen)}
                  >
                    <ChevronsUpDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {locationSearchOpen && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[200px] overflow-y-auto">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map(location => (
                      <button
                        key={location.value}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                        onClick={() => handleLocationSelect(location.value)}
                      >
                        {location.label}
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground">
                      <div className="flex justify-between items-center">
                        <span>No locations found</span>
                        {newLocation.trim() && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={addCustomLocation}
                          >
                            Add "{newLocation}"
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormItem>
        )}
      />
    );
  };

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load companies",
      variant: "destructive"
    });
    console.error(error);
  }

  // Render display summary of target criteria for collapsed view
  const renderTargetCriteriaSummary = () => {
    if (!targetCriteria) {
      return "No criteria defined yet";
    }

    const description = targetCriteria.free_form_role_and_company_description || "";
    
    // Get first industry and count
    const industries = targetCriteria.target_industries ? Object.keys(targetCriteria.target_industries) : [];
    const industryDisplay = industries.length > 0 
      ? `${industries[0]}${industries.length > 1 ? ` +${industries.length - 1}` : ''}` 
      : "";
      
    // Get first function and count  
    const functions = targetCriteria.target_functions ? Object.keys(targetCriteria.target_functions) : [];
    const functionDisplay = functions.length > 0
      ? `${functions[0]}${functions.length > 1 ? ` +${functions.length - 1}` : ''}` 
      : "";
    
    return (
      <div className="flex flex-1 items-center">
        <div className="flex-1 truncate">
          <span className="font-medium">Role & Company: </span>
          <span className="text-muted-foreground">{description.slice(0, 30)}{description.length > 30 ? '...' : ''}</span>
        </div>
        
        {industryDisplay && (
          <div className="mx-4 hidden md:block">
            <span className="font-medium">Industries: </span>
            <span className="text-muted-foreground">{industryDisplay}</span>
          </div>
        )}
        
        {functionDisplay && (
          <div className="mx-4 hidden md:block">
            <span className="font-medium">Functions: </span>
            <span className="text-muted-foreground">{functionDisplay}</span>
          </div>
        )}
        
        <Button 
          className="ml-4 bg-primary/20 text-primary hover:bg-primary/30" 
          onClick={(e) => {
            e.stopPropagation();
            setShowTargetForm(true);
            setOpenCriteria(true);
          }}
        >
          Update
        </Button>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-full">
      <ProfileBreadcrumbs />
      
      <div className="space-y-6">
        {/* Target Criteria Section - Collapsible Styling */}
        <Card className="border-2 border-primary/20 shadow-md">
          <Collapsible
            open={openCriteria}
            onOpenChange={setOpenCriteria}
            className="w-full"
          >
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setOpenCriteria(!openCriteria)}>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-primary">Target Criteria</h2>
                <p className="text-muted-foreground hidden sm:inline-block">
                  Define your target role and company criteria
                </p>
              </div>
              
              {!openCriteria && renderTargetCriteriaSummary()}
              
              <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="sm" className="p-0 h-9 w-9 rounded-full border-2 border-primary/40 bg-background hover:bg-primary/10">
                  {openCriteria ? 
                    <ChevronDown className="h-5 w-5 text-primary" /> : 
                    <ChevronDown className="h-5 w-5 text-primary" />
                  }
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="p-4 pt-0 border-t">
              {!showTargetForm ? (
                <div className="space-y-4">
                  {targetCriteria ? (
                    <div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium text-lg">Role & Company Description</h3>
                          <p className="text-muted-foreground">
                            {targetCriteria.free_form_role_and_company_description || 'No description provided'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {targetCriteria.target_industries && Object.keys(targetCriteria.target_industries).length > 0 && (
                            <div>
                              <h4 className="font-medium">Industries</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.keys(targetCriteria.target_industries).map((industry) => (
                                  <Badge key={industry} variant="secondary">
                                    {industry}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {targetCriteria.target_locations && Object.keys(targetCriteria.target_locations).length > 0 && (
                            <div>
                              <h4 className="font-medium">Locations</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.keys(targetCriteria.target_locations).map((location) => (
                                  <Badge key={location} variant="secondary">
                                    {location}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {targetCriteria.target_functions && Object.keys(targetCriteria.target_functions).length > 0 && (
                            <div>
                              <h4 className="font-medium">Functions</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.keys(targetCriteria.target_functions).map((func) => (
                                  <Badge key={func} variant="secondary">
                                    {func}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {targetCriteria.target_sizes && Object.keys(targetCriteria.target_sizes).length > 0 && (
                            <div>
                              <h4 className="font-medium">Company Sizes</h4>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.keys(targetCriteria.target_sizes).map((size) => (
                                  <Badge key={size} variant="secondary">
                                    {size}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button 
                            onClick={() => setShowTargetForm(true)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Update and Generate More
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                      <p className="text-muted-foreground">
                        No target criteria defined yet. Define your job search criteria to get started.
                      </p>
                      <Button onClick={() => setShowTargetForm(true)}>
                        Define Target Criteria
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Form {...criteriaForm}>
                  <form onSubmit={criteriaForm.handleSubmit(onTargetCriteriaSubmit)} className="space-y-8">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                      <h3 className="font-medium text-blue-800">Why This Matters</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        The more specific you are about your preferences, the better we can help you find relevant companies and contacts.
                        Your preferences aren't set in stone - you can always come back and update them as your job search evolves.
                      </p>
                    </div>
                    
                    {/* Describe Your Ideal Role and Company */}
                    <FormField
                      control={criteriaForm.control}
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
                    {renderChipSelector(
                      "target_functions",
                      functionOptions,
                      "Target Job Functions",
                      "What job functions are you interested in?",
                      "Add function...",
                      newFunction,
                      setNewFunction,
                      addCustomFunction
                    )}
                    
                    {/* Target Industries with Custom Options */}
                    {renderChipSelector(
                      "target_industries",
                      industryOptions,
                      "Target Industries",
                      "What industries are you interested in?",
                      "Add industry...",
                      newIndustry,
                      setNewIndustry,
                      addCustomIndustry
                    )}
                    
                    {/* Preferred Locations */}
                    {renderLocationSelector()}
                    
                    {/* Work From Home Preference */}
                    {renderWFHPreference()}
                    
                    {/* Company Size Preference */}
                    {renderSizePreference()}
                    
                    {/* Similar Companies */}
                    <FormField
                      control={criteriaForm.control}
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
                        type="button"
                        variant="outline"
                        onClick={() => setShowTargetForm(false)}
                        disabled={criteriaForm.formState.isSubmitting || isGeneratingCompanies}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90"
                        disabled={criteriaForm.formState.isSubmitting || isGeneratingCompanies}
                      >
                        {criteriaForm.formState.isSubmitting || isGeneratingCompanies ? "Saving..." : "Update and Generate More"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CollapsibleContent>
          </Collapsible>
        </Card>
        
        {/* Companies Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-2xl font-bold">Target Companies</CardTitle>
              <CardDescription>
                Manage your target companies and interactions
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select
                  value={filterPriority || "none"}
                  onValueChange={(value) => setFilterPriority(value === "none" ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      <span>Priority</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All priorities</SelectItem>
                    <SelectItem value="Top">Top</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Maybe">Maybe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsAddCompanyOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => handleGenerateMoreCompanies()}
                  disabled={isGeneratingCompanies || !targetCriteria}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingCompanies ? 'animate-spin' : ''}`} />
                  Generate More
                </Button>
              </div>
            </div>
            
            {selectedCompanyIds.length > 0 && (
              <div className="flex items-center justify-between mb-4 bg-muted/20 p-2 rounded">
                <div className="text-sm">
                  {selectedCompanyIds.length} {selectedCompanyIds.length === 1 ? 'company' : 'companies'} selected
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCompanyIds([])}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveSelected}
                    disabled={removeCompaniesMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove Selected
                  </Button>
                </div>
              </div>
            )}
            
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredCompanies && filteredCompanies.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={selectedCompanyIds.length === filteredCompanies.length && filteredCompanies.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all companies"
                        />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('user_priority')}
                      >
                        Priority
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('name')}
                      >
                        Company Name
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort('industry')}
                      >
                        Industry
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead>Contacts</TableHead>
                      <TableHead>Latest Update</TableHead>
                      <TableHead>Next Action</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company: CompanyData) => (
                      <TableRow key={company.company_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCompanyIds.includes(company.company_id)}
                            onCheckedChange={() => handleSelectCompany(company.company_id)}
                            aria-label={`Select ${company.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${company.user_priority === 'Top' ? 'bg-red-100 text-red-800' : 
                              company.user_priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'}`}
                          >
                            {company.user_priority || 'Maybe'}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div 
                            className="hover:underline cursor-pointer"
                            onClick={() => handleViewCompany(company)}
                          >
                            {company.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {company.ai_description?.slice(0, 60)}
                            {company.ai_description && company.ai_description.length > 60 ? '...' : ''}
                          </div>
                        </TableCell>
                        <TableCell>{company.industry || 'Unknown'}</TableCell>
                        <TableCell>
                          {company.contacts && company.contacts.length > 0 ? (
                            <div className="flex flex-col space-y-1">
                              {company.contacts.slice(0, 3).map((contact) => (
                                <div key={contact.contact_id} className="group flex items-center gap-1">
                                  <div className="text-sm">
                                    {formatContactName(contact)}
                                    {contact.role && <span className="text-xs text-muted-foreground"> · {contact.role}</span>}
                                  </div>
                                </div>
                              ))}
                              {company.contacts.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{company.contacts.length - 3} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center group">
                              <span className="text-muted-foreground text-sm">No contacts</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.latest_update && company.latest_update.description ? (
                            <div className="flex flex-col">
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(company.latest_update.interaction_date)}
                              </div>
                              <div className="text-sm">
                                {company.latest_update.description.length > 30
                                  ? `${company.latest_update.description.slice(0, 30)}...`
                                  : company.latest_update.description}
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm">No interactions</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.next_followup && company.next_followup.description ? (
                            <div className="flex flex-col">
                              <div className="text-xs flex items-center font-medium">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(company.next_followup.follow_up_due_date)}
                              </div>
                              <div className="text-sm">
                                {company.next_followup.description.length > 30
                                  ? `${company.next_followup.description.slice(0, 30)}...`
                                  : company.next_followup.description}
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm">No follow-ups</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handlePlanInteraction(company)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Plan
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCompany(company)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">No companies found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterPriority
                    ? "No companies match your search criteria"
                    : "You haven't added any companies to your pipeline yet"}
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={() => setIsAddCompanyOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Company
                  </Button>
                  {targetCriteria && (
                    <Button onClick={() => handleGenerateMoreCompanies()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Companies
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {filteredCompanies?.length > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateMoreCompanies()}
                    disabled={isGeneratingCompanies || !targetCriteria}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isGeneratingCompanies ? 'animate-spin' : ''}`} />
                    Generate More
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateMoreCompanies(true)}
                    disabled={isGeneratingCompanies}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Different Criteria
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Company Details Dialog */}
      {selectedCompany && (
        <CompanyDetails 
          company={selectedCompany}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onCompanyUpdated={handleCompanyUpdated}
        />
      )}

      {/* Interaction Form Dialog */}
      {selectedCompany && (
        <InteractionForm
          companyId={selectedCompany.company_id}
          companyName={selectedCompany.name}
          contacts={selectedCompany.contacts || []}
          isOpen={isAddInteractionOpen}
          onClose={() => setIsAddInteractionOpen(false)}
          onInteractionCreated={() => {
            refetch();
            setIsAddInteractionOpen(false);
          }}
          isPlanningMode={true}
        />
      )}
      
      {/* Contact Details Dialog */}
      {selectedContact && (
        <ContactDetails 
          contact={selectedContact}
          isOpen={isContactDetailsOpen}
          onClose={() => setIsContactDetailsOpen(false)}
          onContactUpdated={() => refetch()}
        />
      )}
      
      {/* Message Generation Dialog */}
      {selectedContact && selectedContact.companies && (
        <MessageGeneration
          contact={selectedContact}
          companyName={selectedContact.companies.name || ''}
          isOpen={isMessageOpen}
          onClose={() => setIsMessageOpen(false)}
        />
      )}

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={isAddCompanyOpen}
        onClose={() => setIsAddCompanyOpen(false)}
        onAddCompany={(companyName: string) => {
          addCompanyMutation.mutate(companyName);
          setIsAddCompanyOpen(false);
        }}
        isLoading={addCompanyMutation.isPending}
      />
    </div>
  );
};

export default ConsolidatedJobSearch;
