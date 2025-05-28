/**
 * Composant pour afficher les statistiques des demandes de congés
 */
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Clock, XCircle } from "lucide-react";
import React from "react";
import SectionCard from "../layout/SectionCard";
import { VacationRequest } from "./types";
import { UserRole, useVacationPermissions } from "./useVacationPermissions";

interface VacationStatsProps {
  requests: VacationRequest[];
  userRole: UserRole;
}

const slideInAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, type: "spring", stiffness: 100 },
};

const VacationStats: React.FC<VacationStatsProps> = ({
  requests,
  userRole,
}) => {
  const permissions = useVacationPermissions(userRole);

  if (!permissions.canViewAllRequests) {
    return null;
  }

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      icon: <CalendarDays size={20} />,
      color: "bg-blue-500",
    },
    {
      label: "En attente",
      value: stats.pending,
      icon: <Clock size={20} />,
      color: "bg-yellow-500",
    },
    {
      label: "Approuvées",
      value: stats.approved,
      icon: <CheckCircle2 size={20} />,
      color: "bg-green-500",
    },
    {
      label: "Refusées",
      value: stats.rejected,
      icon: <XCircle size={20} />,
      color: "bg-red-500",
    },
  ];

  return (
    <motion.div {...slideInAnimation} transition={{ delay: 0.05 }}>
      <SectionCard title="Statistiques" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`${stat.color} rounded-full p-3 text-white flex items-center justify-center`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </motion.div>
  );
};

export default VacationStats;
