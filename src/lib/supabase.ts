import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables d'environnement Supabase manquantes: NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type pour les véhicules
export interface Vehicle {
  id: string;
  vin: string;
  created_at: string;
  synced: boolean;
  user_id?: string;
}

// Type pour les utilisateurs
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: "admin" | "user";
  created_at: string;
}
