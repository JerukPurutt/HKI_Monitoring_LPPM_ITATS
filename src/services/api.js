const SCRIPT_URL_KEY = 'hki_tracker_script_url';
const LOCAL_STORAGE_KEY = 'hki_tracker_submissions';

const STAGE_NAMES = [
  "Surat Pengajuan Dana HKI",
  "Surat Serah Terima",
  "Bukti Transfer Keuangan ke LPPM",
  "Bukti Transfer LPPM ke Prodi",
  "Dokumen BAST",
  "Bukti Pembayaran",
  "Dokumen PJK"
];

const JWT_SECRET = 'lppm_hki_secret_key_2026';

function generateMockJwt(user) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60) // 3 days
  };
  
  const base64UrlEncode = (obj) => {
    const str = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(str);
    const binString = Array.from(bytes, byte => String.fromCharCode(byte)).join("");
    return btoa(binString)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };
  
  const headerB64 = base64UrlEncode(header);
  const payloadB64 = base64UrlEncode(payload);
  
  const rawSig = headerB64 + "." + payloadB64 + "." + JWT_SECRET;
  const sigBytes = new TextEncoder().encode(rawSig);
  const sigBin = Array.from(sigBytes, byte => String.fromCharCode(byte)).join("");
  const signatureB64 = btoa(sigBin)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

export function getToken() {
  return localStorage.getItem('hki_tracker_token');
}

// Helper to check warning condition (overdue proof of transfer)
export function checkWarningStatus(submission) {
  const isTransferUploaded = !!submission.timeline[2]?.fileUrl;
  
  if (isTransferUploaded) {
    return false;
  }
  
  const initDate = new Date(submission.tanggalPengajuan);
  const today = new Date();
  
  const diffTime = Math.abs(today - initDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 14;
}

// Generate initial mock data if localStorage is empty
function initializeMockData() {
  const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      // Jika jumlah tahap berubah, bersihkan cache agar data diperbarui
      if (parsed.length > 0 && parsed[0].timeline.length !== STAGE_NAMES.length) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } else {
        return;
      }
    } catch (e) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  const today = new Date();
  const formatOffsetDate = (days) => {
    const d = new Date();
    d.setDate(today.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const mockSubmissions = [
    {
      id: "mock-1",
      nomorSurat: "023/LPPM/HKI/2026",
      prodi: "Teknik Informatika",
      pemohon: "Dr. Budi Santoso",
      tanggalPengajuan: formatOffsetDate(3),
      timeline: STAGE_NAMES.map((name, index) => ({
        index,
        nama: name,
        fileName: index <= 1 ? `${name.replace(/\s+/g, '_')}_final.pdf` : "",
        fileUrl: index <= 1 ? "https://example.com/mock-doc.pdf" : "",
        tanggalUpload: index <= 1 ? formatOffsetDate(3 - index) : ""
      }))
    },
    {
      id: "mock-2",
      nomorSurat: "009/LPPM/HKI/2026",
      prodi: "Sistem Informasi",
      pemohon: "Siti Rahmawati, M.T.",
      tanggalPengajuan: formatOffsetDate(18),
      timeline: STAGE_NAMES.map((name, index) => ({
        index,
        nama: name,
        fileName: index <= 1 ? `${name.replace(/\s+/g, '_')}_draft.pdf` : "",
        fileUrl: index <= 1 ? "https://example.com/mock-doc.pdf" : "",
        tanggalUpload: index <= 1 ? formatOffsetDate(18 - index) : ""
      }))
    },
    {
      id: "mock-3",
      nomorSurat: "002/LPPM/HKI/2026",
      prodi: "Teknik Elektro",
      pemohon: "Prof. Ahmad Fauzi",
      tanggalPengajuan: formatOffsetDate(25),
      timeline: STAGE_NAMES.map((name, index) => ({
        index,
        nama: name,
        fileName: index <= 3 ? `${name.replace(/\s+/g, '_')}_signed.pdf` : "",
        fileUrl: index <= 3 ? "https://example.com/mock-doc.pdf" : "",
        tanggalUpload: index <= 3 ? formatOffsetDate(25 - index * 2) : ""
      }))
    },
    {
      id: "mock-4",
      nomorSurat: "034/LPPM/HKI/2026",
      prodi: "Teknik Informatika",
      pemohon: "Andi Wijaya, M.Kom",
      tanggalPengajuan: formatOffsetDate(1),
      timeline: STAGE_NAMES.map((name, index) => ({
        index,
        nama: name,
        fileName: index === 0 ? "Surat_Pengajuan_Signed.pdf" : "",
        fileUrl: index === 0 ? "https://example.com/mock-doc.pdf" : "",
        tanggalUpload: index === 0 ? formatOffsetDate(1) : ""
      }))
    }
  ];

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockSubmissions));
}

// Clean initialization call if not present
if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
  initializeMockData();
}

// Hardcoded Google Apps Script Web App URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJ5NTePoHWW_FJvxft3RYV3JKentw4F-wDM-Orf1oKe26XA-vFU0nUZynnKLh1AJOayg/exec';

// Get the Script URL
export function getScriptUrl() {
  return SCRIPT_URL;
}

// Save the Script URL (no-op now)
export function saveScriptUrl(url) {
  // Hardcoded in file, so no-op
}

// Check if using mock mode
export function isMockMode() {
  return !getScriptUrl();
}

/**
 * Compress / optimize a file before base64 encoding.
 * - Images (JPEG/PNG/WEBP): resized to max 1200px & re-encoded at 0.75 quality
 * - PDF/DOC: passed through unchanged (no client-side compression possible)
 * Returns a Promise<{ base64, name, type, originalSizeKB, compressedSizeKB }>
 */
async function compressFile(file) {
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIM = 1200;
        let { width, height } = img;

        // Scale down proportionally if too large
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Re-encode as JPEG at 75% quality (much smaller than PNG)
        const quality = 0.75;
        const mimeOut = 'image/jpeg';
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('Gagal kompres gambar')); return; }
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve({
              base64,
              name: file.name.replace(/\.[^.]+$/, '.jpg'),
              type: mimeOut,
              originalSizeKB: Math.round(file.size / 1024),
              compressedSizeKB: Math.round(blob.size / 1024)
            });
          };
          reader.readAsDataURL(blob);
        }, mimeOut, quality);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Gagal memuat gambar')); };
      img.src = objectUrl;
    });
  }

  // Non-image: just read as-is
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve({
        base64,
        name: file.name,
        type: file.type,
        originalSizeKB: Math.round(file.size / 1024),
        compressedSizeKB: Math.round(file.size / 1024)
      });
    };
    reader.readAsDataURL(file);
  });
}

// Check & throw early if file is too large (5 MB max for non-images, 15 MB for images before compress)
function validateFileSize(file) {
  const isImage = file.type.startsWith('image/');
  const limitMB = isImage ? 15 : 5;
  if (file.size > limitMB * 1024 * 1024) {
    throw new Error(`Ukuran file terlalu besar. Maksimal ${limitMB}MB untuk ${isImage ? 'gambar' : 'dokumen'}.`);
  }
}

// API Service
export const api = {
  // Login action
  async login(username, password) {
    const scriptUrl = getScriptUrl();
    const cleanUser = username ? username.toLowerCase().trim() : "";
    const cleanPass = password ? password.trim() : "";

    if (!cleanUser || !cleanPass) {
      return { success: false, error: "Username dan password wajib diisi" };
    }

    if (!scriptUrl) {
      // Mock mode authentication
      let user = null;
      if (cleanUser === 'lppm_admin' && cleanPass === 'lppm_jaya') {
        user = { username: 'admin', role: 'admin' };
      } else if (cleanUser === 'lppm_user' && cleanPass === 'lppm_jaya24') {
        user = { username: 'user', role: 'user' };
      }
      
      if (user) {
        const token = generateMockJwt(user);
        return { success: true, user, token };
      }
      return { success: false, error: "Username atau password salah" };
    }

    try {
      const payload = {
        action: 'login',
        username: cleanUser,
        password: cleanPass
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Koneksi API gagal');
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error logging in via Apps Script:', error);
      throw error;
    }
  },

  // Fetch all submissions
  async getAllSubmissions() {
    const scriptUrl = getScriptUrl();
    if (!scriptUrl) {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return JSON.parse(data || '[]');
    }

    try {
      const response = await fetch(`${scriptUrl}?action=list&token=${encodeURIComponent(getToken() || '')}`);
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching submissions from Apps Script:', error);
      throw error;
    }
  },

  // Create a new submission
  async createSubmission({ nomorSurat, prodi, pemohon, tanggalPengajuan, file }) {
    const scriptUrl = getScriptUrl();

    validateFileSize(file);
    const fileData = await compressFile(file);
    console.log(`[Upload] ${file.name}: ${fileData.originalSizeKB}KB → ${fileData.compressedSizeKB}KB`);

    if (!scriptUrl) {
      const submissions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const newSubmission = {
        id: 'mock-' + Date.now(),
        nomorSurat,
        prodi,
        pemohon,
        tanggalPengajuan,
        timeline: STAGE_NAMES.map((name, index) => ({
          index,
          nama: name,
          fileName: index === 0 ? file.name : "",
          fileUrl: index === 0 ? "https://example.com/mock-upload.pdf" : "",
          tanggalUpload: index === 0 ? new Date().toISOString().split('T')[0] : ""
        }))
      };
      
      submissions.push(newSubmission);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(submissions));
      return newSubmission;
    }

    try {
      const payload = {
        action: 'create',
        token: getToken(),
        nomorSurat,
        prodi,
        pemohon,
        tanggalPengajuan,
        file: fileData
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create submission');
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending request to Apps Script:', error);
      throw error;
    }
  },

  // Upload file for a specific stage
  async uploadStageDocument(submissionId, stageIndex, file) {
    const scriptUrl = getScriptUrl();

    validateFileSize(file);
    const fileData = await compressFile(file);
    console.log(`[Upload] ${file.name}: ${fileData.originalSizeKB}KB → ${fileData.compressedSizeKB}KB`);

    if (!scriptUrl) {
      const submissions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const updatedSubmissions = submissions.map(sub => {
        if (sub.id === submissionId) {
          const updatedTimeline = sub.timeline.map((stage, idx) => {
            if (idx === parseInt(stageIndex)) {
              return {
                ...stage,
                fileName: file.name,
                fileUrl: "https://example.com/mock-upload.pdf",
                tanggalUpload: new Date().toISOString().split('T')[0]
              };
            }
            return stage;
          });
          return {
            ...sub,
            timeline: updatedTimeline
          };
        }
        return sub;
      });

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSubmissions));
      return updatedSubmissions.find(sub => sub.id === submissionId);
    }

    try {
      const payload = {
        action: 'upload',
        token: getToken(),
        id: submissionId,
        stageIndex: parseInt(stageIndex),
        file: fileData
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to upload stage file');
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading file to Apps Script:', error);
      throw error;
    }
  },

  // Delete a submission
  async deleteSubmission(submissionId) {
    const scriptUrl = getScriptUrl();

    if (!scriptUrl) {
      const submissions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const updatedSubmissions = submissions.filter(sub => sub.id !== submissionId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSubmissions));
      return { success: true, message: 'Submission deleted successfully' };
    }

    try {
      const payload = {
        action: 'delete',
        token: getToken(),
        id: submissionId
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to delete submission');
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting submission from Apps Script:', error);
      throw error;
    }
  }
};
