import { useLocation } from "react-router-dom";
import { LayoutGrid, Zap, MapPin, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { NavItem } from "./NavItem";
import { ScanButton } from "./ScanButton";

const items = [
  { to: "/", icon: Zap, label: "Flash" },
  { to: "/map", icon: MapPin, label: "Zone" },
];
const itemsRight = [
  { to: "/activity", icon: Activity, label: "Activity" },
  { to: "/settings", icon: Settings, label: "Paramètres" },
];

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
      <div role="tablist" aria-orientation="horizontal" className="glass shadow-float relative flex w-full max-w-md items-stretch gap-0.5 rounded-[2rem] px-2 py-1.5">
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
