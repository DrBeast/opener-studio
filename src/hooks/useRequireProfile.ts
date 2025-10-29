import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useRequireProfile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      if (loading) {
        return; // Wait for auth state to be determined
      }

      if (!user) {
        // If there's no user and we're not loading, they are likely logged out.
        // The main router logic should handle redirecting to login.
        return;
      }

      // Check if a complete summary exists for the user.
      const { data, error } = await supabase
        .from('user_summaries')
        .select('overall_blurb, value_proposition_summary')
        .eq('user_id', user.id)
        .single();

      // A profile is incomplete if there's an error, no data row, or the key fields are null/empty.
      const is_incomplete = !data || !data.overall_blurb || !data.value_proposition_summary;

      if (is_incomplete) {
        // PGRST116 means no rows were found, which is a normal case for new users.
        // We don't need to log an error for that.
        if (error && error.code !== 'PGRST116') { 
          console.error('Error checking user summary:', error);
        }
        
        console.log('Profile incomplete, redirecting to setup.');
        navigate('/profile?edit=true&setup=true', { replace: true });
      }
    };

    checkProfile();
  }, [user, loading, navigate]);
};
