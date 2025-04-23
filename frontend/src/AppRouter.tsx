import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import IndexPage from "./pages/LandingPage";

// Import des composants de pages
import CompanyManagementPage from "./pages/CompanyManagementPage";
import ContactPage from "./pages/ContactPage";
import DashboardPage from "./pages/DashboardPage";
import DatePickerDemoPage from "./pages/DatePickerDemoPage";
import EmployeeTasksPage from "./pages/EmployeeTasksPage";
import IncidentTrackingPage from "./pages/IncidentTrackingPage";
import LoginPage from "./pages/LoginPage";
import PlanningValidationPage from "./pages/PlanningValidationPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import RegisterPage from "./pages/RegisterPage";
import TeamManagementPage from "./pages/TeamManagementPage";
import TermsOfUsePage from "./pages/TermsOfUsePage";
import UserManagementPage from "./pages/UserManagementPage";
import VacationsPage from "./pages/VacationsPage";
import WeeklySchedulePage from "./pages/WeeklySchedulePage";

/**
 * Composant Page 404 simplifié pour les routes non trouvées
 */
const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">
          Page non trouvée
        </h2>
        <p className="text-gray-600 mb-6">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <a
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

/**
 * Routeur principal de l'application SmartPlanning
 * Définit toutes les routes accessibles dans l'application avec des URLs en français
 */
const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route par défaut - Page d'accueil */}
        <Route path="/" element={<IndexPage />} />

        {/* Routes d'authentification */}
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />

        {/* Route du tableau de bord pour utilisateurs connectés */}
        <Route path="/tableau-de-bord" element={<DashboardPage />} />

        {/* Routes principales de l'application */}
        <Route
          path="/plannings-hebdomadaires"
          element={<WeeklySchedulePage />}
        />
        <Route
          path="/validation-des-plannings"
          element={<PlanningValidationPage />}
        />
        <Route path="/gestion-des-equipes" element={<TeamManagementPage />} />
        <Route path="/gestion-des-conges" element={<VacationsPage />} />
        <Route path="/taches-employes" element={<EmployeeTasksPage />} />
        <Route path="/suivi-des-incidents" element={<IncidentTrackingPage />} />
        <Route
          path="/gestion-des-utilisateurs"
          element={<UserManagementPage />}
        />
        <Route
          path="/gestion-des-entreprises"
          element={<CompanyManagementPage />}
        />
        <Route path="/composants/datepicker" element={<DatePickerDemoPage />} />

        {/* Pages légales et utilitaires */}
        <Route path="/mentions-legales" element={<TermsOfUsePage />} />
        <Route
          path="/politique-de-confidentialite"
          element={<PrivacyPolicyPage />}
        />
        <Route path="/contact" element={<ContactPage />} />

        {/* Route 404 pour toutes les autres URL */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
