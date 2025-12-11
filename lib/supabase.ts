import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface SavedPlaylist {
  id: string;
  user_id: string; // We'll store the Deezer User ID or Email
  title: string;
  tracks: any; // JSONB
  tags: string[];
  vibe_metrics: any; // JSONB
  created_at: string;
  deezer_link?: string;
}

