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

initializeMockData();

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
      if (cleanUser === 'admin' && cleanPass === 'admin123') {
        return { success: true, user: { username: 'admin', role: 'admin' } };
      } else if (cleanUser === 'user' && cleanPass === 'user123') {
        return { success: true, user: { username: 'user', role: 'user' } };
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
      const response = await fetch(`${scriptUrl}?action=list`);
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
    
    const fileData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          base64: reader.result.split(',')[1],
          name: file.name,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    });

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
    
    const fileData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          base64: reader.result.split(',')[1],
          name: file.name,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    });

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
