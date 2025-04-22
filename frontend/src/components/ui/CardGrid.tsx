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
      className={`grid ${columns} gap-6 w-full ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

export default CardGrid;
