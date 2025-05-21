
// This file is deprecated and will be removed in a future update.
// Please use @/integrations/supabase/client directly.

import { supabase as supabaseClient } from "@/integrations/supabase/client";

export const supabase = supabaseClient;

// Helper function to clean up duplicate target criteria
export const cleanupDuplicateTargetCriteria = async (userId: string) => {
  if (!userId) return;
  
  try {
    // Get all target criteria for this user
    const { data, error } = await supabaseClient
      .from('target_criteria')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    // If we have more than one record, keep only the most recent one
    if (data && data.length > 1) {
      console.log(`Found ${data.length} target criteria records for user ${userId}, cleaning up...`);
      
      // Keep the first record (most recent) and delete the rest
      const toKeep = data[0];
      const toDelete = data.slice(1).map(item => item.criteria_id);
      
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabaseClient
          .from('target_criteria')
          .delete()
          .in('criteria_id', toDelete);
        
        if (deleteError) {
          console.error("Error deleting duplicate target criteria:", deleteError);
        } else {
          console.log(`Successfully deleted ${toDelete.length} duplicate target criteria records`);
        }
      }
      
      return toKeep;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error("Error cleaning up duplicate target criteria:", error);
    return null;
  }
};
