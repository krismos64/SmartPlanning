import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Users, Settings, Brain, CheckCircle, Clock, AlertCircle, Sparkles, Zap, Star, Rocket, Building, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../api/axiosInstance';
import { autoGenerateSchedule, GeneratePlanningPayload, GeneratedPlanning, PlanningStats } from '../services/autoGenerateSchedule';
import { PlanningConstraints, PlanningWizardStep, AIGenerationResponse } from '../types/PlanningConstraints';
import LayoutWithSidebar from '../components/layout/LayoutWithSidebar';

const PlanningWizard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  // Vérification de l'authentification
  React.useEffect(() => {
    if (!authLoading && !user) {
      showToast('Vous devez être connecté pour accéder au wizard IA', 'error');
      navigate('/connexion');
    }
  }, [user, authLoading, navigate, showToast]);
  
  // Si l'utilisateur n'est pas encore vérifié, attendre
  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }
  
  // Si l'utilisateur n'est pas connecté, ne rien afficher (redirection en cours)
  if (!user) {
    return null;
  }
  
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [teamConfigMode, setTeamConfigMode] = useState<string>('profiles');
  const [employeeProfiles, setEmployeeProfiles] = useState<{[key: string]: string}>({});
  const [expressSettings, setExpressSettings] = useState({
    dayPreference: 'weekdays',
    serviceType: 'continuous',
    flexibility: 'balanced',
    preferences: {
      regularSchedules: true,
      maxFlexibility: false,
      concentratedHours: false,
      spreadHours: false
    },
    constraints: {
      noWeekends: false,
      avoidLongBreaks: true,
      preferMornings: false,
      preferAfternoons: false
    }
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generatedPlanning, setGeneratedPlanning] = useState<GeneratedPlanning | null>(null);
  const [planningStats, setPlanningStats] = useState<PlanningStats | null>(null);
  
  // Animations avancées
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);
  const [constraints, setConstraints] = useState<PlanningConstraints>({
    teamId: '',
    weekNumber: 0,
    year: new Date().getFullYear(),
    employees: [],
    companyConstraints: {
      openingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      openingHours: [
        { day: 'monday', hours: ['08:00-12:00', '13:00-20:00'] },
        { day: 'tuesday', hours: ['08:00-12:00', '13:00-20:00'] },
        { day: 'wednesday', hours: ['08:00-12:00', '13:00-20:00'] },
        { day: 'thursday', hours: ['08:00-12:00', '13:00-20:00'] },
        { day: 'friday', hours: ['08:00-12:00', '13:00-20:00'] },
        { day: 'saturday', hours: ['08:00-12:00', '13:00-20:00'] },
        { day: 'sunday', hours: ['08:00-12:00'] }
      ],
      minStaffSimultaneously: 2,
      dailyOpeningTime: '08:00',
      dailyClosingTime: '20:00',
      maxHoursPerDay: 10,
      minHoursPerDay: 4,
      lunchBreakDuration: 60,
      mandatoryLunchBreak: true
    },
    preferences: {
      favorSplit: false,
      favorUniformity: true,
      balanceWorkload: true,
      prioritizeEmployeePreferences: true
    }
  });

  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [employeeExceptions, setEmployeeExceptions] = useState<{[key: string]: any[]}>({});
  const [employeePreferences, setEmployeePreferences] = useState<{[key: string]: {preferredDays?: string[], preferredHours?: string[], allowSplitShifts?: boolean, restDay?: string}}>({});
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Fonction pour calculer les dates de la semaine
  const getWeekDateRange = (weekNumber: number, year: number) => {
    if (!weekNumber || !year || weekNumber < 1 || weekNumber > 52) {
      return null;
    }

    // Calcul du premier jour de l'année
    const firstDayOfYear = new Date(year, 0, 1);
    const firstWeekDay = firstDayOfYear.getDay(); // 0 = dimanche, 1 = lundi, etc.
    
    // Ajustement pour commencer la semaine le lundi
    const daysToFirstMonday = firstWeekDay === 0 ? 1 : (8 - firstWeekDay);
    const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
    
    // Calcul du début de la semaine demandée
    const startOfWeek = new Date(firstMonday);
    startOfWeek.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
    
    // Calcul de la fin de la semaine (dimanche)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek,
      end: endOfWeek,
      weekNumber: weekNumber
    };
  };

  const formatDateRange = (weekNumber: number, year: number) => {
    const range = getWeekDateRange(weekNumber, year);
    if (!range) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    
    const startStr = range.start.toLocaleDateString('fr-FR', options);
    const endStr = range.end.toLocaleDateString('fr-FR', options);
    
    return `Du ${startStr} au ${endStr}`;
  };

  // Suggestions contextuelles intelligentes
  const getContextualSuggestions = (weekNumber: number, year: number) => {
    const suggestions = [];
    const date = new Date(year, 0, 1 + (weekNumber - 1) * 7);
    const month = date.getMonth() + 1;
    
    // Suggestions saisonnières
    if (month === 12 || month === 1) {
      suggestions.push({
        icon: '🎄',
        text: 'Période de fêtes détectée - Renforcer le weekend ?',
        type: 'holiday'
      });
    }
    if (month === 9) {
      suggestions.push({
        icon: '📚',
        text: 'Rentrée scolaire - Adapter les horaires parents ?',
        type: 'school'
      });
    }
    if (month >= 6 && month <= 8) {
      suggestions.push({
        icon: '☀️',
        text: 'Période estivale - Horaires d\'été actifs ?',
        type: 'summer'
      });
    }
    
    return suggestions;
  };

  // Application des profils prédéfinis
  const applyEmployeeProfile = (employeeId: string, profileType: string) => {
    const profiles = {
      manager: {
        contractHours: 39,
        preferredDays: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
        preferredHours: ['09:00-17:00'],
        allowSplitShifts: false,
        restDay: 'dimanche'
      },
      vendeur: {
        contractHours: 35,
        preferredDays: [],
        preferredHours: [],
        allowSplitShifts: true,
        restDay: undefined
      },
      polyvalent: {
        contractHours: 20,
        preferredDays: [],
        preferredHours: [],
        allowSplitShifts: true,
        restDay: undefined
      },
      expert: {
        contractHours: 39,
        preferredDays: [],
        preferredHours: [],
        allowSplitShifts: false,
        restDay: undefined
      }
    };

    const profile = profiles[profileType as keyof typeof profiles];
    if (profile) {
      // Mettre à jour les heures contractuelles
      setConstraints(prev => ({
        ...prev,
        employees: prev.employees.map(emp => 
          emp.id === employeeId 
            ? { ...emp, contractHours: profile.contractHours }
            : emp
        )
      }));

      // Mettre à jour les préférences
      setEmployeePreferences(prev => ({
        ...prev,
        [employeeId]: {
          preferredDays: profile.preferredDays,
          preferredHours: profile.preferredHours,
          allowSplitShifts: profile.allowSplitShifts,
          restDay: profile.restDay
        }
      }));
    }
  };

  // Application des paramètres express
  const applyExpressSettings = () => {
    constraints.employees.forEach(employee => {
      const settings: any = { 
        preferredDays: [],
        preferredHours: [],
        allowSplitShifts: expressSettings.serviceType !== 'continuous'
      };

      // Application des préférences de jours
      if (expressSettings.dayPreference === 'weekdays') {
        settings.preferredDays = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
      } else if (expressSettings.dayPreference === 'weekend') {
        settings.preferredDays = ['samedi', 'dimanche'];
      }
      // 'flexible' = pas de préférences spécifiques

      setEmployeePreferences(prev => ({
        ...prev,
        [employee.id]: settings
      }));
    });
  };

  // Calcul du score de faisabilité
  const calculateFeasibilityScore = (): number => {
    let score = 100;
    
    // Vérifications de base
    if (!constraints.teamId) score -= 30;
    if (!constraints.weekNumber || !constraints.year) score -= 20;
    if (!availableEmployees || availableEmployees.length === 0) score -= 30;
    
    // Vérifications des contraintes business
    if (!constraints.companyConstraints.openingDays || constraints.companyConstraints.openingDays.length === 0) score -= 15;
    if (!constraints.companyConstraints.minStaffSimultaneously) score -= 10;
    
    // Vérifications de l'équipe
    const configuredEmployees = availableEmployees?.filter(emp => 
      selectedEmployees.includes(emp._id) || employeePreferences[emp._id]
    ).length || 0;
    
    if (configuredEmployees === 0) score -= 20;
    else if (configuredEmployees < (availableEmployees?.length || 0) / 2) score -= 10;
    
    // Bonus pour mode de configuration
    if (teamConfigMode === 'profiles') score += 5;
    if (teamConfigMode === 'express') score += 3;
    
    return Math.max(0, Math.min(100, score));
  };

  // Alertes et vérifications de validation
  const getValidationAlerts = () => {
    const alerts: Array<{
      type: 'error' | 'warning' | 'success';
      title: string;
      message: string;
      suggestion?: string;
    }> = [];

    // Vérifications critiques (erreurs)
    if (!constraints.teamId) {
      alerts.push({
        type: 'error',
        title: 'Équipe manquante',
        message: 'Aucune équipe sélectionnée pour le planning',
        suggestion: 'Retournez à l\'étape 1 pour sélectionner une équipe'
      });
    }

    if (!constraints.weekNumber || !constraints.year) {
      alerts.push({
        type: 'error',
        title: 'Période incomplète',
        message: 'Semaine ou année non définie',
        suggestion: 'Spécifiez la semaine et l\'année à planifier'
      });
    }

    if (!availableEmployees || availableEmployees.length === 0) {
      alerts.push({
        type: 'error',
        title: 'Aucun employé disponible',
        message: 'Aucun employé trouvé pour cette équipe et cette période',
        suggestion: 'Vérifiez les employés assignés à cette équipe'
      });
    }

    // Vérifications importantes (avertissements)
    if (constraints.companyConstraints.openingDays?.length === 0) {
      alerts.push({
        type: 'warning',
        title: 'Jours d\'ouverture non définis',
        message: 'Aucun jour d\'ouverture configuré',
        suggestion: 'Définissez au moins un jour d\'ouverture'
      });
    }

    const minStaff = constraints.companyConstraints.minStaffSimultaneously || 1;
    const availableCount = availableEmployees?.length || 0;
    if (minStaff > availableCount) {
      alerts.push({
        type: 'warning',
        title: 'Couverture insuffisante',
        message: `${minStaff} personnes requises mais seulement ${availableCount} disponibles`,
        suggestion: 'Réduisez la couverture minimum ou ajoutez des employés'
      });
    }

    if (teamConfigMode === 'advanced') {
      const unconfiguredEmployees = availableEmployees?.filter(emp => 
        !employeePreferences[emp._id]
      ).length || 0;
      
      if (unconfiguredEmployees > 0) {
        alerts.push({
          type: 'warning',
          title: 'Configuration incomplète',
          message: `${unconfiguredEmployees} employé(s) sans préférences configurées`,
          suggestion: 'Configurez les préférences ou utilisez le mode Express'
        });
      }
    }

    // Vérifications positives (succès)
    if (calculateFeasibilityScore() >= 80) {
      alerts.push({
        type: 'success',
        title: 'Configuration excellente',
        message: 'Toutes les vérifications passent avec succès'
      });
    }

    if (teamConfigMode === 'profiles' && availableEmployees?.length > 0) {
      alerts.push({
        type: 'success',
        title: 'Profils optimisés',
        message: 'Configuration intelligente avec profils prédéfinis'
      });
    }

    return alerts;
  };

  // Estimation de la satisfaction
  const getEstimatedSatisfaction = (): number => {
    let satisfaction = 70; // Base

    // Bonus selon le mode
    if (teamConfigMode === 'profiles') satisfaction += 15;
    if (teamConfigMode === 'express') satisfaction += 10;
    if (teamConfigMode === 'advanced') satisfaction += 5;

    // Bonus pour configuration complète
    const configuredEmployees = availableEmployees?.filter(emp => 
      employeePreferences[emp._id] || selectedEmployees.includes(emp._id)
    ).length || 0;
    
    const configRatio = availableEmployees?.length > 0 ? configuredEmployees / availableEmployees.length : 0;
    satisfaction += configRatio * 15;

    // Malus pour contraintes strictes
    const minStaff = constraints.companyConstraints.minStaffSimultaneously || 1;
    if (minStaff >= (availableEmployees?.length || 1)) satisfaction -= 10;

    return Math.max(60, Math.min(95, Math.round(satisfaction)));
  };

  // Fonction pour démarrer la génération (appelée par le bouton)
  const handleGeneration = async () => {
    await generateSchedule();
  };

  // Conversion des jours français vers anglais pour l'API
  const convertDaysToEnglish = (frenchDays: string[]): string[] => {
    const dayMapping: { [key: string]: string } = {
      'lundi': 'monday',
      'mardi': 'tuesday', 
      'mercredi': 'wednesday',
      'jeudi': 'thursday',
      'vendredi': 'friday',
      'samedi': 'saturday',
      'dimanche': 'sunday'
    };
    
    return frenchDays.map(day => dayMapping[day] || day);
  };

  const convertDayToEnglish = (frenchDay: string): string => {
    const dayMapping: { [key: string]: string } = {
      'lundi': 'monday',
      'mardi': 'tuesday', 
      'mercredi': 'wednesday',
      'jeudi': 'thursday',
      'vendredi': 'friday',
      'samedi': 'saturday',
      'dimanche': 'sunday'
    };
    
    return dayMapping[frenchDay] || frenchDay;
  };

  const steps: PlanningWizardStep[] = [
    {
      id: 0,
      title: 'Contexte',
      description: 'Équipe et semaine à planifier',
      icon: Calendar,
      isCompleted: currentStep > 0,
      isActive: currentStep === 0
    },
    {
      id: 1,
      title: 'Contraintes Business',
      description: 'Horaires et règles d\'ouverture',
      icon: Settings,
      isCompleted: currentStep > 1,
      isActive: currentStep === 1
    },
    {
      id: 2,
      title: 'Préférences Équipe',
      description: 'Configuration des employés',
      icon: Users,
      isCompleted: currentStep > 2,
      isActive: currentStep === 2
    },
    {
      id: 3,
      title: 'Validation',
      description: 'Résumé et génération',
      icon: Rocket,
      isCompleted: false,
      isActive: currentStep === 3
    }
  ];

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setIsLoadingTeams(true);
    try {
      const response = await axiosInstance.get('/teams');
      const teams = response.data.data || [];
      setAvailableTeams(teams);
    } catch (error) {
      console.error('Erreur lors du chargement des équipes:', error);
      showToast('Erreur lors du chargement des équipes', 'error');
      setAvailableTeams([]);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const fetchEmployees = async (teamId: string) => {
    setIsLoadingEmployees(true);
    try {
      const response = await axiosInstance.get(`/teams/${teamId}/employees`);
      const employees = response.data.data || [];
      setAvailableEmployees(employees);
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
      showToast('Erreur lors du chargement des employés', 'error');
      setAvailableEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };


  const generateSchedule = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);

      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      // Intégrer les absences dans les contraintes des employés
      const employeesWithExceptions = (availableEmployees || []).map(emp => {
        const exceptions = employeeExceptions[emp._id] || [];
        return {
          _id: emp._id,
          contractHoursPerWeek: emp.contractHours || 35,
          exceptions: exceptions.filter(ex => ex.date && ex.type).map(ex => ({
            date: ex.date,
            type: ex.type as 'vacation' | 'sick' | 'unavailable' | 'training' | 'reduced'
          })),
          preferences: {
            preferredDays: convertDaysToEnglish(employeePreferences[emp._id]?.preferredDays || []),
            preferredHours: employeePreferences[emp._id]?.preferredHours || [],
            allowSplitShifts: employeePreferences[emp._id]?.allowSplitShifts !== undefined ? employeePreferences[emp._id]?.allowSplitShifts : true
          },
          restDay: employeePreferences[emp._id]?.restDay ? convertDayToEnglish(employeePreferences[emp._id]?.restDay) : undefined
        };
      });

      // Conversion des contraintes d'entreprise vers le format API
      // Ne prendre QUE les heures des jours qui sont dans openingDays
      const openHours: string[] = [];
      const selectedOpeningDays = constraints.companyConstraints?.openingDays || [];
      
      if (constraints.companyConstraints?.openingHours && selectedOpeningDays.length > 0) {
        // Ne traiter que les jours sélectionnés dans openingDays
        constraints.companyConstraints.openingHours.forEach(dayHours => {
          // Vérifier si ce jour est dans les jours d'ouverture sélectionnés
          if (selectedOpeningDays.includes(dayHours.day)) {
            dayHours.hours.forEach(hour => {
              if (!openHours.includes(hour)) {
                openHours.push(hour);
              }
            });
          }
        });
      }

      const payload: GeneratePlanningPayload = {
        weekNumber: constraints.weekNumber,
        year: constraints.year,
        employees: employeesWithExceptions,
        companyConstraints: {
          openDays: convertDaysToEnglish(constraints.companyConstraints?.openingDays || []), // Conversion français -> anglais
          openHours: openHours.length > 0 ? openHours : [
            `${constraints.companyConstraints?.dailyOpeningTime || '08:00'}-${constraints.companyConstraints?.dailyClosingTime || '18:00'}`
          ], // Utiliser les heures du wizard ou par défaut
          minEmployeesPerSlot: constraints.companyConstraints?.minStaffSimultaneously || 1, // Correction: minStaffSimultaneously -> minEmployeesPerSlot
          // Nouvelles contraintes du wizard
          maxHoursPerDay: constraints.companyConstraints?.maxHoursPerDay,
          minHoursPerDay: constraints.companyConstraints?.minHoursPerDay,
          mandatoryLunchBreak: constraints.companyConstraints?.mandatoryLunchBreak,
          lunchBreakDuration: constraints.companyConstraints?.lunchBreakDuration
        }
      };

      const response = await autoGenerateSchedule(payload);
      
      setGenerationProgress(100);
      clearInterval(progressInterval);

      if (response.success) {
        // 🎉 Déclencher les confettis de célébration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']
        });
        
        // Animation de confettis en cascade
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#10B981', '#3B82F6', '#8B5CF6']
          });
          
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#F59E0B', '#EF4444', '#8B5CF6']
          });
        }, 300);

        setGeneratedPlanning(response.planning);
        setPlanningStats(response.metadata.stats);
        
        showToast('Planning généré avec succès! 🎉', 'success');
        
        // Rediriger vers la page de validation des plannings
        setTimeout(() => {
          navigate('/validation-plannings');
        }, 1500);
      }

    } catch (error: any) {
      console.error('Erreur génération:', error);
      
      // Gestion spécifique des erreurs d'authentification
      if (error.message?.includes('Session expirée') || error.message?.includes('401')) {
        showToast('Session expirée. Veuillez vous reconnecter.', 'error');
        setTimeout(() => navigate('/connexion'), 2000);
        return;
      }
      
      showToast(error.message || 'Erreur lors de la génération du planning', 'error');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Carte Équipe avec glassmorphism */}
            <motion.div 
              className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-8 rounded-3xl shadow-2xl overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              {/* Fond animé */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 dark:from-blue-400/20 dark:via-purple-400/10 dark:to-cyan-400/20"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
              
              <div className="relative z-10">
                <motion.h3 
                  className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="mr-4 p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Calendar className="w-6 h-6" />
                  </motion.div>
                  Sélection de l'équipe
                  <Sparkles className="ml-2 w-5 h-5 text-yellow-500 animate-pulse" />
                </motion.h3>
                
                <motion.select
                  value={constraints.teamId}
                  onChange={(e) => {
                    setConstraints(prev => ({ ...prev, teamId: e.target.value }));
                    fetchEmployees(e.target.value);
                  }}
                  className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 text-gray-900 dark:text-white shadow-inner"
                  whileFocus={{ scale: 1.02 }}
                >
                  <option value="">✨ Choisir une équipe</option>
                  {isLoadingTeams ? (
                    <option disabled>🔄 Chargement des équipes...</option>
                  ) : availableTeams && availableTeams.length > 0 ? availableTeams.map(team => (
                    <option key={team._id} value={team._id}>🏢 {team.name}</option>
                  )) : (
                    <option disabled>❌ Aucune équipe disponible</option>
                  )}
                </motion.select>
              </div>
            </motion.div>

            {/* Carte Semaine avec effet holographique */}
            <motion.div 
              className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-8 rounded-3xl shadow-2xl overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              {/* Effet holographique */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/10 via-blue-500/5 to-purple-600/10 dark:from-cyan-300/20 dark:via-blue-400/10 dark:to-purple-500/20"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
              
              <div className="relative z-10">
                <motion.h3 
                  className="text-2xl font-bold mb-6 text-gray-900 dark:text-white"
                  initial={{ x: 20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  🗓️ Semaine à planifier
                  <Star className="inline ml-2 w-5 h-5 text-yellow-500 animate-spin" style={{ animationDuration: '3s' }} />
                </motion.h3>
                
                {/* Affichage de la période sélectionnée */}
                {constraints.weekNumber > 0 && constraints.year && (
                  <motion.div
                    className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/30 rounded-2xl"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                        📅 Semaine {constraints.weekNumber} de {constraints.year}
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatDateRange(constraints.weekNumber, constraints.year)}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                      📅 Numéro de semaine (1-52)
                    </label>
                    <motion.input
                      type="number"
                      min="1"
                      max="52"
                      placeholder="Ex: 15 pour la 15ème semaine"
                      value={constraints.weekNumber || ''}
                      onChange={(e) => setConstraints(prev => ({ ...prev, weekNumber: parseInt(e.target.value) || 0 }))}
                      className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:ring-4 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-300 text-gray-900 dark:text-white shadow-inner placeholder-gray-400 dark:placeholder-gray-500"
                      whileFocus={{ scale: 1.05 }}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                      🎯 Année (2024-2030)
                    </label>
                    <motion.input
                      type="number"
                      min="2024"
                      max="2030"
                      placeholder={`Ex: ${new Date().getFullYear()}`}
                      value={constraints.year || ''}
                      onChange={(e) => setConstraints(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                      className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-300 text-gray-900 dark:text-white shadow-inner placeholder-gray-400 dark:placeholder-gray-500"
                      whileFocus={{ scale: 1.05 }}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Contraintes Business */}
            <motion.div 
              className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-8 rounded-3xl shadow-2xl overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-pink-600/10 dark:from-orange-400/20 dark:via-red-400/10 dark:to-pink-500/20"></div>
              
              <div className="relative z-10">
                <motion.h3 
                  className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="mr-4 p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Building className="w-6 h-6" />
                  </motion.div>
                  Contraintes Business
                  <div className="ml-2 text-orange-500">
                    🏢
                  </div>
                </motion.h3>

                {/* Suggestions contextuelles */}
                {getContextualSuggestions().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          💡 Suggestions intelligentes
                        </h4>
                        <div className="space-y-2">
                          {getContextualSuggestions().map((suggestion, idx) => (
                            <div key={idx} className="text-sm text-blue-800 dark:text-blue-200">
                              • {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-8">
                  {/* Heures d'ouverture jour par jour */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 p-6 rounded-2xl shadow-lg"
                  >
                    <label className="block text-lg font-semibold mb-6 text-gray-700 dark:text-gray-300">
                      ⏰ Configuration des horaires jour par jour
                    </label>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {[
                        { key: 'monday', label: 'Lundi', icon: '🌙', color: 'blue' },
                        { key: 'tuesday', label: 'Mardi', icon: '🔥', color: 'red' },
                        { key: 'wednesday', label: 'Mercredi', icon: '⚡', color: 'yellow' },
                        { key: 'thursday', label: 'Jeudi', icon: '🌟', color: 'green' },
                        { key: 'friday', label: 'Vendredi', icon: '🎉', color: 'purple' },
                        { key: 'saturday', label: 'Samedi', icon: '🌊', color: 'cyan' },
                        { key: 'sunday', label: 'Dimanche', icon: '☀️', color: 'amber' }
                      ].map((day) => {
                        const isOpen = constraints.companyConstraints.openingDays.includes(day.key);
                        const dayHours = constraints.companyConstraints.openingHours.find(h => h.day === day.key);
                        
                        return (
                          <motion.div
                            key={day.key}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                              isOpen
                                ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                            }`}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center mb-3">
                              <span className="text-xl mr-2">{day.icon}</span>
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{day.label}</h4>
                              <div className="ml-auto">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isOpen}
                                    onChange={(e) => {
                                      const currentDays = constraints.companyConstraints.openingDays;
                                      const newDays = e.target.checked
                                        ? currentDays.includes(day.key) 
                                          ? currentDays 
                                          : [...currentDays, day.key]
                                        : currentDays.filter(d => d !== day.key);
                                      
                                      setConstraints(prev => ({
                                        ...prev,
                                        companyConstraints: {
                                          ...prev.companyConstraints,
                                          openingDays: newDays
                                        }
                                      }));
                                    }}
                                    className="sr-only"
                                  />
                                  <div className={`relative w-10 h-5 transition duration-200 ease-linear rounded-full ${
                                    isOpen ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                  }`}>
                                    <div className={`absolute left-0 top-0 bg-white w-5 h-5 rounded-full transition transform ${
                                      isOpen ? 'translate-x-5' : 'translate-x-0'
                                    } shadow-md`}></div>
                                  </div>
                                </label>
                              </div>
                            </div>
                            
                            {isOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-2"
                              >
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                                      Ouverture
                                    </label>
                                    <input
                                      type="time"
                                      value={dayHours?.hours[0]?.split('-')[0] || '08:00'}
                                      onChange={(e) => {
                                        const currentHours = dayHours?.hours[0]?.split('-') || ['08:00', '18:00'];
                                        const newTimeRange = `${e.target.value}-${currentHours[1]}`;
                                        
                                        setConstraints(prev => ({
                                          ...prev,
                                          companyConstraints: {
                                            ...prev.companyConstraints,
                                            openingHours: prev.companyConstraints.openingHours.map(h =>
                                              h.day === day.key
                                                ? { ...h, hours: [newTimeRange] }
                                                : h
                                            )
                                          }
                                        }));
                                      }}
                                      className="w-full p-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                                      Fermeture
                                    </label>
                                    <input
                                      type="time"
                                      value={dayHours?.hours[0]?.split('-')[1] || '18:00'}
                                      onChange={(e) => {
                                        const currentHours = dayHours?.hours[0]?.split('-') || ['08:00', '18:00'];
                                        const newTimeRange = `${currentHours[0]}-${e.target.value}`;
                                        
                                        setConstraints(prev => ({
                                          ...prev,
                                          companyConstraints: {
                                            ...prev.companyConstraints,
                                            openingHours: prev.companyConstraints.openingHours.map(h =>
                                              h.day === day.key
                                                ? { ...h, hours: [newTimeRange] }
                                                : h
                                            )
                                          }
                                        }));
                                      }}
                                      className="w-full p-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                  Durée: {(() => {
                                    const hours = dayHours?.hours[0]?.split('-') || ['08:00', '18:00'];
                                    const start = hours[0].split(':').map(Number);
                                    const end = hours[1].split(':').map(Number);
                                    const startMinutes = start[0] * 60 + start[1];
                                    const endMinutes = end[0] * 60 + end[1];
                                    const duration = (endMinutes - startMinutes) / 60;
                                    return `${duration}h`;
                                  })()}
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <div className="flex items-center justify-center">
                          <Clock className="w-4 h-4 text-blue-600 mr-2" />
                          <div className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>{constraints.companyConstraints.openingDays.length}</strong> jours d'ouverture configurés
                          </div>
                        </div>
                      </div>
                      
                      {/* Boutons de raccourci */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        <motion.button
                          type="button"
                          onClick={() => {
                            // Activer Lun-Ven avec horaires 8h-18h
                            const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                            setConstraints(prev => ({
                              ...prev,
                              companyConstraints: {
                                ...prev.companyConstraints,
                                openingDays: weekDays,
                                openingHours: prev.companyConstraints.openingHours.map(h => 
                                  weekDays.includes(h.day) 
                                    ? { ...h, hours: ['08:00-18:00'] }
                                    : h
                                )
                              }
                            }));
                          }}
                          className="px-3 py-1.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          🔄 Semaine classique (Lun-Ven 8h-18h)
                        </motion.button>
                        
                        <motion.button
                          type="button"
                          onClick={() => {
                            // Activer Lun-Sam avec horaires 9h-19h
                            const retailDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                            setConstraints(prev => ({
                              ...prev,
                              companyConstraints: {
                                ...prev.companyConstraints,
                                openingDays: retailDays,
                                openingHours: prev.companyConstraints.openingHours.map(h => 
                                  retailDays.includes(h.day) 
                                    ? { ...h, hours: h.day === 'saturday' ? ['09:00-17:00'] : ['09:00-19:00'] }
                                    : h
                                )
                              }
                            }));
                          }}
                          className="px-3 py-1.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          🛍️ Commerce (Lun-Sam)
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Couverture minimum */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label className="block text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                      👥 Couverture minimum
                    </label>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">
                          Combien de personnes minimum en simultané ?
                        </label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={constraints.companyConstraints.minStaffSimultaneously || 2}
                            onChange={(e) => setConstraints(prev => ({
                              ...prev,
                              companyConstraints: {
                                ...prev.companyConstraints,
                                minStaffSimultaneously: parseInt(e.target.value)
                              }
                            }))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {constraints.companyConstraints.minStaffSimultaneously || 2}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">personnes</span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          {(constraints.companyConstraints.minStaffSimultaneously || 2) >= 5 ? (
                            <span className="text-red-600 dark:text-red-400">⚠️ Attention: Exigence élevée</span>
                          ) : (constraints.companyConstraints.minStaffSimultaneously || 2) >= 3 ? (
                            <span className="text-yellow-600 dark:text-yellow-400">⚡ Exigence modérée</span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">✅ Exigence raisonnable</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Préférences Équipe */}
            <motion.div 
              className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-8 rounded-3xl shadow-2xl overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-cyan-600/10 dark:from-purple-400/20 dark:via-blue-400/10 dark:to-cyan-500/20"></div>
              
              <div className="relative z-10">
                <motion.h3 
                  className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="mr-4 p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl text-white shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Users className="w-6 h-6" />
                  </motion.div>
                  Préférences Équipe
                  <div className="ml-2 text-purple-500">
                    👥
                  </div>
                </motion.h3>

                {/* Sélecteur de mode */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-8"
                >
                  <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                    🎯 Choisissez votre mode de configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Mode Profils */}
                    <motion.button
                      type="button"
                      onClick={() => setTeamConfigMode('profiles')}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                        teamConfigMode === 'profiles'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">👨‍💼</div>
                        <h5 className="font-semibold text-gray-900 dark:text-white">Profils Prédéfinis</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Rapide et intelligent
                        </p>
                      </div>
                    </motion.button>

                    {/* Mode Express */}
                    <motion.button
                      type="button"
                      onClick={() => setTeamConfigMode('express')}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                        teamConfigMode === 'express'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">⚡</div>
                        <h5 className="font-semibold text-gray-900 dark:text-white">Configuration Express</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          30 secondes maximum
                        </p>
                      </div>
                    </motion.button>

                    {/* Mode Avancé */}
                    <motion.button
                      type="button"
                      onClick={() => setTeamConfigMode('advanced')}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                        teamConfigMode === 'advanced'
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">🔧</div>
                        <h5 className="font-semibold text-gray-900 dark:text-white">Détail Avancé</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Contrôle total
                        </p>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Contenu selon le mode sélectionné */}
                <AnimatePresence mode="wait">
                  {teamConfigMode === 'profiles' && (
                    <motion.div
                      key="profiles"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        👨‍💼 Sélectionnez les profils pour votre équipe
                      </h4>
                      
                      {/* Liste des employés avec sélection de profils */}
                      {availableEmployees && availableEmployees.length > 0 ? availableEmployees.map((employee, index) => (
                        <motion.div
                          key={employee._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                                {employee.firstName?.charAt(0) || employee.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white">
                                  {employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.name || 'Nom inconnu'}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{employee.email}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(employeeProfiles).map(([profileKey, profile]) => (
                              <motion.button
                                key={profileKey}
                                type="button"
                                onClick={() => applyEmployeeProfile(employee._id, profileKey)}
                                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                                  selectedEmployees.includes(employee._id) && employeePreferences[employee._id]?.profile === profileKey
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="text-center">
                                  <div className="text-2xl mb-1">{profile.icon}</div>
                                  <div className="font-medium text-sm text-gray-900 dark:text-white">{profile.name}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">{profile.hours}h</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{profile.days}</div>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          Aucun employé disponible
                        </div>
                      )}
                    </motion.div>
                  )}

                  {teamConfigMode === 'express' && (
                    <motion.div
                      key="express"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        ⚡ Configuration Express (30 secondes)
                      </h4>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                        <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">
                          Pour cette équipe, privilégier :
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {Object.entries(expressSettings.preferences).map(([key, setting]) => (
                            <motion.label
                              key={key}
                              className="flex items-center space-x-3 cursor-pointer"
                              whileHover={{ scale: 1.02 }}
                            >
                              <input
                                type="checkbox"
                                checked={setting}
                                onChange={(e) => setExpressSettings(prev => ({
                                  ...prev,
                                  preferences: {
                                    ...prev.preferences,
                                    [key]: e.target.checked
                                  }
                                }))}
                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700 dark:text-gray-300">
                                {key === 'regularSchedules' && '📅 Horaires réguliers pour tous'}
                                {key === 'maxFlexibility' && '🔄 Flexibilité individuelle maximale'}
                                {key === 'concentratedHours' && '📊 Concentration des heures (moins de jours)'}
                                {key === 'spreadHours' && '📈 Étalement des heures (plus de jours)'}
                              </span>
                            </motion.label>
                          ))}
                        </div>

                        <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">
                          Contraintes spéciales :
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(expressSettings.constraints).map(([key, setting]) => (
                            <motion.label
                              key={key}
                              className="flex items-center space-x-3 cursor-pointer"
                              whileHover={{ scale: 1.02 }}
                            >
                              <input
                                type="checkbox"
                                checked={setting}
                                onChange={(e) => setExpressSettings(prev => ({
                                  ...prev,
                                  constraints: {
                                    ...prev.constraints,
                                    [key]: e.target.checked
                                  }
                                }))}
                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700 dark:text-gray-300">
                                {key === 'noWeekends' && '🚫 Personne ne travaille le weekend'}
                                {key === 'avoidLongBreaks' && '⏰ Éviter les coupures > 2h'}
                                {key === 'preferMornings' && '🌅 Privilégier les matinées'}
                                {key === 'preferAfternoons' && '🌇 Privilégier les après-midis'}
                              </span>
                            </motion.label>
                          ))}
                        </div>

                        <motion.button
                          type="button"
                          onClick={() => applyExpressSettings()}
                          className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          🚀 Appliquer la configuration express
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {teamConfigMode === 'advanced' && (
                    <motion.div
                      key="advanced"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        🔧 Configuration Avancée - Contrôle Total
                      </h4>
                      
                      <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-xl">
                        <p className="text-cyan-800 dark:text-cyan-200 text-sm">
                          💡 Utilisez l'historique et les suggestions automatiques pour optimiser votre configuration
                        </p>
                      </div>

                      {/* Configuration détaillée par employé (réutilise l'ancien système amélioré) */}
                      {availableEmployees && availableEmployees.length > 0 ? availableEmployees.map((employee, index) => (
                        <motion.div
                          key={employee._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50"
                        >
                          <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                              {employee.firstName?.charAt(0) || employee.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">
                                {employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.name || 'Nom inconnu'}
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{employee.email}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Heures contractuelles */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Heures contractuelles par semaine
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="48"
                                value={employeePreferences[employee._id]?.weeklyHours || 35}
                                onChange={(e) => {
                                  const currentPrefs = employeePreferences[employee._id] || {};
                                  setEmployeePreferences(prev => ({
                                    ...prev,
                                    [employee._id]: {
                                      ...currentPrefs,
                                      weeklyHours: parseInt(e.target.value) || 35
                                    }
                                  }));
                                }}
                                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>

                            {/* Jour de repos */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Jour de repos obligatoire
                              </label>
                              <select
                                value={employeePreferences[employee._id]?.restDay || ''}
                                onChange={(e) => {
                                  const currentPrefs = employeePreferences[employee._id] || {};
                                  setEmployeePreferences(prev => ({
                                    ...prev,
                                    [employee._id]: {
                                      ...currentPrefs,
                                      restDay: e.target.value || undefined
                                    }
                                  }));
                                }}
                                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500"
                              >
                                <option value="">Aucun jour fixe</option>
                                {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map(day => (
                                  <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Créneaux fractionnés */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Préférence pour les créneaux
                            </label>
                            <div className="flex space-x-3">
                              <motion.button
                                type="button"
                                onClick={() => {
                                  const currentPrefs = employeePreferences[employee._id] || {};
                                  setEmployeePreferences(prev => ({
                                    ...prev,
                                    [employee._id]: {
                                      ...currentPrefs,
                                      allowSplitShifts: false
                                    }
                                  }));
                                }}
                                className={`flex-1 p-3 rounded-lg border-2 transition-all duration-300 ${
                                  employeePreferences[employee._id]?.allowSplitShifts === false
                                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-cyan-300'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                🔄 Service continu
                              </motion.button>
                              <motion.button
                                type="button"
                                onClick={() => {
                                  const currentPrefs = employeePreferences[employee._id] || {};
                                  setEmployeePreferences(prev => ({
                                    ...prev,
                                    [employee._id]: {
                                      ...currentPrefs,
                                      allowSplitShifts: true
                                    }
                                  }));
                                }}
                                className={`flex-1 p-3 rounded-lg border-2 transition-all duration-300 ${
                                  employeePreferences[employee._id]?.allowSplitShifts === true
                                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-cyan-300'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                ✂️ Créneaux fractionnés OK
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          Aucun employé disponible
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Validation & Génération */}
            <motion.div 
              className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-8 rounded-3xl shadow-2xl overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-600/10 dark:from-green-400/20 dark:via-emerald-400/10 dark:to-teal-500/20"></div>
              
              <div className="relative z-10">
                <motion.h3 
                  className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="mr-4 p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CheckCircle className="w-6 h-6" />
                  </motion.div>
                  Validation & Génération
                  <div className="ml-2 text-green-500">
                    ✅
                  </div>
                </motion.h3>

                {/* Dashboard de validation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-6"
                >
                  {/* Score de faisabilité */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200/50 dark:border-green-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
                        🎯 Score de Faisabilité
                      </h4>
                      <div
                        className={`text-3xl font-bold ${
                          calculateFeasibilityScore() >= 80 ? 'text-green-600' :
                          calculateFeasibilityScore() >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}
                      >
                        {calculateFeasibilityScore()}%
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <motion.div
                        className={`h-3 rounded-full ${
                          calculateFeasibilityScore() >= 80 ? 'bg-green-600' :
                          calculateFeasibilityScore() >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${calculateFeasibilityScore()}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                    
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {calculateFeasibilityScore() >= 80 ? '🎉 Excellent! Planning très faisable' :
                       calculateFeasibilityScore() >= 60 ? '⚡ Bon score, quelques ajustements recommandés' :
                       '⚠️ Score faible, révision nécessaire'}
                    </p>
                  </div>

                  {/* Résumé des contraintes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-600/50"
                    >
                      <div className="flex items-center mb-2">
                        <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                        <h5 className="font-semibold text-gray-900 dark:text-white">Période</h5>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Semaine {constraints.weekNumber} • {constraints.year}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Équipe: {availableTeams.find(t => t._id === constraints.teamId)?.name || 'Non sélectionnée'}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-600/50"
                    >
                      <div className="flex items-center mb-2">
                        <Building className="w-5 h-5 text-orange-500 mr-2" />
                        <h5 className="font-semibold text-gray-900 dark:text-white">Ouverture</h5>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {constraints.companyConstraints.openingDays?.length || 0} jours/semaine
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {constraints.companyConstraints.dailyOpeningTime || '08:00'} - {constraints.companyConstraints.dailyClosingTime || '18:00'}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-600/50"
                    >
                      <div className="flex items-center mb-2">
                        <Users className="w-5 h-5 text-purple-500 mr-2" />
                        <h5 className="font-semibold text-gray-900 dark:text-white">Équipe</h5>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {availableEmployees?.length || 0} employés configurés
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Mode: {teamConfigMode === 'profiles' ? 'Profils' : teamConfigMode === 'express' ? 'Express' : 'Avancé'}
                      </p>
                    </motion.div>
                  </div>

                  {/* Alertes et recommandations */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                      🔍 Vérifications automatiques
                    </h4>
                    
                    <div className="space-y-3">
                      {getValidationAlerts().map((alert, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className={`p-4 rounded-xl border ${
                            alert.type === 'error' 
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
                              : alert.type === 'warning'
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50'
                              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${
                              alert.type === 'error' ? 'bg-red-100 dark:bg-red-800' :
                              alert.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-800' :
                              'bg-green-100 dark:bg-green-800'
                            }`}>
                              {alert.type === 'error' ? (
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              ) : alert.type === 'warning' ? (
                                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                              ) : (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className={`font-medium ${
                                alert.type === 'error' ? 'text-red-800 dark:text-red-200' :
                                alert.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                                'text-green-800 dark:text-green-200'
                              }`}>
                                {alert.title}
                              </h5>
                              <p className={`text-sm mt-1 ${
                                alert.type === 'error' ? 'text-red-700 dark:text-red-300' :
                                alert.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' :
                                'text-green-700 dark:text-green-300'
                              }`}>
                                {alert.message}
                              </p>
                              {alert.suggestion && (
                                <p className={`text-sm mt-2 font-medium ${
                                  alert.type === 'error' ? 'text-red-600 dark:text-red-400' :
                                  alert.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-green-600 dark:text-green-400'
                                }`}>
                                  💡 {alert.suggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Estimation des résultats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
                  >
                    <h4 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
                      📊 Estimation des résultats
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {availableEmployees?.length || 0}
                        </div>
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          Employés planifiés
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          ~{Math.round(((availableEmployees?.length || 0) * 35) / (constraints.companyConstraints.openingDays?.length || 5))}h
                        </div>
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          Heures/jour moyennes
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {getEstimatedSatisfaction()}%
                        </div>
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          Satisfaction estimée
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Bouton de génération */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="flex justify-center"
                  >
                    <motion.button
                      type="button"
                      onClick={() => {
                        const errors = getValidationAlerts().filter(alert => alert.type === 'error');
                        if (errors.length > 0) {
                          console.log('Erreurs de validation bloquant la génération:', errors);
                        }
                        handleGeneration();
                      }}
                      disabled={isGenerating || getValidationAlerts().some(alert => alert.type === 'error')}
                      className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                        isGenerating || getValidationAlerts().some(alert => alert.type === 'error')
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                      whileHover={!isGenerating && !getValidationAlerts().some(alert => alert.type === 'error') ? { scale: 1.05 } : {}}
                      whileTap={!isGenerating && !getValidationAlerts().some(alert => alert.type === 'error') ? { scale: 0.95 } : {}}
                    >
                      {isGenerating ? (
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Génération en cours...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <Rocket className="w-6 h-6" />
                          <span>🚀 Générer le planning</span>
                        </div>
                      )}
                    </motion.button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <LayoutWithSidebar activeItem="planning-wizard" pageTitle="Assistant IA Planning">
      {/* Fond futuriste avec particules animées */}
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/10">
        {/* Particules flottantes simplifiées */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}

        <div 
          className="py-12 relative z-10"
          onMouseMove={handleMouseMove}
        >
          <div className="max-w-6xl mx-auto px-6">
            {/* Header futuriste */}
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 mb-4"
                style={{ rotateX, rotateY }}
              >
                🚀 Assistant IA Planning
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Créez des plannings intelligents avec l'IA la plus avancée
              </motion.p>
            </motion.div>

            {/* Navigation futuriste */}
            <motion.div 
              className="relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border border-white/30 dark:border-gray-700/30 rounded-3xl p-8 mb-8 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {/* Fond holographique */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-cyan-400/10 rounded-3xl"></div>
              
              <div className="relative z-10">
                {/* Indicateur de progression global */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Progression</span>
                    <span>{Math.round((currentStep / (steps.length - 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Navigation des étapes */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    return (
                      <motion.div 
                        key={step.id} 
                        className="flex flex-col items-center text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                      >
                        <motion.div 
                          className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${
                            step.isCompleted 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' :
                            step.isActive 
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30' :
                              'bg-white/50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 border border-gray-200/50 dark:border-gray-600/50'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {step.isCompleted ? (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                              <CheckCircle className="w-7 h-7" />
                            </motion.div>
                          ) : (
                            <StepIcon className="w-7 h-7" />
                          )}
                          
                          {step.isActive && (
                            <div
                              className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-2xl opacity-50"
                            />
                          )}
                        </motion.div>
                        
                        <div className="space-y-1">
                          <div className={`text-sm font-medium ${
                            step.isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {step.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 hidden lg:block">
                            {step.description}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Contenu principal */}
            <motion.div 
              className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl border border-white/30 dark:border-gray-700/30 rounded-3xl p-8 shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              {/* Titre de l'étape actuelle */}
              <motion.div 
                className="mb-8 text-center"
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {steps[currentStep].title}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {steps[currentStep].description}
                </p>
              </motion.div>

              {/* Contenu de l'étape */}
              <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                  {renderStep()}
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <motion.div 
                className="flex justify-between items-center pt-8 border-t border-gray-200/50 dark:border-gray-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              >
                <motion.button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="group flex items-center px-6 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-2xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/70 dark:hover:bg-gray-800/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                  whileHover={{ scale: currentStep === 0 ? 1 : 1.05, x: currentStep === 0 ? 0 : -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                  Précédent
                </motion.button>
                
                {currentStep < steps.length - 1 && (
                  <motion.button
                    onClick={handleNext}
                    className="group flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/30"
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Suivant
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    <Sparkles className="w-4 h-4 ml-1 animate-pulse" />
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
};

export default PlanningWizard;