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
      aria-current={active ? "page" : undefined}
      role="tab"
      aria-selected={active}
      className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-w-0 rounded-2xl outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-x-2 inset-y-1 rounded-2xl bg-primary/10"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <motion.div
        animate={{ scale: active ? 1.12 : 1, y: active ? -1 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="relative flex h-5 w-5 items-center justify-center"
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
          "relative text-[10px] font-medium tracking-wide truncate transition-colors",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </Link>
  );
};
