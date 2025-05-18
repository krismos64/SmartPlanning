import { motion } from "framer-motion";
import React from "react";

interface CardGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: string; // ex: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
}

const CardGrid: React.FC<CardGridProps> = ({
  children,
  className = "",
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}) => {
  return (
    <motion.div
      className={`grid ${columns} gap-8 w-full ${className} relative`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.4,
          },
        },
      }}
    >
      <div
        className="absolute inset-0 -z-10 bg-grid-slate-50/[0.05] dark:bg-grid-slate-700/[0.05]"
        style={{
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,1), rgba(0,0,0,0))",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,1), rgba(0,0,0,0))",
        }}
      ></div>
      {children}
    </motion.div>
  );
};

export default CardGrid;
