import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import useAuthStore from '../utils/authStore';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const authStatus = useAuthStore((state) => state.status);

  if (authStatus === 'loading') {
    return <div className="p-8 text-[#8b98a5]">Checking session...</div>;
  }

  if (authStatus !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
