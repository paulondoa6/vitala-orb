import { useEffect, useState, useCallback } from "react";
import { z } from "zod";
import avatarImg from "@/assets/avatar.jpg";

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Au moins 2 caractères" })
    .max(40, { message: "40 caractères max" }),
  location: z
    .string()
    .trim()
    .min(2, { message: "Au moins 2 caractères" })
    .max(60, { message: "60 caractères max" }),
  avatar: z.string().min(1),
  level: z.number().int().min(1).max(99),
  xp: z.number().int().min(0).max(1000),
});

export type Profile = z.infer<typeof profileSchema>;

const KEY = "vitalio.profile.v1";

const DEFAULT: Profile = {
  name: "Vitala User",
  location: "Paris, FR",
  avatar: avatarImg,
  level: 7,
  xp: 820,
};

const read = (): Profile => {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = profileSchema.safeParse({ ...DEFAULT, ...JSON.parse(raw) });
    return parsed.success ? parsed.data : DEFAULT;
  } catch {
    return DEFAULT;
  }
};

const listeners = new Set<(p: Profile) => void>();
let current: Profile = read();

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile>(current);
  useEffect(() => {
    const cb = (p: Profile) => setProfile(p);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  const update = useCallback((patch: Partial<Profile>) => {
    current = { ...current, ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {}
    listeners.forEach((l) => l(current));
  }, []);
  return { profile, update };
};

// Notification preferences
export type NotifKey = "flash" | "urgences" | "reco" | "rappels";

export const notifSchema = z.object({
  flash: z.boolean(),
  urgences: z.boolean(),
  reco: z.boolean(),
  rappels: z.boolean(),
});

export type NotifPrefs = z.infer<typeof notifSchema>;

const NKEY = "vitalio.notif.v1";

const NDEFAULT: NotifPrefs = {
  flash: true,
  urgences: true,
  reco: true,
  rappels: false,
};

const readN = (): NotifPrefs => {
  if (typeof window === "undefined") return NDEFAULT;
  try {
    const raw = localStorage.getItem(NKEY);
    if (!raw) return NDEFAULT;
    const parsed = notifSchema.safeParse({ ...NDEFAULT, ...JSON.parse(raw) });
    return parsed.success ? parsed.data : NDEFAULT;
  } catch {
    return NDEFAULT;
  }
};

const nListeners = new Set<(p: NotifPrefs) => void>();
let nCurrent: NotifPrefs = readN();

export type SyncStatus = "idle" | "saving" | "saved" | "error";

export const useNotifPrefs = () => {
  const [prefs, setPrefs] = useState<NotifPrefs>(nCurrent);
  const [status, setStatus] = useState<SyncStatus>("idle");

  useEffect(() => {
    const cb = (p: NotifPrefs) => setPrefs(p);
    nListeners.add(cb);
    return () => {
      nListeners.delete(cb);
    };
  }, []);

  const toggle = useCallback((key: NotifKey, value: boolean) => {
    nCurrent = { ...nCurrent, [key]: value };
    nListeners.forEach((l) => l(nCurrent));
    setStatus("saving");
    // Simulate instant remote save
    setTimeout(() => {
      try {
        localStorage.setItem(NKEY, JSON.stringify(nCurrent));
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1400);
      } catch {
        setStatus("error");
      }
    }, 350);
  }, []);

  return { prefs, status, toggle };
};
