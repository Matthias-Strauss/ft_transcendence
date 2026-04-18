import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import SocialApp from './SocialApp';
import RegistrationPage from './pages/RegistrationPage';
import UserProfile from './pages/UserProfile';
import PongGame from './pages/PongGame';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { connectSocket, disconnectSocket, setBeforeSocketConnectHook, socket } from './socket';
import { Toast } from './components/ui/Toast';
import {
  clearClientSession,
  ensureAuthenticatedSession,
  refreshSession,
  restoreSession,
} from './utils/api';
import useAuthStore from './utils/authStore';

const SESSION_REFRESH_INTERVAL_MS = 1 * 60 * 1000; // 1 minute

export default function App() {
  const authStatus = useAuthStore((state) => state.status);

  useEffect(() => {
    const onConnectError = (err: Error) => {
      if (err.message !== 'Unauthorized' && err.message !== 'No token provided') {
        return;
      }

      void refreshSession({ force: true }).then((refreshed) => {
        if (refreshed) {
          void connectSocket({ forceReconnect: true });
          return;
        }

        clearClientSession();
      });
    };

    socket.on('connect_error', onConnectError);
    setBeforeSocketConnectHook(() => ensureAuthenticatedSession({ logoutOnFailure: true }));
    void restoreSession();

    return () => {
      socket.off('connect_error', onConnectError);
      setBeforeSocketConnectHook(null);
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void connectSocket();

      const refreshTimer = window.setInterval(() => {
        void refreshSession({ force: true, logoutOnFailure: true });
      }, SESSION_REFRESH_INTERVAL_MS);

      const refreshVisibleSession = () => {
        if (document.visibilityState === 'visible') {
          void refreshSession({ force: true, logoutOnFailure: true });
        }
      };

      const refreshOnFocus = () => {
        void refreshSession({ force: true, logoutOnFailure: true });
      };

      document.addEventListener('visibilitychange', refreshVisibleSession);
      window.addEventListener('focus', refreshOnFocus);
      window.addEventListener('online', refreshOnFocus);

      return () => {
        window.clearInterval(refreshTimer);
        document.removeEventListener('visibilitychange', refreshVisibleSession);
        window.removeEventListener('focus', refreshOnFocus);
        window.removeEventListener('online', refreshOnFocus);
      };
    }

    if (authStatus === 'anonymous') {
      disconnectSocket();
    }
  }, [authStatus]);

  return (
    <>
      <Toast />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
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
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
