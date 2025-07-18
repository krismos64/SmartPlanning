import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Users, Settings, Brain, CheckCircle, Clock, AlertCircle, Sparkles, Zap, Star, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import axiosInstance from '../api/axiosInstance';
import { PlanningConstraints, PlanningWizardStep, EmployeeConstraint, AIGenerationResponse } from '../types/PlanningConstraints';
import LayoutWithSidebar from '../components/layout/LayoutWithSidebar';

const PlanningWizard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
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
      openingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      openingHours: [],
      minStaffSimultaneously: 2
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

  const steps: PlanningWizardStep[] = [
    {
      id: 0,
      title: 'Équipe et Semaine',
      description: 'Sélectionnez l\'équipe et la semaine à planifier',
      icon: Calendar,
      isCompleted: currentStep > 0,
      isActive: currentStep === 0
    },
    {
      id: 1,
      title: 'Employés Présents',
      description: 'Choisissez les employés disponibles cette semaine',
      icon: Users,
      isCompleted: currentStep > 1,
      isActive: currentStep === 1
    },
    {
      id: 2,
      title: 'Configuration Individuelle',
      description: 'Définissez les contraintes personnelles',
      icon: Settings,
      isCompleted: currentStep > 2,
      isActive: currentStep === 2
    },
    {
      id: 3,
      title: 'Contraintes Globales',
      description: 'Paramétrez les règles de l\'entreprise',
      icon: Clock,
      isCompleted: currentStep > 3,
      isActive: currentStep === 3
    },
    {
      id: 4,
      title: 'Préférences IA',
      description: 'Configurez l\'intelligence artificielle',
      icon: Brain,
      isCompleted: currentStep > 4,
      isActive: currentStep === 4
    },
    {
      id: 5,
      title: 'Résumé et Génération',
      description: 'Vérifiez et lancez la génération',
      icon: Rocket,
      isCompleted: false,
      isActive: currentStep === 5
    }
  ];

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setIsLoadingTeams(true);
    try {
      console.log('🔄 Chargement des équipes...');
      const response = await axiosInstance.get('/teams');
      console.log('✅ Équipes récupérées:', response.data);
      const teams = response.data.data || [];
      console.log('📋 Structure des équipes:', teams.length > 0 ? teams[0] : 'Aucune équipe');
      setAvailableTeams(teams);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des équipes:', error);
      showToast('Erreur lors du chargement des équipes', 'error');
      setAvailableTeams([]);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const fetchEmployees = async (teamId: string) => {
    setIsLoadingEmployees(true);
    try {
      console.log(`🔄 Chargement des employés pour l'équipe ${teamId}...`);
      const response = await axiosInstance.get(`/teams/${teamId}/employees`);
      console.log('✅ Employés récupérés:', response.data);
      const employees = response.data.data || [];
      console.log('📋 Structure des employés:', employees.length > 0 ? employees[0] : 'Aucun employé');
      setAvailableEmployees(employees);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des employés:', error);
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

  const handleEmployeeConstraintChange = (employeeId: string, field: keyof EmployeeConstraint, value: any) => {
    setConstraints(prev => ({
      ...prev,
      employees: prev.employees.map(emp =>
        emp.id === employeeId ? { ...emp, [field]: value } : emp
      )
    }));
  };

  const generateSchedule = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      const response = await axiosInstance.post<AIGenerationResponse>('/ai/schedule/generate-from-constraints', constraints);
      
      setGenerationProgress(100);
      clearInterval(progressInterval);
      
      if (response.data.success) {
        showToast('Planning généré avec succès!', 'success');
        navigate('/schedules', { state: { generatedSchedule: response.data.schedule } });
      } else {
        showToast(response.data.error || 'Erreur lors de la génération', 'error');
      }
    } catch (error) {
      clearInterval(progressInterval);
      showToast('Erreur lors de la génération du planning', 'error');
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
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Carte Équipe avec glassmorphism */}
            <motion.div 
              className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-8 rounded-3xl shadow-2xl overflow-hidden"
              whileHover={{ scale: 1.02, rotateY: 2 }}
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
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
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
              whileHover={{ scale: 1.02, rotateY: -2 }}
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
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-8"
          >
            <motion.div 
              className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-8 rounded-3xl shadow-2xl overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              {/* Fond animé avec particules */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-purple-600/10 dark:from-emerald-400/20 dark:via-blue-400/10 dark:to-purple-500/20"></div>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-10, 10, -10],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
              
              <div className="relative z-10">
                <motion.h3 
                  className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="mr-4 p-3 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl text-white shadow-lg"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Users className="w-6 h-6" />
                  </motion.div>
                  Employés disponibles cette semaine
                  <Zap className="ml-2 w-5 h-5 text-yellow-500 animate-bounce" />
                </motion.h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableEmployees && availableEmployees.length > 0 ? availableEmployees.filter(employee => employee && employee._id).map((employee, index) => (
                    <motion.label 
                      key={employee._id} 
                      className="group relative cursor-pointer"
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployees(prev => [...prev, employee._id]);
                            setConstraints(prev => ({
                              ...prev,
                              employees: [...prev.employees, {
                                id: employee._id,
                                name: employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.name || 'Nom inconnu',
                                email: employee.email,
                                weeklyHours: 35,
                                allowSplitShifts: false
                              }]
                            }));
                          } else {
                            setSelectedEmployees(prev => prev.filter(id => id !== employee._id));
                            setConstraints(prev => ({
                              ...prev,
                              employees: prev.employees.filter(emp => emp.id !== employee._id)
                            }));
                          }
                        }}
                        className="sr-only"
                      />
                      
                      <motion.div 
                        className={`relative p-6 rounded-2xl transition-all duration-300 ${
                          selectedEmployees.includes(employee._id)
                            ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-2 border-blue-500/50 dark:border-blue-400/50 shadow-lg shadow-blue-500/25'
                            : 'bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/70 dark:hover:bg-gray-800/70'
                        } backdrop-blur-sm`}
                      >
                        {/* Indicateur de sélection */}
                        {selectedEmployees.includes(employee._id) && (
                          <motion.div
                            className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            <CheckCircle className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                        
                        <div className="flex flex-col items-center text-center">
                          {/* Avatar avec effet holographique */}
                          <motion.div 
                            className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg ${
                              selectedEmployees.includes(employee._id)
                                ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                                : 'bg-gradient-to-br from-gray-500 to-gray-700'
                            }`}
                            whileHover={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 0.5 }}
                          >
                            {employee.firstName?.charAt(0) || employee.name?.charAt(0) || '?'}
                            {selectedEmployees.includes(employee._id) && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-2xl"
                                animate={{ opacity: [0.3, 0.7, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                          </motion.div>
                          
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.name || 'Nom inconnu'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              📧 {employee.email}
                            </div>
                          </div>
                        </div>
                        
                        {/* Effet de survol */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ pointerEvents: 'none' }}
                        />
                      </motion.div>
                    </motion.label>
                  )) : (
                    <motion.div 
                      className="col-span-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 p-12 rounded-3xl text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="inline-block mb-4"
                        >
                          {isLoadingEmployees ? (
                            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                          ) : (
                            <AlertCircle className="w-12 h-12 text-gray-400" />
                          )}
                        </motion.div>
                        <div className="text-lg text-gray-600 dark:text-gray-400">
                          {isLoadingEmployees ? '🔄 Chargement des employés...' : 
                           constraints.teamId ? '❌ Aucun employé trouvé dans cette équipe' : 
                           '⚠️ Veuillez d\'abord sélectionner une équipe'}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-8"
          >
            <motion.div 
              className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-8 rounded-3xl shadow-2xl overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              {/* Fond animé avec particules */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-purple-600/10 dark:from-emerald-400/20 dark:via-blue-400/10 dark:to-purple-500/20"></div>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-emerald-400 to-blue-600 rounded-full opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-10, 10, -10],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
              
              <div className="relative z-10">
                <motion.h3 
                  className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="mr-4 p-3 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl text-white shadow-lg"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Settings className="w-6 h-6" />
                  </motion.div>
                  Configuration individuelle
                  <Sparkles className="ml-2 w-5 h-5 text-yellow-500 animate-pulse" />
                </motion.h3>
                
                <div className="space-y-6">
                  {constraints.employees.length > 0 ? constraints.employees.map((employee, index) => (
                    <motion.div 
                      key={employee.id} 
                      className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 p-6 rounded-2xl shadow-lg overflow-hidden"
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      {/* Effet holographique */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-emerald-400/10"></div>
                      <motion.div
                        className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-emerald-600/20 rounded-full blur-2xl"
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      
                      <div className="relative z-10">
                        <motion.h4 
                          className="text-lg font-bold mb-6 flex items-center text-gray-900 dark:text-white"
                          initial={{ x: -10 }}
                          animate={{ x: 0 }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                        >
                          <motion.div 
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm mr-4 shadow-lg"
                            whileHover={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5 }}
                          >
                            {employee.name?.charAt(0) || '?'}
                          </motion.div>
                          {employee.name}
                          <Star className="ml-2 w-4 h-4 text-yellow-500 animate-spin" style={{ animationDuration: '3s' }} />
                        </motion.h4>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                          >
                            <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                              🏖️ Jour de repos souhaité
                            </label>
                            <motion.select
                              value={employee.restDay || ''}
                              onChange={(e) => handleEmployeeConstraintChange(employee.id, 'restDay', e.target.value)}
                              className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300 text-gray-900 dark:text-white shadow-inner"
                              whileFocus={{ scale: 1.02 }}
                            >
                              <option value="">✨ Aucune préférence</option>
                              <option value="monday">🌙 Lundi</option>
                              <option value="tuesday">🔥 Mardi</option>
                              <option value="wednesday">⚡ Mercredi</option>
                              <option value="thursday">🌟 Jeudi</option>
                              <option value="friday">🎉 Vendredi</option>
                              <option value="saturday">🌊 Samedi</option>
                              <option value="sunday">☀️ Dimanche</option>
                            </motion.select>
                          </motion.div>
                          
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.4 }}
                          >
                            <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                              ⏰ Heures hebdomadaires
                            </label>
                            <motion.input
                              type="number"
                              min="10"
                              max="60"
                              placeholder="Ex: 35 heures"
                              value={employee.weeklyHours || 35}
                              onChange={(e) => handleEmployeeConstraintChange(employee.id, 'weeklyHours', parseInt(e.target.value))}
                              className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 text-gray-900 dark:text-white shadow-inner placeholder-gray-400 dark:placeholder-gray-500"
                              whileFocus={{ scale: 1.02 }}
                            />
                          </motion.div>
                          
                          <motion.div 
                            className="lg:col-span-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.5 }}
                          >
                            <motion.label 
                              className="group flex items-center cursor-pointer p-4 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-gray-200/30 dark:border-gray-600/30 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <motion.input
                                type="checkbox"
                                checked={employee.allowSplitShifts || false}
                                onChange={(e) => handleEmployeeConstraintChange(employee.id, 'allowSplitShifts', e.target.checked)}
                                className="w-5 h-5 text-blue-500 bg-white/50 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 mr-4"
                                whileHover={{ scale: 1.1 }}
                              />
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  🔄 Autoriser les coupures dans la journée
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Permet des pauses déjeuner et horaires fractionnés
                                </div>
                              </div>
                              {employee.allowSplitShifts && (
                                <motion.div
                                  className="ml-auto"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 300 }}
                                >
                                  <CheckCircle className="w-6 h-6 text-green-500" />
                                </motion.div>
                              )}
                            </motion.label>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <motion.div
                      className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 p-12 rounded-3xl text-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="inline-block mb-4"
                      >
                        <AlertCircle className="w-16 h-16 text-gray-400" />
                      </motion.div>
                      <div className="text-xl text-gray-600 dark:text-gray-400 mb-2">
                        ⚠️ Aucun employé sélectionné
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        Veuillez d'abord sélectionner des employés à l'étape précédente
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-8"
          >
            <motion.div 
              className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-8 rounded-3xl shadow-2xl overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              {/* Fond animé avec effet de temps */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-pink-600/10 dark:from-orange-400/20 dark:via-red-400/10 dark:to-pink-500/20"></div>
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-gradient-to-r from-orange-400 to-pink-600 rounded-full opacity-40"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    x: [0, Math.random() * 30 - 15],
                    y: [0, Math.random() * 30 - 15],
                    opacity: [0.4, 0.8, 0.4],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 5 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                  }}
                />
              ))}
              
              <div className="relative z-10">
                <motion.h3 
                  className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="mr-4 p-3 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl text-white shadow-lg"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Clock className="w-6 h-6" />
                  </motion.div>
                  Contraintes globales
                  <Zap className="ml-2 w-5 h-5 text-yellow-500 animate-bounce" />
                </motion.h3>
                
                <div className="space-y-8">
                  {/* Jours d'ouverture */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 p-6 rounded-2xl shadow-lg"
                  >
                    <motion.h4 
                      className="text-lg font-bold mb-6 flex items-center text-gray-900 dark:text-white"
                      initial={{ x: -10 }}
                      animate={{ x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                      🗓️ Jours d'ouverture
                    </motion.h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {[
                        { key: 'monday', label: 'Lundi', icon: '🌙', color: 'from-blue-500 to-indigo-600' },
                        { key: 'tuesday', label: 'Mardi', icon: '🔥', color: 'from-red-500 to-pink-600' },
                        { key: 'wednesday', label: 'Mercredi', icon: '⚡', color: 'from-yellow-500 to-orange-600' },
                        { key: 'thursday', label: 'Jeudi', icon: '🌟', color: 'from-green-500 to-teal-600' },
                        { key: 'friday', label: 'Vendredi', icon: '🎉', color: 'from-purple-500 to-violet-600' },
                        { key: 'saturday', label: 'Samedi', icon: '🌊', color: 'from-cyan-500 to-blue-600' },
                        { key: 'sunday', label: 'Dimanche', icon: '☀️', color: 'from-amber-500 to-yellow-600' }
                      ].map((day, index) => {
                        const isSelected = constraints.companyConstraints.openingDays.includes(day.key);
                        return (
                          <motion.label 
                            key={day.key}
                            className="group cursor-pointer"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.5, duration: 0.3 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setConstraints(prev => ({
                                    ...prev,
                                    companyConstraints: {
                                      ...prev.companyConstraints,
                                      openingDays: [...prev.companyConstraints.openingDays, day.key]
                                    }
                                  }));
                                } else {
                                  setConstraints(prev => ({
                                    ...prev,
                                    companyConstraints: {
                                      ...prev.companyConstraints,
                                      openingDays: prev.companyConstraints.openingDays.filter(d => d !== day.key)
                                    }
                                  }));
                                }
                              }}
                              className="sr-only"
                            />
                            
                            <motion.div 
                              className={`relative p-4 rounded-xl transition-all duration-300 ${
                                isSelected
                                  ? `bg-gradient-to-br ${day.color} text-white shadow-lg transform shadow-${day.color.split('-')[1]}-500/25`
                                  : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-800/70'
                              } backdrop-blur-sm border border-white/30 dark:border-gray-600/30`}
                            >
                              {/* Indicateur de sélection */}
                              {isSelected && (
                                <motion.div
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </motion.div>
                              )}
                              
                              <div className="text-center">
                                <motion.div 
                                  className="text-2xl mb-2"
                                  animate={isSelected ? { rotate: [0, 10, -10, 0] } : {}}
                                  transition={{ duration: 0.5 }}
                                >
                                  {day.icon}
                                </motion.div>
                                <div className="text-sm font-semibold">{day.label}</div>
                              </div>
                              
                              {/* Effet de brillance */}
                              {isSelected && (
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl"
                                  animate={{ x: ['-100%', '100%'] }}
                                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                                />
                              )}
                            </motion.div>
                          </motion.label>
                        );
                      })}
                    </div>
                  </motion.div>
                  
                  {/* Nombre minimum d'employés */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 p-6 rounded-2xl shadow-lg"
                  >
                    <motion.h4 
                      className="text-lg font-bold mb-6 flex items-center text-gray-900 dark:text-white"
                      initial={{ x: -10 }}
                      animate={{ x: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <Users className="w-5 h-5 mr-3 text-emerald-500" />
                      👥 Nombre minimum d'employés présents simultanément
                    </motion.h4>
                    
                    <div className="flex items-center space-x-4">
                      <motion.input
                        type="number"
                        min="1"
                        max="10"
                        placeholder="Ex: 2 employés"
                        value={constraints.companyConstraints.minStaffSimultaneously || 2}
                        onChange={(e) => setConstraints(prev => ({
                          ...prev,
                          companyConstraints: {
                            ...prev.companyConstraints,
                            minStaffSimultaneously: parseInt(e.target.value)
                          }
                        }))}
                        className="flex-1 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300 text-gray-900 dark:text-white shadow-inner placeholder-gray-400 dark:placeholder-gray-500"
                        whileFocus={{ scale: 1.02 }}
                      />
                      
                      <motion.div 
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl border border-emerald-500/30"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          {constraints.companyConstraints.minStaffSimultaneously || 2} min
                        </span>
                      </motion.div>
                    </div>
                    
                    <motion.div 
                      className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/30"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <div className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Garantit qu'il y aura toujours au moins ce nombre d'employés en même temps
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-8"
          >
            <motion.div 
              className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-8 rounded-3xl shadow-2xl overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              {/* Fond animé avec effet IA/neural */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-indigo-600/10 dark:from-purple-400/20 dark:via-pink-400/10 dark:to-indigo-500/20"></div>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full opacity-50"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [1, 2, 1],
                    opacity: [0.5, 1, 0.5],
                    x: [0, Math.random() * 40 - 20],
                    y: [0, Math.random() * 40 - 20],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
              
              <div className="relative z-10">
                <motion.h3 
                  className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="mr-4 p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Brain className="w-6 h-6" />
                  </motion.div>
                  Préférences IA
                  <Sparkles className="ml-2 w-5 h-5 text-purple-500 animate-pulse" />
                </motion.h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[
                    {
                      key: 'favorSplit',
                      title: 'Favoriser les coupures',
                      description: 'Privilégier les journées avec pause déjeuner',
                      icon: '🍽️',
                      color: 'from-orange-500 to-red-600',
                      bgColor: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20'
                    },
                    {
                      key: 'favorUniformity',
                      title: 'Uniformité des horaires',
                      description: 'Horaires similaires pour tous les employés',
                      icon: '⚖️',
                      color: 'from-blue-500 to-cyan-600',
                      bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
                    },
                    {
                      key: 'balanceWorkload',
                      title: 'Équilibrer la charge',
                      description: 'Répartir équitablement les heures',
                      icon: '⚡',
                      color: 'from-green-500 to-emerald-600',
                      bgColor: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                    },
                    {
                      key: 'prioritizeEmployeePreferences',
                      title: 'Priorité aux préférences employés',
                      description: 'Respecter au maximum les souhaits individuels',
                      icon: '❤️',
                      color: 'from-purple-500 to-pink-600',
                      bgColor: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
                    }
                  ].map((preference, index) => {
                    const isChecked = constraints.preferences[preference.key as keyof typeof constraints.preferences] || false;
                    
                    return (
                      <motion.label 
                        key={preference.key}
                        className="group cursor-pointer"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setConstraints(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, [preference.key]: e.target.checked }
                          }))}
                          className="sr-only"
                        />
                        
                        <motion.div 
                          className={`relative p-6 rounded-2xl transition-all duration-300 ${
                            isChecked
                              ? `bg-gradient-to-br ${preference.bgColor} border-2 border-opacity-50 shadow-lg`
                              : 'bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/70 dark:hover:bg-gray-800/70'
                          } backdrop-blur-sm overflow-hidden`}
                        >
                          {/* Effet holographique pour les préférences activées */}
                          {isChecked && (
                            <motion.div
                              className={`absolute inset-0 bg-gradient-to-br ${preference.color} opacity-10`}
                              animate={{ opacity: [0.05, 0.15, 0.05] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                          
                          {/* Indicateur de sélection */}
                          {isChecked && (
                            <motion.div
                              className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                              <CheckCircle className="w-5 h-5 text-white" />
                            </motion.div>
                          )}
                          
                          <div className="relative z-10">
                            <div className="flex items-start space-x-4">
                              <motion.div 
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${
                                  isChecked
                                    ? `bg-gradient-to-br ${preference.color} text-white`
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                }`}
                                animate={isChecked ? { rotate: [0, 10, -10, 0] } : {}}
                                transition={{ duration: 0.5 }}
                              >
                                {preference.icon}
                              </motion.div>
                              
                              <div className="flex-1 min-w-0">
                                <motion.h4 
                                  className={`text-lg font-bold mb-2 ${
                                    isChecked ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                                  }`}
                                  animate={isChecked ? { x: [0, 2, -2, 0] } : {}}
                                  transition={{ duration: 0.3 }}
                                >
                                  {preference.title}
                                </motion.h4>
                                <p className={`text-sm ${
                                  isChecked ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'
                                }`}>
                                  {preference.description}
                                </p>
                              </div>
                            </div>
                            
                            {/* Status indicator */}
                            <motion.div 
                              className={`mt-4 flex items-center justify-between p-3 rounded-xl ${
                                isChecked 
                                  ? `bg-gradient-to-r ${preference.color} text-white`
                                  : 'bg-gray-100/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
                              }`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.5 }}
                            >
                              <span className="text-sm font-medium">
                                {isChecked ? '✅ Activé' : '⭕ Désactivé'}
                              </span>
                              {isChecked && (
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                  className="w-2 h-2 bg-white rounded-full"
                                />
                              )}
                            </motion.div>
                          </div>
                          
                          {/* Effet de brillance */}
                          {isChecked && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-2xl"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            />
                          )}
                        </motion.div>
                      </motion.label>
                    );
                  })}
                </div>
                
                {/* Résumé des préférences sélectionnées */}
                <motion.div
                  className="mt-8 p-6 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200/50 dark:border-purple-700/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex items-center mb-4">
                    <Brain className="w-6 h-6 mr-3 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      🧠 Résumé des préférences IA
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(constraints.preferences).map(([key, value]) => {
                      const labels = {
                        favorSplit: '🍽️ Coupures',
                        favorUniformity: '⚖️ Uniformité',
                        balanceWorkload: '⚡ Équilibrage',
                        prioritizeEmployeePreferences: '❤️ Préférences'
                      };
                      
                      return (
                        <motion.div 
                          key={key}
                          className={`text-center p-3 rounded-xl ${
                            value 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                              : 'bg-gray-100 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400'
                          }`}
                          animate={value ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="text-sm font-medium">
                            {labels[key as keyof typeof labels]}
                          </div>
                          <div className="text-xs mt-1">
                            {value ? 'Activé' : 'Désactivé'}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <CheckCircle className="mr-2" />
                Résumé de la configuration
              </h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold">Équipe sélectionnée</h4>
                  <p className="text-gray-600">Semaine {constraints.weekNumber} de {constraints.year}</p>
                  <p className="text-gray-600">{constraints.employees.length} employés sélectionnés</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold">Contraintes configurées</h4>
                  <p className="text-gray-600">Jours d'ouverture: {constraints.companyConstraints.openingDays.length} jours</p>
                  <p className="text-gray-600">Minimum simultané: {constraints.companyConstraints.minStaffSimultaneously} employés</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold">Préférences IA</h4>
                  <p className="text-gray-600">
                    {constraints.preferences.favorUniformity ? 'Uniformité activée' : 'Variabilité activée'}
                    {constraints.preferences.favorSplit ? ', Coupures favorisées' : ', Journées continues'}
                  </p>
                </div>
              </div>
            </div>

            {isGenerating && (
              <motion.div 
                className="relative bg-gradient-to-br from-blue-500/90 to-purple-600/90 backdrop-blur-xl border border-blue-400/30 p-8 rounded-3xl text-white mb-8 overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Particules d'énergie IA */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white/60 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
                
                <div className="relative z-10">
                  <motion.div 
                    className="flex items-center justify-center mb-6"
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="mr-4"
                    >
                      <Brain className="w-10 h-10" />
                    </motion.div>
                    <span className="text-2xl font-bold">🤖 IA en action...</span>
                  </motion.div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progression</span>
                      <span>{Math.round(generationProgress)}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                      <motion.div 
                        className="bg-gradient-to-r from-cyan-300 to-white h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${generationProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  
                  <motion.div 
                    className="text-center text-lg font-medium"
                    key={generationProgress < 30 ? 'analyse' : generationProgress < 70 ? 'optimisation' : generationProgress < 100 ? 'finalisation' : 'termine'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {generationProgress < 30 && '🔍 Analyse des contraintes...'}
                    {generationProgress >= 30 && generationProgress < 70 && '⚡ Optimisation du planning...'}
                    {generationProgress >= 70 && generationProgress < 100 && '🎯 Finalisation...'}
                    {generationProgress >= 100 && '✨ Terminé!'}
                  </motion.div>
                </div>
              </motion.div>
            )}

            <motion.button
              onClick={generateSchedule}
              disabled={isGenerating || constraints.employees.length === 0}
              className="group relative w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 rounded-3xl font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl shadow-blue-500/30 overflow-hidden"
              whileHover={{ scale: isGenerating ? 1 : 1.02, y: isGenerating ? 0 : -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Effet de brillance */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                initial={{ x: '-100%' }}
                animate={{ x: isGenerating ? '100%' : '-100%' }}
                transition={{ duration: 1.5, repeat: isGenerating ? Infinity : 0, ease: "easeInOut" }}
              />
              
              <div className="relative z-10 flex items-center justify-center">
                {isGenerating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-3"
                    >
                      <Brain className="w-6 h-6" />
                    </motion.div>
                    🚀 Génération en cours...
                  </>
                ) : (
                  <>
                    <Rocket className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                    ✨ Lancer la génération IA
                    <Sparkles className="w-5 h-5 ml-2 animate-pulse" />
                  </>
                )}
              </div>
            </motion.button>
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
        {/* Particules flottantes */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
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
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
                          whileHover={{ scale: 1.1, rotate: step.isActive ? 5 : 0 }}
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
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-2xl"
                              animate={{ opacity: [0.3, 0.7, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity }}
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