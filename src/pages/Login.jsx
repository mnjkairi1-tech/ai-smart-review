import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Eye, EyeOff, LogIn, Store, Shield } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await login(email, password);
      // Check user role
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (!userDoc.exists()) {
        setError('User record not found. Please contact support.');
        return;
      }

      const data = userDoc.data();
      if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.role === 'owner') {
        navigate('/owner');
      } else {
        setError('Insufficient permissions.');
      }
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card fade-in">
        <div className="auth-logo">🔐</div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Log in to manage your smart QR experience</p>

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '3rem' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{error}</div>}

          <button type="submit" className="btn w-full" disabled={loading}>
            <LogIn size={18} /> {loading ? 'Logging In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '0.75rem', marginBottom: 0, fontSize: '0.75rem', textAlign: 'center' }}>
            <Shield size={16} style={{ marginBottom: '0.25rem', color: '#667eea' }} />
            <div>Admin Access</div>
          </div>
          <div className="glass-card" style={{ padding: '0.75rem', marginBottom: 0, fontSize: '0.75rem', textAlign: 'center' }}>
            <Store size={16} style={{ marginBottom: '0.25rem', color: '#667eea' }} />
            <div>Shop Owner</div>
          </div>
        </div>
      </div>
    </div>
  );
}
