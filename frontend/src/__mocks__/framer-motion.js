/**
 * Mock de framer-motion pour les tests Jest
 *
 * Ce fichier simule les fonctionnalités de framer-motion
 * pour permettre aux tests de s'exécuter sans erreur.
 */

const React = require("react");

// Fonction pour créer un composant motion (motion.div, motion.span, etc.)
const createMotionComponent = (elementType) => {
  const Component = (props) => {
    // Extraire les props spécifiques à motion pour ne pas les passer au DOM
    const {
      initial,
      animate,
      exit,
      transition,
      variants,
      whileHover,
      whileTap,
      whileDrag,
      whileInView,
      viewport,
      drag,
      ...otherProps
    } = props;

    return React.createElement(elementType || "div", otherProps);
  };

  return Component;
};

// Créer l'objet "motion" avec ses propriétés
const motion = new Proxy(
  {},
  {
    get: (target, prop) => {
      // Pour chaque propriété demandée (div, span, etc.), retourner un composant
      return createMotionComponent(prop === "custom" ? "div" : prop);
    },
  }
);

// Mock pour AnimatePresence
const AnimatePresence = ({ children, mode, initial, onExitComplete }) => {
  return React.createElement(React.Fragment, null, children);
};

// Hooks divers
const useAnimation = () => {
  return {
    start: jest.fn().mockResolvedValue(null),
    stop: jest.fn(),
    set: jest.fn(),
  };
};

const useMotionValue = (initial) => ({
  get: () => initial,
  set: jest.fn(),
  onChange: jest.fn(),
});

const useTransform = (value, inputRange, outputRange) =>
  useMotionValue(outputRange[0]);
const useInView = (options) => ({ inView: true, ref: { current: null } });
const useScroll = () => ({
  scrollX: useMotionValue(0),
  scrollY: useMotionValue(0),
});

// Export en CommonJS pour Jest
module.exports = {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  useInView,
  useScroll,
  animate: jest.fn(),
};

// Export par défaut
module.exports.default = motion;
