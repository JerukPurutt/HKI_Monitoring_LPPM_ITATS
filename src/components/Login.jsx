import React, { useState } from 'react';
import { api } from '../services/api';
import itatsLogo from '../assets/ITATS-Logo.png';
import loginImg from '../assets/login_img.webp';

export default function Login({ onLoginSuccess, toggleTheme, isDark }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi');
      return;
    }

    setLoading(true);

    try {
      const response = await api.login(username, password);
      if (response.success) {
        onLoginSuccess(response.user, response.token);
      } else {
        setError(response.error || 'Username atau password salah.');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal terhubung ke server API. Periksa jaringan Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card-container">
        {/* Left Side: Form */}
        <div className="login-form-side">
          {/* Floating Dark Mode Toggle */}
          <button 
            type="button"
            className="btn btn-secondary btn-icon" 
            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10, width: '2.25rem', height: '2.25rem', padding: 0 }}
            onClick={toggleTheme}
            title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          >
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </button>

          <div className="login-form-wrapper">
            {/* Logo */}
            <div className="login-logo-container">
              <img src={itatsLogo} alt="Logo ITATS" className="login-logo-img" />
            </div>

            {/* Header */}
            <div className="login-header-group">
              <h1 className="login-title-text">Selamat Datang</h1>
              <p className="login-subtitle-text">
                Masuk untuk mengakses sistem Rekap & Pelacakan Dana HKI LPPM ITATS
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && (
                <div style={{
                  padding: '0.625rem',
                  backgroundColor: 'hsl(var(--destructive) / 0.08)',
                  border: '1px solid hsl(var(--destructive) / 0.3)',
                  color: 'hsl(var(--destructive))',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}

              {/* Username Input */}
              <div className="form-group">
                <label className="login-input-label" htmlFor="login-username">Username</label>
                <div className="login-input-group">
                  <div className="login-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    className="login-input-field"
                    placeholder="user"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label className="login-input-label" htmlFor="login-password">Password</label>
                <div className="login-input-group">
                  <div className="login-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="login-input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="login-input-suffix"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  marginTop: '1.5rem', 
                  height: '2.5rem', 
                  background: 'linear-gradient(135deg, #004bba 0%, #002d9c 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0, 75, 186, 0.25)',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
                    Memverifikasi...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                    Masuk Sekarang
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Image Card Overlay */}
        <div className="login-image-side">
          <img src={loginImg} alt="Hero Background" className="login-image-bg" />
          <div className="login-image-overlay" />

          {/* Text Content */}
          <div className="login-card-content">
            <h2 className="login-card-title">Arsip HKI LPPM</h2>
            <div className="login-card-line" />
            <p className="login-card-desc">
              Kelola dokumen pengajuan dana Hak Kekayaan Intelektual secara real-time dengan linimasa pelacakan alur yang sistematis dan transparan.
            </p>
          </div>

          {/* Bottom Badge Feature Grid */}
          <div className="login-badge-grid">
            <div className="login-badge-item">
              <div className="login-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <span className="login-badge-label">Rekap & Pelacakan<br />Terintegrasi</span>
            </div>

            <div className="login-badge-item">
              <div className="login-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <span className="login-badge-label">Aman &<br />Terpercaya</span>
            </div>

            <div className="login-badge-item">
              <div className="login-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <span className="login-badge-label">Transparan &<br />Akuntabel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
