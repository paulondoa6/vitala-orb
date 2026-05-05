import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VitalScoreProps {
  score: number;
  size?: "sm" | "lg";
}

export const VitalScore = ({ score, size = "sm" }: VitalScoreProps) => {
  const dim = size === "lg" ? 72 : 52;
  const stroke = size === "lg" ? 6 : 4;
  const r = (dim - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone =
    score >= 80 ? "text-primary" : score >= 60 ? "text-accent" : "text-muted-foreground";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} className="-rotate-90">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-muted/60"
          fill="none"
        />
        <motion.circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn(tone)}
          stroke="currentColor"
          fill="none"
          initial={{ strokeDasharray: c, strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-semibold leading-none", size === "lg" ? "text-xl" : "text-sm", tone)}>
          {score}
        </span>
        <span className={cn("text-[8px] uppercase tracking-widest text-muted-foreground", size === "lg" ? "mt-0.5" : "")}>
          /100
        </span>
      </div>
    </div>
  );
};
