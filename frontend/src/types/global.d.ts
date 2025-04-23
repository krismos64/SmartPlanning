/**
 * Déclarations de types globales pour le projet
 */

interface ImportMetaEnv {
  VITE_API_URL: string;
  // Ajouter ici d'autres variables d'environnement Vite si nécessaire
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
