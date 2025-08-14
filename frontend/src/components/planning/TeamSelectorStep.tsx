import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Building, ChevronDown, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { WizardData } from '../../types/GeneratePlanningPayload';
import { useTheme } from '../ThemeProvider';
import { useDarkModeClasses } from '../../utils/darkModeClasses';
import axiosInstance from '../../api/axiosInstance';

interface TeamSelectorStepProps {
  wizardData: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  employeesCount: number;
  manager?: {
    firstName: string;
    lastName: string;
  };
}

const TeamSelectorStep: React.FC<TeamSelectorStepProps> = ({
  wizardData,
  onUpdate,
  onValidationChange
}) => {
  const { isDarkMode } = useTheme();
  const darkClasses = useDarkModeClasses(isDarkMode);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calcul automatique de la semaine courante
  const getCurrentWeekNumber = (): number => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const days = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  // Initialiser la semaine et l'année par défaut
  useEffect(() => {
    if (!wizardData.weekNumber || !wizardData.year) {
      const currentWeek = getCurrentWeekNumber();
      const currentYear = new Date().getFullYear();
      onUpdate({
        weekNumber: currentWeek,
        year: currentYear
      });
    }
  }, []);

  // Charger les équipes disponibles
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('/teams');
        setTeams(response.data.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Erreur chargement équipes:', err);
        setError('Impossible de charger les équipes disponibles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Validation des données
  useEffect(() => {
    const isValid = !!(
      wizardData.teamId && 
      wizardData.weekNumber && 
      wizardData.weekNumber > 0 && 
      wizardData.weekNumber <= 53 &&
      wizardData.year && 
      wizardData.year >= new Date().getFullYear()
    );
    onValidationChange(isValid);
  }, [wizardData.teamId, wizardData.weekNumber, wizardData.year, onValidationChange]);

  const handleTeamSelect = (teamId: string) => {
    onUpdate({ teamId });
  };

  const handleWeekChange = (weekNumber: number) => {
    if (weekNumber >= 1 && weekNumber <= 53) {
      onUpdate({ weekNumber });
    }
  };

  const handleYearChange = (year: number) => {
    const currentYear = new Date().getFullYear();
    if (year >= currentYear && year <= currentYear + 2) {
      onUpdate({ year });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={darkClasses.textMuted}>Chargement des équipes...</p>
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
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4"
        >
          <Users className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className={`text-3xl font-bold ${darkClasses.title} mb-2`}>Sélection de l'équipe</h2>
        <p className={`${darkClasses.subtitle} max-w-2xl mx-auto`}>
          Choisissez l'équipe pour laquelle vous souhaitez générer le planning et définissez la période.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sélection de l'équipe */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`${darkClasses.card} rounded-xl shadow-lg p-6`}
        >
          <div className="flex items-center mb-4">
            <Building className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className={`text-xl font-semibold ${darkClasses.title}`}>Équipe</h3>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-8">
              <p className={`${darkClasses.subtitle} mb-4`}>Aucune équipe disponible</p>
              <p className={`text-sm ${darkClasses.textMuted}`}>Contactez votre administrateur pour créer des équipes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => (
                <motion.button
                  key={team._id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTeamSelect(team._id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    wizardData.teamId === team._id
                      ? darkClasses.selected
                      : darkClasses.unselected
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h4 className={`font-semibold ${darkClasses.title}`}>{team.name}</h4>
                      {team.description && (
                        <p className={`text-sm ${darkClasses.subtitle} mt-1`}>{team.description}</p>
                      )}
                      <div className={`flex items-center mt-2 text-xs ${darkClasses.textMuted}`}>
                        <Users className="h-3 w-3 mr-1" />
                        {team.employeesCount} employé{team.employeesCount > 1 ? 's' : ''}
                        {team.manager && (
                          <span className="ml-3">
                            Manager: {team.manager.firstName} {team.manager.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                    {wizardData.teamId === team._id && (
                      <CheckCircle className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sélection de la période */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className={`${darkClasses.card} rounded-xl shadow-lg p-6`}
        >
          <div className="flex items-center mb-4">
            <Calendar className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className={`text-xl font-semibold ${darkClasses.title}`}>Période</h3>
          </div>

          <div className="space-y-4">
            {/* Sélection de l'année */}
            <div>
              <label className={`block text-sm font-medium ${darkClasses.subtitle} mb-2`}>
                Année
              </label>
              <div className="relative">
                <select
                  value={wizardData.year || new Date().getFullYear()}
                  onChange={(e) => handleYearChange(parseInt(e.target.value))}
                  className={`w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${darkClasses.input}`}
                >
                  {[0, 1, 2].map(offset => {
                    const year = new Date().getFullYear() + offset;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Sélection de la semaine */}
            <div>
              <label className={`block text-sm font-medium ${darkClasses.subtitle} mb-2`}>
                Numéro de semaine
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="53"
                  value={wizardData.weekNumber || ''}
                  onChange={(e) => handleWeekChange(parseInt(e.target.value) || 0)}
                  className={`w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkClasses.input}`}
                  placeholder="Ex: 25"
                />
              </div>
              <p className={`text-xs ${darkClasses.textMuted} mt-1`}>
                Semaine actuelle: {getCurrentWeekNumber()}
              </p>
            </div>

            {/* Aperçu de la période */}
            {wizardData.weekNumber && wizardData.year && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${darkClasses.cardSecondary} rounded-lg p-4`}
              >
                <h4 className={`text-sm font-medium ${darkClasses.subtitle} mb-2`}>Aperçu de la période</h4>
                <p className={`text-sm ${darkClasses.title}`}>
                  Semaine {wizardData.weekNumber} de {wizardData.year}
                </p>
                <p className={`text-xs ${darkClasses.textMuted} mt-1`}>
                  Du {new Date(wizardData.year, 0, (wizardData.weekNumber - 1) * 7 + 1).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })} au {new Date(wizardData.year, 0, wizardData.weekNumber * 7).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Indicateur de validation */}
      {wizardData.teamId && wizardData.weekNumber && wizardData.year && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${darkClasses.success} rounded-xl p-4 text-center`}
        >
          <CheckCircle className={`h-6 w-6 mx-auto mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          <p className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>
            Équipe et période sélectionnées avec succès !
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TeamSelectorStep;