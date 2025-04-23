/**
 * Script de comparaison d'un mot de passe brut avec un hash bcrypt
 *
 * Usage :
 *    npx ts-node src/scripts/bcrypt-compare.ts
 */

import bcrypt from "bcrypt";

// Mot de passe brut à tester
const plainPassword = "Admin123!";

// Hash à comparer (copié depuis MongoDB)
const hashedPassword =
  "$2b$10$fR64Sx/Ac6yIEE3uAbnE0uCT2YPGG7gzkUSjhhnnlK3MTrPglBTqK";

(async () => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

    if (isMatch) {
      console.log("✅ Le mot de passe correspond !");
    } else {
      console.log("❌ Le mot de passe ne correspond pas.");
    }
  } catch (err) {
    console.error("Erreur lors de la comparaison:", err);
  }
})();
