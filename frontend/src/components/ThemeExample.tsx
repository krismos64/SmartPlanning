import React from "react";
import { useTheme } from "../context/ThemeContext";
import Button from "./Button";
import Card from "./Card";
import ThemeToggle from "./ThemeToggle";

const ThemeExample: React.FC = () => {
  const { mode } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Système de Design SmartPlanning
          </h1>
          <ThemeToggle />
        </div>

        <p className="text-[var(--text-secondary)] mb-8">
          Ce composant vous montre les différents éléments de notre système de
          design. Le thème actuel est{" "}
          <span className="font-semibold">
            {mode === "light" ? "clair" : "sombre"}
          </span>
          .
        </p>

        {/* Palette de couleurs */}
        <Card title="Palette de couleurs" className="mb-8" withAnimation="fade">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <div className="h-16 bg-[var(--background-primary)] rounded-lg border border-[var(--border)]"></div>
              <p className="mt-2 text-sm">Background Primary</p>
            </div>
            <div className="flex flex-col">
              <div className="h-16 bg-[var(--background-secondary)] rounded-lg"></div>
              <p className="mt-2 text-sm">Background Secondary</p>
            </div>
            <div className="flex flex-col">
              <div className="h-16 bg-[var(--background-tertiary)] rounded-lg"></div>
              <p className="mt-2 text-sm">Background Tertiary</p>
            </div>
            <div className="flex flex-col">
              <div className="h-16 bg-[var(--accent-primary)] rounded-lg"></div>
              <p className="mt-2 text-sm">Accent Primary</p>
            </div>
            <div className="flex flex-col">
              <div className="h-16 bg-[var(--text-primary)] rounded-lg"></div>
              <p className="mt-2 text-sm">Text Primary</p>
            </div>
            <div className="flex flex-col">
              <div className="h-16 bg-[var(--text-secondary)] rounded-lg"></div>
              <p className="mt-2 text-sm">Text Secondary</p>
            </div>
            <div className="flex flex-col">
              <div className="h-16 bg-[var(--success)] rounded-lg"></div>
              <p className="mt-2 text-sm">Success</p>
            </div>
            <div className="flex flex-col">
              <div className="h-16 bg-[var(--error)] rounded-lg"></div>
              <p className="mt-2 text-sm">Error</p>
            </div>
          </div>
        </Card>

        {/* Typographie */}
        <Card title="Typographie" className="mb-8" withAnimation="slide-up">
          <h1 className="text-4xl font-bold mb-4">Titre H1</h1>
          <h2 className="text-3xl font-semibold mb-3">Titre H2</h2>
          <h3 className="text-2xl font-semibold mb-3">Titre H3</h3>
          <h4 className="text-xl font-semibold mb-3">Titre H4</h4>
          <p className="text-base mb-2">
            Texte normal. Lorem ipsum dolor sit amet, consectetur adipiscing
            elit.
          </p>
          <p className="text-sm text-[var(--text-tertiary)] mb-3">
            Texte secondaire plus petit.
          </p>
          <a
            href="#"
            className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors duration-200"
          >
            Ceci est un lien
          </a>
        </Card>

        {/* Boutons */}
        <Card title="Boutons" className="mb-8" withAnimation="slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Variantes</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primaire</Button>
                <Button variant="secondary">Secondaire</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="text">Texte</Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3">Tailles</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">
                  Petit
                </Button>
                <Button variant="primary" size="md">
                  Moyen
                </Button>
                <Button variant="primary" size="lg">
                  Grand
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-3">États</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" isLoading>
                  Chargement
                </Button>
                <Button variant="primary" disabled>
                  Désactivé
                </Button>
                <Button variant="primary" withAnimation>
                  Avec animation
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3">Avec icônes</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                >
                  Ajouter
                </Button>
                <Button
                  variant="outline"
                  rightIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                >
                  Suivant
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Cartes et animations */}
        <Card
          title="Cartes et animations"
          className="mb-8"
          withAnimation="slide-up"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              title="Carte standard"
              className="bg-[var(--background-tertiary)]"
            >
              <p className="text-sm">
                Carte sans animation ni effet de survol.
              </p>
            </Card>

            <Card
              title="Avec survol"
              className="bg-[var(--background-tertiary)]"
              withHover
            >
              <p className="text-sm">Survolez cette carte pour voir l'effet.</p>
            </Card>

            <Card
              title="Avec animation"
              className="bg-[var(--background-tertiary)]"
              withAnimation="scale"
            >
              <p className="text-sm">Cette carte a une animation d'entrée.</p>
            </Card>
          </div>
        </Card>

        {/* Badges */}
        <Card title="Badges" className="mb-8" withAnimation="slide-up">
          <div className="flex flex-wrap gap-3">
            <span className="badge-primary">Badge primaire</span>
            <span className="badge-success">Succès</span>
            <span className="badge-warning">Avertissement</span>
            <span className="badge-error">Erreur</span>
          </div>
        </Card>

        {/* Formulaires */}
        <Card title="Éléments de formulaire" withAnimation="slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="example-input"
                  className="block text-sm font-medium mb-1"
                >
                  Champ de texte
                </label>
                <input
                  id="example-input"
                  type="text"
                  placeholder="Entrez votre texte"
                  className="input"
                />
              </div>

              <div>
                <label
                  htmlFor="example-select"
                  className="block text-sm font-medium mb-1"
                >
                  Menu déroulant
                </label>
                <select id="example-select" className="input">
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="example-textarea"
                  className="block text-sm font-medium mb-1"
                >
                  Zone de texte
                </label>
                <textarea
                  id="example-textarea"
                  placeholder="Entrez votre message"
                  rows={3}
                  className="input"
                ></textarea>
              </div>

              <div className="flex items-center">
                <input
                  id="example-checkbox"
                  type="checkbox"
                  className="w-4 h-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] rounded"
                />
                <label htmlFor="example-checkbox" className="ml-2 text-sm">
                  Case à cocher
                </label>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ThemeExample;
