import { motion } from "framer-motion";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-red-50 to-white dark:from-red-950 dark:to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 15,
            delay: 0.2,
          }}
          className="flex justify-center mb-6"
        >
          <ShieldAlert size={80} className="text-red-500 dark:text-red-400" />
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          Accès non autorisé
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette
          page. Veuillez contacter votre administrateur si vous pensez qu'il
          s'agit d'une erreur.
        </p>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            to="/tableau-de-bord"
            className="inline-flex items-center px-5 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Retour au tableau de bord
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;
