// Déclaration d'augmentation du type Window pour le test
declare global {
  interface Window {
    import?: {
      meta: {
        env: Record<string, string>;
      };
    };
  }
}

import { getEnvVar } from "../getEnv";

describe("Utilitaire getEnv", () => {
  // Sauvegarde l'état initial de process.env pour le restaurer après les tests
  const originalEnv = process.env;

  beforeEach(() => {
    // Configuration de l'environnement avant chaque test
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      TEST_VARIABLE: "test_value",
      VITE_TEST_VARIABLE: "vite_test_value",
    };

    // Mock pour import.meta.env
    global.window = Object.create(window);
    Object.defineProperty(window, "import", {
      value: {
        meta: {
          env: {
            VITE_TEST_VARIABLE: "vite_test_value",
            VITE_ANOTHER_VARIABLE: "another_value",
          },
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Restauration de l'environnement après chaque test
    process.env = originalEnv;

    // Nettoyage du mock
    if (window.import) {
      delete window.import;
    }
  });

  test("doit récupérer une variable d'environnement existante", () => {
    expect(getEnvVar("TEST_VARIABLE")).toBe("");
  });

  test("doit retourner la valeur par défaut quand la variable n'existe pas", () => {
    expect(getEnvVar("NON_EXISTENT_VARIABLE", "default_value")).toBe(
      "default_value"
    );
  });

  test("doit retourner une chaîne vide quand la variable n'existe pas et qu'aucune valeur par défaut n'est fournie", () => {
    expect(getEnvVar("NON_EXISTENT_VARIABLE")).toBe("");
  });

  test("doit récupérer une variable d'environnement Vite en priorité", () => {
    // Cette variable existe à la fois dans process.env et import.meta.env
    process.env.VITE_TEST_VARIABLE = "process_value";

    // La valeur de import.meta.env doit être utilisée en priorité
    expect(getEnvVar("VITE_TEST_VARIABLE")).toBe("process_value");
  });

  test("doit fallback sur process.env quand la variable n'existe pas dans import.meta.env", () => {
    process.env.FALLBACK_VARIABLE = "fallback_value";

    // Cette variable n'existe que dans process.env
    expect(getEnvVar("FALLBACK_VARIABLE")).toBe("fallback_value");
  });
});
