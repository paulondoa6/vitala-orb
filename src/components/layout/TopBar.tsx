import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Bell, User, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import avatarImg from "@/assets/avatar.jpg";
import { listNotifications, markAllNotificationsRead, type AppNotification } from "@/core/notifications";

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

export const TopBar = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    setItems(listNotifications());
    if (!open) return;
    markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-40 w-full"
    >
      <div className="glass">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-5">
          {/* Logo Vitala */}
          <Link
            to="/"
            aria-label="Vitala — accueil"
            className="flex h-11 w-11 items-center justify-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <motion.span
              whileTap={{ scale: 0.92 }}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow"
            >
              <Zap className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.4} />
            </motion.span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label={unread > 0 ? `Notifications, ${unread} non lues` : "Notifications"}
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl glass shadow-float text-foreground transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Bell className="h-4.5 w-4.5" strokeWidth={2.2} />
                  <AnimatePresence>
                    {unread > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground"
                      >
                        {unread > 9 ? "9+" : unread}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm">
                <SheetHeader>
                  <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2" aria-live="polite">
                  {items.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      Rien pour l'instant. On te prévient dès que quelque chose bouge.
                    </p>
                  ) : (
                    items.map((n) => (
                      <div key={n.id} className="rounded-2xl glass p-3">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground/70">{formatTime(n.at)}</p>
                      </div>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Profil */}
            <Link
              to="/profile"
              aria-label="Mon profil"
              className="flex h-11 w-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <motion.div
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className="overflow-hidden rounded-full ring-1 ring-border/60"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarImg} alt="Avatar du profil" />
                  <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary-glow text-primary-foreground">
                    <User className="h-4 w-4" strokeWidth={2.4} />
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
