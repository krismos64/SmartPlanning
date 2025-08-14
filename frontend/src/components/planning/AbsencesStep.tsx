import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Trash2, User, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { WizardData, Employee, EmployeeException } from '../../types/GeneratePlanningPayload';
import { useTheme } from '../ThemeProvider';
import { useDarkModeClasses } from '../../utils/darkModeClasses';

interface AbsencesStepProps {
  wizardData: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

const getExceptionTypes = (isDarkMode: boolean) => [
  { 
    value: 'vacation', 
    label: 'Congés', 
    color: 'bg-blue-500', 
    bgColor: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50', 
    textColor: isDarkMode ? 'text-blue-400' : 'text-blue-800' 
  },
  { 
    value: 'sick', 
    label: 'Maladie', 
    color: 'bg-red-500', 
    bgColor: isDarkMode ? 'bg-red-900/30' : 'bg-red-50', 
    textColor: isDarkMode ? 'text-red-400' : 'text-red-800' 
  },
  { 
    value: 'unavailable', 
    label: 'Indisponible', 
    color: 'bg-gray-500', 
    bgColor: isDarkMode ? 'bg-gray-700' : 'bg-gray-50', 
    textColor: isDarkMode ? 'text-gray-400' : 'text-gray-800' 
  },
  { 
    value: 'training', 
    label: 'Formation', 
    color: 'bg-green-500', 
    bgColor: isDarkMode ? 'bg-green-900/30' : 'bg-green-50', 
    textColor: isDarkMode ? 'text-green-400' : 'text-green-800' 
  },
  { 
    value: 'reduced', 
    label: 'Horaires réduits', 
    color: 'bg-orange-500', 
    bgColor: isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50', 
    textColor: isDarkMode ? 'text-orange-400' : 'text-orange-800' 
  }
] as const;

const AbsencesStep: React.FC<AbsencesStepProps> = ({
  wizardData,
  onUpdate,
  onValidationChange
}) => {
  const { isDarkMode } = useTheme();
  const darkClasses = useDarkModeClasses(isDarkMode);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [newException, setNewException] = useState<Partial<EmployeeException>>({
    date: '',
    type: 'vacation',
    description: ''
  });
  const [employeesWithExceptions, setEmployeesWithExceptions] = useState<Employee[]>([]);

  // Initialiser les employés avec leurs exceptions existantes
  useEffect(() => {
    const initialEmployees = wizardData.selectedEmployees.map(employee => ({
      ...employee,
      exceptions: employee.exceptions || []
    }));
    setEmployeesWithExceptions(initialEmployees);
    
    if (initialEmployees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(initialEmployees[0]._id);
    }
  }, [wizardData.selectedEmployees]);

  // Validation - toujours valide, les absences sont optionnelles
  useEffect(() => {
    onValidationChange(true);
  }, [onValidationChange]);

  // Calculer la semaine à partir du numéro de semaine et de l'année
  const getWeekDates = (weekNumber: number, year: number) => {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (weekNumber - 1) * 7;
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

  const weekDates = wizardData.weekNumber && wizardData.year 
    ? getWeekDates(wizardData.weekNumber, wizardData.year)
    : [];

  const handleAddException = () => {
    if (!selectedEmployee || !newException.date || !newException.type) return;

    const updatedEmployees = employeesWithExceptions.map(employee => {
      if (employee._id === selectedEmployee) {
        const newExceptions = [
          ...(employee.exceptions || []),
          {
            date: newException.date!,
            type: newException.type!,
            description: newException.description || ''
          }
        ];
        return { ...employee, exceptions: newExceptions };
      }
      return employee;
    });

    setEmployeesWithExceptions(updatedEmployees);
    onUpdate({ selectedEmployees: updatedEmployees });
    
    // Reset du formulaire
    setNewException({
      date: '',
      type: 'vacation',
      description: ''
    });
  };

  const handleRemoveException = (employeeId: string, exceptionIndex: number) => {
    const updatedEmployees = employeesWithExceptions.map(employee => {
      if (employee._id === employeeId) {
        const newExceptions = employee.exceptions?.filter((_, index) => index !== exceptionIndex) || [];
        return { ...employee, exceptions: newExceptions };
      }
      return employee;
    });

    setEmployeesWithExceptions(updatedEmployees);
    onUpdate({ selectedEmployees: updatedEmployees });
  };

  const getSelectedEmployee = () => {
    return employeesWithExceptions.find(emp => emp._id === selectedEmployee);
  };

  const getTypeConfig = (type: string) => {
    const types = getExceptionTypes(isDarkMode);
    return types.find(t => t.value === type) || types[0];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const isDateInWeek = (dateStr: string) => {
    return weekDates.includes(dateStr);
  };

  if (wizardData.selectedEmployees.length === 0) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className={`text-lg font-semibold ${darkClasses.title} mb-2`}>Aucun employé sélectionné</h3>
        <p className={darkClasses.subtitle}>Veuillez d'abord sélectionner des employés à l'étape précédente.</p>
      </div>
    );
  }

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
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mb-4"
        >
          <Calendar className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className={`text-3xl font-bold ${darkClasses.title} mb-2`}>Gestion des absences</h2>
        <p className={`${darkClasses.subtitle} max-w-2xl mx-auto`}>
          Ajoutez les congés, absences et autres exceptions pour chaque employé pendant la semaine planifiée.
        </p>
        {weekDates.length > 0 && (
          <div className={`mt-4 text-sm ${darkClasses.textMuted}`}>
            Semaine {wizardData.weekNumber} de {wizardData.year} ({formatDate(weekDates[0])} - {formatDate(weekDates[6])})
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire d'ajout d'exception */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`${darkClasses.card} rounded-xl shadow-lg p-6`}
        >
          <div className="flex items-center mb-6">
            <Plus className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className={`text-xl font-semibold ${darkClasses.title}`}>Ajouter une absence</h3>
          </div>

          <div className="space-y-4">
            {/* Sélection de l'employé */}
            <div>
              <label className={`block text-sm font-medium ${darkClasses.subtitle} mb-2`}>
                Employé
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className={`w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkClasses.input}`}
              >
                {employeesWithExceptions.map(employee => (
                  <option key={employee._id} value={employee._id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className={`block text-sm font-medium ${darkClasses.subtitle} mb-2`}>
                Date
              </label>
              <input
                type="date"
                value={newException.date || ''}
                onChange={(e) => setNewException({...newException, date: e.target.value})}
                className={`w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkClasses.input}`}
              />
              {newException.date && isDateInWeek(newException.date) && (
                <div className={`mt-1 text-xs flex items-center ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Cette date fait partie de la semaine planifiée
                </div>
              )}
            </div>

            {/* Type d'exception */}
            <div>
              <label className={`block text-sm font-medium ${darkClasses.subtitle} mb-2`}>
                Type d'absence
              </label>
              <div className="grid grid-cols-2 gap-2">
                {getExceptionTypes(isDarkMode).map(type => (
                  <button
                    key={type.value}
                    onClick={() => setNewException({...newException, type: type.value})}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      newException.type === type.value
                        ? `${isDarkMode ? 'border-gray-500' : 'border-gray-400'} ${type.bgColor}`
                        : isDarkMode 
                          ? 'border-gray-600 bg-gray-700 hover:border-gray-500' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${type.color} mb-1`}></div>
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description optionnelle */}
            <div>
              <label className={`block text-sm font-medium ${darkClasses.subtitle} mb-2`}>
                Description (optionnel)
              </label>
              <input
                type="text"
                placeholder="Détails sur l'absence..."
                value={newException.description || ''}
                onChange={(e) => setNewException({...newException, description: e.target.value})}
                className={`w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkClasses.input}`}
              />
            </div>

            {/* Bouton d'ajout */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddException}
              disabled={!selectedEmployee || !newException.date || !newException.type}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Ajouter l'absence
            </motion.button>
          </div>
        </motion.div>

        {/* Liste des exceptions par employé */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className={`${darkClasses.card} rounded-xl shadow-lg p-6`}
        >
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-green-600 mr-3" />
            <h3 className={`text-xl font-semibold ${darkClasses.title}`}>Absences enregistrées</h3>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {employeesWithExceptions.map(employee => (
              <div key={employee._id} className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-100'} pb-4 last:border-b-0`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold ${darkClasses.title}`}>
                    {employee.firstName} {employee.lastName}
                  </h4>
                  <span className={`text-xs ${darkClasses.textMuted}`}>
                    {employee.exceptions?.length || 0} exception{(employee.exceptions?.length || 0) > 1 ? 's' : ''}
                  </span>
                </div>

                <AnimatePresence>
                  {employee.exceptions && employee.exceptions.length > 0 ? (
                    <div className="space-y-2">
                      {employee.exceptions.map((exception, index) => {
                        const typeConfig = getTypeConfig(exception.type);
                        const isInWeek = isDateInWeek(exception.date);
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className={`p-3 rounded-lg border ${typeConfig.bgColor} ${
                              isInWeek 
                                ? isDarkMode ? 'border-orange-500' : 'border-orange-300' 
                                : isDarkMode ? 'border-gray-600' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${typeConfig.color}`}></div>
                                <span className={`text-sm font-medium ${typeConfig.textColor}`}>
                                  {typeConfig.label}
                                </span>
                                {isInWeek && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    isDarkMode 
                                      ? 'bg-orange-900/50 text-orange-300' 
                                      : 'bg-orange-200 text-orange-800'
                                  }`}>
                                    Semaine planifiée
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveException(employee._id, index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(exception.date)}
                              </div>
                              {exception.description && (
                                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{exception.description}</p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`text-center py-4 text-sm ${darkClasses.textMuted}`}>
                      Aucune absence enregistrée
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Résumé des exceptions dans la semaine planifiée */}
      {(() => {
        const weekExceptions = employeesWithExceptions.reduce((acc, employee) => {
          const empExceptions = employee.exceptions?.filter(ex => isDateInWeek(ex.date)) || [];
          if (empExceptions.length > 0) {
            acc.push({
              employee: `${employee.firstName} ${employee.lastName}`,
              exceptions: empExceptions
            });
          }
          return acc;
        }, [] as any[]);

        if (weekExceptions.length > 0) {
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl p-6 ${
                isDarkMode 
                  ? 'bg-orange-900/20 border border-orange-700' 
                  : 'bg-orange-50 border border-orange-200'
              }`}
            >
              <div className="flex items-center mb-4">
                <AlertTriangle className={`h-6 w-6 mr-3 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                  Absences pendant la semaine planifiée
                </h3>
              </div>
              
              <div className="space-y-3">
                {weekExceptions.map((item, index) => (
                  <div key={index} className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                    <h4 className={`font-medium mb-2 ${darkClasses.title}`}>{item.employee}</h4>
                    <div className="space-y-1">
                      {item.exceptions.map((ex: any, exIndex: number) => {
                        const typeConfig = getTypeConfig(ex.type);
                        return (
                          <div key={exIndex} className="flex items-center text-sm">
                            <div className={`w-2 h-2 rounded-full ${typeConfig.color} mr-2`}></div>
                            <span>{formatDate(ex.date)} - {typeConfig.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              <p className={`text-sm mt-4 ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                Ces absences seront prises en compte lors de la génération automatique du planning.
              </p>
            </motion.div>
          );
        }
        
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl p-4 text-center ${
              isDarkMode 
                ? 'bg-green-900/20 border border-green-700' 
                : 'bg-green-50 border border-green-200'
            }`}
          >
            <CheckCircle className={`h-6 w-6 mx-auto mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            <p className={`font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
              Aucune absence pendant la semaine planifiée
            </p>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              Tous les employés seront disponibles pour le planning automatique
            </p>
          </motion.div>
        );
      })()}
    </motion.div>
  );
};

export default AbsencesStep;