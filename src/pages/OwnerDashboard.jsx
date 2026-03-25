import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { LogOut, BarChart2, Store, Copy, ExternalLink, Save, CheckCircle2 } from 'lucide-react';

export default function OwnerDashboard() {
  const { user, logout, shopId } = useAuth();
  const navigate = useNavigate();
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const BASE_URL = 'https://mnjkairi1-tech.github.io/ai-smart-review';

  useEffect(() => {
    const fetchShopData = async () => {
      if (!shopId) {
        setLoading(false);
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, 'shops', shopId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setShopData(data);
          setNewLink(data.googleReviewLink || '');
        }
      } catch (e) {
        console.error("Error fetching shop data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopId]);

  const handleUpdateLink = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'shops', shopId), {
        googleReviewLink: newLink
      });
      setShopData(prev => ({ ...prev, googleReviewLink: newLink }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to update link: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const copyQrLink = () => {
    const link = `${BASE_URL}/?shop=${shopId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-bg" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="loader"></div>
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="dashboard-bg" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-panel text-center" style={{ maxWidth: 400 }}>
          <h2>Access Denied</h2>
          <p>No shop found for this account. Please contact the administrator.</p>
          <button className="btn w-full" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-bg">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-icon">⚡</span>
          <span>Smart QR</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-item active"><BarChart2 size={18} /> My Dashboard</div>
          <div className="sidebar-nav-item" onClick={() => window.open(`${BASE_URL}/?shop=${shopId}`, '_blank')}>
            <ExternalLink size={18} /> Preview App
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{shopData?.shopName?.[0] || 'O'}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{shopData?.shopName || 'Owner'}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{user?.email}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome, {shopData?.shopName}</h1>
            <p className="dashboard-subtitle">Track your performance and manage your QR links</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
              <BarChart2 size={24} color="white" />
            </div>
            <div>
              <div className="stat-value">{shopData?.clicks || 0}</div>
              <div className="stat-label">Total Clicks</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
              <Store size={24} color="white" />
            </div>
            <div>
              <div className="stat-value">Active</div>
              <div className="stat-label">Shop Status</div>
            </div>
          </div>
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={copyQrLink}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
              <Copy size={24} color="white" />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: '1rem' }}>{copied ? 'Copied!' : 'Copy Link'}</div>
              <div className="stat-label">Your Smart QR Link</div>
            </div>
          </div>
        </div>

        {/* Control Section */}
        <div className="table-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Store size={20} /> Shop Configuration
          </h2>

          <form onSubmit={handleUpdateLink} style={{ maxWidth: '600px' }}>
            <div className="form-group">
              <label className="form-label">Put your QR link (Google Review Link)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  required
                />
                <button type="submit" className="btn" disabled={updating || newLink === shopData?.googleReviewLink}>
                  {updating ? 'Saving...' : <><Save size={18} /> Update</>}
                </button>
              </div>
              <span className="form-hint">This is where customers will be redirected after copying their AI review.</span>
              {saveSuccess && (
                <div style={{ color: '#38a169', fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle2 size={14} /> Link updated successfully!
                </div>
              )}
            </div>

            <div className="glass-card" style={{ marginTop: '2.5rem', background: 'rgba(102, 126, 234, 0.05)', border: '1px dashed #667eea' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>How to get your review link?</h3>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                1. Go to Google Maps and search for your shop.<br/>
                2. Click on <strong>"Write a review"</strong>.<br/>
                3. Copy the URL from your browser's address bar.<br/>
                4. Paste it in the box above and click Update.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
