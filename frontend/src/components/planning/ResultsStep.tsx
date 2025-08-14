import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Calendar, Clock, User, Coffee, AlertTriangle, Download, Share, ArrowRight, Sparkles, Users, TrendingUp } from 'lucide-react';
import { GeneratedPlanning, PlanningStats } from '../../types/GeneratePlanningPayload';
import { useTheme } from '../ThemeProvider';
import { useDarkModeClasses } from '../../utils/darkModeClasses';
import confetti from 'canvas-confetti';

interface ResultsStepProps {
  generatedPlanning: GeneratedPlanning | null;
  planningStats?: PlanningStats | null;
  isGenerating: boolean;
  generationProgress: number;
  onNavigateToValidation?: () => void;
}

const FRENCH_DAYS = [
  'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
];

const DAY_LABELS: { [key: string]: string } = {
  'lundi': 'Lundi',
  'mardi': 'Mardi', 
  'mercredi': 'Mercredi',
  'jeudi': 'Jeudi',
  'vendredi': 'Vendredi',
  'samedi': 'Samedi',
  'dimanche': 'Dimanche'
};

const ResultsStep: React.FC<ResultsStepProps> = ({
  generatedPlanning,
  planningStats,
  isGenerating,
  generationProgress,
  onNavigateToValidation
}) => {
  const { isDarkMode } = useTheme();
  const darkClasses = useDarkModeClasses(isDarkMode);
  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  // Déclencher les confettis quand le planning est généré
  useEffect(() => {
    if (generatedPlanning && !isGenerating) {
      setShowAnimation(true);
      
      // Confettis
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Sélectionner le premier employé par défaut
      const employeeIds = Object.keys(generatedPlanning);
      if (employeeIds.length > 0) {
        setSelectedEmployee(employeeIds[0]);
      }
    }
  }, [generatedPlanning, isGenerating]);

  const formatTime = (time: string): string => {
    return time;
  };

  const calculateDayHours = (slots: { start: string; end: string; isLunchBreak?: boolean }[]): number => {
    return slots
      .filter(slot => !slot.isLunchBreak)
      .reduce((total, slot) => {
        const start = parseTimeToDecimal(slot.start);
        const end = parseTimeToDecimal(slot.end);
        return total + (end - start);
      }, 0);
  };

  const parseTimeToDecimal = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  };

  const calculateEmployeeStats = (employeeId: string) => {
    if (!generatedPlanning || !generatedPlanning[employeeId]) return null;

    const schedule = generatedPlanning[employeeId];
    let totalHours = 0;
    let workingDays = 0;
    let hasLunchBreaks = false;

    FRENCH_DAYS.forEach(day => {
      const daySlots = schedule[day] || [];
      if (daySlots.length > 0) {
        const workSlots = daySlots.filter(slot => !slot.isLunchBreak);
        if (workSlots.length > 0) {
          workingDays++;
          totalHours += calculateDayHours(daySlots);
        }
        if (daySlots.some(slot => slot.isLunchBreak)) {
          hasLunchBreaks = true;
        }
      }
    });

    return { totalHours, workingDays, hasLunchBreaks };
  };

  const getSlotColor = (slot: { start: string; end: string; isLunchBreak?: boolean }) => {
    if (slot.isLunchBreak) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getSlotIcon = (slot: { start: string; end: string; isLunchBreak?: boolean }) => {
    return slot.isLunchBreak ? <Coffee className="h-3 w-3" /> : <Clock className="h-3 w-3" />;
  };

  const exportPlanning = () => {
    if (!generatedPlanning) return;

    // Créer un export CSV simple
    let csv = 'Employé,Jour,Heure de début,Heure de fin,Type\n';
    
    Object.entries(generatedPlanning).forEach(([employeeId, schedule]) => {
      FRENCH_DAYS.forEach(day => {
        const daySlots = schedule[day] || [];
        daySlots.forEach(slot => {
          csv += `${employeeId},${day},${slot.start},${slot.end},${slot.isLunchBreak ? 'Pause' : 'Travail'}\n`;
        });
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'planning-genere.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 space-y-8"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
        >
          <Sparkles className="h-10 w-10 text-white" />
        </motion.div>
        
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Génération du planning en cours...</h3>
          <p className="text-gray-600 mb-6">L'IA optimise les créneaux selon vos contraintes</p>
          
          <div className="w-80 bg-gray-200 rounded-full h-3 mb-4">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
              animate={{ width: `${generationProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <div className="text-sm text-gray-500">
            {generationProgress}% - Temps de génération ultra-rapide
          </div>
        </div>
      </motion.div>
    );
  }

  if (!generatedPlanning) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun planning généré</h3>
        <p className="text-gray-600">Une erreur s'est produite lors de la génération du planning.</p>
      </div>
    );
  }

  const employeeIds = Object.keys(generatedPlanning);
  const selectedEmployeeStats = selectedEmployee ? calculateEmployeeStats(selectedEmployee) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* En-tête avec animation de succès */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6"
        >
          <CheckCircle className="h-12 w-12 text-white" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">Planning généré avec succès !</h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-6 transition-colors duration-300">
            Votre planning optimisé est prêt. Tous les employés et contraintes ont été pris en compte.
          </p>
        </motion.div>
      </div>

      {/* Statistiques globales */}
      {planningStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{Math.round(planningStats.employeeSatisfaction)}%</div>
              <div className="text-sm text-gray-600">Satisfaction employés</div>
            </div>
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{Math.round(planningStats.constraintCompliance)}%</div>
              <div className="text-sm text-gray-600">Respect contraintes</div>
            </div>
            <div className="text-center">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{planningStats.totalHours}h</div>
              <div className="text-sm text-gray-600">Total planifié</div>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-indigo-600">{Math.round(planningStats.averageHoursPerEmployee)}h</div>
              <div className="text-sm text-gray-600">Moyenne/employé</div>
            </div>
          </div>

          {planningStats.warnings && planningStats.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">Avertissements</span>
              </div>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                {planningStats.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sélecteur d'employé */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className={`${darkClasses.card} rounded-xl shadow-lg p-6 transition-colors duration-300`}
        >
          <div className="flex items-center mb-4">
            <User className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Employés</h3>
          </div>
          
          <div className="space-y-2">
            {employeeIds.map(employeeId => {
              const stats = calculateEmployeeStats(employeeId);
              
              return (
                <button
                  key={employeeId}
                  onClick={() => setSelectedEmployee(employeeId)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    selectedEmployee === employeeId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1 transition-colors duration-300">{employeeId}</div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>{stats?.totalHours.toFixed(1)}h total • {stats?.workingDays} jours</div>
                    {stats?.hasLunchBreaks && (
                      <div className="flex items-center text-orange-600">
                        <Coffee className="h-3 w-3 mr-1" />
                        Pauses déjeuner
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Planning détaillé de l'employé sélectionné */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300"
        >
          {selectedEmployee && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                    Planning de {selectedEmployee}
                  </h3>
                </div>
                
                {selectedEmployeeStats && (
                  <div className="text-right text-sm text-gray-600">
                    <div className="font-medium">{selectedEmployeeStats.totalHours.toFixed(1)}h total</div>
                    <div>{selectedEmployeeStats.workingDays} jour{selectedEmployeeStats.workingDays > 1 ? 's' : ''} travaillé{selectedEmployeeStats.workingDays > 1 ? 's' : ''}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {FRENCH_DAYS.map(day => {
                  const daySlots = generatedPlanning[selectedEmployee][day] || [];
                  const dayHours = calculateDayHours(daySlots);
                  
                  return (
                    <div key={day} className="bg-gray-50 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm transition-colors duration-300">
                          {DAY_LABELS[day]}
                        </h4>
                        {dayHours > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            {dayHours.toFixed(1)}h
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <AnimatePresence>
                          {daySlots.length > 0 ? (
                            daySlots.map((slot, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-2 rounded-lg border text-center text-xs ${getSlotColor(slot)}`}
                              >
                                <div className="flex items-center justify-center mb-1">
                                  {getSlotIcon(slot)}
                                  <span className="ml-1 font-medium">
                                    {slot.isLunchBreak ? 'Pause' : 'Travail'}
                                  </span>
                                </div>
                                <div>
                                  {formatTime(slot.start)} - {formatTime(slot.end)}
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center text-xs text-gray-400 py-4">
                              Repos
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Planning prêt à utiliser</h3>
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
              Exportez ou validez votre planning pour le mettre en œuvre
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={exportPlanning}
              className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Exporter CSV
            </button>
            
            {onNavigateToValidation && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onNavigateToValidation}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              >
                <span className="mr-2">Valider le planning</span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Animation de célébration */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.8, ease: "backOut" }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full shadow-2xl"
            >
              <div className="flex items-center space-x-3">
                <Sparkles className="h-6 w-6" />
                <span className="text-xl font-bold">Planning généré !</span>
                <CheckCircle className="h-6 w-6" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ResultsStep;