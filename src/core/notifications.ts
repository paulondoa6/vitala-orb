export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string; // ISO
  read: boolean;
}

const KEY = "vitala.notifications.v1";
const MAX = 50;

const load = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
};

const save = (items: AppNotification[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    // stockage plein ou indisponible — silencieux
  }
};

export const listNotifications = (): AppNotification[] => load();

export const pushNotification = (title: string, body: string) => {
  const items = load();
  items.unshift({
    id: crypto.randomUUID?.() ?? `${Date.now()}`,
    title,
    body,
    at: new Date().toISOString(),
    read: false,
  });
  save(items);
};

export const markAllNotificationsRead = () => {
  save(load().map((n) => ({ ...n, read: true })));
};
