import { motion } from "framer-motion";
import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "./Card";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  delay: number;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  icon,
  path,
  delay,
}) => {
  const navigate = useNavigate();

  const iconVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.2,
      rotate: 5,
      filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))",
      transition: { duration: 0.3, yoyo: Infinity, repeatDelay: 0.5 },
    },
  };

  const textVariants = {
    initial: { x: 0 },
    hover: {
      x: 5,
      textShadow: "0 0 8px rgba(59, 130, 246, 0.8)",
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: delay * 0.15,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(path)}
      className="h-full"
      role="button"
      aria-label={`Accéder à ${title}`}
      tabIndex={0}
    >
      <Card
        hoverable
        bordered
        className="h-full cursor-pointer flex flex-col bg-white dark:bg-[#0f172a] border-2 border-transparent dark:hover:border-blue-500/40 hover:border-blue-500/40 backdrop-blur-sm"
      >
        <motion.div
          className="mb-4 p-3 rounded-lg w-fit text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/50 backdrop-blur-sm relative overflow-hidden"
          variants={iconVariants}
          initial="initial"
          whileHover="hover"
        >
          <div className="z-10 relative">{icon}</div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-sm"></div>
        </motion.div>

        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100 font-['Rajdhani',sans-serif] tracking-wide">
          {title}
        </h3>

        <p className="flex-grow text-gray-600 dark:text-gray-300">
          {description}
        </p>

        <div className="flex justify-end mt-4">
          <motion.div
            className="font-medium text-sm text-blue-500 dark:text-blue-400"
            variants={textVariants}
            initial="initial"
            whileHover="hover"
          >
            Accéder →
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

export default DashboardCard;
