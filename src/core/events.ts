/** Tiny event bus: the only way modules talk to each other. */
export type AppEvent =
  | { type: "flash:published"; id: string }
  | { type: "flash:closed"; id: string }
  | { type: "zone:joined"; zoneId: string }
  | { type: "identity:updated" }
  | { type: "espace:created"; uuid: string }
  | { type: "sync:changed" };

type Handler = (event: AppEvent) => void;

const handlers = new Set<Handler>();

export const emit = (event: AppEvent) => handlers.forEach((h) => h(event));

export const subscribe = (handler: Handler) => {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
};
