/**
 * Supabase Client Singleton
 * Server-side only — never import from client components
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url-for-build.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key-for-build';

export const supabase = createClient(supabaseUrl, supabaseKey);
