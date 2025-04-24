import { motion } from "framer-motion";
import { Edit, Users } from "lucide-react";
import React from "react";

// Composants UI
import SectionTitle from "../../../components/layout/SectionTitle";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

/**
 * Interface pour le type Manager
 */
interface Manager {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Interface pour le type Employee
 */
interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

/**
 * Interface pour le type Team
 */
interface Team {
  _id: string;
  name: string;
  managerIds: Manager[];
  employeeIds: Employee[];
}

/**
 * Interface pour les props du composant
 */
interface TeamDetailPanelProps {
  team: Team;
  onEditClick: () => void;
}

/**
 * Composant TeamDetailPanel
 *
 * Affiche les détails d'une équipe avec ses managers et employés
 */
const TeamDetailPanel: React.FC<TeamDetailPanelProps> = ({
  team,
  onEditClick,
}) => {
  // Animation pour l'entrée du composant
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  // Animation pour les éléments enfants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className="w-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* En-tête avec le nom de l'équipe et bouton de modification */}
      <motion.div
        className="flex justify-between items-center mb-6"
        variants={itemVariants}
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {team.name}
        </h2>
        <Button
          variant="ghost"
          onClick={onEditClick}
          icon={<Edit size={18} />}
          aria-label="Modifier l'équipe"
        >
          Modifier
        </Button>
      </motion.div>

      {/* Section des managers */}
      <motion.div className="mb-6" variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className="p-5">
            <SectionTitle
              title="Managers"
              icon={<Users className="h-5 w-5 text-indigo-500" />}
              className="mb-4"
            />
            {team.managerIds.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Aucun manager assigné à cette équipe
              </p>
            ) : (
              <div className="space-y-4">
                {team.managerIds.map((manager) => (
                  <div
                    key={manager._id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {manager.firstName} {manager.lastName}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {manager.email}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Manager
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Section des employés */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className="p-5">
            <SectionTitle
              title="Employés"
              icon={<Users className="h-5 w-5 text-indigo-500" />}
              className="mb-4"
            />
            {team.employeeIds.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Aucun employé assigné à cette équipe
              </p>
            ) : (
              <div className="space-y-4">
                {team.employeeIds.map((employee) => (
                  <div
                    key={employee._id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {employee.email}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.status === "actif"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {employee.status === "actif" ? "Actif" : "Inactif"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default TeamDetailPanel;
