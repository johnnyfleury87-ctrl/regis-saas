// Import depuis CDN pour compatibilité navigateur
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://mkcjwhkcqfjgaoqjbmsy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rY2p3aGtjcWZqZ2Fxb2pibXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDg4ODMsImV4cCI6MjA3OTYyNDg4M30.XANf4CpYvG8U1S_9OGuIPPK_NkvfmwrT0XHfVTpOIdY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
