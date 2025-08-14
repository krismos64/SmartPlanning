import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, User, Calendar, Settings, Building, CheckCircle, AlertTriangle, Copy, Download, Zap } from 'lucide-react';
import { WizardData, GeneratePlanningPayload, convertDaysToEnglish, convertDaysToFrench } from '../../types/GeneratePlanningPayload';
import { useTheme } from '../ThemeProvider';
import { useDarkModeClasses } from '../../utils/darkModeClasses';

interface SummaryStepProps {
  wizardData: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

const SummaryStep: React.FC<SummaryStepProps> = ({
  wizardData,
  onUpdate,
  onValidationChange
}) => {
  const { isDarkMode } = useTheme();
  const darkClasses = useDarkModeClasses(isDarkMode);
  const [jsonPayload, setJsonPayload] = useState<GeneratePlanningPayload | null>(null);
  const [showFullJson, setShowFullJson] = useState(false);

  // Générer le payload JSON
  useEffect(() => {
    if (wizardData.selectedEmployees.length === 0 || !wizardData.weekNumber || !wizardData.year) {
      setJsonPayload(null);
      onValidationChange(false);
      return;
    }

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
      companyConstraints: {
        openDays: wizardData.companyConstraints.openDays,
        openHours: wizardData.companyConstraints.openHours,
        minEmployeesPerSlot: wizardData.companyConstraints.minEmployeesPerSlot,
        maxHoursPerDay: wizardData.companyConstraints.maxHoursPerDay,
        minHoursPerDay: wizardData.companyConstraints.minHoursPerDay,
        mandatoryLunchBreak: wizardData.companyConstraints.mandatoryLunchBreak,
        lunchBreakDuration: wizardData.companyConstraints.lunchBreakDuration
      }
    };

    setJsonPayload(payload);
    onValidationChange(true);
  }, [wizardData, onValidationChange]);

  const copyToClipboard = () => {
    if (jsonPayload) {
      navigator.clipboard.writeText(JSON.stringify(jsonPayload, null, 2));
    }
  };

  const downloadJson = () => {
    if (jsonPayload) {
      const blob = new Blob([JSON.stringify(jsonPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planning-config-semaine-${wizardData.weekNumber}-${wizardData.year}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const getDayLabel = (englishDay: string) => {
    const mapping: { [key: string]: string } = {
      'monday': 'Lundi', 'tuesday': 'Mardi', 'wednesday': 'Mercredi',
      'thursday': 'Jeudi', 'friday': 'Vendredi', 'saturday': 'Samedi', 'sunday': 'Dimanche'
    };
    return mapping[englishDay] || englishDay;
  };

  const getWeekDates = () => {
    if (!wizardData.weekNumber || !wizardData.year) return [];
    
    const firstDayOfYear = new Date(wizardData.year, 0, 1);
    const daysOffset = (wizardData.weekNumber - 1) * 7;
    const weekStart = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    
    const dayOfWeek = weekStart.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    
    return weekDates;
  };

  if (!jsonPayload) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuration incomplète</h3>
        <p className="text-gray-600">Veuillez compléter toutes les étapes précédentes.</p>
      </div>
    );
  }

  const weekDates = getWeekDates();
  const totalHours = jsonPayload.employees.reduce((sum, emp) => sum + emp.contractHoursPerWeek, 0);
  const weekExceptions = jsonPayload.employees.reduce((total, emp) => {
    return total + (emp.exceptions?.filter(ex => weekDates.includes(ex.date)).length || 0);
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* En-tête de l'étape */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mb-4"
        >
          <Eye className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Résumé de la configuration</h2>
        <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
          Vérifiez toutes les informations avant de lancer la génération automatique du planning.
        </p>
      </div>

      {/* Statistiques générales */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{jsonPayload.employees.length}</div>
            <div className="text-sm text-gray-600">Employés</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{totalHours}h</div>
            <div className="text-sm text-gray-600">Total/semaine</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">S{jsonPayload.weekNumber}</div>
            <div className="text-sm text-gray-600">{jsonPayload.year}</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${weekExceptions > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {weekExceptions}
            </div>
            <div className="text-sm text-gray-600">Exceptions</div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Équipe et période */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 transition-colors duration-300"
        >
          <div className="flex items-center mb-4">
            <User className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Équipe sélectionnée</h3>
          </div>
          
          <div className="space-y-3">
            {jsonPayload.employees.map((employee, index) => {
              const employeeData = wizardData.selectedEmployees.find(e => e._id === employee._id);
              const weekExceptionsCount = employee.exceptions?.filter(ex => weekDates.includes(ex.date)).length || 0;
              
              return (
                <div key={employee._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white transition-colors duration-300">
                      {employeeData?.firstName} {employeeData?.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {employee.contractHoursPerWeek}h/semaine
                      {employee.restDay && (
                        <span className="ml-2 text-blue-600">
                          • Repos: {getDayLabel(employee.restDay)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {weekExceptionsCount > 0 && (
                      <div className="text-orange-600">
                        {weekExceptionsCount} exception{weekExceptionsCount > 1 ? 's' : ''}
                      </div>
                    )}
                    <div className="text-gray-500">
                      Max {employee.preferences?.maxConsecutiveDays || 5}j consécutifs
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <div className="font-medium">Période planifiée</div>
              <div>Semaine {jsonPayload.weekNumber} de {jsonPayload.year}</div>
              {weekDates.length > 0 && (
                <div className="text-xs mt-1">
                  Du {formatDate(weekDates[0])} au {formatDate(weekDates[6])}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Contraintes entreprise */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 transition-colors duration-300"
        >
          <div className="flex items-center mb-4">
            <Building className="h-6 w-6 text-indigo-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Contraintes de l'entreprise</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="font-medium text-gray-900 mb-2">Jours d'ouverture</div>
              <div className="flex flex-wrap gap-1">
                {jsonPayload.companyConstraints?.openDays?.map(day => (
                  <span key={day} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                    {getDayLabel(day)}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="font-medium text-gray-900 mb-2">Horaires</div>
              <div className="space-y-1">
                {jsonPayload.companyConstraints?.openHours?.map((hours, index) => (
                  <div key={index} className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                    {hours}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900">Staffing minimum</div>
                <div className="text-gray-700">{jsonPayload.companyConstraints?.minEmployeesPerSlot} employé{(jsonPayload.companyConstraints?.minEmployeesPerSlot || 0) > 1 ? 's' : ''}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Heures/jour</div>
                <div className="text-gray-700">
                  {jsonPayload.companyConstraints?.minHoursPerDay}h - {jsonPayload.companyConstraints?.maxHoursPerDay}h
                </div>
              </div>
            </div>

            {jsonPayload.companyConstraints?.mandatoryLunchBreak && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-800">
                  <div className="font-medium">Pause déjeuner obligatoire</div>
                  <div>{jsonPayload.companyConstraints.lunchBreakDuration} minutes</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Configuration JSON */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 transition-colors duration-300"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Configuration JSON</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copier
            </button>
            <button
              onClick={downloadJson}
              className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Télécharger
            </button>
            <button
              onClick={() => setShowFullJson(!showFullJson)}
              className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showFullJson ? 'Masquer' : 'Voir le JSON'}
            </button>
          </div>
        </div>

        {showFullJson ? (
          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
            <pre className="text-sm text-gray-300">
              {JSON.stringify(jsonPayload, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 space-y-2">
              <div>• {jsonPayload.employees.length} employés configurés avec préférences</div>
              <div>• {jsonPayload.companyConstraints?.openDays?.length || 0} jours d'ouverture définis</div>
              <div>• {jsonPayload.companyConstraints?.openHours?.length || 0} créneaux horaires configurés</div>
              <div>• Contraintes de staffing et pauses déjeuner incluses</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Validation finale */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-xl p-6 text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
          <h3 className="text-xl font-semibold text-green-800">Configuration validée</h3>
        </div>
        
        <p className="text-green-700 mb-4">
          Toutes les informations nécessaires ont été collectées. 
          Le planning peut maintenant être généré automatiquement par l'IA.
        </p>
        
        <div className="flex items-center justify-center text-sm text-green-600 space-x-4">
          <div className="flex items-center">
            <Zap className="h-4 w-4 mr-1" />
            Génération ultra-rapide (2-5ms)
          </div>
          <div>•</div>
          <div>Respect des contraintes légales</div>
          <div>•</div>
          <div>Optimisation des préférences</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SummaryStep;