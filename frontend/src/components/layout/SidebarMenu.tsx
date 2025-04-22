import { motion } from "framer-motion";
import {
  BarChart,
  Calendar,
  ClipboardList,
  Home,
  LogOut,
  Plane,
  Settings,
  User,
  Users,
} from "lucide-react";
import React, { lazy, Suspense } from "react";

// Import pour le logo animé (optionnel)
import planningAnimation from "../../assets/animations/planning-animation.json";
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
}

const menuItems = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: Home,
    route: "/dashboard",
  },
  {
    id: "plannings",
    label: "Plannings",
    icon: Calendar,
    route: "/plannings",
  },
  {
    id: "conges",
    label: "Demandes de congés",
    icon: Plane,
    route: "/conges",
  },
  {
    id: "taches",
    label: "Tâches",
    icon: ClipboardList,
    route: "/taches",
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
  {
    id: "profil",
    label: "Mon profil",
    icon: User,
    route: "/profil",
  },
];

const SidebarMenu: React.FC<SidebarMenuProps> = ({
  activeItem,
  onNavigate,
  firstName,
  lastName,
  photoUrl,
  companyName = "Acme Corporation",
  companyLogoUrl,
  className = "",
}) => {
  const handleItemClick = (route: string) => {
    onNavigate(route);
  };

  const handleLogout = () => {
    onNavigate("/logout");
  };

  const renderMenuItem = (
    { id, label, icon: Icon, route }: (typeof menuItems)[0],
    index: number
  ) => {
    const isActive = activeItem === id;

    return (
      <motion.li
        key={id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
        className="mb-1"
      >
        <motion.button
          onClick={() => handleItemClick(route)}
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          className={`relative flex items-center w-full p-3.5 rounded-lg text-left transition-all duration-200 ease-in-out ${
            isActive
              ? "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-l-4 border-violet-600 dark:border-violet-400"
              : "text-gray-700 hover:bg-violet-50/50 hover:text-violet-700 dark:text-gray-300 dark:hover:bg-violet-900/20 dark:hover:text-violet-300 border-l-4 border-transparent"
          }`}
          aria-current={isActive ? "page" : undefined}
        >
          <motion.div
            whileHover={{ rotate: isActive ? 0 : 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="mr-3 flex-shrink-0"
          >
            <Icon
              size={20}
              className={`${
                isActive
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            />
          </motion.div>
          <span className="text-[15px] font-medium tracking-wide">{label}</span>
        </motion.button>
      </motion.li>
    );
  };

  return (
    <aside
      role="navigation"
      aria-label="Menu principal"
      className={`flex flex-col h-screen shadow-md border-r border-violet-100 dark:border-violet-900 bg-gradient-to-b from-violet-50 to-white dark:from-violet-950 dark:to-gray-900 w-64 flex-shrink-0 ${className}`}
    >
      {/* En-tête avec logo et nom de l'entreprise */}
      <div className="p-4 border-b border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-100/70 to-violet-50/70 dark:from-violet-900/30 dark:to-violet-950/30">
        <div className="flex items-center space-x-3">
          {companyLogoUrl ? (
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-10 h-10 flex-shrink-0"
            >
              <img
                src={companyLogoUrl}
                alt={`Logo ${companyName}`}
                className="w-full h-full object-contain rounded-md"
              />
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-violet-500 to-indigo-600 dark:from-violet-400 dark:to-indigo-500 rounded-md flex items-center justify-center"
            >
              <Suspense fallback={<div className="w-10 h-10"></div>}>
                <EnhancedLottie
                  animationData={planningAnimation}
                  loop={true}
                  style={{ width: "100%", height: "100%" }}
                />
              </Suspense>
            </motion.div>
          )}
          <div className="flex flex-col">
            <motion.span
              className="text-sm font-bold text-violet-800 dark:text-violet-200"
              whileHover={{ scale: 1.03, x: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {companyName}
            </motion.span>
            <span className="text-xs text-violet-600/70 dark:text-violet-300/70">
              Espace entreprise
            </span>
          </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-violet-300 dark:scrollbar-thumb-violet-700 scrollbar-track-transparent">
        <div className="mb-6">
          <h2 className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-violet-700/80 dark:text-violet-400/80">
            Navigation
          </h2>
          <ul>{menuItems.map(renderMenuItem)}</ul>
        </div>

        {/* Séparateur discret */}
        <div className="mx-3 my-4 border-t border-violet-200 dark:border-violet-800 opacity-50"></div>

        <div>
          <h2 className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-violet-700/80 dark:text-violet-400/80">
            Mon espace
          </h2>
          <ul>{userMenuItems.map(renderMenuItem)}</ul>
        </div>
      </div>

      {/* Déconnexion */}
      <div className="border-t border-violet-100 dark:border-violet-900 p-3 mt-auto bg-gradient-to-b from-white to-violet-50/70 dark:from-gray-900 dark:to-violet-950/30">
        <motion.button
          onClick={handleLogout}
          whileHover={{
            scale: 1.03,
            backgroundColor: "rgba(254, 226, 226, 0.6)",
          }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center w-full p-3.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
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
    </aside>
  );
};

export default SidebarMenu;
