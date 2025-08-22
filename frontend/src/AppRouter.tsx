import React, { Suspense, useEffect, lazy } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";

// Import des composants de gestion des cookies RGPD
import { CookieConsentBanner } from "./components/cookies/CookieConsentBanner";
import { CookieManager } from "./components/cookies/CookieManager";

// Import du layout avec sidebar (garde en import direct car critique)
import LayoutWithSidebar from "./components/layout/LayoutWithSidebar";

// Lazy loading des pages pour code-splitting automatique
const IndexPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const CreatePasswordPage = lazy(() => import("./pages/CreatePasswordPage"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const CompleteProfilePage = lazy(() => import("./pages/CompleteProfilePage"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));

// Pages principales (chargées à la demande)
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const WeeklySchedulePage = lazy(() => import("./pages/WeeklySchedulePage"));
const VacationsPage = lazy(() => import("./pages/VacationsPage"));
const EmployeeTasksPage = lazy(() => import("./pages/EmployeeTasksPage"));
const IncidentTrackingPage = lazy(() => import("./pages/IncidentTrackingPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));

// Pages de gestion (management)
const UserManagementPage = lazy(() => import("./pages/UserManagementPage"));
const DirectorUserManagementPage = lazy(() => import("./pages/DirectorUserManagementPage"));
const CompanyManagementPage = lazy(() => import("./pages/CompanyManagementPage"));
const CollaboratorManagementPage = lazy(() => import("./pages/CollaboratorManagementPage"));
const ManagerPlanningValidationPage = lazy(() => import("./pages/ManagerPlanningValidationPage"));
const EmployeeSchedulePage = lazy(() => import("./pages/EmployeeSchedulePage"));

// Pages d'administration (lazy car moins utilisées)
const AdminPlanningPage = lazy(() => import("./pages/admin/AdminPlanningPage"));
const AdminTeamViewer = lazy(() => import("./pages/admin/AdminTeamViewer"));

// Pages légales et utilitaires
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfUsePage = lazy(() => import("./pages/TermsOfUsePage"));
const DatePickerDemoPage = lazy(() => import("./pages/DatePickerDemoPage"));
const MonitoringPage = lazy(() => import("./pages/MonitoringPage"));
const PlanningWizard = lazy(() => import("./pages/PlanningWizard"));

// Pages SEO Solutions (nouvelles)
const SolutionsPage = lazy(() => import("./pages/SolutionsPage"));
const LogicielPlanningRHPage = lazy(() => import("./pages/solutions/LogicielPlanningRHPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const TestimonialsPage = lazy(() => import("./pages/TestimonialsPage"));

// Page de choix d'abonnement et facturation
const ChoosePlanPage = lazy(() => import("./pages/ChoosePlanPage"));
const BillingDashboard = lazy(() => import("./components/billing/BillingDashboard"));


/**
 * Composant de vérification du profil pour la redirection conditionnelle
 */
const ProfileChecker: React.FC = () => {
  const { user, isAuthenticated, shouldCompleteProfile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ne pas rediriger pendant le chargement
    if (loading) return;

    // Ne pas rediriger si on est sur le planning-wizard pour éviter les problèmes de navigation
    if (location.pathname === "/planning-wizard") return;

    // Rediriger vers la page de complétion de profil si nécessaire
    if (
      isAuthenticated &&
      shouldCompleteProfile &&
      location.pathname !== "/complete-profile" &&
      !location.pathname.startsWith("/connexion") &&
      !location.pathname.startsWith("/inscription") &&
      !location.pathname.startsWith("/unauthorized") &&
      !location.pathname.startsWith("/forgot-password") &&
      !location.pathname.startsWith("/reset-password") &&
      !location.pathname.startsWith("/create-password") &&
      !location.pathname.startsWith("/choose-plan")
    ) {
      navigate("/complete-profile", { replace: true });
    }
  }, [
    isAuthenticated,
    shouldCompleteProfile,
    loading,
    navigate,
    location.pathname,
  ]);

  return null;
};

/**
 * Composant pour rediriger les directeurs de /employees vers /director/users
 */
const DirectorRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ne pas rediriger pendant le chargement
    if (loading) return;

    // Rediriger uniquement les directeurs qui accèdent à /employees
    if (user?.role === "directeur" && location.pathname === "/employees") {
      navigate("/director/users", { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  return null;
};

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
 * Composant de route protégée par rôle
 */
interface RoleProtectedRouteProps {
  element: React.ReactNode;
  allowedRoles: string[];
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  element,
  allowedRoles,
}) => {
  const { user } = useAuth();

  // Logs de debug
  console.log("RoleProtectedRoute - User:", user);
  console.log("RoleProtectedRoute - Allowed roles:", allowedRoles);
  console.log("RoleProtectedRoute - User role:", user?.role);

  if (!user) {
    console.log("RoleProtectedRoute - User is null, redirecting to login");
    return <Navigate to="/connexion" replace />;
  }

  if (allowedRoles.includes(user.role)) {
    console.log("RoleProtectedRoute - Access granted");
    return <>{element}</>;
  }

  console.log(
    "RoleProtectedRoute - Access denied, redirecting to unauthorized"
  );
  return <Navigate to="/unauthorized" replace />;
};

/**
 * Composant pour activer la navigation clavier globale
 */
const KeyboardNavigationProvider: React.FC = () => {
  useKeyboardNavigation();
  return null;
};

/**
 * Routeur principal de l'application SmartPlanning
 * Définit toutes les routes accessibles dans l'application avec des URLs en français
 */
const AppRouter: React.FC = () => {
  return (
    <BrowserRouter 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <KeyboardNavigationProvider />
      <ProfileChecker />
      <DirectorRedirect />
      <CookieManager />
      <CookieConsentBanner />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      }>
        <Routes>
        {/* Route par défaut - Page d'accueil */}
        <Route path="/" element={<IndexPage />} />

        {/* Routes d'authentification */}
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/create-password" element={<CreatePasswordPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/choose-plan" element={<ChoosePlanPage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* Route du tableau de bord pour utilisateurs connectés */}
        <Route path="/tableau-de-bord" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Route de facturation */}
        <Route 
          path="/dashboard/billing" 
          element={
            <LayoutWithSidebar activeItem="billing" pageTitle="Facturation">
              <BillingDashboard />
            </LayoutWithSidebar>
          } 
        />

        {/* Routes principales de l'application */}
        <Route
          path="/plannings-hebdomadaires"
          element={
            <RoleProtectedRoute
              element={<WeeklySchedulePage />}
              allowedRoles={["admin", "manager", "directeur", "employee"]}
            />
          }
        />

        {/* Route dédiée aux employés pour consulter leurs plannings */}
        <Route
          path="/mes-plannings"
          element={
            <RoleProtectedRoute
              element={<EmployeeSchedulePage />}
              allowedRoles={["employee"]}
            />
          }
        />

        <Route path="/gestion-des-conges" element={<VacationsPage />} />
        <Route path="/taches-employes" element={<EmployeeTasksPage />} />
        <Route path="/suivi-des-incidents" element={<IncidentTrackingPage />} />

        {/* Route pour les incidents avec protection par rôle */}
        <Route
          path="/incidents"
          element={
            <RoleProtectedRoute
              element={<IncidentTrackingPage />}
              allowedRoles={["admin", "manager", "directeur"]}
            />
          }
        />

        <Route
          path="/gestion-des-utilisateurs"
          element={<UserManagementPage />}
        />
        <Route
          path="/gestion-des-entreprises"
          element={<CompanyManagementPage />}
        />
        <Route
          path="/collaborateurs"
          element={<CollaboratorManagementPage />}
        />
        <Route
          path="/validation-plannings"
          element={
            <RoleProtectedRoute
              element={<ManagerPlanningValidationPage />}
              allowedRoles={["manager", "directeur", "admin"]}
            />
          }
        />
        <Route
          path="/statistiques"
          element={
            <RoleProtectedRoute
              element={<StatsPage />}
              allowedRoles={["admin", "manager", "directeur"]}
            />
          }
        />
        <Route path="/composants/datepicker" element={<DatePickerDemoPage />} />

        {/* Route pour le wizard de génération IA */}
        <Route
          path="/planning-wizard"
          element={
            <RoleProtectedRoute
              element={<PlanningWizard />}
              allowedRoles={["admin", "manager", "directeur"]}
            />
          }
        />

        {/* Route pour la gestion des utilisateurs par un directeur */}
        <Route
          path="/director/users"
          element={
            <RoleProtectedRoute
              element={
                <LayoutWithSidebar
                  activeItem="collaborateurs"
                  pageTitle="Gestion des collaborateurs"
                >
                  <DirectorUserManagementPage />
                </LayoutWithSidebar>
              }
              allowedRoles={["directeur"]}
            />
          }
        />

        {/* Route pour la gestion des utilisateurs par un admin */}
        <Route
          path="/admin/users"
          element={
            <RoleProtectedRoute
              element={<UserManagementPage />}
              allowedRoles={["admin"]}
            />
          }
        />

        {/* Route pour les employés (vue manager) - avec redirection pour les directeurs gérée par DirectorRedirect */}
        <Route
          path="/employees"
          element={
            <RoleProtectedRoute
              element={<CollaboratorManagementPage />}
              allowedRoles={["manager"]}
            />
          }
        />

        {/* Route pour le profil utilisateur */}
        <Route
          path="/mon-profil"
          element={
            <LayoutWithSidebar activeItem="profil" pageTitle="Mon Profil">
              <UserProfilePage />
            </LayoutWithSidebar>
          }
        />

        {/* Routes d'administration */}
        <Route
          path="/admin/entreprises/:id/equipes"
          element={<AdminTeamViewer />}
        />
        <Route
          path="/admin/plannings"
          element={
            <RoleProtectedRoute
              element={<AdminPlanningPage />}
              allowedRoles={["admin"]}
            />
          }
        />
        <Route
          path="/monitoring"
          element={
            <RoleProtectedRoute
              element={
                <LayoutWithSidebar
                  activeItem="monitoring"
                  pageTitle="Monitoring"
                >
                  <MonitoringPage />
                </LayoutWithSidebar>
              }
              allowedRoles={["admin"]}
            />
          }
        />

        {/* Pages Solutions SEO */}
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/solutions/logiciel-planning-rh" element={<LogicielPlanningRHPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/temoignages" element={<TestimonialsPage />} />

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
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
