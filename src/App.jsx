import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SubmissionDetail from './components/SubmissionDetail';
import SubmissionForm from './components/SubmissionForm';
import Login from './components/Login';
import { api, getScriptUrl, saveScriptUrl, isMockMode } from './services/api';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('hki_tracker_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [scriptUrl, setScriptUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('hki_tracker_theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 1. Initialize theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hki_tracker_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hki_tracker_theme', 'light');
    }
  }, [isDark]);

  // 2. Load settings and fetch data (only if logged in)
  useEffect(() => {
    const url = getScriptUrl();
    setScriptUrl(url);
    if (currentUser) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // 3. Fetch submissions
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAllSubmissions();
      const sorted = [...data].sort((a, b) => new Date(b.tanggalPengajuan) - new Date(a.tanggalPengajuan));
      setSubmissions(sorted);
      
      if (selectedSubmission) {
        const updated = sorted.find(s => s.id === selectedSubmission.id);
        if (updated) {
          setSelectedSubmission(updated);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data pengajuan HKI dari server.');
      showToast('Gagal memuat data dari server', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 4. Toast notification helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // 5. Toggle theme
  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // 6. Save Google Script Web App URL settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveScriptUrl(scriptUrl);
    setShowSettings(false);
    showToast(scriptUrl ? 'Koneksi Google Apps Script berhasil disimpan!' : 'Menggunakan mode simulasi lokal offline.', 'success');
    if (currentUser) {
      fetchData();
    }
  };

  // 7. Handle Login Success
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('hki_tracker_user', JSON.stringify(user));
    showToast(`Selamat datang kembali, ${user.username}!`, 'success');
  };

  // 8. Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hki_tracker_user');
    setSelectedSubmission(null);
    showToast('Anda telah keluar dari sistem.', 'success');
  };

  // 9. Handle creation success
  const handleCreateSuccess = (newSub) => {
    setShowNewForm(false);
    fetchData();
    setSelectedSubmission(newSub);
  };

  // 10. Refresh submission details after upload
  const handleRefreshSubmission = (updatedSub) => {
    setSubmissions(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));
    setSelectedSubmission(updatedSub);
  };

  // 11. Delete submission
  const handleDeleteSubmission = async (id) => {
    try {
      await api.deleteSubmission(id);
      setSubmissions(prev => prev.filter(s => s.id !== id));
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(null);
      }
      showToast('Pengajuan berhasil dihapus', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus pengajuan', 'error');
    }
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} toggleTheme={toggleTheme} isDark={isDark} />;
  }

  return (
    <div className="app-container">
      {/* Header section */}
      <header className="app-header">
        <div className="header-title">
          <h1>Arsip & Rekap Pengajuan Dana HKI</h1>
          <p>Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)</p>
        </div>

        <div className="header-actions">
          {/* User Role Badge */}
          <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '0.7rem', padding: '0.25rem 0.625rem' }}>
            Peran: {currentUser.role}
          </span>

          {/* Dark Mode Toggle */}
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={toggleTheme}
            title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </button>

          {/* Logout Button */}
          <button className="btn btn-secondary" onClick={handleLogout} title="Keluar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Keluar
          </button>
        </div>
      </header>

      {/* Main content body */}
      <main style={{ flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: 'hsl(var(--muted-foreground))' }}>
            <svg className="animate-spin" width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Track (background circle) */}
              <circle cx="18" cy="18" r="14" stroke="hsl(var(--border))" strokeWidth="3.5" fill="none"/>
              {/* Arc (spinning part) */}
              <circle
                cx="18" cy="18" r="14"
                stroke="hsl(var(--primary))"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="22 66"
                strokeDashoffset="0"
              />
            </svg>
            <p style={{ fontWeight: 500 }}>Memuat Data Pengajuan...</p>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'hsl(var(--destructive))' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>Terjadi Kesalahan</p>
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', marginTop: '0.25rem' }}>{error}</p>
            </div>
            <button className="btn btn-secondary" onClick={fetchData}>
              Coba Lagi
            </button>
          </div>
        ) : selectedSubmission ? (
          <SubmissionDetail 
            submission={selectedSubmission} 
            onBack={() => setSelectedSubmission(null)}
            onRefreshSubmission={handleRefreshSubmission}
            onDeleteSubmission={handleDeleteSubmission}
            showToast={showToast}
            currentUser={currentUser}
          />
        ) : (
          <Dashboard 
            submissions={submissions} 
            onSelectSubmission={setSelectedSubmission}
            onOpenNewForm={() => setShowNewForm(true)}
            onDeleteSubmission={handleDeleteSubmission}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Footer copyright */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid hsl(var(--border))', paddingTop: '1.25rem', textAlign: 'center', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
        <p>&copy; {new Date().getFullYear()} LPPM - HKI Funding Record. Didesain dengan estetika modern minimalis.</p>
      </footer>

      {/* Modal: Add New Submission */}
      {showNewForm && (
        <SubmissionForm 
          onClose={() => setShowNewForm(false)} 
          onCreateSuccess={handleCreateSuccess}
          showToast={showToast}
        />
      )}

      {/* Settings Modal removed as SCRIPT_URL is hardcoded in api.js */}

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {toast.type === 'success' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'hsl(var(--success))' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'hsl(var(--destructive))' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
