import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const TopBar = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-40 w-full"
    >
      <div className="glass">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-5">
          <div className="w-9" aria-hidden />
          <h1 className="text-lg font-semibold tracking-[0.2em] text-foreground">
            VITALA
          </h1>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="rounded-full ring-1 ring-border/60"
            aria-label="Profile"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src="" alt="" />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                V
              </AvatarFallback>
            </Avatar>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};
