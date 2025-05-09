// This file is no longer needed as we're using the client from @/integrations/supabase/client
// Keeping it for backward compatibility but with a deprecation warning

import { createClient } from "@supabase/supabase-js";
import { supabase as supabaseClient } from "@/integrations/supabase/client";

console.warn(
  "Warning: Using deprecated supabase client from @/lib/supabase. " +
  "Please update your imports to use @/integrations/supabase/client instead."
);

export const supabase = supabaseClient;
