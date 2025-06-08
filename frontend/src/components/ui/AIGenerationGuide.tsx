import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle, Sparkles, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";

interface AIGenerationGuideProps {
  isVisible: boolean;
  onClose?: () => void;
  targetSelector?: string; // Sélecteur CSS pour l'élément à pointer
  message?: string;
  title?: string;
}

const AIGenerationGuide: React.FC<AIGenerationGuideProps> = ({
  isVisible,
  onClose,
  targetSelector = '[data-menu-item="plannings-ai"]',
  message = "Votre planning IA a été généré avec succès ! Rendez-vous dans la section 'Plannings IA' pour le valider et l'appliquer.",
  title = "Planning IA généré !",
}) => {
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [targetPosition, setTargetPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible) {
      // Trouver l'élément cible
      const element = document.querySelector(targetSelector);
      if (element) {
        setTargetElement(element);

        // Calculer la position
        const rect = element.getBoundingClientRect();
        setTargetPosition({
          top: rect.top + rect.height / 2,
          left: rect.left + rect.width + 10,
        });

        // Ajouter une classe pour mettre en surbrillance l'élément
        element.classList.add("ai-guide-highlight");
      }
    }

    return () => {
      // Nettoyer la classe de surbrillance
      const element = document.querySelector(targetSelector);
      if (element) {
        element.classList.remove("ai-guide-highlight");
      }
    };
  }, [isVisible, targetSelector]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay semi-transparent avec animation */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
      </AnimatePresence>

      {/* Bulle de guide principale */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed z-50 max-w-sm bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white rounded-2xl shadow-2xl border border-violet-400/20"
        style={{
          top: Math.max(20, targetPosition.top - 100),
          left: Math.min(window.innerWidth - 400, targetPosition.left + 20),
        }}
      >
        {/* En-tête avec icône et titre */}
        <div className="p-4 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="p-2 bg-yellow-400/20 rounded-full"
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </motion.div>
            <h3 className="text-lg font-bold">{title}</h3>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <CheckCircle className="w-5 h-5 text-green-300" />
            </motion.div>
          </div>

          <p className="text-sm text-violet-100 leading-relaxed">{message}</p>
        </div>

        {/* Bouton d'action avec animation */}
        <div className="p-4 pt-2">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 cursor-pointer hover:bg-white/20 transition-all duration-300"
            onClick={() => {
              // Scroll vers l'élément et le mettre en surbrillance
              if (targetElement) {
                targetElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });

                // Effet de pulsation sur l'élément cible
                targetElement.classList.add("ai-guide-pulse");
                setTimeout(() => {
                  targetElement.classList.remove("ai-guide-pulse");
                }, 3000);
              }
              onClose?.();
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium">
                  Voir mes plannings IA
                </span>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bouton de fermeture discret */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-xs border border-gray-600 transition-colors"
        >
          ×
        </button>
      </motion.div>

      {/* Doigt pointeur animé */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: [0, -10, 5, 0],
          y: [0, 5, -3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="fixed z-50 pointer-events-none"
        style={{
          top: targetPosition.top - 30,
          left: targetPosition.left - 40,
        }}
      >
        <div className="relative">
          {/* Doigt avec effet de brillance */}
          <div className="text-4xl ai-guide-pointer">👆</div>

          {/* Effet de scintillement autour du doigt */}
          <motion.div
            animate={{
              scale: [0.8, 1.2, 0.8],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -inset-4 bg-gradient-to-r from-yellow-400/30 via-violet-400/30 to-blue-400/30 rounded-full blur-lg"
          />
        </div>
      </motion.div>
    </>
  );
};

export default AIGenerationGuide;
