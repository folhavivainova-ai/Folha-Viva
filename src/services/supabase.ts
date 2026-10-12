import { createClient } from '@supabase/supabase-js';
import { clientConfig } from '../config/client';
export const supabase = clientConfig.supabase ? createClient(clientConfig.supabase.url, clientConfig.supabase.key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
}) : null;
