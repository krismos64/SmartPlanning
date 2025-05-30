import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Brain,
  ChevronRight,
  MessageSquare,
  Settings,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  aiConversation,
  generateSchedule,
  generateScheduleWithContext,
} from "../../services/api";
import {
  AIGenerationMode,
  AIGenerationRequest,
  ConversationMessage,
  ConversationResponse,
  EnhancedAIGenerationRequest,
} from "../../types/ai";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface AIScheduleGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  year: number;
  weekNumber: number;
  onScheduleGenerated?: (scheduleData: any) => void;
}

const AIScheduleGeneratorModal: React.FC<AIScheduleGeneratorModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  year,
  weekNumber,
  onScheduleGenerated,
}) => {
  // Debug: vérifier les props reçues à chaque rendu
  console.log("Debug - AIScheduleGeneratorModal rendu avec props:", {
    isOpen,
    teamId,
    teamName,
    year,
    weekNumber,
  });

  // États principaux
  const [selectedMode, setSelectedMode] = useState<"quick" | "assisted" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "mode" | "quick" | "conversation" | "summary"
  >("mode");

  // États pour génération rapide
  const [quickConstraints, setQuickConstraints] = useState<string[]>([]);
  const [quickNotes, setQuickNotes] = useState("");

  // États pour conversation IA
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [aiResponse, setAiResponse] = useState<ConversationResponse | null>(
    null
  );
  const [conversationSummary, setConversationSummary] = useState("");
  const [additionalRequirements, setAdditionalRequirements] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Configuration des modes
  const generationModes: AIGenerationMode[] = [
    {
      type: "quick",
      label: "Génération Rapide",
      description: "Génération automatique avec prompts améliorés",
      icon: "zap",
    },
    {
      type: "assisted",
      label: "Génération Assistée",
      description: "Conversation avec l'IA pour personnaliser votre planning",
      icon: "messageSquare",
    },
  ];

  // Contraintes prédéfinies
  const predefinedConstraints = [
    "Respecter les préférences d'horaires des employés",
    "Assurer une couverture minimum en permanence",
    "Équilibrer la charge de travail",
    "Respecter les repos légaux",
    "Éviter les journées trop longues",
    "Prévoir des créneaux de chevauchement",
    "Optimiser les coûts",
    "Favoriser la continuité de service",
  ];

  // Scroll automatique vers le bas des messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, aiResponse]);

  // Debug: tracker les changements de props
  useEffect(() => {
    console.log("Debug - Props changées:", {
      isOpen,
      teamId,
      teamName,
      year,
      weekNumber,
    });

    // Vérifier si toutes les props nécessaires sont définies
    if (isOpen && (!teamId || !year || !weekNumber)) {
      console.error("Debug - Modal ouvert mais props manquantes:", {
        teamId,
        year,
        weekNumber,
      });
    }
  }, [isOpen, teamId, teamName, year, weekNumber]);

  // Reset du modal
  const resetModal = () => {
    setSelectedMode(null);
    setCurrentStep("mode");
    setQuickConstraints([]);
    setQuickNotes("");
    setConversationHistory([]);
    setCurrentMessage("");
    setAiResponse(null);
    setConversationSummary("");
    setAdditionalRequirements("");
    setIsLoading(false);
  };

  // Fermeture du modal
  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Gestion de la sélection du mode
  const handleModeSelect = (mode: "quick" | "assisted") => {
    setSelectedMode(mode);
    setCurrentStep(mode === "quick" ? "quick" : "conversation");
  };

  // Gestion des contraintes pour génération rapide
  const toggleConstraint = (constraint: string) => {
    setQuickConstraints((prev) =>
      prev.includes(constraint)
        ? prev.filter((c) => c !== constraint)
        : [...prev, constraint]
    );
  };

  // Génération rapide
  const handleQuickGeneration = async () => {
    if (quickConstraints.length === 0) {
      toast.error("Veuillez sélectionner au moins une contrainte");
      return;
    }

    // Debug: vérifier les valeurs des props
    console.log("Debug - Props reçues:", {
      teamId,
      year,
      weekNumber,
      quickConstraints,
      quickNotes,
    });

    // Validation supplémentaire des props
    if (!teamId || !year || !weekNumber) {
      console.error("Paramètres manquants:", { teamId, year, weekNumber });
      toast.error("Erreur: Paramètres de l'équipe manquants");
      return;
    }

    setIsLoading(true);
    try {
      const request: AIGenerationRequest = {
        teamId,
        year,
        weekNumber,
        constraints: quickConstraints,
        notes: quickNotes,
      };

      console.log("Debug - Requête envoyée:", request);

      const result = await generateSchedule(request);

      toast.success("Planning généré avec succès !");
      onScheduleGenerated?.(result);
      handleClose();
    } catch (error) {
      console.error("Erreur génération rapide:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la génération"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Envoi d'un message à l'IA
  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Debug: vérifier les valeurs des props
    console.log("Debug - Props pour conversation:", {
      teamId,
      year,
      weekNumber,
      message,
    });

    // Validation supplémentaire des props
    if (!teamId || !year || !weekNumber) {
      console.error("Paramètres manquants pour conversation:", {
        teamId,
        year,
        weekNumber,
      });
      toast.error("Erreur: Paramètres de l'équipe manquants");
      return;
    }

    setIsLoading(true);
    setCurrentMessage("");

    try {
      const conversationData = {
        teamId,
        year,
        weekNumber,
        message,
        conversationHistory,
      };

      console.log("Debug - Données conversation envoyées:", conversationData);

      const response = await aiConversation(conversationData);

      setAiResponse(response);
      setConversationHistory(response.conversationHistory);

      if (response.readyToGenerate) {
        setCurrentStep("summary");
        // Pré-remplir le résumé avec le dernier échange
        const summary = response.conversationHistory
          .map(
            (msg: ConversationMessage) =>
              `${msg.role === "user" ? "Manager" : "IA"}: ${msg.content}`
          )
          .join("\n\n");
        setConversationSummary(summary);
      }
    } catch (error) {
      console.error("Erreur conversation IA:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la conversation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Génération assistée finale
  const handleAssistedGeneration = async () => {
    setIsLoading(true);
    try {
      const request: EnhancedAIGenerationRequest = {
        teamId,
        year,
        weekNumber,
        constraints: ["Contraintes définies via conversation IA"],
        conversationSummary,
        additionalRequirements,
      };

      const result = await generateScheduleWithContext(request);

      toast.success("Planning assisté généré avec succès !");
      onScheduleGenerated?.(result);
      handleClose();
    } catch (error) {
      console.error("Erreur génération assistée:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la génération assistée"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Rendu du sélecteur de mode
  const renderModeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Assistant IA de Planification
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Choisissez votre mode de génération pour l'équipe{" "}
          <strong>{teamName}</strong>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Semaine {weekNumber}/{year}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {generationModes.map((mode) => (
          <motion.button
            key={mode.type}
            onClick={() => handleModeSelect(mode.type)}
            className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-left transition-all duration-200 hover:border-blue-500 hover:shadow-lg group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {mode.icon === "zap" && (
                  <Zap className="w-8 h-8 text-blue-500" />
                )}
                {mode.icon === "messageSquare" && (
                  <MessageSquare className="w-8 h-8 text-purple-500" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600">
                  {mode.label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {mode.description}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  // Rendu de la génération rapide
  const renderQuickGeneration = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Zap className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Génération Rapide
        </h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Contraintes de planification (sélectionnez au moins une) :
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {predefinedConstraints.map((constraint) => (
            <button
              key={constraint}
              onClick={() => toggleConstraint(constraint)}
              className={`text-left px-3 py-2 rounded-lg border transition-all ${
                quickConstraints.includes(constraint)
                  ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300"
                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              <span className="text-sm">{constraint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes additionnelles (optionnel) :
        </label>
        <textarea
          value={quickNotes}
          onChange={(e) => setQuickNotes(e.target.value)}
          placeholder="Informations spéciales pour cette semaine..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          rows={3}
        />
      </div>

      <div className="flex space-x-3">
        <Button
          onClick={() => setCurrentStep("mode")}
          variant="outline"
          className="flex-1"
        >
          Retour
        </Button>
        <Button
          onClick={handleQuickGeneration}
          disabled={isLoading || quickConstraints.length === 0}
          className="flex-1"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Génération...</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer le Planning
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Rendu de la conversation
  const renderConversation = () => (
    <div className="space-y-4 h-96 flex flex-col relative overflow-hidden">
      {/* Arrière-plan futuriste avec animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/30 to-cyan-900/20 rounded-lg">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,90,255,0.1)_50%,transparent_75%)] animate-pulse"></div>
      </div>

      <div className="flex items-center space-x-3 relative z-10">
        <div className="relative">
          <MessageSquare className="w-6 h-6 text-purple-400 animate-pulse" />
          <div className="absolute -inset-1 bg-purple-500 rounded-full blur-sm opacity-30 animate-ping"></div>
        </div>
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
          🤖 Assistant IA Futuriste
        </h3>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <div
            className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>

      {/* Zone de messages avec effet holographique */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-black/20 rounded-lg border border-cyan-500/30 shadow-2xl backdrop-blur-sm relative">
        {/* Effet de scan lines */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,255,0.03)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

        {conversationHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center text-cyan-300 py-8 relative"
          >
            <div className="relative inline-block">
              <Bot className="w-16 h-16 mx-auto mb-4 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.7)]" />
              <div className="absolute inset-0 bg-cyan-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
            </div>
            <motion.p
              className="text-lg font-medium bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨ Initialisez la connexion avec l'IA ✨
            </motion.p>
            <p className="text-sm mt-2 text-cyan-400/80">
              💬 "Je veux optimiser les horaires pour cette semaine"
            </p>
          </motion.div>
        )}

        {conversationHistory.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
              type: "spring",
              stiffness: 200,
            }}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div className="relative group">
              {/* Effet de glow */}
              <div
                className={`absolute inset-0 rounded-lg blur-sm opacity-30 ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600"
                    : "bg-gradient-to-r from-cyan-400 to-green-400"
                }`}
              ></div>

              <div
                className={`relative max-w-[80%] p-4 rounded-lg border backdrop-blur-sm ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-pink-600/80 text-white border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    : "bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 text-cyan-100 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                }`}
              >
                {/* Icône de rôle */}
                <div
                  className={`absolute -top-2 ${
                    message.role === "user" ? "-right-2" : "-left-2"
                  }`}
                >
                  {message.role === "user" ? (
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      👤
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-green-400 rounded-full flex items-center justify-center text-gray-900 text-xs font-bold shadow-lg animate-pulse">
                      🤖
                    </div>
                  )}
                </div>

                <motion.p
                  className="text-sm leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {message.content}
                </motion.p>

                <p
                  className={`text-xs opacity-70 mt-2 ${
                    message.role === "user" ? "text-blue-100" : "text-cyan-300"
                  }`}
                >
                  ⏰ {new Date(message.timestamp).toLocaleTimeString()}
                </p>

                {/* Effet de typing pour les messages IA */}
                {message.role === "assistant" &&
                  index === conversationHistory.length - 1 && (
                    <motion.div
                      className="absolute -bottom-1 -right-1 flex space-x-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </motion.div>
                  )}
              </div>
            </div>
          </motion.div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Interface de saisie futuriste */}
      <div className="flex space-x-3 relative z-10">
        <div className="flex-1 relative">
          {/* Effet de glow sur l'input */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-lg blur-sm"></div>
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && !isLoading && sendMessage(currentMessage)
            }
            placeholder="🚀 Transmettez vos instructions à l'IA..."
            disabled={isLoading}
            className="relative w-full px-4 py-3 bg-gray-900/80 border-2 border-cyan-500/40 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-cyan-100 placeholder-cyan-400/60 backdrop-blur-sm transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          />

          {/* Indicateur de saisie */}
          {currentMessage && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            </motion.div>
          )}
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => sendMessage(currentMessage)}
            disabled={isLoading || !currentMessage.trim()}
            size="sm"
            className={`px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all duration-300 ${
              isLoading ? "animate-pulse" : ""
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <motion.div
                animate={{ x: [0, 2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.div>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Boutons d'action futuristes */}
      <div className="flex space-x-3 relative z-10">
        <motion.div
          className="flex-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={() => setCurrentStep("mode")}
            variant="outline"
            className="w-full border-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 backdrop-blur-sm transition-all duration-300"
          >
            ← Retour
          </Button>
        </motion.div>

        {/* Bouton pour forcer la génération */}
        {conversationHistory.length > 0 && (
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => setCurrentStep("summary")}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 border-0 shadow-[0_0_25px_rgba(147,51,234,0.4)] transition-all duration-300"
              disabled={isLoading}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="mr-2"
              >
                <Settings className="w-4 h-4" />
              </motion.div>
              ⚡ Générer maintenant
            </Button>
          </motion.div>
        )}

        {/* Bouton automatique si l'IA estime être prête */}
        {aiResponse?.readyToGenerate && (
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => setCurrentStep("summary")}
              className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-400 hover:via-emerald-400 hover:to-teal-400 border-0 shadow-[0_0_25px_rgba(34,197,94,0.5)] animate-pulse transition-all duration-300"
              disabled={isLoading}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mr-2"
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              🎯 IA prête - Finaliser
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );

  // Rendu du résumé final
  const renderSummary = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Brain className="w-6 h-6 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Génération du Planning
        </h3>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
          📋 Équipe et période
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>{teamName}</strong> • Semaine {weekNumber}/{year}
        </p>
      </div>

      {conversationHistory.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🤖 Résumé de la conversation (optionnel) :
          </label>
          <textarea
            value={conversationSummary}
            onChange={(e) => setConversationSummary(e.target.value)}
            placeholder="L'IA intégrera automatiquement vos échanges..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={3}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ✨ Instructions supplémentaires (optionnel) :
        </label>
        <textarea
          value={additionalRequirements}
          onChange={(e) => setAdditionalRequirements(e.target.value)}
          placeholder="Ajoutez des contraintes spécifiques pour cette semaine..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          rows={2}
        />
      </div>

      <div className="flex space-x-3">
        <Button
          onClick={() => setCurrentStep("conversation")}
          variant="outline"
          className="flex-1"
        >
          ← Continuer la conversation
        </Button>
        <Button
          onClick={handleAssistedGeneration}
          disabled={isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Génération...</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              🚀 Générer le Planning
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900/50 to-purple-900/50 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.3)]">
        {/* Effet de grille futuriste en arrière-plan */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

        {/* Header futuriste */}
        <div className="relative flex items-center justify-between p-6 border-b border-cyan-500/30 bg-gradient-to-r from-gray-900/90 via-blue-900/80 to-purple-900/90 backdrop-blur-sm">
          {/* Effet de particules en arrière-plan */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-40"></div>
            <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-60"></div>
            <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce opacity-50"></div>
          </div>

          <div className="flex items-center space-x-4 relative z-10">
            <motion.div
              className="relative"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.5)]">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg blur-lg opacity-30 animate-pulse"></div>
            </motion.div>
            <div>
              <motion.h2
                className="text-xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent"
                animate={{ opacity: [1, 0.8, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🚀 Assistant IA de Planification
              </motion.h2>
              <motion.p
                className="text-sm text-cyan-400/80 flex items-center space-x-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span>🎯 {teamName}</span>
                <span className="text-purple-400">•</span>
                <span>
                  📅 Semaine {weekNumber}/{year}
                </span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="ml-2"
                >
                  ⚡
                </motion.div>
              </motion.p>
            </div>
          </div>

          <motion.button
            onClick={handleClose}
            className="relative z-10 text-cyan-400 hover:text-cyan-300 transition-colors duration-300 p-2 rounded-lg hover:bg-cyan-400/10"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Content avec arrière-plan futuriste */}
        <div className="p-6 relative z-10 bg-gradient-to-b from-transparent to-gray-900/20">
          <AnimatePresence mode="wait">
            {currentStep === "mode" && (
              <motion.div
                key="mode"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderModeSelection()}
              </motion.div>
            )}

            {currentStep === "quick" && (
              <motion.div
                key="quick"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderQuickGeneration()}
              </motion.div>
            )}

            {currentStep === "conversation" && (
              <motion.div
                key="conversation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderConversation()}
              </motion.div>
            )}

            {currentStep === "summary" && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderSummary()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
};

export default AIScheduleGeneratorModal;
