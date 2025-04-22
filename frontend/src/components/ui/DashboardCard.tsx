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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: delay * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.03 }}
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
        className="h-full cursor-pointer flex flex-col bg-white dark:bg-[#0f172a]"
      >
        <div className="mb-4 p-3 rounded-lg w-fit text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/20">
          {icon}
        </div>

        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
          {title}
        </h3>

        <p className="flex-grow text-gray-600 dark:text-gray-300">
          {description}
        </p>

        <div className="flex justify-end mt-4">
          <motion.div
            className="font-medium text-sm text-blue-500 dark:text-blue-400"
            whileHover={{ x: 5 }}
          >
            Accéder →
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

export default DashboardCard;
