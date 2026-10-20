import { Navigate, useLocation } from 'react-router';
import { useAuth } from './useAuth.js';

function RequireAuth({ children, role }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="p-8">Loading...</p>;
  }

  if (!isAuthenticated || !user) {
    const next = `${location.pathname}${location.search}${location.hash}`;

    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (role && user.role !== role) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Forbidden</h1>
        <p>You do not have permission to access this page.</p>
      </main>
    );
  }

  return children;
}

export default RequireAuth;
