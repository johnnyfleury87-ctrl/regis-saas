// Import depuis CDN pour compatibilité navigateur
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://mkcjwhkcqfjgaoqjbmsy.supabase.co";
const SUPABASE_ANON_KEY = "sb-publishable_lqtN22OC8TuIwLBSx_gdLA_R6XTQmOZ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
