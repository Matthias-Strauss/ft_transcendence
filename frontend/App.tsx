import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import SocialApp from './SocialApp';
import RegistrationPage from './pages/RegistrationPage';
import UserProfile from './pages/UserProfile';
import PongGame from './pages/PongGame';
import { connectSocketFromStorage, disconnectSocket, socket } from './socket';
import { Toast } from './components/ui/Toast';

export default function App() {
  useEffect(() => {
    const onConnectError = (err: Error) => {
      if (err.message === 'Unauthorized' || err.message === 'No token provided') {
        localStorage.removeItem('accessToken');
        disconnectSocket();
      }
    };

    socket.on('connect_error', onConnectError);
    connectSocketFromStorage();

    return () => {
      socket.off('connect_error', onConnectError);
      disconnectSocket();
    };
  }, []);

  return (
      <>
      <Toast />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route
        path="/game"
        element={
          <ProtectedRoute>
            <PongGame />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SocialApp />
          </ProtectedRoute>
        }
      >
        <Route path="game" element={<PongGame />} />
        <Route path="users/:username" element={<UserProfile />} />
      </Route>
    </Routes>
    </>
  );
}
