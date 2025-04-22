import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import React, { lazy, Suspense, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import planningAnimation from "../../assets/animations/planning-animation.json";
import { User } from "../../types/User";
import { useTheme } from "../ThemeProvider";
import Button from "../ui/Button";
import { ThemeSwitch } from "../ui/ThemeSwitch";
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

  // Simuler un utilisateur (à remplacer par un contexte d'authentification réel)
  const mockUser: User = {
    _id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    role: "admin", // Pour tester l'affichage du menu admin
    status: "active",
    createdAt: new Date().toISOString(),
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
        <SidebarMenu
          activeItem={activeItem}
          onNavigate={handleNavigate}
          firstName={mockUser.firstName}
          lastName={mockUser.lastName}
          companyName="SmartTech Industries"
          companyLogoUrl="/src/assets/images/company-logo.png"
          user={mockUser} // Passer l'utilisateur simulé
        />
      </div>

      {/* Overlay mobile (si sidebar ouverte) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
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

                  {/* Logo et animation */}
                  <Link
                    to="/"
                    className="flex items-center"
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                  >
                    <motion.div
                      className="w-10 h-10 mr-2"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                      <Suspense
                        fallback={
                          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full"></div>
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
                      className="flex flex-col"
                    >
                      <motion.span
                        className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300"
                        whileHover={{ scale: 1.05 }}
                      >
                        SmartPlanning
                      </motion.span>
                      <span className="text-xs text-indigo-500/70 dark:text-indigo-300/70">
                        Espace utilisateur
                      </span>
                    </motion.div>
                  </Link>
                </div>

                {/* Partie droite du header */}
                <div className="flex items-center space-x-4">
                  {/* Indicateur de statut animé */}
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

                  {/* Theme switcher avec animations */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-indigo-100/80 dark:bg-indigo-900/30 p-2 rounded-full"
                  >
                    <ThemeSwitch onChange={toggleTheme} checked={isDarkMode} />
                  </motion.div>

                  {/* Bouton de profil */}
                  <motion.div whileHover={{ scale: 1.05 }} className="relative">
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/profil")}
                      className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/30 rounded-full px-4 py-2"
                    >
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-200 to-blue-100 dark:from-indigo-700 dark:to-blue-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                        JD
                      </span>
                      <span className="hidden md:inline">John Doe</span>
                    </Button>
                  </motion.div>
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
                Tous droits réservés • Fait avec ❤️ par l'équipe SmartPlanning
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LayoutWithSidebar;
