# Implémentation de l'authentification Google (OAuth2) dans SmartPlanning

Ce document explique comment mettre en place l'authentification Google OAuth dans l'application SmartPlanning, comprenant à la fois les parties frontend et backend.

## Table des matières

1. [Prérequis](#prérequis)
2. [Installation des dépendances](#installation-des-dépendances)
3. [Configuration du projet Google Cloud](#configuration-du-projet-google-cloud)
4. [Configuration du Backend](#configuration-du-backend)
5. [Configuration du Frontend](#configuration-du-frontend)
6. [Résolution des problèmes](#résolution-des-problèmes)

## Prérequis

- Un compte Google Developer
- Un projet Node.js avec Express
- Un projet React avec TypeScript
- MongoDB comme base de données

## Installation des dépendances

### Backend

```bash
npm install passport passport-google-oauth20 express-session jsonwebtoken dotenv
npm install -D @types/passport @types/passport-google-oauth20 @types/express-session @types/jsonwebtoken
```

### Frontend

```bash
npm install axios react-router-dom framer-motion
```

## Configuration du projet Google Cloud

1. Créez un nouveau projet sur [Google Cloud Console](https://console.cloud.google.com/)
2. Allez dans "APIs & Services" > "Credentials"
3. Configurez l'écran de consentement OAuth
4. Créez un nouvel ID client OAuth 2.0
5. Ajoutez les URIs de redirection autorisés :
   - `http://localhost:5000/api/auth/google/callback` (développement)
   - `https://votre-domaine.com/api/auth/google/callback` (production)
6. Copiez le Client ID et le Client Secret

## Configuration du Backend

### Variables d'environnement (.env)

Créez un fichier `.env` à la racine du projet backend avec les variables suivantes :

```
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
JWT_SECRET=votre_secret_jwt
MONGODB_URI=mongodb://localhost:27017/smartplanning
```

### Modifications du modèle User

Le modèle `User` doit être adapté pour stocker les informations Google :

1. Ajoutez l'interface `GoogleProfile` dans le modèle
2. Ajoutez le champ `google` au schéma utilisateur
3. Modifiez la validation du mot de passe pour qu'il soit optionnel pour les utilisateurs Google

### Configuration de Passport

Créez ou modifiez le fichier `backend/src/config/passport.ts` :

```typescript
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User, IUser } from "../models/User.model";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Vérification des variables d'environnement obligatoires
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("Erreur : Les identifiants Google OAuth sont manquants");
  process.exit(1);
}

// Configuration de la stratégie Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Recherche de l'utilisateur par son ID Google
        let user = await User.findOne({ "google.id": profile.id });

        // Si l'utilisateur n'existe pas
        if (!user) {
          // Vérifier si l'email existe déjà
          const email = profile.emails && profile.emails[0].value;
          if (email) {
            const existingUser = await User.findOne({ email });
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
          const newUser = {
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            email: email || `${profile.id}@googleauth.com`,
            role: "user",
            google: {
              id: profile.id,
              email: email || "",
              name: profile.displayName || "",
            },
            isEmailVerified: true,
          };

          user = await User.create(newUser);
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// Sérialisation et désérialisation de l'utilisateur
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Fonction pour générer un JWT
export const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};

export default passport;
```

### Routes d'authentification

Créez ou modifiez le fichier `backend/src/routes/auth.routes.ts` :

```typescript
import express, { Request, Response } from "express";
import passport from "../config/passport";
import { generateToken } from "../config/passport";

const router = express.Router();

// Route pour initier l'authentification Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Route de callback Google
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/login?error=google_auth_failed`,
  }),
  (req: Request, res: Response) => {
    try {
      const user = req.user;

      if (!user) {
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login?error=user_not_found`
        );
      }

      // Génération du token JWT
      const token = generateToken(user);

      // Redirection vers le frontend avec le token
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?token=${token}`
      );
    } catch (error) {
      console.error("Erreur lors du callback Google:", error);
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?error=server_error`
      );
    }
  }
);

// Routes existantes (login classique, etc.)
// ...

export default router;
```

### Intégration dans l'application Express

Modifiez votre fichier principal Express (`app.ts` ou `server.ts`) :

```typescript
import express from "express";
import cors from "cors";
import passport from "./config/passport";
import session from "express-session";
import authRoutes from "./routes/auth.routes";

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration de la session (nécessaire pour Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "smartplanning_secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Initialisation de Passport
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);

// Autres routes...

export default app;
```

## Configuration du Frontend

### Contexte d'authentification

Assurez-vous que votre `AuthContext.tsx` peut gérer à la fois l'authentification classique et OAuth :

```typescript
// AuthContext.tsx
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Création du contexte
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Configuration de l'en-tête Authorization
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Récupération des infos utilisateur
        const response = await axios.get("/api/auth/me");

        if (response.data.success) {
          setUser(response.data.data);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
        }
      } catch (error) {
        console.error("Erreur de vérification du token:", error);
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
      }

      setLoading(false);
    };

    verifyToken();
  }, [token]);

  // Fonction de connexion
  const login = (userData: User, userToken: string) => {
    localStorage.setItem("token", userToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;
    setToken(userToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

### Page de connexion

Créez ou modifiez votre composant `LoginPage.tsx` :

```tsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Contexte d'authentification
import { AuthContext } from "../context/AuthContext";

// Composant de page de connexion
const LoginPage: React.FC = () => {
  // États pour le formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hooks de navigation et d'authentification
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);

  // Récupération du token dans l'URL (pour OAuth)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      if (error === "google_auth_failed") {
        setError("L'authentification Google a échoué. Veuillez réessayer.");
      } else if (error === "user_not_found") {
        setError("Utilisateur non trouvé.");
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
      return;
    }

    if (token) {
      // Stocker le token dans localStorage
      localStorage.setItem("token", token);

      // Décoder le token pour obtenir les informations utilisateur
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );

        const { user } = JSON.parse(jsonPayload);

        // Mettre à jour le contexte d'authentification
        auth.login(user, token);

        // Rediriger selon le rôle
        if (user.role === "admin") {
          navigate("/tableau-de-bord/admin");
        } else if (user.role === "manager") {
          navigate("/tableau-de-bord/manager");
        } else {
          navigate("/tableau-de-bord");
        }
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error);
        setError("Erreur d'authentification. Veuillez réessayer.");
      }
    }
  }, [location, navigate, auth]);

  // Soumission du formulaire classique
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("/api/auth/login", { email, password });

      const { token, user } = response.data;

      // Stocker le token et mettre à jour le contexte
      auth.login(user, token);

      // Rediriger selon le rôle
      if (user.role === "admin") {
        navigate("/tableau-de-bord/admin");
      } else if (user.role === "manager") {
        navigate("/tableau-de-bord/manager");
      } else {
        navigate("/tableau-de-bord");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);

      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || "Identifiants incorrects");
      } else {
        setError("Erreur de connexion. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Connexion avec Google
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Redirection vers l'API Google OAuth
    window.location.href = `${
      process.env.REACT_APP_API_URL || "http://localhost:5000"
    }/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Composant de page de connexion */}
      <div className="max-w-md w-full space-y-8">
        {/* En-tête */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à votre compte
          </h2>
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de connexion */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Adresse email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Bouton de connexion classique */}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </div>
        </form>

        {/* Séparateur */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Ou continuer avec
              </span>
            </div>
          </div>
        </div>

        {/* Bouton Google */}
        <div>
          <button
            onClick={handleGoogleLogin}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={googleLoading}
          >
            {googleLoading ? (
              "Connexion via Google..."
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  {/* Logo Google */}
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continuer avec Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```

## Résolution des problèmes

### CORS

Si vous rencontrez des problèmes CORS, assurez-vous que :

1. Le middleware CORS est bien configuré dans votre backend
2. L'origine du frontend est correctement spécifiée
3. L'option `credentials: true` est activée

### Authentification

Si la connexion échoue :

1. Vérifiez les identifiants Google dans votre fichier `.env`
2. Assurez-vous que les URL de redirection sont correctement configurées dans la console Google
3. Vérifiez les logs serveur pour les erreurs spécifiques

### Intégration Frontend

Si le token est reçu mais l'authentification échoue :

1. Vérifiez que le contexte d'authentification est correctement configuré
2. Assurez-vous que le décodage du token est fait correctement
3. Vérifiez que les redirections sont basées sur le rôle de l'utilisateur

## Autres considérations

- **Sécurité** : Utilisez HTTPS en production
- **Gestion des sessions** : Ajoutez un mécanisme d'expiration et de rafraîchissement des tokens
- **Déconnexion** : Assurez-vous que la déconnexion supprime le token côté client

---

Pour toute question ou assistance supplémentaire, consultez la documentation officielle de [Passport.js](http://www.passportjs.org/packages/passport-google-oauth20/) et [Google OAuth2](https://developers.google.com/identity/protocols/oauth2).
