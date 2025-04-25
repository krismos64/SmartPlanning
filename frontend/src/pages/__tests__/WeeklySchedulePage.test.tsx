/**
 * Test d'intégration pour WeeklySchedulePage
 *
 * Ce test vérifie le processus complet de création d'un planning hebdomadaire,
 * depuis le chargement des données jusqu'à la soumission du formulaire.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import * as validateModule from "../../utils/validateWeeklySchedule";
import WeeklySchedulePage from "../WeeklySchedulePage";

process.env.VITE_API_URL = "http://localhost:5050/api";

// Mock des modules externes
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mocks pour les dépendances problématiques
jest.mock("react-helmet-async");
jest.mock("lottie-react");
jest.mock("styled-components");
jest.mock("framer-motion");
jest.mock("react-time-picker");

// Espionnage de la fonction validateWeeklySchedule
jest.spyOn(validateModule, "validateWeeklySchedule").mockImplementation(() => ({
  isValid: true,
  errors: [],
}));

// Données de test
const mockEmployees = {
  success: true,
  data: [
    { _id: "emp1", firstName: "John", lastName: "Doe" },
    { _id: "emp2", firstName: "Jane", lastName: "Smith" },
  ],
};

const mockWeeklySchedules = {
  success: true,
  data: [],
  count: 0,
};

const mockPostResponse = {
  success: true,
  message: "Planning créé avec succès",
  data: { _id: "schedule1" },
};

describe("WeeklySchedulePage", () => {
  beforeEach(() => {
    // Configuration des mocks d'axios pour simuler les réponses API
    mockedAxios.get.mockImplementation((url) => {
      if (url === "/api/employees") {
        return Promise.resolve({ data: mockEmployees });
      } else if (url.includes("/api/weekly-schedules/week/")) {
        return Promise.resolve({ data: mockWeeklySchedules });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    mockedAxios.post.mockResolvedValue({ data: mockPostResponse });

    // Réinitialiser les appels aux mocks
    jest.clearAllMocks();
  });

  test("permet la création complète d'un planning hebdomadaire", async () => {
    // ÉTAPE 1: Rendre le composant dans un MemoryRouter
    render(
      <MemoryRouter>
        <WeeklySchedulePage />
      </MemoryRouter>
    );

    // ÉTAPE 2: Attendre le chargement des employés dans le select
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/employees");
    });

    // Vérifier que le formulaire est chargé
    expect(screen.getByText("Créer un nouveau planning")).toBeInTheDocument();

    // ÉTAPE 3: Sélectionner un employé
    // D'abord, trouver et cliquer sur le select
    const employeeSelect = screen.getByText("Sélectionner un employé");
    fireEvent.click(employeeSelect);

    // Attendre que les options apparaissent et sélectionner le premier employé
    await waitFor(() => {
      const employeeOption = screen.getByText("John Doe");
      expect(employeeOption).toBeInTheDocument();
      fireEvent.click(employeeOption);
    });

    // ÉTAPE 4: Ajouter un créneau horaire pour lundi
    // Trouver le bouton "Ajouter un créneau" pour lundi
    const addSlotButtons = screen.getAllByText("Ajouter un créneau");
    // Cliquer sur le premier bouton (lundi)
    fireEvent.click(addSlotButtons[0]);

    // ÉTAPE 5: Renseigner les heures (début: 09:00, fin: 17:00)
    // Note: L'interaction avec TimePicker est complexe, nous simulons directement
    // le changement de valeur via onChange des composants internes

    // Trouver les champs de texte pour les heures et simuler le changement
    const timeInputs = screen.getAllByRole("textbox");

    // Cette partie peut varier selon l'implémentation exacte de votre TimePicker
    // Nous supposons que les 4 premiers inputs sont pour l'heure/minute du début/fin
    // Simuler la saisie d'heures et minutes
    await waitFor(() => {
      // Les TimePicker peuvent avoir une structure interne complexe
      // Souvent, il faut cibler les inputs individuels pour heures et minutes
      // Ceci est une approximation et peut nécessiter des ajustements
      const timePickerContainers = document.querySelectorAll(
        ".react-time-picker-wrapper"
      );

      // Vérifier que les TimePickers sont rendus
      expect(timePickerContainers.length).toBeGreaterThan(0);

      // Simuler un changement d'heure via les props du composant
      // Ceci est un hack car le vrai composant TimePicker n'est pas exposé complètement dans les tests
      const timeChangeEvent = new CustomEvent("change");
      Object.defineProperty(timeChangeEvent, "target", {
        value: { value: "09:00" },
      });
      timePickerContainers[0].dispatchEvent(timeChangeEvent);

      const timeChangeEvent2 = new CustomEvent("change");
      Object.defineProperty(timeChangeEvent2, "target", {
        value: { value: "17:00" },
      });
      timePickerContainers[1].dispatchEvent(timeChangeEvent2);
    });

    // ÉTAPE 6: Ajouter une note pour lundi
    const textareas = screen.getAllByRole("textbox");
    // Nous supposons que le premier textarea est pour les notes de lundi
    const noteTextarea = textareas.find(
      (el) =>
        el.getAttribute("placeholder")?.includes("Ex: Repos") ||
        el.getAttribute("id")?.includes("note-")
    );

    if (noteTextarea) {
      fireEvent.change(noteTextarea, { target: { value: "Repos" } });
    }

    // ÉTAPE 7: Cliquer sur le bouton "Créer le planning"
    const submitButton = screen.getByText("Créer le planning");
    fireEvent.click(submitButton);

    // VÉRIFICATIONS:

    // 1. Vérifier que validateWeeklySchedule a été appelée
    await waitFor(() => {
      expect(validateModule.validateWeeklySchedule).toHaveBeenCalled();
    });

    // 2. Vérifier que axios.post a été appelé avec les bonnes données
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/weekly-schedules",
        expect.objectContaining({
          employeeId: "emp1",
          year: expect.any(Number),
          weekNumber: expect.any(Number),
          scheduleData: expect.any(Object),
          status: "approved",
        })
      );
    });

    // 3. Vérifier que le toast de succès est affiché
    await waitFor(() => {
      expect(screen.getByText("Planning créé avec succès")).toBeInTheDocument();
    });
  });
});
