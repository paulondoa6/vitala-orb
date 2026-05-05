import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface FlashLiveBadgeProps {
  endsAt: number;
}

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

export const FlashLiveBadge = ({ endsAt }: FlashLiveBadgeProps) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = endsAt - now;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-glow"
    >
      <motion.span
        animate={{ scale: [1, 1.25, 1], rotate: [0, -8, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Zap className="h-3 w-3 fill-current" />
      </motion.span>
      <span>Flash Live</span>
      <span className="ml-1 rounded-full bg-background/25 px-1.5 py-0.5 font-mono tabular-nums">
        {fmt(remaining)}
      </span>
    </motion.div>
  );
};
