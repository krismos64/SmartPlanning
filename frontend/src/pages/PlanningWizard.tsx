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
  const handleWizardDataUpdate = (newData: Partial<WizardData>) => {
    setWizardData(prev => ({
      ...prev,
      ...newData,
      currentStep
    }));
  };

  // Gestion de la validation d'étape
  const handleStepValidation = (stepIndex: number, isValid: boolean) => {
    setStepsValidation(prev => {
      const newValidation = [...prev];
      newValidation[stepIndex] = isValid;
      return newValidation;
    });
  };

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

  // Rendu du composant d'étape actuel
  const renderCurrentStep = () => {
    const stepProps = {
      wizardData,
      onUpdate: handleWizardDataUpdate,
      onValidationChange: (isValid: boolean) => handleStepValidation(currentStep, isValid)
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
          {/* En-tête du wizard */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              style={{ rotateX, rotateY }}
              className="inline-block"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 shadow-2xl dark:shadow-blue-500/20">
                <div className="flex items-center justify-center space-x-3">
                  <Sparkles className="h-8 w-8" />
                  <h1 className="text-3xl font-bold">Assistant IA Planning</h1>
                  <Sparkles className="h-8 w-8" />
                </div>
                <p className="mt-2 text-blue-100">
                  Génération automatique de planning ultra-rapide et optimisée
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Indicateur de progression */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-6 mb-8 transition-colors duration-300"
          >
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

            {/* Navigation des étapes */}
            <div className="grid grid-cols-7 gap-2">
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
                    <div className="text-xs opacity-75">{step.description}</div>
                    {step.isOptional && (
                      <div className="text-xs mt-1 opacity-60">(Optionnel)</div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Contenu de l'étape */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-8 mb-8 transition-colors duration-300"
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

          {/* Boutons de navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-6 transition-colors duration-300"
          >
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
          </motion.div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
};

export default PlanningWizard;