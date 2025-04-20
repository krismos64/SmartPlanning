/**
 * SidebarMenu - Navigation latérale principale
 *
 * Ce composant représente la barre de navigation latérale de l'application SmartPlanning.
 * Il affiche le logo, les liens de navigation principaux et les options utilisateur.
 */
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
import React from "react";

/**
 * Interface pour les propriétés du composant SidebarMenu
 */
export interface SidebarMenuProps {
  /** Page/section active actuelle */
  activeItem: string;
  /** Fonction de callback appelée lors de la navigation */
  onNavigate: (route: string) => void;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Définition des éléments du menu
 * Chaque élément contient un id, un label, une icône et une route
 */
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

/**
 * Éléments du menu utilisateur (bas de sidebar)
 */
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

/**
 * Composant SidebarMenu
 *
 * Navigation latérale principale avec logo, menus et déconnexion
 */
const SidebarMenu: React.FC<SidebarMenuProps> = ({
  activeItem,
  onNavigate,
  className = "",
}) => {
  /**
   * Gère le clic sur un élément du menu
   */
  const handleItemClick = (route: string) => {
    onNavigate(route);
  };

  /**
   * Gère la déconnexion
   */
  const handleLogout = () => {
    // TODO: Appeler le service de déconnexion
    onNavigate("/logout");
  };

  /**
   * Rendu d'un élément du menu (avec animations et états)
   */
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
          whileHover={{ scale: 1.03, x: 5 }}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center w-full p-3 rounded-lg text-left transition-colors ${
            isActive
              ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)]/50 hover:text-[var(--text-primary)]"
          }`}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon
            size={20}
            className={`mr-3 flex-shrink-0 ${
              isActive
                ? "text-[var(--accent-primary)]"
                : "text-[var(--text-tertiary)]"
            }`}
          />
          <span className="text-sm font-medium">{label}</span>

          {/* Indicateur visuel pour l'élément actif */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="w-1 h-6 bg-[var(--accent-primary)] absolute right-0 rounded-l-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </motion.button>
      </motion.li>
    );
  };

  return (
    <aside
      role="navigation"
      aria-label="Menu principal"
      className={`flex flex-col h-screen border-r border-[var(--border)] bg-[var(--background-secondary)] w-64 flex-shrink-0 ${className}`}
    >
      {/* En-tête avec logo */}
      <div className="p-5 flex justify-center border-b border-[var(--border)]">
        <img
          src="/images/logo.svg"
          alt="SmartPlanning Logo"
          className="h-8 w-auto"
        />
      </div>

      {/* Conteneur principal avec défilement */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {/* Menu principal */}
        <div className="mb-6">
          <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Navigation
          </h2>
          <ul>{menuItems.map(renderMenuItem)}</ul>
        </div>

        {/* Menu utilisateur */}
        <div>
          <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Mon espace
          </h2>
          <ul>{userMenuItems.map(renderMenuItem)}</ul>
        </div>
      </div>

      {/* Bouton de déconnexion (bas de sidebar) */}
      <div className="border-t border-[var(--border)] p-3 mt-auto">
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center w-full p-3 rounded-lg text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          <span className="text-sm font-medium">Déconnexion</span>
        </motion.button>
      </div>
    </aside>
  );
};

export default SidebarMenu;
