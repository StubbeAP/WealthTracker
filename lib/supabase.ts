import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vgsfkoligrwknmvughly.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MM3qo068M1TnEf1UDc5Fzw_b13OMX82';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
});
