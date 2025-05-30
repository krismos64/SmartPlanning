import { motion } from "framer-motion";
import {
  AlertCircle,
  BarChart,
  Building,
  Calendar,
  ClipboardList,
  Home,
  LogOut,
  Plane,
  Sparkles,
  User as UserIcon,
  Users,
} from "lucide-react";
import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

import planningAnimation from "../../assets/animations/planning-animation.json";
import { useAuth } from "../../hooks/useAuth";
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

// Menu items de base (sans l'entrée Collaborateurs qui sera ajoutée dynamiquement)
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
    id: "statistiques",
    label: "Statistiques",
    icon: BarChart,
    route: "/statistiques",
  },
];

// Item "Collaborateurs" avec routes dynamiques selon le rôle
const collaborateursMenuItem = {
  id: "collaborateurs",
  label: "Collaborateurs",
  icon: Users,
  // La route sera définie dynamiquement
};

const userMenuItems = [
  { id: "profil", label: "Mon profil", icon: UserIcon, route: "/mon-profil" },
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

const adminPlanningMenuItem = {
  id: "admin-plannings",
  label: "Gestion des plannings",
  icon: Calendar,
  route: "/admin/plannings",
};

const incidentsMenuItem = {
  id: "incidents",
  label: "Incidents employés",
  icon: AlertCircle,
  route: "/incidents",
};

const planningsAiMenuItem = {
  id: "plannings-ai",
  label: "Plannings IA",
  icon: Sparkles,
  route: "/validation-plannings",
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
  const { logout } = useAuth();
  const [companyData, setCompanyData] = useState<{
    name: string;
    logoUrl?: string;
  } | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user?.companyId) return;

      try {
        const response = await axiosInstance.get("/companies/me");

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

    // Pour les employés, remplacer le lien "Plannings" par "Mes Plannings"
    if (user?.role === "employee") {
      items = items.map((item) =>
        item.id === "plannings"
          ? { ...item, label: "Mes Plannings", route: "/mes-plannings" }
          : item
      );

      // Pour les employés, supprimer l'accès aux statistiques
      items = items.filter((item) => item.id !== "statistiques");
    }

    // Pour les admins, retirer le lien "Plannings" normal
    if (user?.role === "admin") {
      items = items.filter((item) => item.id !== "plannings");
    }

    // Ajouter l'entrée "Collaborateurs" avec la route appropriée selon le rôle
    if (user?.role === "directeur") {
      // Pour les directeurs, rediriger vers /director/users
      const directeurCollaborateurs = {
        ...collaborateursMenuItem,
        route: "/director/users",
      };
      // Insérer après le dashboard (index 0)
      items.splice(1, 0, directeurCollaborateurs);
    } else if (user?.role === "manager") {
      // Pour les managers, rediriger vers /employees
      const managerCollaborateurs = {
        ...collaborateursMenuItem,
        route: "/employees",
      };
      // Insérer après le dashboard (index 0)
      items.splice(1, 0, managerCollaborateurs);
    }

    // Pour les admins, on gère séparément - SUPPRESSION du lien Collaborateurs
    if (user?.role === "admin") {
      // Les admins ont directement "Gestion des utilisateurs" au lieu de "Collaborateurs"
      // Ajouter les items spécifiques aux admins
      items.push(
        adminMenuItem,
        companyManagementMenuItem,
        adminPlanningMenuItem
      );
    }

    // Ajouter "Incidents employés" après les demandes de congés
    if (
      user?.role === "admin" ||
      user?.role === "manager" ||
      user?.role === "directeur"
    ) {
      // Trouver l'index après "conges"
      const congesIndex = items.findIndex((item) => item.id === "conges");
      if (congesIndex !== -1) {
        // Insérer incidents après conges
        items.splice(congesIndex + 1, 0, incidentsMenuItem);
      } else {
        // Fallback si "conges" n'est pas trouvé
        items.push(incidentsMenuItem);
      }
    }

    // Ajouter "Plannings IA" après les incidents pour manager, directeur et admin
    if (
      user?.role === "manager" ||
      user?.role === "directeur" ||
      user?.role === "admin"
    ) {
      // Trouver l'index après "incidents"
      const incidentsIndex = items.findIndex((item) => item.id === "incidents");
      if (incidentsIndex !== -1) {
        // Insérer plannings IA après incidents
        items.splice(incidentsIndex + 1, 0, planningsAiMenuItem);
      } else {
        // Fallback - ajouter après les plannings normaux
        const planningsIndex = items.findIndex(
          (item) => item.id === "plannings"
        );
        if (planningsIndex !== -1) {
          items.splice(planningsIndex + 1, 0, planningsAiMenuItem);
        } else {
          items.push(planningsAiMenuItem);
        }
      }
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

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      await logout();
      // Redirection vers la page d'accueil
      window.location.href = "/";
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // En cas d'erreur, on redirige quand même vers la page d'accueil
      window.location.href = "/";
    }
  };

  return (
    <div
      className={`flex flex-col h-full shadow-md border-r border-violet-100 dark:border-violet-900 bg-gradient-to-b from-violet-50 to-white dark:from-violet-950 dark:to-gray-900 w-64 flex-shrink-0 ${className}`}
    >
      <div className="p-4 border-b border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-100/70 to-violet-50/70 dark:from-violet-900/30 dark:to-violet-950/30">
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-violet-500 to-indigo-600 dark:from-violet-400 dark:to-indigo-500 rounded-md flex items-center justify-center cursor-pointer"
            onClick={() => (window.location.href = "/")}
          >
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
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.span
              className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-400 dark:to-indigo-300"
              whileHover={{ scale: 1.05 }}
            >
              Smartplanning
            </motion.span>
          </motion.div>
        </div>
      </div>

      {/* Contenu du menu */}
      <div className="flex-grow overflow-y-auto p-4">
        <nav>
          <ul className="space-y-1">{dynamicMenuItems.map(renderMenuItem)}</ul>
        </nav>

        {/* Séparateur */}
        <div className="my-6 border-t border-violet-200 dark:border-violet-800/40"></div>

        {/* Menu utilisateur */}
        <nav>
          <ul className="space-y-1">
            {userMenuItems.map(renderMenuItem)}
            <motion.li
              className="mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleLogout}
            >
              <motion.div
                className="relative flex items-center w-full p-3 rounded-lg text-left transition-all duration-200 ease-in-out text-gray-700 hover:bg-red-50/50 hover:text-red-700 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-300 border-l-4 border-transparent"
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <motion.div
                  whileHover={{ rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="mr-3 flex-shrink-0"
                >
                  <LogOut
                    size={20}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </motion.div>
                <span className="text-[15px] font-medium tracking-wide">
                  Déconnexion
                </span>
              </motion.div>
            </motion.li>
          </ul>
        </nav>
      </div>

      {/* Informations utilisateur */}
      <div className="p-4 border-t border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-100/70 to-violet-50/70 dark:from-violet-900/30 dark:to-violet-950/30">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${firstName} ${lastName}`}
                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 dark:from-violet-400 dark:to-indigo-500 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                {firstName?.charAt(0)}
                {lastName?.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
              {firstName} {lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.role === "admin"
                ? "Administrateur"
                : user?.role === "manager"
                ? "Manager"
                : user?.role === "directeur"
                ? "Directeur"
                : "Employé"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarMenu;
