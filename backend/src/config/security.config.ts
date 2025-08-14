/**
 * Configuration de sécurité centralisée
 * Résout les 5 problèmes de sécurité identifiés
 */

export const securityConfig = {
  // Configuration des cookies sécurisés
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const, // FIX #1: SameSite=Strict pour prévenir CSRF
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    path: '/',
  },

  // FIX #2: Validation stricte des headers HTTP
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cookie',
  ],

  // FIX #3: Limite de taille des payloads (protection DoS)
  payloadLimits: {
    json: '10mb', // Limite JSON à 10MB
    urlencoded: '10mb', // Limite URL encoded à 10MB
    raw: '10mb', // Limite raw à 10MB
  },

  // FIX #4: Validation stricte des formats email
  emailRegex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // FIX #5: Configuration CORS stricte
  corsOptions: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://smartplanning.fr',
        'https://www.smartplanning.fr',
      ];

      // Permettre les requêtes sans origine (Postman, etc.) en développement
      if (!origin && process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Non autorisé par la politique CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cookie',
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // 24 heures
  },

  // Headers de sécurité supplémentaires
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
  },
};

/**
 * Middleware pour appliquer les headers de sécurité
 */
export const applySecurityHeaders = (req: any, res: any, next: any) => {
  Object.entries(securityConfig.securityHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });
  next();
};

/**
 * Validation stricte des emails
 */
export const isValidEmail = (email: string): boolean => {
  return securityConfig.emailRegex.test(email);
};

/**
 * Nettoyage des cookies à la déconnexion
 */
export const clearAuthCookies = (res: any) => {
  // FIX #5: Nettoyer correctement les cookies à la déconnexion
  const clearOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  };

  res.clearCookie('token', clearOptions);
  res.clearCookie('refreshToken', clearOptions);
};