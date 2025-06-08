import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import React from "react";
import { useAIGuide } from "../../hooks/useAIGuide";
import AIGenerationGuide from "../ui/AIGenerationGuide";
import Button from "../ui/Button";

const AIGuideDemo: React.FC = () => {
  const aiGuide = useAIGuide(500); // Délai plus court pour la démo

  const simulateAIGeneration = () => {
    // Simuler la génération d'un planning IA
    console.log("🤖 Simulation de génération IA...");
    aiGuide.showGuide();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <motion.h1
          className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Démonstration du Guide IA
        </motion.h1>
        <p className="text-gray-600 dark:text-gray-300">
          Testez l'indication visuelle futuriste qui guide les utilisateurs vers
          les plannings IA
        </p>
      </div>

      {/* Zone de simulation du menu */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Menu de navigation simulé
        </h2>
        <div className="space-y-2">
          <div className="flex items-center p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
            <Sparkles className="w-5 h-5 mr-3 text-violet-500" />
            <span
              data-menu-item="plannings-ai"
              className="text-gray-700 dark:text-gray-200 font-medium"
            >
              Plannings IA
            </span>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm opacity-60">
            <div className="w-5 h-5 mr-3 bg-gray-300 rounded"></div>
            <span className="text-gray-500">Autres éléments du menu</span>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm opacity-60">
            <div className="w-5 h-5 mr-3 bg-gray-300 rounded"></div>
            <span className="text-gray-500">Autres éléments du menu</span>
          </div>
        </div>
      </div>

      {/* Bouton de test */}
      <div className="text-center mb-6">
        <Button
          onClick={simulateAIGeneration}
          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold px-6 py-3"
          icon={<Bot className="w-5 h-5" />}
        >
          Simuler la génération d'un planning IA
        </Button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Comment tester :
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
          <li>
            Cliquez sur le bouton "Simuler la génération d'un planning IA"
          </li>
          <li>
            Observez l'apparition du guide visuel avec le doigt pointeur animé
          </li>
          <li>Notez la bulle explicative qui pointe vers "Plannings IA"</li>
          <li>
            Cliquez sur "Voir mes plannings IA" pour faire défiler vers
            l'élément
          </li>
          <li>Le guide se ferme automatiquement après interaction</li>
        </ol>
      </div>

      {/* Guide IA */}
      <AIGenerationGuide
        isVisible={aiGuide.isVisible}
        onClose={aiGuide.hideGuide}
        title="Démonstration réussie !"
        message="Voici comment le guide apparaît après la génération d'un planning IA. Cliquez sur 'Voir mes plannings IA' pour naviguer vers la section correspondante."
      />
    </div>
  );
};

export default AIGuideDemo;
