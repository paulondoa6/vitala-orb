import { motion } from "framer-motion";
import { ScanLine } from "lucide-react";
import { Link } from "react-router-dom";

interface ScanButtonProps {
  active: boolean;
}

export const ScanButton = ({ active }: ScanButtonProps) => {
  return (
    <div className="relative -mt-8 flex flex-1 items-start justify-center">
      <Link to="/scan" aria-label="Scan" className="relative block">
        {/* Pulse halo */}
        <motion.span
          className="absolute inset-0 rounded-full bg-gradient-primary"
          animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="absolute inset-0 rounded-full bg-primary-glow/60"
          animate={{ scale: [1, 1.6, 1], opacity: [0.35, 0, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        />

        <motion.div
          whileTap={{ scale: 0.92 }}
          animate={{ scale: active ? 1.06 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow ring-4 ring-background/80"
        >
          <ScanLine className="h-7 w-7 text-primary-foreground" strokeWidth={2.4} />
        </motion.div>
      </Link>
    </div>
  );
};
