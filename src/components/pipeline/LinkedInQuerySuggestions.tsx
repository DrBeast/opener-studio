import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/airtable-ds/button";
import { Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/airtable-ds/use-toast";

interface LinkedInQuerySuggestionsProps {
  companyName: string;
  isModalOpen: boolean;
}

export const LinkedInQuerySuggestions = ({
  companyName,
  isModalOpen,
}: LinkedInQuerySuggestionsProps) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    // Only generate suggestions once when modal opens and we haven't generated before
    if (isModalOpen && !hasGenerated && companyName) {
      generateSuggestions();
    }
  }, [isModalOpen, hasGenerated, companyName]);

  const generateSuggestions = async () => {
    if (!user || !companyName || hasGenerated) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate_linkedin_queries",
        {
          body: { company_name: companyName },
        }
      );

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        setHasGenerated(true);
      }
    } catch (error: any) {
      console.error("Error generating LinkedIn queries:", error);
      // Fallback to basic suggestions if API fails
      setSuggestions([
        `${companyName} finance`,
        `${companyName} product manager`,
        `${companyName} recruiter`,
        `${companyName} CEO`,
        `${companyName} director`,
      ]);
      setHasGenerated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (query: string, index: number) => {
    try {
      await navigator.clipboard.writeText(query);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Copied!",
        description: "LinkedIn search query copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setHasGenerated(false);
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [isModalOpen]);

  if (!isModalOpen) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">LinkedIn Search Suggestions</p>
        <div className="text-sm text-muted-foreground">
          Generating suggestions...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">LinkedIn Search Suggestions</p>
      <p className="text-xs text-muted-foreground mb-3">
        Click to copy these queries and paste them into LinkedIn's search bar to
        find relevant contacts:
      </p>
      <div className="grid grid-cols-1 gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="justify-between h-auto p-2 text-left"
            onClick={() => copyToClipboard(suggestion, index)}
          >
            <span className="text-xs">{suggestion}</span>
            {copiedIndex === index ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};
