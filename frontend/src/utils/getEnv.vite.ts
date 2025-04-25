/**
 * Fonction utilitaire pour récupérer les variables d'environnement dans l'environnement Vite
 *
 * Cette version est destinée à être utilisée avec Vite en développement et en production.
 * Elle vérifie d'abord si la variable est disponible dans import.meta.env (Vite),
 * puis tente de la récupérer depuis process.env (uniquement pour SSR).
 *
 * Note: Les variables d'environnement Vite doivent commencer par VITE_ pour être exposées au client.
 *
 * @param key - Clé de la variable d'environnement
 * @param defaultValue - Valeur par défaut si la variable n'est pas trouvée
 * @returns Valeur de la variable d'environnement ou valeur par défaut
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  // Vérifier si la variable existe dans import.meta.env (Vite)
  if (import.meta.env && key in import.meta.env) {
    return import.meta.env[key] as string;
  }

  // Vérifier si process.env est disponible (SSR) et si la variable existe
  if (typeof process !== "undefined" && process.env && key in process.env) {
    return process.env[key] ?? defaultValue ?? "";
  }

  // Retourner la valeur par défaut ou une chaîne vide si rien n'est trouvé
  return defaultValue ?? "";
}

export default getEnvVar;
