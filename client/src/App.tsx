import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ZoneDiscoveryPage from './pages/ZoneDiscoveryPage';
import CreatePostPage from './pages/CreatePostPage';
import ProfilePage from './pages/ProfilePage';
import PrivacyPage from './pages/PrivacyPage';
import NotFoundPage from './pages/NotFoundPage';
import CollaborationRoomPage from './pages/CollaborationRoomPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import ModerationPage from './pages/ModerationPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ZoneProvider } from './context/ZoneContext';
import { LoadingState } from './components/common/LoadingState';

// Protected route component that restores session and redirects if unauthenticated
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState
          message="Verifying DropZone session..."
          submessage="Restoring cryptographic credentials"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Full-width Public Layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Dashboard & Workspace Layout (with Sidebar Navigation) */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/zones" element={<ZoneDiscoveryPage />} />
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/collaborations/:id"
          element={
            <ProtectedRoute>
              <CollaborationRoomPage />
            </ProtectedRoute>
          }
        />
        <Route path="/organizer" element={<OrganizerDashboardPage />} />
        <Route
          path="/moderation"
          element={
            <ProtectedRoute>
              <ModerationPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ZoneProvider>
          <AppRoutes />
        </ZoneProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
