import { motion } from "framer-motion";
import { Building, Menu, X } from "lucide-react";
import React, { lazy, Suspense, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import planningAnimation from "../../assets/animations/planning-animation.json";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../ThemeProvider";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import ThemeSwitch from "../ui/ThemeSwitch";
import SidebarMenu from "./SidebarMenu";

const EnhancedLottie = lazy(() => import("../ui/EnhancedLottie"));

interface LayoutWithSidebarProps {
  children: React.ReactNode;
  activeItem: string;
  pageTitle?: string;
  showHeader?: boolean;
}

const LayoutWithSidebar: React.FC<LayoutWithSidebarProps> = ({
  children,
  activeItem,
  pageTitle = "SmartPlanning",
  showHeader = true,
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [companyData, setCompanyData] = useState<{
    name: string;
    logoUrl?: string;
  } | null>(null);

  // Utiliser le hook useAuth pour accéder aux données utilisateur
  const { user, isAuthenticated, loading } = useAuth();

  // Récupérer les informations de l'entreprise
  useEffect(() => {
    const fetchCompany = async () => {
      if (!user?.companyId) return;

      try {
        // Les cookies httpOnly sont automatiquement envoyés
        const response = await axiosInstance.get("/companies/me");

        // Vérifier la structure de la réponse et extraire les données correctement
        if (response.data) {
          // Si la réponse a une propriété success et data, utiliser cette structure
          if (response.data.success && response.data.data) {
            setCompanyData({
              name: response.data.data.name,
              logoUrl: response.data.data.logoUrl,
            });
          }
          // Sinon, vérifier si la réponse elle-même contient les données de l'entreprise
          else if (response.data.name) {
            setCompanyData({
              name: response.data.name,
              logoUrl: response.data.logoUrl,
            });
          }

          console.log("Données entreprise récupérées:", response.data);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des infos entreprise:",
          error
        );
      }
    };

    if (user && user.companyId) {
      fetchCompany();
    }
  }, [user]);

  // Fonction pour déterminer la route des collaborateurs selon le rôle de l'utilisateur
  const getCollaborateursRoute = () => {
    if (!user) return "";

    switch (user.role) {
      case "directeur":
        return "/director/users";
      case "manager":
        return "/employees";
      case "admin":
        return "/admin/users";
      default:
        return "";
    }
  };

  const handleNavigate = (route: string) => {
    setSidebarOpen(false);
    navigate(route);
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      {/* Sidebar pour mobile - rendue visible uniquement si le menu est ouvert */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 z-50 transition-transform duration-300 md:transform-none ${
          isSidebarOpen ? "transform-none" : "-translate-x-full"
        }`}
      >
        {!loading && user && (
          <SidebarMenu
            activeItem={activeItem}
            onNavigate={handleNavigate}
            firstName={user.firstName}
            lastName={user.lastName}
            photoUrl={user.photoUrl}
            user={user}
          />
        )}
      </div>

      {/* Overlay mobile (si sidebar ouverte) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSidebarOpen(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Fermer le menu de navigation"
        />
      )}

      {/* Contenu principal à droite de la sidebar */}
      <div className="md:pl-64 min-h-screen bg-white dark:bg-gray-900 flex flex-col">
        {/* Header futuriste pour l'espace utilisateur */}
        {showHeader && (
          <header className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50 dark:from-indigo-950 dark:via-gray-900 dark:to-indigo-950 border-b border-indigo-100 dark:border-indigo-900 sticky top-0 z-30 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo et titre avec animation */}
                <div className="flex items-center">
                  {/* Bouton burger mobile */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="md:hidden mr-3 text-gray-700 dark:text-white p-2 rounded-full hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40"
                    onClick={() => setSidebarOpen((prev) => !prev)}
                    aria-label="Menu"
                  >
                    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                  </motion.button>

                  {/* Logo et nom de l'entreprise */}
                  <div className="flex items-center">
                    <motion.div
                      className="w-10 h-10 mr-2 flex items-center justify-center"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                      {companyData?.logoUrl &&
                      companyData.logoUrl.trim() !== "" ? (
                        <img
                          src={companyData.logoUrl}
                          alt={companyData.name}
                          className="w-full h-full object-contain rounded-md"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-md flex items-center justify-center">
                          <Building size={24} className="text-white" />
                        </div>
                      )}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.span
                        className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300"
                        whileHover={{ scale: 1.05 }}
                      >
                        {companyData?.name || "Entreprise"}
                      </motion.span>
                    </motion.div>
                  </div>
                </div>

                {/* Partie droite du header */}
                <div className="flex items-center space-x-4">
                  {/* Indicateur de statut animé */}
                  {isAuthenticated && (
                    <motion.div
                      className="hidden sm:flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div
                        className="w-2 h-2 rounded-full bg-emerald-500 mr-2"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [1, 0.7, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "loop",
                        }}
                      ></motion.div>
                      <span className="text-sm text-indigo-700 dark:text-indigo-300">
                        Connecté
                      </span>
                    </motion.div>
                  )}

                  {/* Theme switcher avec animations */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-indigo-100/80 dark:bg-indigo-900/30 p-2 rounded-full"
                  >
                    <ThemeSwitch onChange={toggleTheme} checked={isDarkMode} />
                  </motion.div>

                  {/* Bouton de profil avec Avatar */}
                  {user && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative"
                    >
                      <Button
                        variant="ghost"
                        onClick={() => navigate("/mon-profil")}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/30 rounded-full px-4 py-2"
                      >
                        <Avatar size="md" src={user.photoUrl} />
                        <span className="hidden md:inline">
                          {user.firstName} {user.lastName}
                        </span>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Contenu scrollable avec padding pour compenser le header */}
        <main className="flex-1 px-4 py-8">{children}</main>

        {/* Footer moderne */}
        <footer className="py-6 bg-gradient-to-r from-cyan-50 via-white to-cyan-50 dark:from-cyan-950 dark:via-gray-900 dark:to-cyan-950 border-t border-cyan-100 dark:border-cyan-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <motion.div
                  className="w-8 h-8 mr-2"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.5 }}
                >
                  <Suspense fallback={<div className="w-8 h-8"></div>}>
                    <EnhancedLottie
                      animationData={planningAnimation}
                      loop={true}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </Suspense>
                </motion.div>
                <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-sky-500 dark:from-cyan-400 dark:to-sky-300">
                  SmartPlanning © 2025
                </span>
              </div>
              <div className="text-xs text-cyan-600/70 dark:text-cyan-300/70">
                Tous droits réservés • L'équipe SmartPlanning vous remercie de
                votre confiance.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LayoutWithSidebar;
