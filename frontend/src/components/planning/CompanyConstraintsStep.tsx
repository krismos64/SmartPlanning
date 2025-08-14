import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building, Clock, Users, Settings, CheckCircle, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { WizardData, CompanyConstraints, convertDaysToEnglish } from '../../types/GeneratePlanningPayload';
import { useTheme } from '../ThemeProvider';

interface CompanyConstraintsStepProps {
  wizardData: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

const FRENCH_DAYS = [
  { value: 'lundi', english: 'monday', label: 'Lundi', short: 'L' },
  { value: 'mardi', english: 'tuesday', label: 'Mardi', short: 'M' },
  { value: 'mercredi', english: 'wednesday', label: 'Mercredi', short: 'Me' },
  { value: 'jeudi', english: 'thursday', label: 'Jeudi', short: 'J' },
  { value: 'vendredi', english: 'friday', label: 'Vendredi', short: 'V' },
  { value: 'samedi', english: 'saturday', label: 'Samedi', short: 'S' },
  { value: 'dimanche', english: 'sunday', label: 'Dimanche', short: 'D' }
];

const PRESET_SCHEDULES = [
  {
    name: 'Commerce standard',
    description: 'Lundi-Samedi 9h-19h',
    openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    openHours: ['09:00-19:00']
  },
  {
    name: 'Bureau classique',
    description: 'Lundi-Vendredi 8h-18h',
    openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    openHours: ['08:00-18:00']
  },
  {
    name: 'Service continu',
    description: '7j/7 avec équipes',
    openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    openHours: ['06:00-22:00']
  },
  {
    name: 'Horaires décalés',
    description: 'Avec pause déjeuner',
    openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    openHours: ['08:00-12:00', '14:00-20:00']
  }
];

const CompanyConstraintsStep: React.FC<CompanyConstraintsStepProps> = ({
  wizardData,
  onUpdate,
  onValidationChange
}) => {
  const { isDarkMode } = useTheme();
  const [constraints, setConstraints] = useState<CompanyConstraints>({
    openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    openHours: ['09:00-18:00'],
    minEmployeesPerSlot: 1,
    maxHoursPerDay: 8,
    minHoursPerDay: 2,
    mandatoryLunchBreak: true,
    lunchBreakDuration: 60,
    ...wizardData.companyConstraints
  });

  // Validation des contraintes
  useEffect(() => {
    const isValid = !!(
      constraints.openDays && constraints.openDays.length > 0 &&
      constraints.openHours && constraints.openHours.length > 0 &&
      constraints.minEmployeesPerSlot && constraints.minEmployeesPerSlot > 0 &&
      constraints.maxHoursPerDay && constraints.maxHoursPerDay > 0 &&
      constraints.minHoursPerDay && constraints.minHoursPerDay > 0 &&
      constraints.maxHoursPerDay >= constraints.minHoursPerDay
    );
    onValidationChange(isValid);
  }, [constraints, onValidationChange]);

  // Mettre à jour le wizard data quand les contraintes changent
  useEffect(() => {
    onUpdate({ companyConstraints: constraints });
  }, [constraints, onUpdate]);

  const handlePresetSelect = (preset: typeof PRESET_SCHEDULES[0]) => {
    setConstraints({
      ...constraints,
      openDays: preset.openDays,
      openHours: preset.openHours
    });
  };

  const handleDayToggle = (dayEnglish: string) => {
    const newOpenDays = constraints.openDays?.includes(dayEnglish)
      ? constraints.openDays.filter(d => d !== dayEnglish)
      : [...(constraints.openDays || []), dayEnglish];

    setConstraints({ ...constraints, openDays: newOpenDays });
  };

  const handleHourAdd = () => {
    const newHours = [...(constraints.openHours || []), '09:00-17:00'];
    setConstraints({ ...constraints, openHours: newHours });
  };

  const handleHourChange = (index: number, value: string) => {
    const newHours = [...(constraints.openHours || [])];
    newHours[index] = value;
    setConstraints({ ...constraints, openHours: newHours });
  };

  const handleHourRemove = (index: number) => {
    const newHours = constraints.openHours?.filter((_, i) => i !== index) || [];
    setConstraints({ ...constraints, openHours: newHours });
  };

  const validateTimeRange = (timeRange: string): boolean => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!regex.test(timeRange)) return false;

    const [start, end] = timeRange.split('-');
    const startTime = new Date(`2000-01-01T${start}:00`);
    const endTime = new Date(`2000-01-01T${end}:00`);

    return startTime < endTime;
  };

  const getTotalOpenHours = (): number => {
    return (constraints.openHours || []).reduce((total, range) => {
      if (!validateTimeRange(range)) return total;
      
      const [start, end] = range.split('-');
      const startTime = new Date(`2000-01-01T${start}:00`);
      const endTime = new Date(`2000-01-01T${end}:00`);
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      return total + hours;
    }, 0);
  };

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
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full mb-4"
        >
          <Building className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Contraintes de l'entreprise</h2>
        <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
          Configurez les jours et horaires d'ouverture, ainsi que les contraintes légales et organisationnelles.
        </p>
      </div>

      {/* Présets de configuration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 transition-colors duration-300"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Configurations prédéfinies</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESET_SCHEDULES.map((preset, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePresetSelect(preset)}
              className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-left transition-all"
            >
              <h4 className="font-semibold text-gray-900 mb-1">{preset.name}</h4>
              <p className="text-sm text-gray-600">{preset.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {preset.openDays.slice(0, 3).map(day => {
                  const dayInfo = FRENCH_DAYS.find(d => d.english === day);
                  return (
                    <span key={day} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {dayInfo?.short}
                    </span>
                  );
                })}
                {preset.openDays.length > 3 && (
                  <span className="text-xs text-gray-500">+{preset.openDays.length - 3}</span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Jours d'ouverture */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 transition-colors duration-300"
        >
          <div className="flex items-center mb-4">
            <Clock className="h-6 w-6 text-indigo-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">Jours d'ouverture</h3>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {FRENCH_DAYS.map(day => {
              const isSelected = constraints.openDays?.includes(day.english) || false;
              
              return (
                <button
                  key={day.english}
                  onClick={() => handleDayToggle(day.english)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold">{day.short}</div>
                  <div className="text-xs mt-1">{day.label.slice(0, 3)}</div>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-gray-600">
            {constraints.openDays?.length || 0} jour{(constraints.openDays?.length || 0) > 1 ? 's' : ''} d'ouverture par semaine
          </p>
        </motion.div>

        {/* Horaires d'ouverture */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 transition-colors duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">Horaires</h3>
            </div>
            <button
              onClick={handleHourAdd}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {(constraints.openHours || []).map((hours, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="09:00-18:00"
                  value={hours}
                  onChange={(e) => handleHourChange(index, e.target.value)}
                  className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    !validateTimeRange(hours) && hours ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {constraints.openHours!.length > 1 && (
                  <button
                    onClick={() => handleHourRemove(index)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-700">
              <div className="font-medium">Total: {getTotalOpenHours()}h par jour</div>
              <div className="text-xs text-gray-500 mt-1">
                Format: HH:MM-HH:MM (ex: 09:00-18:00)
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Contraintes de staffing et légales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 transition-colors duration-300"
      >
        <div className="flex items-center mb-6">
          <Users className="h-6 w-6 text-purple-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">Contraintes de staffing</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Minimum d'employés simultanés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum d'employés simultanés
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={constraints.minEmployeesPerSlot || 1}
              onChange={(e) => setConstraints({
                ...constraints,
                minEmployeesPerSlot: parseInt(e.target.value) || 1
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nombre minimum requis à tout moment
            </p>
          </div>

          {/* Heures max par jour */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum d'heures par jour
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={constraints.maxHoursPerDay || 8}
              onChange={(e) => setConstraints({
                ...constraints,
                maxHoursPerDay: parseInt(e.target.value) || 8
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Limite légale du temps de travail
            </p>
          </div>

          {/* Heures min par jour */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum d'heures par jour
            </label>
            <input
              type="number"
              min="0.5"
              max="8"
              step="0.5"
              value={constraints.minHoursPerDay || 2}
              onChange={(e) => setConstraints({
                ...constraints,
                minHoursPerDay: parseFloat(e.target.value) || 2
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Durée minimum d'un service
            </p>
          </div>
        </div>
      </motion.div>

      {/* Contraintes de pause déjeuner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 transition-colors duration-300"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">Pauses déjeuner</h3>
          </div>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={constraints.mandatoryLunchBreak || false}
              onChange={(e) => setConstraints({
                ...constraints,
                mandatoryLunchBreak: e.target.checked
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Obligatoire</span>
          </label>
        </div>

        {constraints.mandatoryLunchBreak && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée de la pause (minutes)
                </label>
                <select
                  value={constraints.lunchBreakDuration || 60}
                  onChange={(e) => setConstraints({
                    ...constraints,
                    lunchBreakDuration: parseInt(e.target.value)
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 heure</option>
                  <option value={90}>1h30</option>
                  <option value={120}>2 heures</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <div className="font-medium">Règles automatiques :</div>
                  <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                    <li>Pause après 4h de travail consécutif</li>
                    <li>Positionnée au milieu de la journée</li>
                    <li>Non comptée dans les heures travaillées</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Validation et résumé */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl p-6 ${
          constraints.openDays?.length && constraints.openHours?.length &&
          constraints.maxHoursPerDay! >= constraints.minHoursPerDay!
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className="flex items-center mb-4">
          {constraints.openDays?.length && constraints.openHours?.length &&
           constraints.maxHoursPerDay! >= constraints.minHoursPerDay! ? (
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
          )}
          <h3 className="text-lg font-semibold">
            {constraints.openDays?.length && constraints.openHours?.length &&
             constraints.maxHoursPerDay! >= constraints.minHoursPerDay!
              ? 'Configuration valide'
              : 'Configuration incomplète'
            }
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Jours d'ouverture:</span>
            <div className="mt-1">
              {constraints.openDays?.length ? (
                `${constraints.openDays.length} jour${constraints.openDays.length > 1 ? 's' : ''}/semaine`
              ) : (
                <span className="text-red-600">Non configuré</span>
              )}
            </div>
          </div>
          
          <div>
            <span className="font-medium">Horaires quotidiens:</span>
            <div className="mt-1">
              {getTotalOpenHours() > 0 ? (
                `${getTotalOpenHours()}h/jour (${constraints.openHours?.length} créneau${constraints.openHours!.length > 1 ? 'x' : ''})`
              ) : (
                <span className="text-red-600">Non configuré</span>
              )}
            </div>
          </div>
          
          <div>
            <span className="font-medium">Contraintes staffing:</span>
            <div className="mt-1">
              {constraints.minEmployeesPerSlot} min • {constraints.minHoursPerDay}h-{constraints.maxHoursPerDay}h/jour
              {constraints.mandatoryLunchBreak && (
                <div className="text-xs text-gray-600">
                  Pause déjeuner: {constraints.lunchBreakDuration}min
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CompanyConstraintsStep;