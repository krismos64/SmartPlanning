import jwt from "jsonwebtoken";

/**
 * Génère un token JWT pour l'authentification
 * @param user Objet utilisateur contenant id et role
 * @returns Token JWT signé
 */
export const generateToken = (user: { id: string; role: string }) => {
  return jwt.sign(
    { user: { id: user.id, role: user.role } },
    process.env.JWT_SECRET!,
    {
      expiresIn: "24h",
    }
  );
};
