/**
 * Utilitaires pour les classes CSS du dark mode
 * Centralisation des classes communes pour cohérence
 */

export const darkModeClasses = {
  // Conteneurs principaux
  card: (isDark: boolean) => 
    `${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} transition-colors duration-300`,
  
  cardSecondary: (isDark: boolean) => 
    `${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} transition-colors duration-300`,

  // Textes
  title: (isDark: boolean) => 
    `${isDark ? 'text-white' : 'text-gray-900'} transition-colors duration-300`,
  
  subtitle: (isDark: boolean) => 
    `${isDark ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`,
  
  textMuted: (isDark: boolean) => 
    `${isDark ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`,

  // Boutons
  button: (isDark: boolean, variant: 'primary' | 'secondary' | 'ghost' = 'primary') => {
    switch (variant) {
      case 'secondary':
        return `${isDark ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-gray-200 border-gray-300 text-gray-700 hover:bg-gray-300'} transition-all duration-300`;
      case 'ghost':
        return `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-all duration-300`;
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300';
    }
  },

  // États de sélection
  selected: (isDark: boolean) => 
    `${isDark ? 'border-blue-400 bg-blue-900/30' : 'border-blue-500 bg-blue-50'} transition-all duration-300`,
  
  unselected: (isDark: boolean) => 
    `${isDark ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'} transition-all duration-300`,

  // États d'erreur
  error: (isDark: boolean) => 
    `${isDark ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-800'} transition-colors duration-300`,

  // États de succès
  success: (isDark: boolean) => 
    `${isDark ? 'bg-green-900/30 border-green-800 text-green-400' : 'bg-green-50 border-green-200 text-green-800'} transition-colors duration-300`,

  // États d'avertissement
  warning: (isDark: boolean) => 
    `${isDark ? 'bg-orange-900/30 border-orange-800 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-800'} transition-colors duration-300`,

  // Formulaires
  input: (isDark: boolean) => 
    `${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} transition-colors duration-300`,

  // Barres de progression
  progressBar: (isDark: boolean) => 
    `${isDark ? 'bg-gray-700' : 'bg-gray-200'} transition-colors duration-300`,
};

/**
 * Hook pour simplifier l'utilisation des classes dark mode
 */
export const useDarkModeClasses = (isDarkMode: boolean) => {
  return {
    card: darkModeClasses.card(isDarkMode),
    cardSecondary: darkModeClasses.cardSecondary(isDarkMode),
    title: darkModeClasses.title(isDarkMode),
    subtitle: darkModeClasses.subtitle(isDarkMode),
    textMuted: darkModeClasses.textMuted(isDarkMode),
    button: (variant?: 'primary' | 'secondary' | 'ghost') => darkModeClasses.button(isDarkMode, variant),
    selected: darkModeClasses.selected(isDarkMode),
    unselected: darkModeClasses.unselected(isDarkMode),
    error: darkModeClasses.error(isDarkMode),
    success: darkModeClasses.success(isDarkMode),
    warning: darkModeClasses.warning(isDarkMode),
    input: darkModeClasses.input(isDarkMode),
    progressBar: darkModeClasses.progressBar(isDarkMode)
  };
};