import axios from "axios";
import { motion } from "framer-motion";
import {
  BarChart,
  Building,
  Calendar,
  ClipboardList,
  Home,
  LogOut,
  Plane,
  Settings,
  User as UserIcon,
  Users,
} from "lucide-react";
import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";

import planningAnimation from "../../assets/animations/planning-animation.json";
import { User } from "../../types/User";
import { getEnvVar } from "../../utils/getEnv";

const EnhancedLottie = lazy(() => import("../ui/EnhancedLottie"));

export interface SidebarMenuProps {
  activeItem: string;
  onNavigate: (route: string) => void;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  companyName?: string;
  companyLogoUrl?: string;
  className?: string;
  user?: User | null;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: Home,
    route: "/tableau-de-bord",
  },
  {
    id: "plannings",
    label: "Plannings",
    icon: Calendar,
    route: "/plannings-hebdomadaires",
  },
  {
    id: "conges",
    label: "Demandes de congés",
    icon: Plane,
    route: "/gestion-des-conges",
  },
  {
    id: "taches",
    label: "Tâches",
    icon: ClipboardList,
    route: "/taches-employes",
  },
  {
    id: "collaborateurs",
    label: "Collaborateurs",
    icon: Users,
    route: "/collaborateurs",
  },
  {
    id: "statistiques",
    label: "Statistiques",
    icon: BarChart,
    route: "/statistiques",
  },
];

const userMenuItems = [
  {
    id: "parametres",
    label: "Paramètres",
    icon: Settings,
    route: "/parametres",
  },
  { id: "profil", label: "Mon profil", icon: UserIcon, route: "/profil" },
];

const adminMenuItem = {
  id: "users",
  label: "Gestion des utilisateurs",
  icon: Users,
  route: "/gestion-des-utilisateurs",
};

const companyManagementMenuItem = {
  id: "gestion-des-entreprises",
  label: "Gestion des entreprises",
  icon: Building,
  route: "/gestion-des-entreprises",
};

const SidebarMenu: React.FC<SidebarMenuProps> = ({
  activeItem,
  onNavigate,
  firstName,
  lastName,
  photoUrl,
  companyName = "SmartPlanning",
  companyLogoUrl,
  className = "",
  user,
}) => {
  const [companyData, setCompanyData] = useState<{
    name: string;
    logoUrl?: string;
  } | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user?.companyId) return;

      try {
        const token = localStorage.getItem("token");
        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        const response = await axios.get(
          `${getEnvVar("VITE_API_URL")}/admin/companies/${user.companyId}`
        );

        if (response.data.success) {
          setCompanyData({
            name: response.data.data.name,
            logoUrl: response.data.data.logoUrl,
          });
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des infos entreprise:",
          error
        );
      }
    };

    fetchCompany();
  }, [user?.companyId]);

  const dynamicMenuItems = useMemo(() => {
    let items = [...menuItems];

    // Supprimer "Collaborateurs" uniquement pour les admins
    if (user?.role === "admin") {
      items = items.filter((item) => item.id !== "collaborateurs");
      items.push(adminMenuItem, companyManagementMenuItem);
    }

    return items;
  }, [user]);

  const renderMenuItem = (item: (typeof menuItems)[0]) => {
    const isActive = activeItem === item.id;
    return (
      <motion.li
        key={item.id}
        className="mb-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => onNavigate(item.route)}
      >
        <motion.div
          className={`relative flex items-center w-full p-3 rounded-lg text-left transition-all duration-200 ease-in-out ${
            isActive
              ? "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-l-4 border-violet-600 dark:border-violet-400"
              : "text-gray-700 hover:bg-violet-50/50 hover:text-violet-700 dark:text-gray-300 dark:hover:bg-violet-900/20 dark:hover:text-violet-300 border-l-4 border-transparent"
          }`}
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <motion.div
            whileHover={{ rotate: isActive ? 0 : 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="mr-3 flex-shrink-0"
          >
            <item.icon
              size={20}
              className={`$${
                isActive
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            />
          </motion.div>
          <span className="text-[15px] font-medium tracking-wide">
            {item.label}
          </span>
        </motion.div>
      </motion.li>
    );
  };

  return (
    <div
      className={`flex flex-col h-full shadow-md border-r border-violet-100 dark:border-violet-900 bg-gradient-to-b from-violet-50 to-white dark:from-violet-950 dark:to-gray-900 w-64 flex-shrink-0 ${className}`}
    >
      <div className="p-4 border-b border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-100/70 to-violet-50/70 dark:from-violet-900/30 dark:to-violet-950/30">
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-10 h-10 flex-shrink-0"
          >
            {companyData?.logoUrl ? (
              <img
                src={companyData.logoUrl}
                alt={`${companyData.name} logo`}
                className="w-full h-full object-contain rounded-md"
              />
            ) : (
              <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-violet-500 to-indigo-600 dark:from-violet-400 dark:to-indigo-500 rounded-md flex items-center justify-center">
                <Suspense
                  fallback={
                    <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/50 rounded-md animate-pulse"></div>
                  }
                >
                  <EnhancedLottie
                    animationData={planningAnimation}
                    loop={true}
                    style={{ width: "100%", height: "100%" }}
                  />
                </Suspense>
              </div>
            )}
          </motion.div>
          <div className="flex flex-col">
            <motion.span
              className="text-sm font-bold text-violet-800 dark:text-violet-200"
              whileHover={{ scale: 1.03, x: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {companyData?.name || companyName}
            </motion.span>
            <span className="text-xs text-violet-600/70 dark:text-violet-300/70">
              Espace entreprise
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-violet-300 dark:scrollbar-thumb-violet-700 scrollbar-track-transparent">
        <div className="mb-6">
          <h2 className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-violet-700/80 dark:text-violet-400/80">
            Navigation
          </h2>
          <ul>{dynamicMenuItems.map(renderMenuItem)}</ul>
        </div>
        <div className="mx-3 my-4 border-t border-violet-200 dark:border-violet-800 opacity-50"></div>
        <div>
          <h2 className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-violet-700/80 dark:text-violet-400/80">
            Mon espace
          </h2>
          <ul>{userMenuItems.map(renderMenuItem)}</ul>
        </div>
      </div>

      <div className="border-t border-violet-100 dark:border-violet-900 p-4 mt-auto bg-gradient-to-b from-white to-violet-50/70 dark:from-gray-900 dark:to-violet-950/30">
        <motion.button
          onClick={() => onNavigate("/logout")}
          whileHover={{
            scale: 1.03,
            backgroundColor: "rgba(254, 226, 226, 0.6)",
          }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
        >
          <motion.div
            whileHover={{ rotate: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="mr-3"
          >
            <LogOut size={20} />
          </motion.div>
          <span className="text-[15px] font-medium tracking-wide">
            Déconnexion
          </span>
        </motion.button>
      </div>
    </div>
  );
};

export default SidebarMenu;
