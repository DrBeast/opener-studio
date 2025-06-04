
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Target } from "lucide-react";
import { TargetCriteriaForm } from "@/components/TargetCriteriaForm";
import { Modal } from "@/components/ui/design-system/modals";

interface TargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TargetsModal({ isOpen, onClose }: TargetsModalProps) {
  const { user } = useAuth();
  const [existingCriteria, setExistingCriteria] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExistingCriteria = async () => {
      if (!user?.id || !isOpen) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('target_criteria')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching criteria:', error);
          toast({
            title: "Error",
            description: "Failed to load existing criteria",
            variant: "destructive",
          });
        } else {
          setExistingCriteria(data);
        }
      } catch (error) {
        console.error('Error fetching criteria:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingCriteria();
  }, [user?.id, isOpen]);

  const handleSaved = () => {
    toast({
      title: "Success",
      description: "Target criteria saved successfully",
    });
    onClose();
  };

  if (isLoading) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Edit Target Criteria"
        icon={<Target />}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Target Criteria"
      icon={<Target />}
      className="sm:max-w-4xl"
    >
      <div className="space-y-6">
        <div className="text-sm text-[hsl(var(--normaltext))]">
          Define your job search criteria to help AI generate relevant companies and opportunities.
        </div>
        
        <TargetCriteriaForm
          onCancel={onClose}
          onSaved={handleSaved}
          initialData={existingCriteria}
        />
      </div>
    </Modal>
  );
}
