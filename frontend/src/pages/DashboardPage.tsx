import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  CalendarCheck,
  ClipboardList,
  Plane,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";
import React from "react";
import LayoutWithSidebar from "../components/layout/LayoutWithSidebar";
import SEO from "../components/layout/SEO";

import { useTheme } from "../components/ThemeProvider";
import CardGrid from "../components/ui/CardGrid";
import DashboardCard from "../components/ui/DashboardCard";
import { useAuth } from "../hooks/useAuth";

/**
 * Page du tableau de bord (dashboard RH) utilisant le layout principal
 */
const DashboardPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  // Obtenir l'heure pour personnaliser le message
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  // Déterminer le lien des collaborateurs selon le rôle utilisateur
  const getCollaboratorsPath = () => {
    if (!user) return "/employees"; // Fallback par défaut

    switch (user.role) {
      case "directeur":
        return "/collaborateurs";
      case "manager":
        return "/employees";
      case "admin":
        return "/gestion-des-utilisateurs";
      default:
        return "/employees";
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, scale: 0.8, rotateX: -90 },
    visible: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 1.2,
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1,
        delay: 0.4,
        ease: "easeOut",
      },
    },
  };

  const welcomeVariants = {
    hidden: { opacity: 0, x: -50, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        delay: 0.2,
        ease: "easeOut",
      },
    },
  };

  const floatingAnimation = {
    y: [-5, 5, -5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const sparkleAnimation = {
    scale: [1, 1.2, 1],
    rotate: [0, 180, 360],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  // Fonctionnalités pour les employés
  const employeeFeatures = [
    {
      title: "Mon Planning & Équipe",
      description:
        "Consultez votre planning hebdomadaire et celui de votre équipe, avec génération PDF",
      icon: <CalendarCheck size={24} />,
      path: "/plannings-hebdomadaires",
      isAI: false,
    },
    {
      title: "Mes Demandes de Congés",
      description:
        "Gérez vos demandes de congés et suivez leur statut de validation par votre manager",
      icon: <Plane size={24} />,
      path: "/gestion-des-conges",
      isAI: false,
    },
    {
      title: "Mes Tâches Personnelles",
      description:
        "Suivez et gérez vos tâches personnelles, votre pense-bête quotidien",
      icon: <ClipboardList size={24} />,
      path: "/taches-employes",
      isAI: false,
    },
    {
      title: "Mon Profil",
      description:
        "Mettez à jour vos informations personnelles et votre photo de profil",
      icon: <User size={24} />,
      path: "/mon-profil",
      isAI: false,
    },
  ];

  // Fonctionnalités pour les autres rôles (managers, directeurs, admins)
  const features = [
    {
      title: "Planning hebdomadaire",
      description:
        "Consultez et gérez les horaires de travail de votre équipe pour la semaine en cours",
      icon: <CalendarCheck size={24} />,
      path: "/plannings-hebdomadaires",
      isAI: false,
    },
    {
      title: "IA Planification Automatique",
      description:
        "Générez et validez des plannings intelligents automatiquement basés sur les contraintes et préférences des employés",
      icon: <Bot size={24} />,
      path: "/validation-plannings",
      isAI: false,
    },
    {
      title: "Gestion des collaborateurs",
      description:
        "Visualisez, ajoutez ou modifiez les membres de votre équipe et leurs informations",
      icon: <Users size={24} />,
      path: getCollaboratorsPath(),
      isAI: false,
    },
    {
      title: "Gestion des congés",
      description:
        "Gérez les demandes de congés des employés et générez des PDF",
      icon: <Plane size={24} />,
      path: "/gestion-des-conges",
      isAI: false,
    },
    {
      title: "Suivi des incidents",
      description:
        "Enregistrez et suivez les incidents (retards, absences...) des employés",
      icon: <AlertTriangle size={24} />,
      path: "/suivi-des-incidents",
      isAI: false,
    },
    {
      title: "Tâches personnelles",
      description:
        "Assignez et suivez l'avancement de vos tâches personnelles, un vrai pense bête!",
      icon: <ClipboardList size={24} />,
      path: "/taches-employes",
      isAI: false,
    },
  ];

  // DashboardCard gère automatiquement la navigation

  // Choisir les bonnes fonctionnalités selon le rôle
  const featuresToDisplay =
    user?.role === "employee" ? employeeFeatures : features;

  return (
    <LayoutWithSidebar
      activeItem="tableau-de-bord"
      pageTitle="Dashboard SmartPlanning – Vue d'ensemble RH"
    >
      <SEO
        title="Dashboard SmartPlanning – Vue d'ensemble RH"
        description="Découvrez le tableau de bord de SmartPlanning, l'outil de gestion de l'équipe par excellence."
      />
      <div
        className={`max-w-6xl mx-auto mb-12 relative ${
          isDarkMode ? "text-gray-100" : "text-gray-900"
        }`}
      >
        {/* Arrière-plan futuriste avec effets de particules */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-3xl blur-3xl"></div>
          <motion.div
            className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl"
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Message de bienvenue personnalisé */}
        <motion.div
          className="text-center mb-8 relative z-10"
          initial="hidden"
          animate="visible"
          variants={welcomeVariants}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={sparkleAnimation}
              className="text-yellow-500 dark:text-yellow-400"
            >
              <Sparkles size={28} />
            </motion.div>
            <motion.h2
              className="text-2xl md:text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400"
              animate={floatingAnimation}
            >
              {getGreeting()}, {user?.firstName || "Utilisateur"} !
            </motion.h2>
            <motion.div
              animate={sparkleAnimation}
              className="text-yellow-500 dark:text-yellow-400"
              style={{ animationDelay: "1s" }}
            >
              <Zap size={28} />
            </motion.div>
          </div>
          <motion.p
            className="text-lg text-gray-600 dark:text-gray-300 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Prêt à optimiser votre gestion aujourd'hui ?
          </motion.p>
        </motion.div>

        {/* Titre principal avec effet 3D */}
        <motion.div
          className="text-center mb-8 relative z-10"
          style={{ perspective: "1000px" }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6 text-center relative"
            initial="hidden"
            animate="visible"
            variants={titleVariants}
            style={{ transformStyle: "preserve-3d" }}
          >
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 font-['Rajdhani',sans-serif] tracking-wider relative">
              Tableau de bord
              {/* Effet de lueur */}
              <span className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 blur-lg opacity-30">
                Tableau de bord
              </span>
            </span>
          </motion.h1>

          {/* Barre de séparation animée avec effet néon */}
          <motion.div
            className="relative mx-auto mb-8"
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
          >
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full blur-sm opacity-60"></div>
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 rounded-full blur-md opacity-30"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Description avec effets de typage */}
        <motion.div
          className="text-center mb-12 relative z-10"
          initial="hidden"
          animate="visible"
          variants={subtitleVariants}
        >
          <motion.p
            className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            🚀 Votre{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              centre de contrôle intelligent
            </span>{" "}
            pour une gestion d'équipe moderne et efficace
          </motion.p>
          <motion.p
            className="max-w-2xl mx-auto text-gray-500 dark:text-gray-400 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.8 }}
          >
            Accédez instantanément à tous vos outils de planification et de
            gestion
          </motion.p>
        </motion.div>

        <CardGrid>
          {featuresToDisplay.map((feature, index) => (
            <DashboardCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              path={feature.path}
              delay={index}
              isAI={feature.isAI}
            />
          ))}
        </CardGrid>
      </div>
    </LayoutWithSidebar>
  );
};

export default DashboardPage;
