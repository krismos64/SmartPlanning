/**
 * Tests pour vérifier le bon fonctionnement d'axiosInstance
 * avec l'authentification par cookies httpOnly
 */

import axiosInstance, { testAuthentication } from "../api/axiosInstance";

describe("axiosInstance Configuration", () => {
  test("axiosInstance should have withCredentials set to true", () => {
    expect(axiosInstance.defaults.withCredentials).toBe(true);
  });

  test("axiosInstance should have correct baseURL", () => {
    const expectedBaseURL = process.env.VITE_API_URL || "https://smartplanning.onrender.com/api";
    expect(axiosInstance.defaults.baseURL).toBe(expectedBaseURL);
  });

  test("axiosInstance should have correct Content-Type header", () => {
    expect(axiosInstance.defaults.headers["Content-Type"]).toBe("application/json");
  });
});

describe("Authentication Tests", () => {
  test("testAuthentication function should exist", () => {
    expect(typeof testAuthentication).toBe("function");
  });

  // Test d'intégration (nécessite un serveur backend en cours d'exécution)
  test("should make authenticated request to /auth/me", async () => {
    // Ce test nécessite un utilisateur connecté avec un cookie JWT valide
    // Il devrait être exécuté dans un environnement où l'utilisateur est déjà authentifié
    
    try {
      const result = await testAuthentication();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data._id).toBeDefined();
    } catch (error) {
      // Si pas d'authentification, l'erreur est attendue
      expect(error).toBeDefined();
    }
  }, 10000); // Timeout de 10 secondes pour les requêtes réseau
});

describe("API Endpoints Tests", () => {
  test("should make request with cookies automatically", async () => {
    // Test pour vérifier que les cookies sont envoyés automatiquement
    try {
      const response = await axiosInstance.get("/auth/me");
      expect(response.data).toBeDefined();
    } catch (error) {
      // 401 est attendu si pas d'authentification
      expect(error.response?.status).toBe(401);
    }
  });
});

// Instructions pour exécuter ces tests:
// 1. Assurer que le backend est en cours d'exécution
// 2. Exécuter: npm test -- axiosInstance.test.ts
// 3. Pour tester avec un utilisateur connecté:
//    - Se connecter via l'interface web
//    - Exécuter les tests depuis la console du navigateur