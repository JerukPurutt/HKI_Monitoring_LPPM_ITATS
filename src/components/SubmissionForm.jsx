import React, { useState } from 'react';
import { api } from '../services/api';

const PRODI_OPTIONS = [
  "Teknik Informatika",
  "Sistem Informasi",
  "Teknik Elektro",
  "Teknik Industri",
  "Teknik Sipil",
  "Teknik Pertambangan",
  "Teknik Mesin",
  "Teknik Perkapalan",
  "Teknik Kimia",
  "Arsitektur",
  "Teknik Lingkungan",
];

export default function SubmissionForm({ onClose, onCreateSuccess, showToast }) {
  const [nomorSurat, setNomorSurat] = useState('');
  const [prodi, setProdi] = useState('');
  const [customProdi, setCustomProdi] = useState('');
  const [pemohon, setPemohon] = useState('');
  const [tanggalPengajuan, setTanggalPengajuan] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!submitting) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (submitting) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal adalah 10MB');
        setFile(null);
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  // Handle file select
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) { // 10MB Limit
        setError('Ukuran file maksimal adalah 10MB');
        setFile(null);
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalProdi = prodi === 'Other' ? customProdi.trim() : prodi;

    // Validation
    if (!nomorSurat.trim()) return setError('Nomor surat harus diisi');
    if (!finalProdi) return setError('Program studi harus diisi');
    if (!pemohon.trim()) return setError('Nama pemohon harus diisi');
    if (!tanggalPengajuan) return setError('Tanggal pengajuan harus diisi');
    if (!file) return setError('Dokumen Surat Pengajuan Dana HKI (Tahap 1) wajib diunggah');

    setSubmitting(true);

    try {
      const newSub = await api.createSubmission({
        nomorSurat: nomorSurat.trim(),
        prodi: finalProdi,
        pemohon: pemohon.trim(),
        tanggalPengajuan,
        file
      });

      showToast('Pengajuan baru berhasil dibuat!', 'success');
      onCreateSuccess(newSub);
    } catch (err) {
      console.error(err);
      setError('Gagal membuat pengajuan baru. Silakan coba kembali.');
      showToast('Gagal membuat pengajuan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Buat Pengajuan Dana HKI</h2>
          <button className="modal-close" onClick={onClose} disabled={submitting}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '0.75rem', backgroundColor: 'hsl(var(--destructive) / 0.1)', border: '1px solid hsl(var(--destructive) / 0.3)', color: 'hsl(var(--destructive))', borderRadius: 'var(--radius)', fontSize: '0.825rem', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="form-no-surat">Nomor Surat Pengajuan</label>
              <input
                id="form-no-surat"
                type="text"
                className="input-text"
                placeholder="Contoh: 023/LPPM/HKI/2026"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="form-pemohon">Nama Pemohon (Dosen / Tim)</label>
              <input
                id="form-pemohon"
                type="text"
                className="input-text"
                placeholder="Nama lengkap pemohon beserta gelar"
                value={pemohon}
                onChange={(e) => setPemohon(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="form-prodi">Program Studi (Prodi)</label>
              <select
                id="form-prodi"
                className="select-input"
                value={prodi}
                onChange={(e) => setProdi(e.target.value)}
                disabled={submitting}
                required
              >
                <option value="">Pilih Program Studi...</option>
                {PRODI_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="Other">Lainnya...</option>
              </select>
            </div>

            {prodi === 'Other' && (
              <div className="form-group" style={{ marginTop: '-0.5rem' }}>
                <input
                  type="text"
                  className="input-text"
                  placeholder="Masukkan nama Prodi lainnya..."
                  value={customProdi}
                  onChange={(e) => setCustomProdi(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="form-tanggal">Tanggal Pengajuan</label>
              <input
                id="form-tanggal"
                type="date"
                className="input-text"
                value={tanggalPengajuan}
                onChange={(e) => setTanggalPengajuan(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group" style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.825rem', color: 'hsl(var(--foreground))' }}>Unggah Surat Pengajuan Dana HKI (Tahap 1)</span>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textTransform: 'none', fontWeight: 'normal' }}>
                  Unggah berkas untuk langsung memulai linimasa pelacakan pengajuan.
                </span>
              </label>

              <div style={{ marginTop: '0.5rem' }}>
                <input
                  type="file"
                  id="form-file-initial"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={submitting}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                
                {!file ? (
                  <div 
                    className="upload-dropzone"
                    style={{
                      borderColor: isDragging ? 'hsl(var(--ring))' : 'hsl(var(--border))',
                      backgroundColor: isDragging ? 'hsl(var(--muted) / 0.3)' : 'hsl(var(--muted) / 0.1)',
                      transition: 'all 0.2s ease',
                      padding: '1.25rem'
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <label 
                      htmlFor="form-file-initial"
                      style={{ width: '100%', height: '100%', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>Tarik & lepas file di sini atau klik untuk mencari</div>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.125rem' }}>Maks. 10MB (PDF, Word, Gambar)</p>
                    </label>
                  </div>
                ) : (
                  <div className="file-selected-box">
                    <span className="file-selected-name">{file.name}</span>
                    <button 
                      type="button" 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'hsl(var(--muted-foreground))' }}
                      onClick={() => setFile(null)}
                      disabled={submitting}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
                  Menyimpan...
                </span>
              ) : (
                'Buat Pengajuan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
