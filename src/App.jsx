import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UsersProvider } from './context/UsersContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Groups from './pages/Groups';
import Settings from './pages/Settings';
import Community from './pages/CommunityInbox';
import Posts from './pages/Posts';
import LoadingScreen from './components/LoadingScreen';


function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="users" element={<Users />} />
        <Route path="posts" element={<Posts />} />
        <Route path="feed" element={<Navigate to="/posts" replace />} />
        <Route path="groups" element={<Groups />} />
        <Route path="settings" element={<Settings />} />
        <Route path="community-inbox" element={<Community />} />
        <Route path="community" element={<Navigate to="/community-inbox" replace />} />
        <Route path="communities" element={<Navigate to="/community-inbox" replace />} />
        {/* Unknown sub-routes redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      {/* Top-level unknown routes */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  const [appLoading, setAppLoading] = useState(true);

  return (
    <ThemeProvider>
      <AuthProvider>
        <UsersProvider>
          {appLoading && (
            <LoadingScreen
              durationMs={4200}
              onComplete={() => setAppLoading(false)}
            />
          )}
          <div
            className={`min-h-screen bg-bg transition-opacity duration-700 ${
              appLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </div>
        </UsersProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}