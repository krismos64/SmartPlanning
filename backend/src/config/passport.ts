import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { IUser, User } from "../models/User.model";

dotenv.config();

// Vérification des variables d'environnement obligatoires
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error(
    "Erreur : Les identifiants Google OAuth sont manquants dans les variables d'environnement"
  );
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error(
    "Erreur : La clé secrète JWT est manquante dans les variables d'environnement"
  );
  process.exit(1);
}

/**
 * Configuration de la stratégie d'authentification Google OAuth
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:5050/api/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Recherche de l'utilisateur par son ID Google
        let user = await User.findOne({ "google.id": profile.id });

        // Si l'utilisateur n'existe pas dans la base de données
        if (!user) {
          // Vérifier si l'e-mail existe déjà (pour éviter les doublons)
          const email = profile.emails && profile.emails[0].value;
          if (email) {
            const existingUser = await User.findOne({ email });

            // Si l'utilisateur existe déjà avec cet e-mail, lier son compte Google
            if (existingUser) {
              existingUser.google = {
                id: profile.id,
                email: email,
                name: profile.displayName,
              };
              await existingUser.save();
              return done(null, existingUser);
            }
          }

          // Création d'un nouvel utilisateur
          const newUser: Partial<IUser> = {
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            email: email || `${profile.id}@googleauth.com`,
            role: "employee", // Rôle par défaut
            google: {
              id: profile.id,
              email: email || "",
              name: profile.displayName || "",
            },
            password: "", // Pas de mot de passe pour l'authentification Google
            isEmailVerified: true, // L'e-mail est déjà vérifié par Google
          };

          user = await User.create(newUser);
        }

        return done(null, user);
      } catch (error) {
        console.error("Erreur d'authentification Google OAuth:", error);
        return done(error as Error, undefined);
      }
    }
  )
);

/**
 * Sérialisation de l'utilisateur pour la session
 */
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

/**
 * Désérialisation de l'utilisateur depuis la session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Génère un JWT token pour l'utilisateur
 */
export const generateToken = (user: any): string => {
  return jwt.sign(
    {
      user: {
        id: user._id,
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

export default passport;
