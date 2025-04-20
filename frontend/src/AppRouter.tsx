import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import IndexPage from "./pages/LandingPage";

// Import des composants de pages
import CompanyOverviewPage from "./pages/CompanyOverviewPage";
import EmployeeTasksPage from "./pages/EmployeeTasksPage";
import IncidentTrackingPage from "./pages/IncidentTrackingPage";
import LoginPage from "./pages/LoginPage";
import PlanningValidationPage from "./pages/PlanningValidationPage";
import RegisterPage from "./pages/RegisterPage";
import TeamManagementPage from "./pages/TeamManagementPage";
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
 * Définit toutes les routes accessibles dans l'application
 */
const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route par défaut - Redirection vers la page de connexion */}
        <Route path="/" element={<IndexPage />} />

        {/* Routes d'authentification */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Routes principales de l'application */}
        <Route path="/weekly-schedule" element={<WeeklySchedulePage />} />
        <Route
          path="/planning-validation"
          element={<PlanningValidationPage />}
        />
        <Route path="/company-overview" element={<CompanyOverviewPage />} />
        <Route path="/incident-tracking" element={<IncidentTrackingPage />} />
        <Route path="/team-management" element={<TeamManagementPage />} />
        <Route path="/employee-tasks" element={<EmployeeTasksPage />} />
        <Route path="/vacations" element={<VacationsPage />} />

        {/* Route 404 pour toutes les autres URL */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
