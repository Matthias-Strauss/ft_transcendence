import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import SocialApp from './SocialApp';
import RegistrationPage from './pages/RegistrationPage';
import SocketTestPage from './pages/temp_SocketTestPage';
import { connectSocketFromStorage, disconnectSocket, socket } from './socket';

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
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SocialApp />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route
        path="/socket-test"
        element={
          <ProtectedRoute>
            <SocketTestPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
