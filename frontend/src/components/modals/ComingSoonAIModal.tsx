import { motion } from "framer-motion";
import {
  Bot,
  Brain,
  Clock,
  Lightbulb,
  Rocket,
  Sparkles,
  Star,
  Wand2,
  Zap,
} from "lucide-react";
import React from "react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface ComingSoonAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ComingSoonAIModal: React.FC<ComingSoonAIModalProps> = ({
  isOpen,
  onClose,
}) => {
  const floatingAnimation = {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const sparkleAnimation = {
    scale: [1, 1.3, 1],
    rotate: [0, 180, 360],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const pulseAnimation = {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const rotateAnimation = {
    rotate: [0, 360],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "linear",
    },
  };

  const typewriterVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const title = "DÉVELOPPEMENT EN COURS";
  const subtitle = "Nos robots travaillent dur !";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="w-full max-w-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 dark:from-blue-950 dark:via-purple-950 dark:to-cyan-950 border-2 border-blue-200 dark:border-blue-800"
    >
      <div className="relative p-8 overflow-hidden">
        {/* Arrière-plan avec effets de particules */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Particules flottantes */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 50 - 25],
                y: [0, Math.random() * 50 - 25],
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}

          {/* Orbes en mouvement */}
          <motion.div
            className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-xl"
            animate={{
              scale: [1, 1.5, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-full blur-lg"
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Contenu principal */}
        <div className="relative z-10 text-center">
          {/* Icône principale animée */}
          <motion.div
            className="flex justify-center mb-6"
            animate={floatingAnimation}
          >
            <div className="relative">
              <motion.div
                className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 rounded-full flex items-center justify-center shadow-2xl"
                animate={pulseAnimation}
              >
                <motion.div animate={rotateAnimation}>
                  <Bot size={48} className="text-white" />
                </motion.div>
              </motion.div>

              {/* Étoiles autour de l'icône */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${50 + 60 * Math.cos((i * 60 * Math.PI) / 180)}px`,
                    top: `${50 + 60 * Math.sin((i * 60 * Math.PI) / 180)}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                  animate={sparkleAnimation}
                  transition={{ delay: i * 0.2 }}
                >
                  <Star size={16} className="text-yellow-400" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Titre avec effet typewriter */}
          <motion.div
            className="mb-4"
            initial="hidden"
            animate="visible"
            variants={typewriterVariants}
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              {title.split("").map((char, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </h2>
          </motion.div>

          {/* Sous-titre avec animation */}
          <motion.p
            className="text-xl text-gray-600 dark:text-gray-300 mb-8 font-semibold"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {subtitle}
          </motion.p>

          {/* Description avec icônes animées */}
          <motion.div
            className="space-y-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-blue-200 dark:border-blue-700">
              <motion.div animate={sparkleAnimation} className="text-blue-500">
                <Brain size={24} />
              </motion.div>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Intelligence artificielle avancée</strong> en cours de
                développement
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-purple-200 dark:border-purple-700">
              <motion.div animate={rotateAnimation} className="text-purple-500">
                <Wand2 size={24} />
              </motion.div>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Plannings magiques</strong> basés sur vos préférences
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-cyan-200 dark:border-cyan-700">
              <motion.div animate={pulseAnimation} className="text-cyan-500">
                <Zap size={24} />
              </motion.div>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Optimisation ultra-rapide</strong> de vos équipes
              </p>
            </div>
          </motion.div>

          {/* Message humoristique */}
          <motion.div
            className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 p-6 rounded-xl border-2 border-dashed border-yellow-400 dark:border-yellow-600 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <motion.div
                animate={sparkleAnimation}
                className="text-yellow-500"
              >
                <Lightbulb size={24} />
              </motion.div>
              <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-300">
                Psst... Petit secret !
              </h3>
              <motion.div
                animate={sparkleAnimation}
                className="text-yellow-500"
                style={{ animationDelay: "0.5s" }}
              >
                <Sparkles size={24} />
              </motion.div>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 text-center">
              Nos développeurs nourrissent l'IA avec du café ☕ et des lignes de
              code.
              <br />
              <strong>Résultat attendu :</strong> Des plannings si parfaits que
              même votre chat sera jaloux ! 🐱
            </p>
          </motion.div>

          {/* Estimation avec animation de compte à rebours */}
          <motion.div
            className="flex items-center justify-center gap-3 mb-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.8 }}
          >
            <motion.div animate={pulseAnimation} className="text-blue-500">
              <Clock size={24} />
            </motion.div>
            <div className="text-center">
              <p className="text-blue-700 dark:text-blue-300 font-semibold">
                Disponibilité estimée
              </p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                Très bientôt ! 🎯
              </p>
            </div>
            <motion.div animate={rotateAnimation} className="text-blue-500">
              <Rocket size={24} />
            </motion.div>
          </motion.div>

          {/* Bouton de fermeture stylé */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 3, duration: 0.8 }}
          >
            <Button
              onClick={onClose}
              variant="primary"
              className="px-8 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={20} />
                Compris, j'ai hâte !
                <Sparkles size={20} />
              </span>
            </Button>
          </motion.div>
        </div>
      </div>
    </Modal>
  );
};

export default ComingSoonAIModal;
