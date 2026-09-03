import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/core/geo";

/**
 * Module Radar — veilles et alertes de l'utilisateur.
 * Backend réel (tables `radar_watches` / `radar_alerts`), aucune UI ici.
 */

export interface RadarWatchDTO {
  id: string;
  label: string;
  categories: string[];
  radiusLabel: string;
  radiusM: number;
  zoneId: string | null;
  active: boolean;
}

export interface RadarAlertDTO {
  id: string;
  title: string;
  ageLabel: string;
  read: boolean;
  href: string | null;
}

export interface RadarScreenDTO {
  watches: RadarWatchDTO[];
  alerts: RadarAlertDTO[];
  unread: number;
}

const fail = (message: string | undefined): never => {
  throw new Error(message ?? "On n'arrive pas à joindre ton radar.");
};

export const radiusLabel = (m: number) =>
  m < 1000 ? `${m} m autour de moi` : `${(m / 1000).toFixed(1)} km autour de moi`;

const alertHref = (sourceType: string, sourceId: string | null): string | null => {
  if (!sourceId) return null;
  if (sourceType === "flash") return `/flash/${sourceId}`;
  if (sourceType === "zone") return `/zone/${sourceId}`;
  if (sourceType === "espace") return `/espace/${sourceId}`;
  return null;
};

export const listWatches = async (): Promise<RadarWatchDTO[]> => {
  const { data, error } = await supabase
    .from("radar_watches")
    .select("id,label,categories,radius_m,zone_id,is_active")
    .order("created_at", { ascending: false });
  if (error) fail(error.message);
  return (data ?? []).map((w) => ({
    id: w.id,
    label: w.label,
    categories: w.categories ?? [],
    radiusM: w.radius_m,
    radiusLabel: radiusLabel(w.radius_m),
    zoneId: w.zone_id,
    active: w.is_active,
  }));
};

export interface CreateWatchInput {
  label: string;
  categories: string[];
  radiusM: number;
  zoneId?: string | null;
}

export const createWatch = async (input: CreateWatchInput): Promise<RadarWatchDTO> => {
  const label = input.label.trim();
  if (label.length < 2) throw new Error("Donne un nom à ta veille.");
  const { data: session } = await supabase.auth.getUser();
  const userId = session.user?.id;
  if (!userId) throw new Error("Connecte-toi pour créer une veille.");

  const { data, error } = await supabase
    .from("radar_watches")
    .insert({
      user_id: userId,
      label,
      categories: input.categories,
      radius_m: input.radiusM,
      zone_id: input.zoneId ?? null,
    })
    .select("id,label,categories,radius_m,zone_id,is_active")
    .single();
  if (error || !data) fail(error?.message);
  return {
    id: data!.id,
    label: data!.label,
    categories: data!.categories ?? [],
    radiusM: data!.radius_m,
    radiusLabel: radiusLabel(data!.radius_m),
    zoneId: data!.zone_id,
    active: data!.is_active,
  };
};

export const toggleWatch = async (id: string, active: boolean): Promise<void> => {
  const { error } = await supabase
    .from("radar_watches")
    .update({ is_active: active })
    .eq("id", id);
  if (error) fail(error.message);
};

export const deleteWatch = async (id: string): Promise<void> => {
  const { error } = await supabase.from("radar_watches").delete().eq("id", id);
  if (error) fail(error.message);
};

export const listAlerts = async (limit = 50): Promise<RadarAlertDTO[]> => {
  const { data, error } = await supabase
    .from("radar_alerts")
    .select("id,title,source_type,source_id,is_read,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail(error.message);
  return (data ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    ageLabel: timeAgo(new Date(a.created_at).getTime()),
    read: a.is_read,
    href: alertHref(a.source_type, a.source_id),
  }));
};

export const markAlertRead = async (id: string): Promise<void> => {
  const { error } = await supabase.from("radar_alerts").update({ is_read: true }).eq("id", id);
  if (error) fail(error.message);
};

/** Vue Radar : veilles + alertes, rien d'autre (contrat `radar`). */
export const getRadarScreen = async (): Promise<RadarScreenDTO> => {
  const [watches, alerts] = await Promise.all([listWatches(), listAlerts()]);
  return { watches, alerts, unread: alerts.filter((a) => !a.read).length };
};
