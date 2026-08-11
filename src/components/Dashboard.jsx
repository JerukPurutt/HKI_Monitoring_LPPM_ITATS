import React, { useState, useMemo } from 'react';
import { checkWarningStatus } from '../services/api';

export default function Dashboard({ submissions, onSelectSubmission, onOpenNewForm, onDeleteSubmission, currentUser }) {
  const [search, setSearch] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [confirmDeleteSub, setConfirmDeleteSub] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Calculate stats
  const stats = useMemo(() => {
    let total = submissions.length;
    let completed = 0;
    let onProgress = 0;
    let critical = 0;

    submissions.forEach(sub => {
      // Check if all stages are done (meaning the last stage has a fileUrl)
      const isCompleted = !!sub.timeline[sub.timeline.length - 1]?.fileUrl;
      const isWarning = checkWarningStatus(sub);

      if (isCompleted) {
        completed++;
      } else {
        onProgress++;
      }

      if (isWarning) {
        critical++;
      }
    });

    return { total, completed, onProgress, critical };
  }, [submissions]);

  // 2. Dynamic list of study programs (Prodi) from data
  const prodis = useMemo(() => {
    const list = new Set();
    submissions.forEach(sub => {
      if (sub.prodi) list.add(sub.prodi);
    });
    return Array.from(list).sort();
  }, [submissions]);

  // 3. Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      // Search matches nomorSurat or pemohon
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        sub.nomorSurat.toLowerCase().includes(searchLower) ||
        sub.pemohon.toLowerCase().includes(searchLower);

      // Prodi filter
      const matchesProdi = !selectedProdi || sub.prodi === selectedProdi;

      // Status filter
      let matchesStatus = true;
      if (selectedStatus) {
        const isCompleted = !!sub.timeline[sub.timeline.length - 1]?.fileUrl;
        const isWarning = checkWarningStatus(sub);

        if (selectedStatus === 'selesai') {
          matchesStatus = isCompleted;
        } else if (selectedStatus === 'proses') {
          matchesStatus = !isCompleted && !isWarning;
        } else if (selectedStatus === 'warning') {
          matchesStatus = isWarning;
        }
      }

      return matchesSearch && matchesProdi && matchesStatus;
    });
  }, [submissions, search, selectedProdi, selectedStatus]);

  // Calculate completed stages for a single submission
  const getCompletedCount = (sub) => {
    return sub.timeline.filter(t => !!t.fileUrl).length;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stats Cards Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            <span>Total Pengajuan</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-desc">Semua usulan yang masuk</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Dalam Proses</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--ring))' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="stat-value">{stats.onProgress}</div>
          <div className="stat-desc">Proses verifikasi & pencairan</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Selesai</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--success))' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-desc">Sertifikat HKI terbit & lunas</div>
        </div>

        <div className={`stat-card ${stats.critical > 0 ? 'warning-card' : ''}`}>
          <div className="stat-label">
            <span>Kritis (Terlambat)</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: stats.critical > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))' }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div className="stat-value" style={{ color: stats.critical > 0 ? 'hsl(var(--destructive))' : 'inherit' }}>
            {stats.critical}
          </div>
          <div className="stat-desc">Melebihi batas 2 minggu upload bukti tf</div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="filter-section">
        <div className="filter-grid">
          <div className="form-group">
            <label htmlFor="search-input">Cari Pengajuan</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '0.75rem', color: 'hsl(var(--muted-foreground))', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                id="search-input"
                type="text"
                className="input-text"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Cari No. Surat atau Nama Pemohon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="prodi-filter">Program Studi</label>
            <select
              id="prodi-filter"
              className="select-input"
              value={selectedProdi}
              onChange={(e) => setSelectedProdi(e.target.value)}
            >
              <option value="">Semua Prodi</option>
              {prodis.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status-filter">Status Pelacakan</label>
            <select
              id="status-filter"
              className="select-input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="proses">Dalam Proses (Normal)</option>
              <option value="warning">Terlambat Bukti Tf (Kritis)</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Daftar Arsip Pengajuan ({filteredSubmissions.length})
          </h2>
          {currentUser?.role === 'user' && (
            <button className="btn btn-primary" onClick={onOpenNewForm}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tambah Pengajuan
            </button>
          )}
        </div>

        <div className="table-container">
          {filteredSubmissions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem', opacity: 0.6 }}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
              <p style={{ fontWeight: 500 }}>Tidak ada pengajuan ditemukan</p>
              <p style={{ fontSize: '0.75rem' }}>Coba ubah kata pencarian atau bersihkan filter.</p>
            </div>
          ) : (
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>No. Surat</th>
                  <th>Pemohon</th>
                  <th>Prodi</th>
                  <th>Tgl. Pengajuan</th>
                  <th style={{ width: '22%' }}>Kemajuan (Progress)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub) => {
                  const completedCount = getCompletedCount(sub);
                  const progressPct = (completedCount / sub.timeline.length) * 100;
                  const isCompleted = completedCount === sub.timeline.length;
                  const isWarning = checkWarningStatus(sub);

                  let statusBadge = <span className="badge badge-info">Dalam Proses</span>;
                  if (isCompleted) {
                    statusBadge = <span className="badge badge-success">Selesai</span>;
                  } else if (isWarning) {
                    statusBadge = <span className="badge badge-warning">Terlambat Tf LPPM</span>;
                  }

                  return (
                    <tr key={sub.id}>
                      <td>
                        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {sub.nomorSurat}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{sub.pemohon}</div>
                      </td>
                      <td>{sub.prodi}</td>
                      <td>{sub.tanggalPengajuan}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 500 }}>
                            <span>{completedCount}/{sub.timeline.length} Tahap</span>
                            <span>{Math.round(progressPct)}%</span>
                          </div>
                          <div style={{ height: '6px', width: '100%', backgroundColor: 'hsl(var(--secondary))', borderRadius: '3px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${progressPct}%`, 
                                backgroundColor: isCompleted ? 'hsl(var(--success))' : isWarning ? 'hsl(var(--warning))' : 'hsl(var(--primary))',
                                transition: 'width 0.4s ease'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>{statusBadge}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                          {(currentUser?.role === 'user' || currentUser?.role === 'admin') && (
                            <button 
                              className="btn btn-secondary btn-icon" 
                              style={{ color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive) / 0.2)' }}
                              onClick={() => setConfirmDeleteSub(sub)}
                              title="Hapus Pengajuan"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                          )}
                          <button 
                            className="btn btn-secondary btn-icon" 
                            onClick={() => onSelectSubmission(sub)}
                            title="Lacak Progress Detail"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteSub && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', padding: '1.75rem' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Hapus Pengajuan ini?</h3>
            <p style={{ fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus pengajuan atas nama <strong>{confirmDeleteSub.pemohon}</strong> ({confirmDeleteSub.nomorSurat})? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setConfirmDeleteSub(null)}
                disabled={isDeleting}
              >
                Batal
              </button>
              <button 
                className="btn" 
                style={{ backgroundColor: 'hsl(var(--destructive))', color: '#fff' }}
                onClick={async () => {
                  setIsDeleting(true);
                  await onDeleteSubmission(confirmDeleteSub.id);
                  setIsDeleting(false);
                  setConfirmDeleteSub(null);
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
