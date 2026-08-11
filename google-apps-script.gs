const STAGE_NAMES = [
  "Surat Pengajuan Dana HKI",
  "Surat Serah Terima",
  "Bukti Transfer Keuangan ke LPPM",
  "Bukti Transfer LPPM ke Prodi",
  "Dokumen BAST",
  "Bukti Pembayaran",
  "Dokumen PJK"
];

// Handle GET Request (fetching data)
function doGet(e) {
  var action = e.parameter.action;
  
  try {
    var sheet = getOrCreateSheet();
    
    if (action === 'list') {
      var data = getAllSubmissionsData(sheet);
      return createJsonResponse(data);
    }
    
    return createJsonResponse({ success: false, error: 'Aksi GET tidak dikenali' });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// Handle POST Request (saving data, files & login)
function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    
    // Action 1: Login
    if (action === 'login') {
      var usersSheet = getOrCreateUsersSheet();
      var loginResult = handleLogin(usersSheet, postData);
      return createJsonResponse(loginResult);
    }
    
    // Action 2 & 3: Create & Upload Submissions
    var sheet = getOrCreateSheet();
    if (action === 'create') {
      var newSubmission = createSubmission(sheet, postData);
      return createJsonResponse(newSubmission);
    }
    
    if (action === 'upload') {
      var updatedSubmission = uploadDocument(sheet, postData);
      return createJsonResponse(updatedSubmission);
    }
    
    if (action === 'delete') {
      var deleteResult = deleteSubmissionRow(sheet, postData);
      return createJsonResponse(deleteResult);
    }
    
    return createJsonResponse({ success: false, error: 'Aksi POST tidak dikenali' });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// Get or create spreadsheet sheet for HKI Submissions
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Submissions");
  if (!sheet) {
    sheet = ss.insertSheet("Submissions");
    var headers = [
      "ID", "Nomor Surat", "Prodi", "Pemohon", "Tanggal Pengajuan",
      "T1 Nama File", "T1 URL", "T1 Tgl Upload",
      "T2 Nama File", "T2 URL", "T2 Tgl Upload",
      "T3 Nama File", "T3 URL", "T3 Tgl Upload",
      "T4 Nama File", "T4 URL", "T4 Tgl Upload",
      "T5 Nama File", "T5 URL", "T5 Tgl Upload",
      "T6 Nama File", "T6 URL", "T6 Tgl Upload",
      "T7 Nama File", "T7 URL", "T7 Tgl Upload"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Get or create spreadsheet sheet for User Accounts
function getOrCreateUsersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  if (!sheet) {
    sheet = ss.insertSheet("Users");
    var headers = ["Username", "Password", "Role"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    
    // Add default accounts
    sheet.appendRow(["admin", "admin123", "admin"]);
    sheet.appendRow(["user", "user123", "user"]);
  }
  return sheet;
}

// Check user login credentials
function handleLogin(sheet, data) {
  var username = data.username ? data.username.toLowerCase().trim() : "";
  var password = data.password ? data.password.toString() : "";
  
  if (!username || !password) {
    return { success: false, error: "Username dan password wajib diisi" };
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: false, error: "Tidak ada data pengguna terdaftar" };
  }
  
  var values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  for (var i = 0; i < values.length; i++) {
    var dbUser = values[i][0].toString().toLowerCase().trim();
    var dbPass = values[i][1].toString();
    var dbRole = values[i][2].toString().toLowerCase().trim();
    
    if (dbUser === username && dbPass === password) {
      return { 
        success: true, 
        user: { 
          username: values[i][0].toString(), 
          role: dbRole 
        } 
      };
    }
  }
  
  return { success: false, error: "Username atau password salah" };
}

// Get or create Google Drive storage folder
function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

// Create a helper JSON output with CORS header
function createJsonResponse(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get all submissions mapped into the JSON structure
function getAllSubmissionsData(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  var values = sheet.getRange(2, 1, lastRow - 1, 26).getValues();
  var submissions = [];
  
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var id = row[0];
    
    if (!id) continue; // Skip empty rows
    
    var nomorSurat = row[1];
    var prodi = row[2];
    var pemohon = row[3];
    
    // Format date properly to YYYY-MM-DD
    var tanggalPengajuan = "";
    if (row[4] instanceof Date) {
      tanggalPengajuan = Utilities.formatDate(row[4], Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      tanggalPengajuan = row[4].toString();
    }
    
    var timeline = [];
    for (var j = 0; j < STAGE_NAMES.length; j++) {
      var colStart = 5 + (j * 3);
      var fileName = row[colStart];
      var fileUrl = row[colStart + 1];
      
      var tanggalUpload = "";
      if (row[colStart + 2] instanceof Date) {
        tanggalUpload = Utilities.formatDate(row[colStart + 2], Session.getScriptTimeZone(), "yyyy-MM-dd");
      } else {
        tanggalUpload = row[colStart + 2].toString();
      }
      
      timeline.push({
        index: j,
        nama: STAGE_NAMES[j],
        fileName: fileName || "",
        fileUrl: fileUrl || "",
        tanggalUpload: tanggalUpload || ""
      });
    }
    
    submissions.push({
      id: id.toString(),
      nomorSurat: nomorSurat.toString(),
      prodi: prodi.toString(),
      pemohon: pemohon.toString(),
      tanggalPengajuan: tanggalPengajuan,
      timeline: timeline
    });
  }
  
  return submissions;
}

// Create a new submission
function createSubmission(sheet, data) {
  var id = "hki-" + new Date().getTime();
  var nomorSurat = data.nomorSurat;
  var prodi = data.prodi;
  var pemohon = data.pemohon;
  var tanggalPengajuan = data.tanggalPengajuan;
  
  // Create Date object for tanggalPengajuan
  var dateParts = tanggalPengajuan.split('-');
  var parsedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

  // Upload initial Stage 1 file
  var folder = getOrCreateFolder("HKI_Funding_Documents");
  var decoded = Utilities.base64Decode(data.file.base64);
  var blob = Utilities.newBlob(decoded, data.file.type, data.file.name);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  var fileName = data.file.name;
  var fileUrl = file.getUrl();
  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  // Construct the row array
  var newRow = [
    id, nomorSurat, prodi, pemohon, parsedDate,
    fileName, fileUrl, new Date() // Column F, G, H
  ];
  
  // Pad the rest of the columns up to index 25 (total 26 columns)
  while (newRow.length < 26) {
    newRow.push("");
  }
  
  sheet.appendRow(newRow);
  
  // Construct return object
  var timeline = STAGE_NAMES.map(function(name, index) {
    return {
      index: index,
      nama: name,
      fileName: index === 0 ? fileName : "",
      fileUrl: index === 0 ? fileUrl : "",
      tanggalUpload: index === 0 ? todayStr : ""
    };
  });
  
  return {
    id: id,
    nomorSurat: nomorSurat,
    prodi: prodi,
    pemohon: pemohon,
    tanggalPengajuan: tanggalPengajuan,
    timeline: timeline
  };
}

// Upload document for specific stage
function uploadDocument(sheet, data) {
  var id = data.id;
  var stageIndex = parseInt(data.stageIndex);
  
  // Find row matching ID in Column A
  var lastRow = sheet.getLastRow();
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var rowIndex = -1;
  
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0].toString() === id.toString()) {
      rowIndex = i + 2; // Offset for header + 0-index conversion
      break;
    }
  }
  
  if (rowIndex === -1) {
    throw new Error("Pengajuan HKI tidak ditemukan dengan ID: " + id);
  }
  
  // Upload file to Drive
  var folder = getOrCreateFolder("HKI_Funding_Documents");
  var decoded = Utilities.base64Decode(data.file.base64);
  var blob = Utilities.newBlob(decoded, data.file.type, data.file.name);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  var fileName = data.file.name;
  var fileUrl = file.getUrl();
  var today = new Date();
  
  // Col start for stageIndex = 6 + (stageIndex * 3)
  var colStart = 6 + (stageIndex * 3);
  
  sheet.getRange(rowIndex, colStart).setValue(fileName);
  sheet.getRange(rowIndex, colStart + 1).setValue(fileUrl);
  sheet.getRange(rowIndex, colStart + 2).setValue(today);
  
  // Read back the updated submission row
  var values = sheet.getRange(rowIndex, 1, 1, 26).getValues()[0];
  
  var nomorSurat = values[1];
  var prodi = values[2];
  var pemohon = values[3];
  
  var tanggalPengajuan = "";
  if (values[4] instanceof Date) {
    tanggalPengajuan = Utilities.formatDate(values[4], Session.getScriptTimeZone(), "yyyy-MM-dd");
  } else {
    tanggalPengajuan = values[4].toString();
  }
  
  var timeline = [];
  for (var j = 0; j < STAGE_NAMES.length; j++) {
    var cStart = 5 + (j * 3);
    var fName = values[cStart];
    var fUrl = values[cStart + 1];
    
    var tUpload = "";
    if (values[cStart + 2] instanceof Date) {
      tUpload = Utilities.formatDate(values[cStart + 2], Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      tUpload = values[cStart + 2].toString();
    }
    
    timeline.push({
      index: j,
      nama: STAGE_NAMES[j],
      fileName: fName || "",
      fileUrl: fUrl || "",
      tanggalUpload: tUpload || ""
    });
  }
  
  return {
    id: id,
    nomorSurat: nomorSurat.toString(),
    prodi: prodi.toString(),
    pemohon: pemohon.toString(),
    tanggalPengajuan: tanggalPengajuan,
    timeline: timeline
  };
}

// Delete submission row by ID
function deleteSubmissionRow(sheet, data) {
  var id = data.id;
  if (!id) return { success: false, error: 'ID pengajuan wajib disertakan' };
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: 'Tabel pengajuan kosong' };
  
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 2);
      return { success: true, message: 'Pengajuan berhasil dihapus' };
    }
  }
  return { success: false, error: 'Pengajuan tidak ditemukan' };
}
