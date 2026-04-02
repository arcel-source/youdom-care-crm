import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BeneficiairesPage from './pages/BeneficiairesPage';
import BeneficiaireDetailPage from './pages/BeneficiaireDetailPage';
import FamillesPage from './pages/FamillesPage';
import IntervenantsPage from './pages/IntervenantsPage';
import LeadsPage from './pages/LeadsPage';
import PlanningPage from './pages/PlanningPage';
import DevisPage from './pages/DevisPage';
import FacturesPage from './pages/FacturesPage';
import QualitePage from './pages/QualitePage';
import NotificationsPage from './pages/NotificationsPage';
import PrescripteursPage from './pages/PrescripteursPage';
import ServicesPage from './pages/ServicesPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function GoogleCallbackPage() {
  const { handleGoogleCallback } = useAuth();
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      handleGoogleCallback(code).then((result) => {
        if (!result.success) setError(result.error);
      });
    } else {
      setError('Code Google manquant');
    }
  }, [handleGoogleCallback]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/login" className="text-indigo-600 hover:underline">Retour à la connexion</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" />
      <p className="ml-3 text-gray-600">Connexion en cours...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="beneficiaires" element={<BeneficiairesPage />} />
          <Route path="beneficiaires/:id" element={<BeneficiaireDetailPage />} />
          <Route path="familles" element={<FamillesPage />} />
          <Route path="intervenants" element={<IntervenantsPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route path="devis" element={<DevisPage />} />
          <Route path="factures" element={<FacturesPage />} />
          <Route path="qualite" element={<QualitePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="prescripteurs" element={<PrescripteursPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
