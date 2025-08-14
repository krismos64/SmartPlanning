import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, User, CheckCircle, AlertCircle, Search, Clock, Mail, Phone } from 'lucide-react';
import { WizardData, Employee } from '../../types/GeneratePlanningPayload';
import { useTheme } from '../ThemeProvider';
import { useDarkModeClasses } from '../../utils/darkModeClasses';
import axiosInstance from '../../api/axiosInstance';

interface EmployeeSelectionStepProps {
  wizardData: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

const EmployeeSelectionStep: React.FC<EmployeeSelectionStepProps> = ({
  wizardData,
  onUpdate,
  onValidationChange
}) => {
  const { isDarkMode } = useTheme();
  const darkClasses = useDarkModeClasses(isDarkMode);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les employés de l'équipe sélectionnée
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!wizardData.teamId) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // Récupérer les employés de l'équipe
        const response = await axiosInstance.get(`/employees/team/${wizardData.teamId}`);
        const employees = response.data.data || [];

        // Transformer les données pour correspondre à notre interface
        const transformedEmployees: Employee[] = employees.map((emp: any) => ({
          _id: emp._id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          contractHoursPerWeek: emp.contractHoursPerWeek || 35,
          exceptions: emp.exceptions || [],
          preferences: emp.preferences || {},
          restDay: emp.restDay || undefined
        }));

        setAvailableEmployees(transformedEmployees);
        
        // Si aucun employé n'est encore sélectionné, sélectionner tous par défaut
        if (wizardData.selectedEmployees.length === 0) {
          onUpdate({ selectedEmployees: transformedEmployees });
        }
      } catch (err: any) {
        console.error('Erreur chargement employés:', err);
        setError('Impossible de charger les employés de cette équipe');
        setAvailableEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [wizardData.teamId]);

  // Validation des données
  useEffect(() => {
    const isValid = wizardData.selectedEmployees.length > 0;
    onValidationChange(isValid);
  }, [wizardData.selectedEmployees, onValidationChange]);

  // Filtrer les employés selon la recherche
  const filteredEmployees = availableEmployees.filter(employee => 
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeeToggle = (employee: Employee) => {
    const isSelected = wizardData.selectedEmployees.some(emp => emp._id === employee._id);
    
    let newSelectedEmployees: Employee[];
    if (isSelected) {
      // Désélectionner
      newSelectedEmployees = wizardData.selectedEmployees.filter(emp => emp._id !== employee._id);
    } else {
      // Sélectionner
      newSelectedEmployees = [...wizardData.selectedEmployees, employee];
    }
    
    onUpdate({ selectedEmployees: newSelectedEmployees });
  };

  const handleSelectAll = () => {
    onUpdate({ selectedEmployees: [...filteredEmployees] });
  };

  const handleDeselectAll = () => {
    onUpdate({ selectedEmployees: [] });
  };

  if (!wizardData.teamId) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className={`text-lg font-semibold ${darkClasses.title} mb-2`}>Équipe non sélectionnée</h3>
        <p className={darkClasses.subtitle}>Veuillez d'abord sélectionner une équipe à l'étape précédente.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={darkClasses.textMuted}>Chargement des employés...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${darkClasses.error} rounded-xl p-6 text-center`}
      >
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>Erreur de chargement</h3>
        <p className={isDarkMode ? 'text-red-300' : 'text-red-600'}>{error}</p>
      </motion.div>
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
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mb-4"
        >
          <Users className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className={`text-3xl font-bold ${darkClasses.title} mb-2`}>Sélection des employés</h2>
        <p className={`${darkClasses.subtitle} max-w-2xl mx-auto`}>
          Choisissez les employés qui seront inclus dans la génération automatique du planning.
        </p>
      </div>

      {/* Outils de recherche et sélection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`${darkClasses.card} rounded-xl shadow-lg p-6`}
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          {/* Barre de recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkClasses.input}`}
            />
          </div>

          {/* Boutons de sélection rapide */}
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-300"
            >
              Tout sélectionner
            </button>
            <button
              onClick={handleDeselectAll}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${darkClasses.button('secondary')}`}
            >
              Tout désélectionner
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className={`mt-4 p-4 rounded-lg ${darkClasses.cardSecondary}`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{availableEmployees.length}</p>
              <p className={`text-sm ${darkClasses.textMuted}`}>Employés disponibles</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{wizardData.selectedEmployees.length}</p>
              <p className={`text-sm ${darkClasses.textMuted}`}>Employés sélectionnés</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {wizardData.selectedEmployees.reduce((sum, emp) => sum + emp.contractHoursPerWeek, 0)}h
              </p>
              <p className={`text-sm ${darkClasses.textMuted}`}>Heures totales/semaine</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Liste des employés */}
      {filteredEmployees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <User className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          <h3 className={`text-lg font-medium ${darkClasses.title} mb-2`}>
            {searchTerm ? 'Aucun employé trouvé' : 'Aucun employé disponible'}
          </h3>
          <p className={darkClasses.textMuted}>
            {searchTerm 
              ? 'Essayez de modifier votre terme de recherche'
              : 'Cette équipe ne contient aucun employé'
            }
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEmployees.map((employee, index) => {
            const isSelected = wizardData.selectedEmployees.some(emp => emp._id === employee._id);
            
            return (
              <motion.div
                key={employee._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleEmployeeToggle(employee)}
                className={`relative rounded-xl shadow-lg border-2 p-6 cursor-pointer transition-all ${
                  isSelected 
                    ? `${darkClasses.selected} shadow-xl` 
                    : `${darkClasses.unselected} hover:shadow-xl`
                }`}
              >
                {/* Indicateur de sélection */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </motion.div>
                )}

                {/* Avatar */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto ${
                  isSelected 
                    ? (isDarkMode ? 'bg-green-900/30' : 'bg-green-100')
                    : (isDarkMode ? 'bg-gray-700' : 'bg-gray-100')
                }`}>
                  <User className={`h-8 w-8 ${
                    isSelected 
                      ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                      : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                  }`} />
                </div>

                {/* Informations employé */}
                <div className="text-center">
                  <h3 className={`text-lg font-semibold ${darkClasses.title} mb-1`}>
                    {employee.firstName} {employee.lastName}
                  </h3>
                  
                  <div className={`space-y-2 text-sm ${darkClasses.subtitle}`}>
                    <div className="flex items-center justify-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{employee.contractHoursPerWeek}h/semaine</span>
                    </div>
                    
                    {employee.restDay && (
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
                      }`}>
                        Repos: {employee.restDay === 'monday' ? 'Lundi' : 
                               employee.restDay === 'tuesday' ? 'Mardi' :
                               employee.restDay === 'wednesday' ? 'Mercredi' :
                               employee.restDay === 'thursday' ? 'Jeudi' :
                               employee.restDay === 'friday' ? 'Vendredi' :
                               employee.restDay === 'saturday' ? 'Samedi' :
                               employee.restDay === 'sunday' ? 'Dimanche' : employee.restDay}
                      </div>
                    )}

                    {employee.exceptions && employee.exceptions.length > 0 && (
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        isDarkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {employee.exceptions.length} exception{employee.exceptions.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Indicateur de validation */}
      {wizardData.selectedEmployees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${darkClasses.success} rounded-xl p-4 text-center`}
        >
          <CheckCircle className={`h-6 w-6 mx-auto mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          <p className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>
            {wizardData.selectedEmployees.length} employé{wizardData.selectedEmployees.length > 1 ? 's' : ''} sélectionné{wizardData.selectedEmployees.length > 1 ? 's' : ''} pour la génération !
          </p>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
            Total: {wizardData.selectedEmployees.reduce((sum, emp) => sum + emp.contractHoursPerWeek, 0)} heures/semaine
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmployeeSelectionStep;