import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import avatarImg from "@/assets/avatar.jpg";

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
          <Link
            to="/"
            aria-label="Accueil"
            className="flex h-9 w-9 items-center justify-center rounded-full glass shadow-float text-foreground transition-colors hover:text-primary"
          >
            <Home className="h-4.5 w-4.5" strokeWidth={2.2} />
          </Link>
          <Link to="/" aria-label="Vitalio home" className="flex items-baseline gap-0.5">
            <span className="font-semibold text-xl tracking-tight text-foreground lowercase">
              vital
            </span>
            <span className="font-semibold text-xl tracking-tight bg-gradient-primary bg-clip-text text-transparent lowercase">
              io
            </span>
            <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-gradient-primary shadow-glow" />
          </Link>
          <Link to="/profile" aria-label="Profile">
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="rounded-full ring-1 ring-border/60"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarImg} alt="Profile avatar" />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                  V
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.header>
  );
};
