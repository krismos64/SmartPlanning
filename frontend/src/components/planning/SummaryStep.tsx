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
        <h3 className={`text-lg font-semibold ${darkClasses.title} mb-2`}>Configuration incomplète</h3>
        <p className={darkClasses.subtitle}>Veuillez compléter toutes les étapes précédentes.</p>
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
        <h2 className={`text-3xl font-bold ${darkClasses.title} mb-2`}>Résumé de la configuration</h2>
        <p className={`${darkClasses.subtitle} max-w-2xl mx-auto`}>
          Vérifiez toutes les informations avant de lancer la génération automatique du planning.
        </p>
      </div>

      {/* Statistiques générales */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-xl p-6 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50'
        }`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{jsonPayload.employees.length}</div>
            <div className={`text-sm ${darkClasses.textMuted}`}>Employés</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{totalHours}h</div>
            <div className={`text-sm ${darkClasses.textMuted}`}>Total/semaine</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">S{jsonPayload.weekNumber}</div>
            <div className={`text-sm ${darkClasses.textMuted}`}>{jsonPayload.year}</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${weekExceptions > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {weekExceptions}
            </div>
            <div className={`text-sm ${darkClasses.textMuted}`}>Exceptions</div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Équipe et période */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className={`${darkClasses.card} rounded-xl shadow-lg p-6`}
        >
          <div className="flex items-center mb-4">
            <User className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className={`text-lg font-semibold ${darkClasses.title}`}>Équipe sélectionnée</h3>
          </div>
          
          <div className="space-y-3">
            {jsonPayload.employees.map((employee, index) => {
              const employeeData = wizardData.selectedEmployees.find(e => e._id === employee._id);
              const weekExceptionsCount = employee.exceptions?.filter(ex => weekDates.includes(ex.date)).length || 0;
              
              return (
                <div key={employee._id} className={`flex items-center justify-between p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div>
                    <div className={`font-medium ${darkClasses.title}`}>
                      {employeeData?.firstName} {employeeData?.lastName}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {employee.contractHoursPerWeek}h/semaine
                      {employee.restDay && (
                        <span className={`ml-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          • Repos: {getDayLabel(employee.restDay)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {weekExceptionsCount > 0 && (
                      <div className={isDarkMode ? 'text-orange-400' : 'text-orange-600'}>
                        {weekExceptionsCount} exception{weekExceptionsCount > 1 ? 's' : ''}
                      </div>
                    )}
                    <div className={darkClasses.textMuted}>
                      Max {employee.preferences?.maxConsecutiveDays || 5}j consécutifs
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`mt-4 p-3 rounded-lg ${
            isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50'
          }`}>
            <div className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
              <div className="font-medium">Période planifiée</div>
              <div>Semaine {jsonPayload.weekNumber} de {jsonPayload.year}</div>
              {weekDates.length > 0 && (
                <div className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
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
          className={`${darkClasses.card} rounded-xl shadow-lg p-6`}
        >
          <div className="flex items-center mb-4">
            <Building className="h-6 w-6 text-indigo-600 mr-3" />
            <h3 className={`text-lg font-semibold ${darkClasses.title}`}>Contraintes de l'entreprise</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className={`font-medium ${darkClasses.title} mb-2`}>Jours d'ouverture</div>
              <div className="flex flex-wrap gap-1">
                {jsonPayload.companyConstraints?.openDays?.map(day => (
                  <span key={day} className={`px-2 py-1 text-xs rounded-full ${
                    isDarkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {getDayLabel(day)}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className={`font-medium ${darkClasses.title} mb-2`}>Horaires</div>
              <div className="space-y-1">
                {jsonPayload.companyConstraints?.openHours?.map((hours, index) => (
                  <div key={index} className={`text-sm px-2 py-1 rounded ${
                    isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-50'
                  }`}>
                    {hours}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className={`font-medium ${darkClasses.title}`}>Staffing minimum</div>
                <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{jsonPayload.companyConstraints?.minEmployeesPerSlot} employé{(jsonPayload.companyConstraints?.minEmployeesPerSlot || 0) > 1 ? 's' : ''}</div>
              </div>
              <div>
                <div className={`font-medium ${darkClasses.title}`}>Heures/jour</div>
                <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {jsonPayload.companyConstraints?.minHoursPerDay}h - {jsonPayload.companyConstraints?.maxHoursPerDay}h
                </div>
              </div>
            </div>

            {jsonPayload.companyConstraints?.mandatoryLunchBreak && (
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50'
              }`}>
                <div className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
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
        className={`${darkClasses.card} rounded-xl shadow-lg p-6`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-green-600 mr-3" />
            <h3 className={`text-lg font-semibold ${darkClasses.title}`}>Configuration JSON</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copier
            </button>
            <button
              onClick={downloadJson}
              className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <Download className="h-4 w-4 mr-1" />
              Télécharger
            </button>
            <button
              onClick={() => setShowFullJson(!showFullJson)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-600 text-white hover:bg-gray-500' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {showFullJson ? 'Masquer' : 'Voir le JSON'}
            </button>
          </div>
        </div>

        {showFullJson ? (
          <div className={`rounded-lg p-4 max-h-96 overflow-auto ${
            isDarkMode ? 'bg-gray-900' : 'bg-gray-800'
          }`}>
            <pre className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-100'}`}>
              {JSON.stringify(jsonPayload, null, 2)}
            </pre>
          </div>
        ) : (
          <div className={`rounded-lg p-4 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-sm space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
        className={`rounded-xl p-6 text-center ${
          isDarkMode 
            ? 'bg-green-900/20 border border-green-700' 
            : 'bg-green-50 border border-green-200'
        }`}
      >
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className={`h-8 w-8 mr-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>Configuration validée</h3>
        </div>
        
        <p className={`mb-4 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
          Toutes les informations nécessaires ont été collectées. 
          Le planning peut maintenant être généré automatiquement par l'IA.
        </p>
        
        <div className={`flex items-center justify-center text-sm space-x-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
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