import { useLocation } from "react-router-dom";
import { LayoutGrid, Zap, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { NavItem } from "./NavItem";
import { ScanButton } from "./ScanButton";

const items = [
  { to: "/flash", icon: Zap, label: "Flash" },
  { to: "/zone", icon: MapPin, label: "Zone" },
];
const itemsRight = [{ to: "/espace", icon: LayoutGrid, label: "Espace" }];

export const BottomNav = () => {
  const { pathname } = useLocation();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
      aria-label="Navigation principale"
      role="navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="glass shadow-float relative flex w-full max-w-md items-stretch gap-0.5 rounded-[2rem] px-2 py-1.5"
      >
        {/* Ambient glow that softly follows the active tab via the layoutId pill in NavItem */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -top-6 left-1/2 h-12 w-32 -translate-x-1/2 rounded-full bg-gradient-primary opacity-30 blur-2xl"
          animate={{ opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />
        {items.map((it) => (
          <NavItem key={it.to} {...it} active={isActive(it.to)} />
        ))}
        <ScanButton active={pathname.startsWith("/scan")} />
        {itemsRight.map((it) => (
          <NavItem key={it.to} {...it} active={isActive(it.to)} />
        ))}
      </div>
    </motion.nav>
  );
};
