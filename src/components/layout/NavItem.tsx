import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}

export const NavItem = ({ to, icon: Icon, label, active }: NavItemProps) => {
  return (
    <Link
      to={to}
      aria-label={label}
      className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
    >
      {active && (
        <motion.span
          layoutId="nav-indicator"
          className="absolute -top-0.5 h-1 w-1 rounded-full bg-primary shadow-glow"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <motion.div
        animate={{ scale: active ? 1.12 : 1, y: active ? -1 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
      >
        <Icon
          className={cn(
            "h-5 w-5 transition-colors",
            active ? "text-primary" : "text-muted-foreground"
          )}
          strokeWidth={active ? 2.4 : 2}
        />
      </motion.div>
      <span
        className={cn(
          "text-[10px] font-medium tracking-wide transition-colors",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </Link>
  );
};
