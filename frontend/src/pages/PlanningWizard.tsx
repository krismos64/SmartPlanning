import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, Calendar, AlertTriangle, Settings, Building, Eye, CheckCircle2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../components/ThemeProvider';
import LayoutWithSidebar from '../components/layout/LayoutWithSidebar';

// Import des nouveaux types et composants
import { 
  WizardData, 
  WizardStep, 
  GeneratePlanningPayload, 
  GeneratedPlanning, 
  PlanningStats,
  convertDaysToEnglish 
} from '../types/GeneratePlanningPayload';

// Import des composants de wizard
import TeamSelectorStep from '../components/planning/TeamSelectorStep';
import EmployeeSelectionStep from '../components/planning/EmployeeSelectionStep';
import AbsencesStep from '../components/planning/AbsencesStep';
import PreferencesStep from '../components/planning/PreferencesStep';
import CompanyConstraintsStep from '../components/planning/CompanyConstraintsStep';
import SummaryStep from '../components/planning/SummaryStep';
import ResultsStep from '../components/planning/ResultsStep';

// Import du service API (en utilisant le service existant)
import { autoGenerateSchedule } from '../services/autoGenerateSchedule';

const PlanningWizard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { isDarkMode } = useTheme();
  
  // La vérification d'authentification est déjà gérée par RoleProtectedRoute

  // Configuration des étapes du wizard
  const steps: WizardStep[] = [
    {
      id: 'team-selection',
      title: 'Équipe',
      description: 'Sélection équipe et période',
      icon: Users,
      isCompleted: false
    },
    {
      id: 'employee-selection',
      title: 'Employés',
      description: 'Choix des employés',
      icon: Calendar,
      isCompleted: false
    },
    {
      id: 'absences',
      title: 'Absences',
      description: 'Congés et exceptions',
      icon: AlertTriangle,
      isCompleted: false,
      isOptional: true
    },
    {
      id: 'preferences',
      title: 'Préférences',
      description: 'Contraintes personnelles',
      icon: Settings,
      isCompleted: false,
      isOptional: true
    },
    {
      id: 'company-constraints',
      title: 'Entreprise',
      description: 'Horaires et contraintes',
      icon: Building,
      isCompleted: false
    },
    {
      id: 'summary',
      title: 'Résumé',
      description: 'Validation finale',
      icon: Eye,
      isCompleted: false
    },
    {
      id: 'results',
      title: 'Résultats',
      description: 'Planning généré',
      icon: CheckCircle2,
      isCompleted: false
    }
  ];

  // États du wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    teamId: '',
    selectedEmployees: [],
    weekNumber: 0,
    year: new Date().getFullYear(),
    companyConstraints: {
      openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      openHours: ['09:00-18:00'],
      minEmployeesPerSlot: 1,
      maxHoursPerDay: 8,
      minHoursPerDay: 2,
      mandatoryLunchBreak: true,
      lunchBreakDuration: 60
    },
    currentStep: 0,
    isValid: false
  });

  // États de génération
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedPlanning, setGeneratedPlanning] = useState<GeneratedPlanning | null>(null);
  const [planningStats, setPlanningStats] = useState<PlanningStats | null>(null);
  
  // États de validation par étape
  const [stepsValidation, setStepsValidation] = useState<boolean[]>(new Array(steps.length).fill(false));

  // Animations avancées
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  // Gestion des données du wizard
  const handleWizardDataUpdate = React.useCallback((newData: Partial<WizardData>) => {
    setWizardData(prev => ({
      ...prev,
      ...newData,
      currentStep
    }));
  }, [currentStep]);

  // Gestion de la validation d'étape
  const handleStepValidation = React.useCallback((stepIndex: number, isValid: boolean) => {
    setStepsValidation(prev => {
      const newValidation = [...prev];
      newValidation[stepIndex] = isValid;
      return newValidation;
    });
  }, []);

  // Navigation entre les étapes
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Marquer l'étape courante comme complétée si elle est valide
      if (stepsValidation[currentStep] || steps[currentStep].isOptional) {
        steps[currentStep].isCompleted = true;
      }
      
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Permettre la navigation vers les étapes précédentes ou la suivante si l'étape courante est valide
    if (stepIndex <= currentStep || (stepIndex === currentStep + 1 && stepsValidation[currentStep])) {
      setCurrentStep(stepIndex);
    }
  };

  // Génération du planning
  const handleGenerate = async () => {
    if (currentStep !== 5) return; // Seulement depuis l'étape Summary
    
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setCurrentStep(6); // Passer à l'étape Results
      
      // Simulation de progression
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      // Préparer le payload pour l'API
      const payload: GeneratePlanningPayload = {
        employees: wizardData.selectedEmployees.map(employee => ({
          _id: employee._id,
          contractHoursPerWeek: employee.contractHoursPerWeek,
          exceptions: employee.exceptions?.map(ex => ({
            date: ex.date,
            type: ex.type
          })) || [],
          preferences: {
            preferredDays: employee.preferences?.preferredDays || [],
            preferredHours: employee.preferences?.preferredHours || [],
            allowSplitShifts: employee.preferences?.allowSplitShifts ?? true,
            maxConsecutiveDays: employee.preferences?.maxConsecutiveDays || 5
          },
          restDay: employee.restDay
        })),
        weekNumber: wizardData.weekNumber,
        year: wizardData.year,
        companyConstraints: wizardData.companyConstraints
      };

      console.log('🚀 Envoi du payload vers l\'API:', payload);
      
      // Appel à l'API de génération
      const result = await autoGenerateSchedule(payload);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      // Attendre un peu pour l'effet visuel
      setTimeout(() => {
        setGeneratedPlanning(result.planning);
        setPlanningStats(result.stats || result.metadata?.stats || null);
        setIsGenerating(false);
        
        // Confettis de célébration
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        const savedCount = result.savedSchedules || Object.keys(result.planning).length;
        showToast(`Planning généré avec succès ! ${savedCount} planning(s) sauvegardé(s)`, 'success');
      }, 500);

    } catch (error: any) {
      console.error('Erreur génération planning:', error);
      clearInterval(progressInterval!);
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentStep(5); // Retour à l'étape Summary
      
      showToast(
        error.message || 'Erreur lors de la génération du planning', 
        'error'
      );
    }
  };

  // Navigation vers la validation
  const handleNavigateToValidation = () => {
    navigate('/validation-plannings');
  };

  // Callback pour la validation de l'étape courante
  const handleCurrentStepValidation = React.useCallback((isValid: boolean) => {
    handleStepValidation(currentStep, isValid);
  }, [handleStepValidation, currentStep]);

  // Rendu du composant d'étape actuel
  const renderCurrentStep = () => {
    const stepProps = {
      wizardData,
      onUpdate: handleWizardDataUpdate,
      onValidationChange: handleCurrentStepValidation
    };

    switch (currentStep) {
      case 0:
        return <TeamSelectorStep {...stepProps} />;
      case 1:
        return <EmployeeSelectionStep {...stepProps} />;
      case 2:
        return <AbsencesStep {...stepProps} />;
      case 3:
        return <PreferencesStep {...stepProps} />;
      case 4:
        return <CompanyConstraintsStep {...stepProps} />;
      case 5:
        return <SummaryStep {...stepProps} />;
      case 6:
        return (
          <ResultsStep
            generatedPlanning={generatedPlanning}
            planningStats={planningStats}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            onNavigateToValidation={handleNavigateToValidation}
          />
        );
      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep];
  const isCurrentStepValid = stepsValidation[currentStep];
  const canProceed = isCurrentStepValid || currentStepData?.isOptional;

  return (
    <LayoutWithSidebar>
      <div 
        className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mouseX.set(e.clientX - rect.width / 2);
          mouseY.set(e.clientY - rect.height / 2);
        }}
      >
        <div className="container mx-auto px-4 py-8">
          {/* En-tête du wizard futuriste */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              style={{ rotateX, rotateY }}
              className="inline-block relative"
            >
              {/* Halo d'arrière-plan avec animation */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-2xl blur-xl opacity-30"
              />
              
              {/* Contenu principal avec effets néon */}
              <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 text-white rounded-2xl p-8 shadow-2xl border border-cyan-400/30 dark:shadow-cyan-500/20 overflow-hidden">
                {/* Lignes de grille futuristes */}
                <div className="absolute inset-0 opacity-10">
                  <div className="grid grid-cols-8 h-full">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="border-r border-cyan-400/20" />
                    ))}
                  </div>
                  <div className="absolute inset-0 grid grid-rows-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="border-b border-cyan-400/20" />
                    ))}
                  </div>
                </div>
                
                {/* Effets de particules animées */}
                <motion.div
                  animate={{
                    x: [-20, 20, -20],
                    y: [-10, 10, -10]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute top-4 right-4 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
                />
                <motion.div
                  animate={{
                    x: [20, -20, 20],
                    y: [10, -10, 10]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute bottom-4 left-4 w-1 h-1 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50"
                />
                
                {/* Titre avec effet néon */}
                <div className="flex items-center justify-center space-x-4 relative z-10">
                  <motion.div
                    animate={{
                      rotate: [0, 180, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="h-10 w-10 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
                  </motion.div>
                  
                  <motion.h1 
                    className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent"
                    style={{
                      textShadow: '0 0 30px rgba(34, 211, 238, 0.5)',
                      fontFamily: '"Orbitron", "Exo 2", sans-serif'
                    }}
                    animate={{
                      textShadow: [
                        '0 0 30px rgba(34, 211, 238, 0.5)',
                        '0 0 50px rgba(34, 211, 238, 0.8)',
                        '0 0 30px rgba(34, 211, 238, 0.5)'
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    Assistant IA Planning
                  </motion.h1>
                  
                  <motion.div
                    animate={{
                      rotate: [360, 180, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="h-10 w-10 text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]" />
                  </motion.div>
                </div>
                
                {/* Sous-titre avec effet holographique */}
                <motion.p 
                  className="mt-4 text-lg text-cyan-100 relative z-10"
                  style={{
                    fontFamily: '"Orbitron", "Exo 2", sans-serif',
                    textShadow: '0 0 15px rgba(34, 211, 238, 0.3)'
                  }}
                  animate={{
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  Génération automatique de planning ultra-rapide et optimisée
                </motion.p>
                
                {/* Barres de scanning animées */}
                <motion.div
                  animate={{
                    x: [-100, 400]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-30"
                />
                
                {/* Bordures néon animées */}
                <div className="absolute inset-0 rounded-2xl">
                  <motion.div
                    animate={{
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Indicateur de progression - Responsive */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 transition-colors duration-300"
          >
            {/* Version Desktop */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                  Étape {currentStep + 1} sur {steps.length}
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                  {Math.round(((currentStep + 1) / steps.length) * 100)}% terminé
                </div>
              </div>
              
              {/* Barre de progression */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6 transition-colors duration-300">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Version Mobile - Plus compacte */}
            <div className="md:hidden mb-4">
              <div className="text-center mb-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                  Étape {currentStep + 1} / {steps.length}
                </h2>
                <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                  {Math.round(((currentStep + 1) / steps.length) * 100)}% terminé
                </div>
              </div>
              
              {/* Barre de progression mobile */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-3 transition-colors duration-300">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full"
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Navigation des étapes - Responsive */}
            <div className="space-y-4">
              {/* Version Desktop/Tablette - Grille horizontale */}
              <div className="hidden md:grid md:grid-cols-7 gap-2">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = step.isCompleted;
                  const isAccessible = index <= currentStep || (index === currentStep + 1 && canProceed);
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(index)}
                      disabled={!isAccessible}
                      className={`p-3 rounded-xl text-center transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                          : isCompleted
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/70 border border-transparent dark:border-green-700'
                          : isAccessible
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-transparent dark:border-gray-600'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50 border border-transparent dark:border-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">{step.title}</div>
                      <div className="text-xs opacity-75 hidden lg:block">{step.description}</div>
                      {step.isOptional && (
                        <div className="text-xs mt-1 opacity-60 hidden lg:block">(Optionnel)</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Version Mobile - Liste verticale compacte */}
              <div className="md:hidden space-y-2">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = step.isCompleted;
                  const isAccessible = index <= currentStep || (index === currentStep + 1 && canProceed);
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(index)}
                      disabled={!isAccessible}
                      className={`w-full p-4 rounded-xl flex items-center text-left transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : isCompleted
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/70 border border-transparent dark:border-green-700'
                          : isAccessible
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-transparent dark:border-gray-600'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50 border border-transparent dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg mr-3 bg-white/20">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{index + 1}. {step.title}</span>
                          {step.isOptional && (
                            <span className="text-xs opacity-60 bg-white/20 px-2 py-1 rounded">Optionnel</span>
                          )}
                          {isCompleted && !isActive && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="text-xs opacity-75 mt-1">{step.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Indicateur d'étape actuelle pour mobile */}
              <div className="md:hidden text-center">
                <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Étape {currentStep + 1} sur {steps.length} • {Math.round(((currentStep + 1) / steps.length) * 100)}% terminé
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contenu de l'étape */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 md:p-8 mb-6 md:mb-8 transition-colors duration-300"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderCurrentStep()}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Boutons de navigation - Responsive */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 md:p-6 transition-colors duration-300"
          >
            {/* Version Desktop */}
            <div className="hidden md:flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 ${
                  currentStep === 0
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600 shadow-lg hover:shadow-xl border-0 dark:border dark:border-gray-600'
                }`}
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Précédent
              </button>

              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                  {currentStepData?.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  {currentStepData?.description}
                </div>
                {!isCurrentStepValid && !currentStepData?.isOptional && (
                  <div className="text-xs text-red-400 mt-1">
                    Compléter cette étape pour continuer
                  </div>
                )}
              </div>

              {currentStep < 5 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 ${
                    canProceed
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Suivant
                  <ChevronRight className="h-5 w-5 ml-2" />
                </button>
              ) : currentStep === 5 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerate}
                  disabled={!isCurrentStepValid || isGenerating}
                  className={`flex items-center px-8 py-3 rounded-xl transition-all duration-300 ${
                    isCurrentStepValid && !isGenerating
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  {isGenerating ? 'Génération...' : 'Générer le planning'}
                </motion.button>
              ) : (
                <div className="w-24" /> // Espaceur pour l'équilibre visuel
              )}
            </div>

            {/* Version Mobile */}
            <div className="md:hidden space-y-4">
              {/* Informations de l'étape actuelle */}
              <div className="text-center py-2">
                <div className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                  {currentStepData?.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  {currentStepData?.description}
                </div>
                {!isCurrentStepValid && !currentStepData?.isOptional && (
                  <div className="text-xs text-red-400 mt-1">
                    Compléter cette étape pour continuer
                  </div>
                )}
              </div>

              {/* Boutons de navigation empilés */}
              <div className="flex flex-col space-y-3">
                {currentStep < 5 ? (
                  <>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed}
                      className={`w-full flex items-center justify-center px-6 py-3 rounded-xl transition-all duration-300 ${
                        canProceed
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Suivant
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </button>
                    {currentStep > 0 && (
                      <button
                        onClick={handlePrevious}
                        className="w-full flex items-center justify-center px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                      >
                        <ChevronLeft className="h-5 w-5 mr-2" />
                        Précédent
                      </button>
                    )}
                  </>
                ) : currentStep === 5 ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerate}
                      disabled={!isCurrentStepValid || isGenerating}
                      className={`w-full flex items-center justify-center px-8 py-4 rounded-xl transition-all duration-300 ${
                        isCurrentStepValid && !isGenerating
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      {isGenerating ? 'Génération en cours...' : 'Générer le planning'}
                    </motion.button>
                    <button
                      onClick={handlePrevious}
                      className="w-full flex items-center justify-center px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" />
                      Précédent
                    </button>
                  </>
                ) : (
                  // Étape Results
                  currentStep > 0 && (
                    <button
                      onClick={handlePrevious}
                      className="w-full flex items-center justify-center px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" />
                      Précédent
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
};

export default PlanningWizard;