/**
 * Fonction utilitaire pour récupérer les variables d'environnement dans l'environnement Jest
 *
 * Cette version est spécifiquement conçue pour les tests Jest où process.env est accessible.
 * Elle vérifie d'abord si l'environnement est en mode test, puis récupère la variable
 * depuis process.env.
 *
 * @param key - Clé de la variable d'environnement
 * @param defaultValue - Valeur par défaut si la variable n'est pas trouvée
 * @returns Valeur de la variable d'environnement ou valeur par défaut
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  // Vérifier si nous sommes dans un environnement de test
  const isTestEnvironment =
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "test";

  if (isTestEnvironment) {
    // Dans l'environnement Jest, récupérer depuis process.env
    if (key in process.env) {
      return process.env[key] ?? defaultValue ?? "";
    }
  }

  // Si la variable n'est pas trouvée ou si ce n'est pas un environnement de test,
  // retourner la valeur par défaut ou une chaîne vide
  return defaultValue ?? "";
}

export default getEnvVar;
