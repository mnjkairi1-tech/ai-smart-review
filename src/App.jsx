import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CustomerApp from './pages/CustomerApp';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';

// Protected Route Component for Admin
function AdminRoute({ children }) {
  const { user, userRole, loading } = useAuth();
  if (loading) return <div className="dashboard-bg" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="loader"></div></div>;
  if (!user || userRole !== 'admin') return <Navigate to="/login" replace />;
  return children;
}

// Protected Route Component for Owner
function OwnerRoute({ children }) {
  const { user, userRole, loading } = useAuth();
  if (loading) return <div className="dashboard-bg" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="loader"></div></div>;
  if (!user || (userRole !== 'owner' && userRole !== 'admin')) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Customer Application - Handled by CustomerApp with ?shop=... query param */}
          <Route path="/" element={<CustomerApp />} />

          {/* Login Page */}
          <Route path="/login" element={<Login />} />

          {/* Super Admin Dashboard */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          {/* Shop Owner Dashboard */}
          <Route path="/owner" element={
            <OwnerRoute>
              <OwnerDashboard />
            </OwnerRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
