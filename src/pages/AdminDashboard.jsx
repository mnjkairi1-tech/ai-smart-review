import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, firebaseConfig } from '../firebase';
import {
  collection, getDocs, doc, setDoc, deleteDoc,
  query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword, getAuth
} from 'firebase/auth';
import { LogOut, Plus, Trash2, RefreshCw, Copy, ExternalLink, Users, BarChart2, Store, X, Shield } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [newShop, setNewShop] = useState({ shopName: '', ownerEmail: '', ownerPassword: '', googleReviewLink: '' });

  const BASE_URL = 'https://mnjkairi1-tech.github.io/ai-smart-review';

  const fetchShops = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'shops'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setShops(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShops(); }, []);

  const totalClicks = shops.reduce((sum, s) => sum + (s.clicks || 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      // Create secondary Firebase app to avoid signing out admin
      const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      const cred = await createUserWithEmailAndPassword(secondaryAuth, newShop.ownerEmail, newShop.ownerPassword);
      const ownerId = cred.user.uid;

      // Create shop document
      const shopRef = doc(collection(db, 'shops'));
      await setDoc(shopRef, {
        shopName: newShop.shopName,
        ownerEmail: newShop.ownerEmail,
        ownerId,
        googleReviewLink: newShop.googleReviewLink,
        clicks: 0,
        createdAt: serverTimestamp(),
      });

      // Create user doc with owner role
      await setDoc(doc(db, 'users', ownerId), {
        role: 'owner',
        shopId: shopRef.id,
        email: newShop.ownerEmail,
      });

      await deleteApp(secondaryApp);
      setNewShop({ shopName: '', ownerEmail: '', ownerPassword: '', googleReviewLink: '' });
      setShowCreateModal(false);
      fetchShops();
    } catch (err) {
      setCreateError(err.message || 'Failed to create shop owner.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (shop) => {
    if (!window.confirm(`Delete "${shop.shopName}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'shops', shop.id));
      await deleteDoc(doc(db, 'users', shop.ownerId));
      fetchShops();
    } catch (e) {
      alert('Error deleting shop: ' + e.message);
    }
  };

  const copyQrLink = (shopId) => {
    const link = `${BASE_URL}/#/?shop=${shopId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(shopId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="dashboard-bg">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-icon">⚡</span>
          <span>Smart QR</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-item active"><Shield size={18} /> Admin Overview</div>
          <div className="sidebar-nav-item" onClick={fetchShops}><RefreshCw size={18} /> Sync Data</div>
          <div className="sidebar-nav-item" onClick={() => window.open(BASE_URL, '_blank')}><ExternalLink size={18} /> View Site</div>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">A</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Super Admin</div>
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
            <h1 className="dashboard-title">Global Dashboard</h1>
            <p className="dashboard-subtitle">Control center for all registered shops and analytics</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Add New Shop
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
              <Store size={22} color="white" />
            </div>
            <div>
              <div className="stat-value">{shops.length}</div>
              <div className="stat-label">Total Shops</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
              <BarChart2 size={22} color="white" />
            </div>
            <div>
              <div className="stat-value">{totalClicks.toLocaleString()}</div>
              <div className="stat-label">Total Clicks Across All</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
              <Users size={22} color="white" />
            </div>
            <div>
              <div className="stat-value">{shops.length}</div>
              <div className="stat-label">Active Shop Owners</div>
            </div>
          </div>
        </div>

        {/* Shops Table */}
        <div className="table-card">
          <div className="table-card-header">
            <h2 className="table-card-title">All Registered Businesses</h2>
          </div>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}><div className="loader"></div></div>
          ) : shops.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏪</div>
              <h3>No shops found</h3>
              <p>Get started by adding your first business partner.</p>
              <button className="btn" onClick={() => setShowCreateModal(true)}><Plus size={16} /> Add First Shop</button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shop Name</th>
                    <th>Owner Email</th>
                    <th>Total Clicks</th>
                    <th>App Link</th>
                    <th>Reviews URL</th>
                    <th>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map(shop => (
                    <tr key={shop.id}>
                      <td><strong>{shop.shopName}</strong></td>
                      <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{shop.ownerEmail}</td>
                      <td>
                        <span className="badge badge-blue">{shop.clicks || 0} clicks</span>
                      </td>
                      <td>
                        <button className="btn-sm" onClick={() => copyQrLink(shop.id)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                          {copiedId === shop.id ? '✓ OK!' : <><Copy size={13} /> Copy QR Link</>}
                        </button>
                      </td>
                      <td>
                        {shop.googleReviewLink ? (
                          <a href={shop.googleReviewLink} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ExternalLink size={14} /> View Link
                          </a>
                        ) : <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Not configured</span>}
                      </td>
                      <td>
                        <button className="btn-sm btn-sm-danger" onClick={() => handleDelete(shop)}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create Shop Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Register New Business</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input className="form-input" placeholder="e.g. Starbucks Main St." value={newShop.shopName}
                  onChange={e => setNewShop(p => ({ ...p, shopName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Owner's Email (Login ID)</label>
                <input className="form-input" type="email" placeholder="owner@gmail.com" value={newShop.ownerEmail}
                  onChange={e => setNewShop(p => ({ ...p, ownerEmail: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input className="form-input" type="password" placeholder="At least 6 characters" value={newShop.ownerPassword}
                  onChange={e => setNewShop(p => ({ ...p, ownerPassword: e.target.value }))} required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Google Review URL</label>
                <input className="form-input" type="url" placeholder="https://g.page/r/..." value={newShop.googleReviewLink}
                  onChange={e => setNewShop(p => ({ ...p, googleReviewLink: e.target.value }))} required />
                <span className="form-hint">The direct review window link from Google Maps</span>
              </div>

              {createError && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{createError}</div>}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none' }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 2 }} disabled={creating}>
                  {creating ? 'Registering...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
