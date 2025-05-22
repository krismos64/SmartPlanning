/**
 * Utilitaire pour la génération et gestion de mots de passe
 */

/**
 * Génère un mot de passe temporaire sécurisé pour les nouveaux utilisateurs
 * @returns {string} Mot de passe temporaire de 12 caractères minimum
 */
export const generateTemporaryPassword = (): string => {
  // Caractères pour générer un mot de passe fort
  const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclus I, O pour éviter les confusions
  const lowercaseChars = "abcdefghijkmnopqrstuvwxyz"; // Exclus l pour éviter les confusions
  const numberChars = "23456789"; // Exclus 0, 1 pour éviter les confusions
  const specialChars = "!@#$%^&*()_+{}[]|:;<>,.?";

  // Longueur du mot de passe (12 caractères minimum)
  const passwordLength = 12;

  let tempPassword = "";

  // Assurer au moins un caractère de chaque type
  tempPassword += uppercaseChars.charAt(
    Math.floor(Math.random() * uppercaseChars.length)
  );
  tempPassword += lowercaseChars.charAt(
    Math.floor(Math.random() * lowercaseChars.length)
  );
  tempPassword += numberChars.charAt(
    Math.floor(Math.random() * numberChars.length)
  );
  tempPassword += specialChars.charAt(
    Math.floor(Math.random() * specialChars.length)
  );

  // Compléter le reste du mot de passe
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

  for (let i = tempPassword.length; i < passwordLength; i++) {
    tempPassword += allChars.charAt(
      Math.floor(Math.random() * allChars.length)
    );
  }

  // Mélanger les caractères pour une sécurité accrue
  return tempPassword
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
};

/**
 * Vérifie si un mot de passe répond aux exigences de sécurité
 * @param {string} password - Le mot de passe à valider
 * @returns {boolean} - true si le mot de passe est valide, false sinon
 */
export const isSecurePassword = (password: string): boolean => {
  if (!password || password.length < 8) {
    return false;
  }

  // Vérification des critères de complexité
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasUppercase && hasLowercase && hasNumber;
};

/**
 * Utilitaire de validation de mot de passe RGPD
 *
 * Fonctions pour vérifier qu'un mot de passe respecte les exigences de sécurité RGPD
 */

/**
 * Vérifie la complexité d'un mot de passe selon les exigences RGPD
 * Le mot de passe doit contenir au moins :
 * - 8 caractères
 * - Une lettre majuscule
 * - Une lettre minuscule
 * - Un chiffre
 * - Un caractère spécial (@$!%*?&)
 *
 * @param password - Le mot de passe à valider
 * @returns boolean - True si le mot de passe est conforme
 */
export const validatePasswordComplexity = (password: string): boolean => {
  // Regex vérifiant la complexité du mot de passe
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

/**
 * Message d'erreur formaté pour les exigences de mot de passe
 */
export const passwordRequirementsMessage =
  "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&).";

export default {
  validatePasswordComplexity,
  passwordRequirementsMessage,
};
