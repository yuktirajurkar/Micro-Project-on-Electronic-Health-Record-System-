import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jiwqsofspwemjezktljm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3Fzb2ZzcHdlbWplemt0bGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5ODQ1OTYsImV4cCI6MjA3NzU2MDU5Nn0.DLT7Bv4mn7d7Fdz9zMMAXqboxdFy9j4AxzNea3LebzY";

export const supabase = createClient(supabaseUrl, supabaseKey);
