import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="loader"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={role === 'admin' ? '/admin' : '/owner'} replace />;
  }

  if (role && userRole !== role) {
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'owner') return <Navigate to="/owner/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
