/**
 * Tabs - Composant de navigation par onglets
 *
 * Affiche une barre d'onglets interactive et le contenu correspondant à l'onglet actif.
 * Supporte l'animation, l'accessibilité, et s'adapte au thème clair/sombre.
 */
import { AnimatePresence, motion } from "framer-motion";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface TabsProps {
  tabs: string[]; // Titres des onglets
  children: React.ReactNode[]; // Contenu de chaque onglet
  animated?: boolean; // Active l'animation de l'indicateur
  animationType?: "fade" | "slide"; // Type d'animation pour le contenu
  className?: string; // Classes CSS additionnelles
  initialTab?: number; // Index de l'onglet actif initial (défaut: 0)
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  children,
  animated = true,
  animationType = "fade",
  className = "",
  initialTab = 0,
}) => {
  // État pour suivre l'onglet actif
  const [activeTabIndex, setActiveTabIndex] = useState<number>(initialTab);

  // Refs pour mesurer les dimensions et positions des onglets
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const tabListRef = useRef<HTMLDivElement>(null);

  // Dimensions calculées pour l'indicateur animé
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });

  // Génère des IDs uniques pour chaque onglet et panneau (pour l'accessibilité)
  const tabIds = useMemo(() => {
    return tabs.map(
      (_, index) => `tab-${index}-${Math.random().toString(36).substring(2, 9)}`
    );
  }, [tabs]);

  // Met à jour la position et la largeur de l'indicateur
  const updateIndicator = useCallback(() => {
    if (tabsRef.current[activeTabIndex] && tabListRef.current) {
      const activeTab = tabsRef.current[activeTabIndex];
      const tabListRect = tabListRef.current.getBoundingClientRect();
      const activeTabRect = activeTab!.getBoundingClientRect();

      setIndicatorStyle({
        left: activeTabRect.left - tabListRect.left,
        width: activeTabRect.width,
      });
    }
  }, [activeTabIndex]);

  // Met à jour l'indicateur lors du changement d'onglet ou au resize
  useEffect(() => {
    updateIndicator();

    // Réactualiser lors du redimensionnement de la fenêtre
    const handleResize = () => {
      updateIndicator();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [activeTabIndex, updateIndicator]);

  // Gestionnaire de clic sur un onglet
  const handleTabClick = (index: number) => {
    setActiveTabIndex(index);
  };

  // Gestionnaire de navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        setActiveTabIndex((prevIndex) =>
          prevIndex < tabs.length - 1 ? prevIndex + 1 : prevIndex
        );
        break;
      case "ArrowLeft":
        e.preventDefault();
        setActiveTabIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex
        );
        break;
      case "Home":
        e.preventDefault();
        setActiveTabIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveTabIndex(tabs.length - 1);
        break;
      default:
        break;
    }
  };

  // Focus sur l'onglet actif après changement par les flèches
  useEffect(() => {
    if (tabsRef.current[activeTabIndex]) {
      tabsRef.current[activeTabIndex]?.focus();
    }
  }, [activeTabIndex]);

  // Variantes d'animation pour le contenu selon le type d'animation
  const contentVariants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } },
      exit: { opacity: 0, transition: { duration: 0.2 } },
    },
    slide: {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
      exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
    },
  };

  // Vérification que children est un array et correspond au nombre d'onglets
  if (!Array.isArray(children) || children.length !== tabs.length) {
    console.warn(
      "Le nombre d'enfants doit correspondre au nombre d'onglets dans le composant Tabs."
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Barre d'onglets */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Onglets de navigation"
        className="relative flex border-b border-[var(--border)] overflow-x-auto scrollbar-hide"
      >
        {tabs.map((tab, index) => (
          <button
            key={tabIds[index]}
            id={tabIds[index]}
            ref={(el) => (tabsRef.current[index] = el)}
            role="tab"
            aria-selected={activeTabIndex === index}
            aria-controls={`tabpanel-${tabIds[index]}`}
            tabIndex={activeTabIndex === index ? 0 : -1}
            className={`
              relative px-4 py-3 text-sm font-medium flex-shrink-0
              transition-colors duration-200 ease-in-out
              focus:outline-none focus:bg-[var(--background-tertiary)]/30
              ${
                activeTabIndex === index
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }
            `}
            onClick={() => handleTabClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab}
          </button>
        ))}

        {/* Indicateur animé */}
        {animated && (
          <motion.div
            className="absolute bottom-0 h-0.5 bg-[var(--accent-primary)]"
            initial={false}
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
          />
        )}
      </div>

      {/* Contenu des onglets */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {tabs.map(
            (_, index) =>
              activeTabIndex === index && (
                <motion.div
                  key={tabIds[index]}
                  id={`tabpanel-${tabIds[index]}`}
                  role="tabpanel"
                  aria-labelledby={tabIds[index]}
                  tabIndex={0}
                  className="focus:outline-none"
                  variants={contentVariants[animationType]}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {children[index]}
                </motion.div>
              )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Tabs;
