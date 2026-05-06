import { useLocation } from "react-router-dom";
import { Activity, Home, Map } from "lucide-react";
import { motion } from "framer-motion";
import { NavItem } from "./NavItem";
import { ScanButton } from "./ScanButton";

const items = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/map", icon: Map, label: "Map" },
];
const itemsRight = [
  { to: "/activity", icon: Activity, label: "Activity" },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="glass shadow-float relative flex w-full max-w-md items-stretch rounded-[2rem] px-2 py-1.5">
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
