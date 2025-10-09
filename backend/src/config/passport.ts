import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error(
    "Erreur : La clé secrète JWT est manquante dans les variables d'environnement"
  );
  process.exit(1);
}

/**
 * Génère un JWT token pour l'utilisateur
 */
export const generateToken = (user: any): string => {
  return jwt.sign(
    {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        teamIds: user.teamIds || [],
        companyId: user.companyId,
      },
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};

