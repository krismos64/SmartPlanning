import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, User, CheckCircle, AlertCircle, Search, Clock, Mail, Phone } from 'lucide-react';
import { WizardData, Employee } from '../../types/GeneratePlanningPayload';
import { useTheme } from '../ThemeProvider';
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Équipe non sélectionnée</h3>
        <p className="text-gray-600">Veuillez d'abord sélectionner une équipe à l'étape précédente.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
      >
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
        <p className="text-red-600">{error}</p>
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
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Sélection des employés</h2>
        <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
          Choisissez les employés qui seront inclus dans la génération automatique du planning.
        </p>
      </div>

      {/* Outils de recherche et sélection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 transition-colors duration-300"
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
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300"
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
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors duration-300"
            >
              Tout désélectionner
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{availableEmployees.length}</p>
              <p className="text-sm text-gray-600">Employés disponibles</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{wizardData.selectedEmployees.length}</p>
              <p className="text-sm text-gray-600">Employés sélectionnés</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {wizardData.selectedEmployees.reduce((sum, emp) => sum + emp.contractHoursPerWeek, 0)}h
              </p>
              <p className="text-sm text-gray-600">Heures totales/semaine</p>
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
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Aucun employé trouvé' : 'Aucun employé disponible'}
          </h3>
          <p className="text-gray-500">
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
                className={`relative bg-white rounded-xl shadow-lg border-2 p-6 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-green-500 bg-green-50 shadow-xl' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
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
                  isSelected ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <User className={`h-8 w-8 ${isSelected ? 'text-green-600' : 'text-gray-600'}`} />
                </div>

                {/* Informations employé */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{employee.contractHoursPerWeek}h/semaine</span>
                    </div>
                    
                    {employee.restDay && (
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
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
                      <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
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
          className="bg-green-50 border border-green-200 rounded-xl p-4 text-center"
        >
          <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-medium">
            {wizardData.selectedEmployees.length} employé{wizardData.selectedEmployees.length > 1 ? 's' : ''} sélectionné{wizardData.selectedEmployees.length > 1 ? 's' : ''} pour la génération !
          </p>
          <p className="text-green-600 text-sm mt-1">
            Total: {wizardData.selectedEmployees.reduce((sum, emp) => sum + emp.contractHoursPerWeek, 0)} heures/semaine
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmployeeSelectionStep;