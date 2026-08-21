import { useCallback, useEffect, useState } from "react";
import type { GeoPoint } from "./db";

export type PermissionKind = "geolocation" | "camera" | "notifications";
export type PermissionState = "unknown" | "prompt" | "granted" | "denied";

const queryState = async (kind: PermissionKind): Promise<PermissionState> => {
  if (typeof navigator === "undefined" || !("permissions" in navigator)) return "unknown";
  const name = kind === "notifications" ? "notifications" : kind;
  try {
    const status = await navigator.permissions.query({ name: name as PermissionName });
    return status.state as PermissionState;
  } catch {
    return "unknown";
  }
};

/**
 * Contextual permission handling: we never ask on boot, only when a feature
 * genuinely needs it, and we always keep a usable fallback.
 */
export const usePermission = (kind: PermissionKind) => {
  const [state, setState] = useState<PermissionState>("unknown");

  useEffect(() => {
    let alive = true;
    queryState(kind).then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, [kind]);

  const request = useCallback(async (): Promise<PermissionState> => {
    if (kind === "geolocation") {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setState("denied");
        return "denied";
      }
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            setState("granted");
            resolve("granted");
          },
          () => {
            setState("denied");
            resolve("denied");
          },
          { enableHighAccuracy: true, timeout: 8000 },
        );
      });
    }
    if (kind === "notifications") {
      if (typeof Notification === "undefined") {
        setState("denied");
        return "denied";
      }
      const res = await Notification.requestPermission();
      const mapped: PermissionState = res === "default" ? "prompt" : (res as PermissionState);
      setState(mapped);
      return mapped;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setState("granted");
      return "granted";
    } catch {
      setState("denied");
      return "denied";
    }
  }, [kind]);

  return { state, request };
};

/** Best-effort position. Resolves to null instead of throwing so callers keep working. */
export const getPosition = (): Promise<GeoPoint | null> =>
  new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  });
