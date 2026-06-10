import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl bg-muted/70",
      "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
      "before:bg-gradient-to-r before:from-transparent before:via-background/60 before:to-transparent",
      className,
    )}
  />
);

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = ({
  title = "Une erreur est survenue",
  description = "Impossible de charger les données. Veuillez réessayer.",
  onRetry,
  className,
}: ErrorStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-3xl glass shadow-float px-6 py-10 text-center",
      className,
    )}
    role="alert"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
      <AlertTriangle className="h-5 w-5" />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-semibold tracking-tight">{title}</p>
      <p className="mx-auto max-w-[32ch] text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
    {onRetry && (
      <Button
        onClick={onRetry}
        size="sm"
        className="mt-1 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow"
      >
        <RefreshCw className="mr-1 h-3.5 w-3.5" /> Réessayer
      </Button>
    )}
  </motion.div>
);


interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}

export const PageHeader = ({ eyebrow, title, subtitle, className }: PageHeaderProps) => (
  <motion.header
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className={cn("pt-2", className)}
  >
    {eyebrow && (
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
        {eyebrow}
      </p>
    )}
    <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight text-foreground">
      {title}
    </h1>
    {subtitle && (
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-[32ch]">
        {subtitle}
      </p>
    )}
  </motion.header>
);

interface SectionLabelProps {
  label: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export const SectionLabel = ({ label, trailing, className }: SectionLabelProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4, delay: 0.15 }}
    className={cn("mt-7 flex items-center justify-between", className)}
  >
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </h2>
    <span className="h-px flex-1 ml-3 bg-gradient-to-r from-border to-transparent" />
    {trailing && <span className="ml-3 text-[11px] text-muted-foreground">{trailing}</span>}
  </motion.div>
);

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-3xl glass shadow-float px-6 py-10 text-center",
      className,
    )}
  >
    {icon && (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
    )}
    <div className="space-y-1">
      <p className="text-sm font-semibold tracking-tight">{title}</p>
      {description && (
        <p className="mx-auto max-w-[30ch] text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
    {action}
  </motion.div>
);

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export const LoadingState = ({ label = "Chargement…", className }: LoadingStateProps) => (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-3xl glass shadow-float px-6 py-10 text-center",
      className,
    )}
  >
    <Loader2 className="h-5 w-5 animate-spin text-primary" />
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
  </div>
);
