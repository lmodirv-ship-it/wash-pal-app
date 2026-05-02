import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  id: number;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  signup_enabled: boolean;
  welcome_message: string | null;
  brand_logo_url: string | null;
  brand_primary_color: string | null;
  updated_at: string;
}

export function useAppSettings() {
  return useQuery({
    queryKey: ["app_settings"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings" as any)
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AppSettings | null;
    },
  });
}

export interface FeatureFlag {
  id: string;
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  category: string;
  updated_at: string;
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ["feature_flags"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags" as any)
        .select("*")
        .order("category", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as FeatureFlag[];
    },
  });
}

export function useFeatureEnabled(key: string): boolean {
  const { data } = useFeatureFlags();
  if (!data) return true; // optimistic — don't hide UI before flags load
  const f = data.find((x) => x.key === key);
  return f?.enabled ?? true;
}