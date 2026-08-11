import React, { useState, useMemo } from 'react';
import { checkWarningStatus, api } from '../services/api';

export default function SubmissionDetail({ submission, onBack, onRefreshSubmission, onDeleteSubmission, showToast, currentUser }) {
  const [selectedFile, setSelectedFile] = useState({ stageIndex: null, file: null });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [activeDragIndex, setActiveDragIndex] = useState(null);
  const [editingStageIndex, setEditingStageIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (!uploading) setActiveDragIndex(index);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setActiveDragIndex(null);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    setActiveDragIndex(null);
    if (uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal adalah 10MB');
        setSelectedFile({ stageIndex: null, file: null });
        return;
      }
      setSelectedFile({ stageIndex: index, file: selected });
      setError('');
    }
  };

  // 1. Calculate active stage index
  // The active stage is the first stage in the timeline (0 to 7) that doesn't have a fileUrl
  const activeStageIndex = useMemo(() => {
    for (let i = 0; i < submission.timeline.length; i++) {
      if (!submission.timeline[i].fileUrl) {
        return i;
      }
    }
    return -1; // All completed
  }, [submission]);

  // 2. Check if the warning condition is met
  const isWarning = useMemo(() => {
    return checkWarningStatus(submission);
  }, [submission]);

  // 3. Calculate how many days overdue or since submission
  const daysDiff = useMemo(() => {
    const initDate = new Date(submission.tanggalPengajuan);
    const today = new Date();
    const diffTime = Math.abs(today - initDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [submission.tanggalPengajuan]);

  // 4. File input change handler
  const handleFileChange = (e, index) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Ukuran file maksimal adalah 10MB');
        setSelectedFile({ stageIndex: null, file: null });
        return;
      }
      setSelectedFile({ stageIndex: index, file: selected });
      setError('');
    }
  };

  // 5. Upload document submit handler
  const handleUploadSubmit = async (e, targetStageIndex = activeStageIndex) => {
    e.preventDefault();
    const fileToUpload = selectedFile.stageIndex === targetStageIndex ? selectedFile.file : null;
    if (!fileToUpload || targetStageIndex === -1) return;

    setUploading(true);
    setError('');

    try {
      const updatedSub = await api.uploadStageDocument(submission.id, targetStageIndex, fileToUpload);
      onRefreshSubmission(updatedSub);
      setSelectedFile({ stageIndex: null, file: null });
      setEditingStageIndex(null); // Reset edit state
      showToast(`Berhasil memperbarui dokumen ${submission.timeline[targetStageIndex].nama}!`, 'success');
    } catch (err) {
      console.error(err);
      setError('Gagal mengunggah dokumen. Silakan coba lagi.');
      showToast('Gagal mengunggah dokumen', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Kembali ke Dashboard
        </button>

        {(currentUser?.role === 'user' || currentUser?.role === 'admin') && (
          <button 
            className="btn" 
            style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}
            onClick={() => setShowDeleteModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Hapus Pengajuan ini
          </button>
        )}
      </div>

      <div className="detail-container">
        <div className="detail-sidebar">
          <h2 className="detail-title">Detail Pengajuan</h2>
          
          <div className="metadata-list">
            <div className="metadata-item">
              <span className="metadata-label">Nomor Surat</span>
              <span className="metadata-value" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{submission.nomorSurat}</span>
            </div>
            
            <div className="metadata-item">
              <span className="metadata-label">Program Studi (Prodi)</span>
              <span className="metadata-value">{submission.prodi}</span>
            </div>
            
            <div className="metadata-item">
              <span className="metadata-label">Nama Pemohon</span>
              <span className="metadata-value" style={{ fontWeight: 600 }}>{submission.pemohon}</span>
            </div>
            
            <div className="metadata-item">
              <span className="metadata-label">Tanggal Pengajuan</span>
              <span className="metadata-value">{submission.tanggalPengajuan}</span>
            </div>

            <div className="metadata-item">
              <span className="metadata-label">Status Akhir</span>
              <span className="metadata-value">
                {activeStageIndex === -1 ? (
                  <span className="badge badge-success">Selesai ({submission.timeline.length}/{submission.timeline.length})</span>
                ) : isWarning ? (
                  <span className="badge badge-warning">Terlambat Tf LPPM</span>
                ) : (
                  <span className="badge badge-info">Dalam Proses</span>
                )}
              </span>
            </div>
          </div>

          {isWarning && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: 'hsl(var(--destructive) / 0.1)',
              border: '1px solid hsl(var(--destructive) / 0.3)',
              borderRadius: 'var(--radius)',
              color: 'hsl(var(--destructive))'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Peringatan Kritis!
              </div>
              <p style={{ fontSize: '0.775rem', lineHeight: 1.45, opacity: 0.9 }}>
                Pengajuan ini telah berjalan selama <strong>{daysDiff} hari</strong> sejak dibuat ({submission.tanggalPengajuan}), namun berkas <strong>Bukti Transfer Keuangan ke LPPM</strong> belum diunggah.
              </p>
            </div>
          )}
        </div>

        <div className="detail-main">
          <div className="timeline-header">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Linimasa Alur Pengajuan HKI</h2>
            <span style={{ fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
              {activeStageIndex === -1 ? 'Semua Dokumen Terarsip' : `Tahap ${activeStageIndex + 1} dari ${submission.timeline.length} Aktif`}
            </span>
          </div>

          <div className="timeline-list">
            {submission.timeline.map((stage, index) => {
              const isCompleted = !!stage.fileUrl;
              const isActive = index === activeStageIndex;
              const isPending = index > activeStageIndex && activeStageIndex !== -1;
              const isWarningActive = isActive && index === 2 && isWarning;

              let itemClass = "timeline-item pending";
              if (isCompleted) {
                itemClass = "timeline-item completed";
              } else if (isWarningActive) {
                itemClass = "timeline-item warning-active";
              } else if (isActive) {
                itemClass = "timeline-item active";
              }

              return (
                <div key={index} className={itemClass}>
                  <div className="timeline-dot">
                    {isCompleted ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div className="timeline-content">
                    <div className="timeline-title-row">
                      <span className="timeline-step-title">{stage.nama}</span>
                      {isCompleted && (
                        <span className="timeline-date">Diunggah: {stage.tanggalUpload}</span>
                      )}
                      {isWarningActive && (
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>LEWAT TENGGAT</span>
                      )}
                    </div>

                    {isCompleted ? (
                      editingStageIndex === index ? (
                        <form onSubmit={(e) => handleUploadSubmit(e, index)} className="upload-wrapper" style={{ marginTop: '0.5rem', width: '100%' }}>
                          <div 
                            className="upload-dropzone"
                            style={{
                              borderColor: activeDragIndex === index ? 'hsl(var(--ring))' : 'hsl(var(--border))',
                              backgroundColor: activeDragIndex === index ? 'hsl(var(--muted) / 0.3)' : 'hsl(var(--muted) / 0.1)',
                              transition: 'all 0.2s ease',
                              padding: '1.25rem'
                            }}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                          >
                            <input
                              type="file"
                              id={`file-upload-${index}`}
                              style={{ display: 'none' }}
                              onChange={(e) => handleFileChange(e, index)}
                              disabled={uploading}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <label 
                              htmlFor={`file-upload-${index}`}
                              style={{ width: '100%', height: '100%', cursor: uploading ? 'not-allowed' : 'pointer', display: 'block' }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>Tarik & lepas berkas baru di sini atau klik untuk memilih</div>
                              <p>Maks. ukuran 10MB (PDF, Word, Gambar)</p>
                            </label>
                          </div>

                          {selectedFile.stageIndex === index && selectedFile.file && (
                            <div className="file-selected-box">
                              <span className="file-selected-name">{selectedFile.file.name}</span>
                              <button 
                                type="button" 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'hsl(var(--muted-foreground))' }}
                                onClick={() => setSelectedFile({ stageIndex: null, file: null })}
                                disabled={uploading}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </div>
                          )}

                          {error && <div className="upload-error">{error}</div>}

                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button 
                              type="submit" 
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', height: 'auto' }}
                              disabled={uploading || selectedFile.stageIndex !== index || !selectedFile.file}
                            >
                              {uploading ? 'Memperbarui...' : 'Simpan Perubahan'}
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', height: 'auto' }}
                              onClick={() => {
                                setEditingStageIndex(null);
                                setSelectedFile({ stageIndex: null, file: null });
                                setError('');
                              }}
                              disabled={uploading}
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* Normal Completed View */
                        <div className="timeline-doc-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <div className="timeline-doc-info">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--muted-foreground))' }}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span style={{ fontWeight: 500, color: 'hsl(var(--card-foreground))' }}>{stage.fileName}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <a href={stage.fileUrl} target="_blank" rel="noopener noreferrer" className="doc-link">
                              Buka File
                            </a>
                            {currentUser?.role === 'user' && (
                              <button 
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto' }}
                                onClick={() => {
                                  setEditingStageIndex(index);
                                  setFile(null);
                                  setError('');
                                }}
                              >
                                Ganti File
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    ) : isActive ? (
                      /* Active Stage Form Upload */
                      currentUser?.role === 'user' ? (
                        <form onSubmit={(e) => handleUploadSubmit(e, index)} className="upload-wrapper">
                          <div 
                            className="upload-dropzone"
                            style={{
                              borderColor: activeDragIndex === index ? 'hsl(var(--ring))' : 'hsl(var(--border))',
                              backgroundColor: activeDragIndex === index ? 'hsl(var(--muted) / 0.3)' : 'hsl(var(--muted) / 0.1)',
                              transition: 'all 0.2s ease'
                            }}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                          >
                            <input
                              type="file"
                              id={`file-upload-${index}`}
                              style={{ display: 'none' }}
                              onChange={(e) => handleFileChange(e, index)}
                              disabled={uploading}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <label 
                              htmlFor={`file-upload-${index}`}
                              style={{ width: '100%', height: '100%', cursor: uploading ? 'not-allowed' : 'pointer', display: 'block' }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>Tarik & lepas berkas di sini atau klik untuk memilih</div>
                              <p>Maks. ukuran 10MB (PDF, Word, Gambar)</p>
                            </label>
                          </div>

                          {selectedFile.stageIndex === index && selectedFile.file && (
                            <div className="file-selected-box">
                              <span className="file-selected-name">{selectedFile.file.name}</span>
                              <button 
                                type="button" 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'hsl(var(--muted-foreground))' }}
                                onClick={() => setSelectedFile({ stageIndex: null, file: null })}
                                disabled={uploading}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </div>
                          )}

                          {error && <div className="upload-error">{error}</div>}

                          {selectedFile.stageIndex === index && selectedFile.file && (
                            <button 
                              type="submit" 
                              className="btn btn-primary btn-upload-submit"
                              disabled={uploading}
                            >
                              {uploading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
                                  Mengunggah...
                                </span>
                              ) : (
                                'Unggah Dokumen & Selesaikan Tahap Ini'
                              )}
                            </button>
                          )}
                        </form>
                      ) : (
                        <div style={{ fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '0.375rem', paddingLeft: '0.25rem', paddingBlock: '0.25rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--ring))' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Tahap aktif (Menunggu unggah dokumen oleh User)
                        </div>
                      )
                    ) : (
                      /* Locked / Pending Stage */
                      <div style={{ fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '0.25rem', paddingLeft: '0.25rem' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Menunggu penyelesaian tahap sebelumnya
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modal Konfirmasi Hapus ── */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '1rem',
              padding: '2rem 1.75rem',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Ikon merah */}
            <div style={{
              width: '3.5rem', height: '3.5rem', borderRadius: '50%',
              backgroundColor: 'hsl(var(--destructive) / 0.12)',
              color: 'hsl(var(--destructive))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.1rem'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'hsl(var(--foreground))' }}>
              Hapus Pengajuan ini?
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.55, marginBottom: '1.5rem' }}>
              Apakah Anda yakin ingin menghapus pengajuan atas nama{' '}
              <strong style={{ color: 'hsl(var(--foreground))' }}>{submission.pemohon}</strong>{' '}
              ({submission.nomorSurat})? Tindakan ini <strong>tidak dapat dibatalkan</strong>.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                style={{ minWidth: '100px' }}
              >
                Batal
              </button>
              <button
                className="btn"
                style={{ backgroundColor: 'hsl(var(--destructive))', color: '#fff', minWidth: '110px' }}
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDeleteSubmission(submission.id);
                  } finally {
                    setIsDeleting(false);
                    setShowDeleteModal(false);
                  }
                }}
              >
                {isDeleting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    </svg>
                    Menghapus...
                  </span>
                ) : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
