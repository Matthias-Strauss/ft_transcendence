import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import SocialApp from './SocialApp';
import RegistrationPage from './pages/RegistrationPage';
import { Navigate } from 'react-router-dom';

export default function App() {
  const isAuthenticated = localStorage.getItem('accessToken') !== null;
  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <ProtectedRoute>
              <SocialApp />
            </ProtectedRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />"
    </Routes>
  );
}
