import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import SocialApp from './SocialApp';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SocialApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
