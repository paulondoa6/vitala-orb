import { supabase } from "@/integrations/supabase/client";

/**
 * Couche de lecture distante : une vue = un écran.
 * Chaque fonction ne retourne que les champs affichés par son écran.
 */

export interface FlashFeedRow {
  id: string;
  body: string;
  category: string;
  zone_id: string | null;
  lat: number | null;
  lng: number | null;
  reply_count: number;
  created_at: string;
  expires_at: string;
  author_id: string;
  author_first_name: string | null;
  author_avatar_url: string | null;
}

export interface ZoneListRow {
  id: string;
  name: string;
  city: string;
  pulse: number;
  lat: number | null;
  lng: number | null;
  radius_m: number;
  active_flash_count: number;
  member_count: number;
}

export interface EspacePublicRow {
  id: string;
  public_code: string;
  name: string;
  type: string;
  city: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  service_count: number;
}

export interface ProfilePublicRow {
  id: string;
  first_name: string;
  avatar_url: string | null;
  city: string | null;
}

const unwrap = <T>(data: T | null, error: { message: string } | null): T => {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
};

export const fetchFlashFeed = async (limit = 50): Promise<FlashFeedRow[]> => {
  const { data, error } = await supabase
    .from("v_flash_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return unwrap<FlashFeedRow[]>(data as FlashFeedRow[] | null, error);
};

export const fetchZoneList = async (limit = 50): Promise<ZoneListRow[]> => {
  const { data, error } = await supabase
    .from("v_zone_list")
    .select("*")
    .order("pulse", { ascending: false })
    .limit(limit);
  return unwrap<ZoneListRow[]>(data as ZoneListRow[] | null, error);
};

export const fetchPublicEspaces = async (limit = 50): Promise<EspacePublicRow[]> => {
  const { data, error } = await supabase
    .from("v_espace_public")
    .select("*")
    .limit(limit);
  return unwrap<EspacePublicRow[]>(data as EspacePublicRow[] | null, error);
};

export const fetchPublicProfile = async (id: string): Promise<ProfilePublicRow | null> => {
  const { data, error } = await supabase
    .from("v_profile_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ProfilePublicRow | null) ?? null;
};
