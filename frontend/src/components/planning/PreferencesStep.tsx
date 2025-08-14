import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Clock, Calendar, ToggleLeft, ToggleRight, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { WizardData, Employee, EmployeePreferences, convertDaysToFrench } from '../../types/GeneratePlanningPayload';
import { useTheme } from '../ThemeProvider';

interface PreferencesStepProps {
  wizardData: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

const FRENCH_DAYS = [
  { value: 'lundi', label: 'Lundi', short: 'L' },
  { value: 'mardi', label: 'Mardi', short: 'M' },
  { value: 'mercredi', label: 'Mercredi', short: 'Me' },
  { value: 'jeudi', label: 'Jeudi', short: 'J' },
  { value: 'vendredi', label: 'Vendredi', short: 'V' },
  { value: 'samedi', label: 'Samedi', short: 'S' },
  { value: 'dimanche', label: 'Dimanche', short: 'D' }
];

const REST_DAYS = [
  { value: '', label: 'Aucun jour de repos fixe' },
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' }
];

const PRESET_HOURS = [
  { value: '08:00-16:00', label: 'Journée standard (8h-16h)' },
  { value: '09:00-17:00', label: 'Horaires bureau (9h-17h)' },
  { value: '10:00-18:00', label: 'Décalé matin (10h-18h)' },
  { value: '14:00-22:00', label: 'Après-midi/soir (14h-22h)' },
  { value: '06:00-14:00', label: 'Équipe du matin (6h-14h)' },
  { value: '22:00-06:00', label: 'Équipe de nuit (22h-6h)' }
];

const PreferencesStep: React.FC<PreferencesStepProps> = ({
  wizardData,
  onUpdate,
  onValidationChange
}) => {
  const { isDarkMode } = useTheme();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employeesWithPreferences, setEmployeesWithPreferences] = useState<Employee[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  // Initialiser les employés avec leurs préférences existantes
  useEffect(() => {
    const initialEmployees = wizardData.selectedEmployees.map(employee => ({
      ...employee,
      preferences: {
        preferredDays: employee.preferences?.preferredDays || [],
        preferredHours: employee.preferences?.preferredHours || [],
        allowSplitShifts: employee.preferences?.allowSplitShifts ?? true,
        maxConsecutiveDays: employee.preferences?.maxConsecutiveDays || 5,
        ...employee.preferences
      }
    }));
    setEmployeesWithPreferences(initialEmployees);
    
    if (initialEmployees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(initialEmployees[0]._id);
    }
  }, [wizardData.selectedEmployees]);

  // Validation - toujours valide, les préférences sont optionnelles
  useEffect(() => {
    onValidationChange(true);
  }, [onValidationChange]);

  const updateEmployeePreferences = (employeeId: string, preferences: Partial<EmployeePreferences>) => {
    const updatedEmployees = employeesWithPreferences.map(employee => {
      if (employee._id === employeeId) {
        return {
          ...employee,
          preferences: {
            ...employee.preferences,
            ...preferences
          }
        };
      }
      return employee;
    });

    setEmployeesWithPreferences(updatedEmployees);
    onUpdate({ selectedEmployees: updatedEmployees });
  };

  const applyToAllEmployees = (preferences: Partial<EmployeePreferences>) => {
    const updatedEmployees = employeesWithPreferences.map(employee => ({
      ...employee,
      preferences: {
        ...employee.preferences,
        ...preferences
      }
    }));

    setEmployeesWithPreferences(updatedEmployees);
    onUpdate({ selectedEmployees: updatedEmployees });
  };

  const getSelectedEmployeeData = () => {
    return employeesWithPreferences.find(emp => emp._id === selectedEmployee);
  };

  const handleDayToggle = (day: string, employeeId?: string) => {
    const employee = employeeId 
      ? employeesWithPreferences.find(emp => emp._id === employeeId)
      : getSelectedEmployeeData();
    
    if (!employee) return;

    const preferredDays = employee.preferences?.preferredDays || [];
    const newPreferredDays = preferredDays.includes(day)
      ? preferredDays.filter(d => d !== day)
      : [...preferredDays, day];

    if (bulkMode) {
      applyToAllEmployees({ preferredDays: newPreferredDays });
    } else {
      updateEmployeePreferences(employee._id, { preferredDays: newPreferredDays });
    }
  };

  const handleHoursChange = (hours: string[], employeeId?: string) => {
    const employee = employeeId 
      ? employeesWithPreferences.find(emp => emp._id === employeeId)
      : getSelectedEmployeeData();
    
    if (!employee) return;

    if (bulkMode) {
      applyToAllEmployees({ preferredHours: hours });
    } else {
      updateEmployeePreferences(employee._id, { preferredHours: hours });
    }
  };

  const handleSplitShiftsToggle = (value: boolean, employeeId?: string) => {
    const employee = employeeId 
      ? employeesWithPreferences.find(emp => emp._id === employeeId)
      : getSelectedEmployeeData();
    
    if (!employee) return;

    if (bulkMode) {
      applyToAllEmployees({ allowSplitShifts: value });
    } else {
      updateEmployeePreferences(employee._id, { allowSplitShifts: value });
    }
  };

  const handleMaxConsecutiveDaysChange = (days: number, employeeId?: string) => {
    const employee = employeeId 
      ? employeesWithPreferences.find(emp => emp._id === employeeId)
      : getSelectedEmployeeData();
    
    if (!employee) return;

    if (bulkMode) {
      applyToAllEmployees({ maxConsecutiveDays: days });
    } else {
      updateEmployeePreferences(employee._id, { maxConsecutiveDays: days });
    }
  };

  const handleRestDayChange = (restDay: string, employeeId: string) => {
    const updatedEmployees = employeesWithPreferences.map(employee => {
      if (employee._id === employeeId) {
        return { ...employee, restDay: restDay || undefined };
      }
      return employee;
    });

    setEmployeesWithPreferences(updatedEmployees);
    onUpdate({ selectedEmployees: updatedEmployees });
  };

  if (wizardData.selectedEmployees.length === 0) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun employé sélectionné</h3>
        <p className="text-gray-600">Veuillez d'abord sélectionner des employés à l'étape précédente.</p>
      </div>
    );
  }

  const selectedEmployeeData = getSelectedEmployeeData();

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
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4"
        >
          <Settings className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Préférences des employés</h2>
        <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
          Configurez les préférences de travail pour optimiser le planning selon les contraintes personnelles.
        </p>
      </div>

      {/* Mode de configuration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 transition-colors duration-300"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Mode de configuration</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setBulkMode(false)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                !bulkMode ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="h-4 w-4 mr-2" />
              Individuel
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                bulkMode ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Groupé
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {bulkMode 
            ? 'Les modifications seront appliquées à tous les employés sélectionnés'
            : 'Configurez les préférences individuellement pour chaque employé'
          }
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sélecteur d'employé (mode individuel uniquement) */}
        {!bulkMode && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 transition-colors duration-300"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélection employé</h3>
            
            <div className="space-y-2">
              {employeesWithPreferences.map(employee => (
                <button
                  key={employee._id}
                  onClick={() => setSelectedEmployee(employee._id)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    selectedEmployee === employee._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {employee.contractHoursPerWeek}h/semaine
                        {employee.restDay && (
                          <span className="ml-2">
                            • Repos: {REST_DAYS.find(d => d.value === employee.restDay)?.label}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedEmployee === employee._id && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Configuration des préférences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${
            bulkMode ? 'lg:col-span-2' : ''
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {bulkMode ? 'Préférences pour tous les employés' : 
             selectedEmployeeData ? `Préférences de ${selectedEmployeeData.firstName} ${selectedEmployeeData.lastName}` : 'Sélectionnez un employé'}
          </h3>

          {(bulkMode || selectedEmployeeData) && (
            <div className="space-y-6">
              {/* Jours préférés */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Jours de travail préférés
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {FRENCH_DAYS.map(day => {
                    const isSelected = bulkMode 
                      ? true // En mode groupé, on ne peut pas montrer l'état individuel
                      : selectedEmployeeData?.preferences?.preferredDays?.includes(day.value) || false;
                    
                    return (
                      <button
                        key={day.value}
                        onClick={() => handleDayToggle(day.value)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          isSelected && !bulkMode
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">{day.short}</div>
                        <div className="text-xs mt-1">{day.label.slice(0, 3)}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Laissez vide pour autoriser tous les jours d'ouverture
                </p>
              </div>

              {/* Créneaux horaires préférés */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Créneaux horaires préférés
                </label>
                <div className="space-y-2">
                  {PRESET_HOURS.map(preset => {
                    const isSelected = bulkMode 
                      ? false // En mode groupé, on ne peut pas montrer l'état individuel
                      : selectedEmployeeData?.preferences?.preferredHours?.includes(preset.value) || false;
                    
                    return (
                      <button
                        key={preset.value}
                        onClick={() => {
                          const currentHours = bulkMode 
                            ? []
                            : selectedEmployeeData?.preferences?.preferredHours || [];
                          
                          const newHours = currentHours.includes(preset.value)
                            ? currentHours.filter(h => h !== preset.value)
                            : [...currentHours, preset.value];
                          
                          handleHoursChange(newHours);
                        }}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected && !bulkMode
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{preset.label}</span>
                          <span className="text-sm text-gray-500">{preset.value}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Plusieurs créneaux peuvent être sélectionnés
                </p>
              </div>

              {/* Créneaux fractionnés */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Autoriser les créneaux fractionnés
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Permet de diviser la journée en plusieurs créneaux avec pauses
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const currentValue = bulkMode 
                        ? true 
                        : selectedEmployeeData?.preferences?.allowSplitShifts ?? true;
                      handleSplitShiftsToggle(!currentValue);
                    }}
                    className="relative"
                  >
                    {(bulkMode ? true : selectedEmployeeData?.preferences?.allowSplitShifts ?? true) ? (
                      <ToggleRight className="h-8 w-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Jours consécutifs maximum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum de jours consécutifs
                </label>
                <select
                  value={bulkMode ? 5 : selectedEmployeeData?.preferences?.maxConsecutiveDays || 5}
                  onChange={(e) => handleMaxConsecutiveDaysChange(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <option key={num} value={num}>
                      {num} jour{num > 1 ? 's' : ''} consécutif{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </motion.div>

        {/* Configuration des jours de repos (individuel uniquement) */}
        {!bulkMode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 transition-colors duration-300"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Jours de repos fixes</h3>
            
            <div className="space-y-3">
              {employeesWithPreferences.map(employee => (
                <div key={employee._id} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="font-medium text-gray-900 mb-2">
                    {employee.firstName} {employee.lastName}
                  </div>
                  <select
                    value={employee.restDay || ''}
                    onChange={(e) => handleRestDayChange(e.target.value, employee._id)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {REST_DAYS.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Résumé des préférences configurées */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-xl p-6"
      >
        <div className="flex items-center mb-4">
          <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
          <h3 className="text-lg font-semibold text-green-800">Résumé des préférences</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employeesWithPreferences.map(employee => {
            const hasPreferences = 
              (employee.preferences?.preferredDays?.length || 0) > 0 ||
              (employee.preferences?.preferredHours?.length || 0) > 0 ||
              employee.preferences?.allowSplitShifts === false ||
              (employee.preferences?.maxConsecutiveDays || 5) !== 5 ||
              employee.restDay;
            
            return (
              <div key={employee._id} className="bg-white rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">
                  {employee.firstName} {employee.lastName}
                </h4>
                <div className="space-y-1 text-xs text-gray-600">
                  {employee.preferences?.preferredDays?.length ? (
                    <div>
                      Jours: {employee.preferences.preferredDays.join(', ')}
                    </div>
                  ) : null}
                  
                  {employee.preferences?.preferredHours?.length ? (
                    <div>
                      Créneaux: {employee.preferences.preferredHours.length} configuré{employee.preferences.preferredHours.length > 1 ? 's' : ''}
                    </div>
                  ) : null}
                  
                  {employee.preferences?.allowSplitShifts === false && (
                    <div className="text-orange-600">Créneaux continus uniquement</div>
                  )}
                  
                  {(employee.preferences?.maxConsecutiveDays || 5) !== 5 && (
                    <div>Max {employee.preferences?.maxConsecutiveDays} jours consécutifs</div>
                  )}
                  
                  {employee.restDay && (
                    <div className="text-blue-600">
                      Repos: {REST_DAYS.find(d => d.value === employee.restDay)?.label}
                    </div>
                  )}
                  
                  {!hasPreferences && (
                    <div className="text-gray-400">Aucune préférence spécifique</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <p className="text-green-700 text-sm mt-4">
          Les préférences seront utilisées pour optimiser la génération automatique du planning.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default PreferencesStep;