/**
 * Point d'entrée pour l'utilitaire de variables d'environnement
 *
 * Ce fichier détecte automatiquement l'environnement d'exécution (Jest ou Vite)
 * et utilise la fonction getEnvVar appropriée sans importer statiquement
 * des modules qui ne fonctionneraient pas dans certains environnements.
 */

// Interface pour typer les fonctions des modules chargés dynamiquement
interface EnvProvider {
  getEnvVar: (key: string, defaultValue?: string) => string;
}

// Détection de l'environnement Jest selon les critères spécifiés
const isJestEnvironment =
  typeof process !== "undefined" && !!process.env.JEST_WORKER_ID;

// Variable pour stocker la fonction de récupération des variables d'environnement
let envProvider: EnvProvider | null = null;

/**
 * Fonction d'accès aux variables d'environnement
 * C'est le point d'entrée unique pour récupérer les variables d'environnement
 *
 * @param key - Clé de la variable d'environnement à récupérer
 * @param defaultValue - Valeur par défaut si la variable n'est pas trouvée (défaut: "")
 * @returns La valeur de la variable d'environnement ou la valeur par défaut
 */
export const getEnvVar = (key: string, defaultValue = ""): string => {
  // Initialisation paresseuse du provider lors du premier appel
  if (!envProvider) {
    try {
      if (isJestEnvironment) {
        // Environnement Jest : charger dynamiquement le module Jest
        import("./getEnv.jest").then((jestModule) => {
          envProvider = {
            getEnvVar: jestModule.default || jestModule.getEnvVar,
          };
        });
      } else {
        // Environnement Vite : charger dynamiquement le module Vite
        import("./getEnv.vite").then((viteModule) => {
          envProvider = {
            getEnvVar: viteModule.default || viteModule.getEnvVar,
          };
        });
      }

      // Pendant le chargement du module, utiliser un provider temporaire
      envProvider = {
        getEnvVar: (_: string, dv = "") => dv,
      };
    } catch (error) {
      // En cas d'échec, afficher un avertissement et utiliser une fonction minimale
      console.warn(
        `Échec du chargement du module de variables d'environnement: ${error}. 
        Utilisation des valeurs par défaut.`
      );

      // Créer un provider minimal qui retourne toujours la valeur par défaut
      envProvider = {
        getEnvVar: (_: string, dv = "") => dv,
      };
    }
  }

  // Utiliser le provider pour récupérer la variable d'environnement
  return envProvider.getEnvVar(key, defaultValue);
};

// Export par défaut pour faciliter l'utilisation
export default getEnvVar;
