import { motion } from "framer-motion";
import {
  BarChart,
  Calendar,
  ClipboardList,
  Home,
  LogOut,
  Plane,
  Settings,
  User as UserIcon,
  Users,
} from "lucide-react";
import React, { lazy, Suspense, useMemo } from "react";

// Import pour le logo animé (optionnel)
import planningAnimation from "../../assets/animations/planning-animation.json";
// Import du type UserRole
import { User } from "../../types/User";
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
    route: "/gestion-des-equipes",
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
    icon: UserIcon,
    route: "/profil",
  },
];

const adminMenuItem = {
  id: "users",
  label: "Gestion des utilisateurs",
  icon: Users,
  route: "/gestion-des-utilisateurs",
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
  const dynamicMenuItems = useMemo(() => {
    // Création d'une copie du tableau menuItems
    const items = [...menuItems];

    // Ajout de l'élément "Gestion des utilisateurs" après "collaborateurs" si l'utilisateur est admin
    if (user?.role === "admin") {
      const collaborateursIndex = items.findIndex(
        (item) => item.id === "collaborateurs"
      );
      if (collaborateursIndex !== -1) {
        items.splice(collaborateursIndex + 1, 0, adminMenuItem);
      }
    }

    return items;
  }, [user]);

  const renderMenuItem = (item: (typeof menuItems)[0]) => {
    const isActive = activeItem === item.id;
    return (
      <li key={item.id} className="mb-2" onClick={() => onNavigate(item.route)}>
        <motion.div
          className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer select-none ${
            isActive
              ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200"
              : "hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-300"
          }`}
          whileHover={{ x: 3, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <item.icon
            size={18}
            className={`mr-3 ${
              isActive
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          />
          <span
            className={`font-medium ${
              isActive
                ? "font-semibold"
                : "text-gray-700 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-100"
            }`}
          >
            {item.label}
          </span>
        </motion.div>
      </li>
    );
  };

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-gray-800 shadow-lg ${className}`}
    >
      {/* En-tête de la sidebar avec logo et nom d'entreprise */}
      <div className="p-4 border-b border-violet-200/70 dark:border-violet-800/40">
        <div className="flex items-center space-x-3">
          {/* Logo - Utilisation d'animation Lottie ou image classique */}
          <div className="w-10 h-10 flex-shrink-0">
            {companyLogoUrl ? (
              <img
                src={companyLogoUrl}
                alt={`${companyName} logo`}
                className="w-full h-full object-contain"
              />
            ) : (
              <Suspense
                fallback={
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-md animate-pulse"></div>
                }
              >
                <EnhancedLottie
                  animationData={planningAnimation}
                  style={{ width: 40, height: 40 }}
                />
              </Suspense>
            )}
          </div>

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
          <ul>{dynamicMenuItems.map(renderMenuItem)}</ul>
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
      <div className="p-4 border-t border-violet-200/70 dark:border-violet-800/40">
        <div className="flex items-center pb-3">
          <div className="mr-3 flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${firstName} ${lastName}`}
                className="w-9 h-9 rounded-full object-cover border-2 border-violet-200 dark:border-violet-700"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                {firstName.charAt(0)}
                {lastName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
              {firstName} {lastName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user?.role || "Utilisateur"}
            </div>
          </div>
        </div>
        <motion.button
          onClick={() => onNavigate("/logout")}
          className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut size={18} className="mr-2" />
          <span className="font-medium">Déconnexion</span>
        </motion.button>
      </div>
    </div>
  );
};

export default SidebarMenu;
