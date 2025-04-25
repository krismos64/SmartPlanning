# Utilitaires SmartPlanning

## getEnv

L'utilitaire `getEnv` est conçu pour récupérer les variables d'environnement de manière cohérente, quelle que soit l'environnement d'exécution (développement, production ou test).

### Architecture

Le système est composé de trois fichiers :

1. **getEnv.ts** : Fichier principal qui détecte automatiquement l'environnement et importe la version appropriée.
2. **getEnv.vite.ts** : Implémentation pour Vite, qui vérifie `import.meta.env` puis fait un fallback sur `process.env`.
3. **getEnv.jest.ts** : Implémentation pour Jest, qui vérifie si on est dans un environnement de test puis utilise `process.env`.

### Utilisation

```typescript
import { getEnvVar } from "./utils/getEnv";

// Récupérer une variable avec une valeur par défaut
const apiUrl = getEnvVar("VITE_API_URL", "http://localhost:5050/api");

// Récupérer une variable sans valeur par défaut (retourne '' si non trouvée)
const apiKey = getEnvVar("VITE_API_KEY");
```

### Variables d'environnement Vite

Pour que les variables d'environnement soient accessibles dans le navigateur, elles doivent être préfixées par `VITE_` dans vos fichiers `.env`.

Exemple de fichier `.env` :

```
VITE_API_URL=https://api.smartplanning.com
VITE_DEBUG_MODE=true
```

### Tests

L'utilitaire comprend des tests unitaires pour vérifier son fonctionnement dans différents environnements. Pour exécuter les tests :

```bash
npm run test -- --testPathPattern=getEnv
```

### Points importants

- Par défaut, l'utilitaire vérifie d'abord `import.meta.env` puis `process.env`.
- Dans un environnement de test (NODE_ENV=test), il utilise directement `process.env`.
- Si une variable n'est pas trouvée, la valeur par défaut est utilisée, ou une chaîne vide est retournée.
- Pour le SSR (Server-Side Rendering), la vérification de `process.env` est disponible comme fallback.

### Exemple d'utilisation dans le projet

L'utilitaire est actuellement utilisé dans plusieurs composants, notamment :

- `LayoutWithSidebar.tsx` pour récupérer l'URL de l'API
- `SidebarMenu.tsx` pour les requêtes API
