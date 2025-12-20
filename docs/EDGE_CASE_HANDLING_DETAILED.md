# Edge Case Handling - Improvement Details

## 📊 Analisis Lengkap Dengan Perbaikan

### **1. KOLOM NILAI KOSONG**

#### Problem Definition
```
Skenario: Siswa tidak memiliki nilai untuk komponen KET atau PENG
Contoh:
  Aswaja KET: 85
  Aswaja PENG: [EMPTY]
```

#### Code Logic (BEFORE & AFTER)
```javascript
// ✅ EXISTING LOGIC (sudah baik):
const calculateAverage = (ket, peng) => {
  const ketVal = parseFloat(String(ket).replace(',', '.'));
  const pengVal = parseFloat(String(peng).replace(',', '.'));
  
  if (isNaN(ketVal) || isNaN(pengVal)) return '-';
  
  const avg = (ketVal + pengVal) / 2;
  return avg.toFixed(2);
};

// BEHAVIOR:
// Input: calculateAverage(85, '')
// Output: '-'
// Reason: parseFloat('') = NaN, triggers if condition
```

#### Handling Flow Diagram
```
Input: (KET value, PENG value)
  ↓
Convert to float (handle comma as decimal)
  ↓
Check if either is NaN (invalid)
  ├─ YES → Return '-' (dash marker)
  └─ NO → Calculate average → Return number
```

#### User Display
```
Tabel Rapor:
┌────────────────┬──────────┬───────────┬──────────────┐
│ Mata Pelajaran │ KET      │ PENG      │ Nilai Akhir  │
├────────────────┼──────────┼───────────┼──────────────┤
│ Aswaja         │ 85       │ [KOSONG]  │ -            │ ← Dash
│ Matematika     │ 90       │ 88        │ 89.00        │
└────────────────┴──────────┴───────────┴──────────────┘
```

#### Catatan
- Nilai KET dan PENG tetap disimpan apa adanya (85 dan undefined)
- Hanya rata-rata (Nilai Akhir) yang ditampilkan sebagai "-"
- **Tidak ada error atau crash aplikasi**

---

### **2. MATA PELAJARAN TIDAK DIKENAL (UNRECOGNIZED)**

#### Problem Definition
```
Skenario: File Excel memiliki kolom mata pelajaran yang tidak ada di allSubjectNames
Contoh Header:
  Aswaja | Matematika | MAPEL_BARU | Fisika | ...
                            ↑
                  Tidak ada di list allSubjectNames
```

#### List Mata Pelajaran yang Dikenal (allSubjectNames)
```javascript
[
  'Pendidikan Agama Islam',
  'Pendidikan Pancasila dan Kewarganegaraan',
  'Bahasa Indonesia',
  'Matematika',
  'Sejarah Indonesia',
  'Bahasa Inggris',
  'Pendidikan Jasmani Olahraga dan Kesehatan',
  'Seni Budaya',
  'Teknologi Informasi dan Komunikasi',
  'Informatika',
  'Prakarya dan Kewirausahaan',
  'Bahasa Daerah/Jawa',
  'Aswaja',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sejarah/Sejarah Peminatan',
  'Geografi',
  'Sosiologi',
  'Ekonomi',
  'Ekonomi Akuntansi',
  'Antropologi',
  'Bahasa dan Sastra Arab',
  'Bahasa dan Sastra Indonesia',
  'Bahasa dan Sastra Inggris',
  'Bahasa Indonesia Tingkat Lanjut',
  'Bahasa Inggris Tingkat Lanjut',
  'Keterampilan Bahasa Inggris'
]
```

#### Code Logic
```javascript
// PROSES DETEKSI:
const findSubjectColumns = (headerRow) => {
  const subjectColumns = {};
  
  // Loop setiap subject yang DIKENAL
  allSubjectNames.forEach(subjectName => {
    // Cari di header (case-insensitive)
    const foundIndex = headerRow.findIndex(h => 
      h?.toString().trim().toLowerCase() === subjectName.toLowerCase()
    );
    
    // Hanya simpan jika DITEMUKAN
    if (foundIndex !== -1) {
      subjectColumns[subjectName] = { ... };
    }
    // Jika tidak ditemukan → SKIP (tidak ada warning)
  });
  
  return subjectColumns;
};

// HASIL:
// Input: ['Aswaja', 'Matematika', 'MAPEL_BARU', 'Fisika']
// Output: {
//   'Aswaja': {...},
//   'Matematika': {...},
//   'Fisika': {...}
//   // 'MAPEL_BARU' tidak ada di output
// }
```

#### Behavior: Mata Pelajaran Diabaikan
```
FILE EXCEL HEADER:
No | NIS | Nama | Aswaja | MAPEL_BARU | Matematika | ...

PROSES:
1. Loop allSubjectNames (17 item)
2. Cari "Pendidikan Agama Islam" → tidak ditemukan → skip
3. ... (loop terus) ...
4. Cari "Aswaja" → DITEMUKAN di kolom D → save
5. Cari "Matematika" → DITEMUKAN di kolom F → save
6. Loop selesai

HASIL:
subjectColumns = {
  'Aswaja': { ketIndex: 3, pengIndex: 4 },
  'Matematika': { ketIndex: 5, pengIndex: 6 }
}

NOTE: MAPEL_BARU sama sekali tidak diproses
```

#### Improvement: VALIDASI & WARNING (BARU)
```javascript
// ✨ NEW FUNCTION ADDED:
const validateHeaderRow = (headerRow) => {
  const recognizedSubjects = [];
  const unrecognizedSubjects = new Set();
  
  // Check recognized
  allSubjectNames.forEach(subjectName => {
    if (headerRow.includes(subjectName)) {
      recognizedSubjects.push(subjectName);
    }
  });
  
  // Check unrecognized (selain system columns)
  const systemColumns = ['no', 'nis', 'nama', ...];
  headerRow.forEach((header) => {
    if (header && 
        !systemColumns.includes(header) && 
        !recognizedSubjects.includes(header)) {
      unrecognizedSubjects.add(header);
    }
  });
  
  return {
    recognizedSubjects,      // [17 item]
    unrecognizedSubjects     // ['MAPEL_BARU']
  };
};
```

#### Alert Message (IMPROVED)
```javascript
// OLD MESSAGE:
"Berhasil memuat 25 siswa dari 3 sheet dengan 17 mata pelajaran"

// NEW MESSAGE (with warning):
"✅ Berhasil memuat 25 siswa dari 3 sheet
📚 Mata pelajaran terdeteksi: 17

⚠️ 1 mata pelajaran tidak dikenali (diabaikan):
MAPEL_BARU"
```

#### Console Logging
```javascript
// User dapat melihat di Browser DevTools (F12):
console.log('Dynamic subject columns found:', {...})
console.log('Header validation:', {
  recognizedSubjects: [17 items],
  unrecognizedSubjects: ['MAPEL_BARU']
})
console.warn('⚠️ Unrecognized subjects (akan diabaikan):', ['MAPEL_BARU'])
```

#### Edge Case: Tidak Ada Subject Sama Sekali
```javascript
// NEW VALIDATION (added in handleFileUpload):
if (headerValidation.recognizedSubjects.length === 0) {
  alert('❌ Error: Tidak ada mata pelajaran yang dikenali di file!');
  return; // STOP processing
}

// Result: User harus memperbaiki file sebelum bisa lanjut
```

---

### **3. KOMBINASI: NILAI KOSONG + MAPEL TIDAK DIKENAL**

#### Skenario Kompleks
```
FILE STRUCTURE:
Header: No | NIS | Nama | Aswaja | Matematika | MAPEL_BARU | Fisika
Row 8:  1  | 445 | Adinda | 85    | 81,5       | [kosong]   | [kosong]
```

#### Execution Flow
```
STEP 1: validateHeaderRow()
  → recognizedSubjects: ['Aswaja', 'Matematika', 'Fisika']
  → unrecognizedSubjects: ['MAPEL_BARU']
  → Alert user tentang MAPEL_BARU

STEP 2: findSubjectColumns()
  → {
      'Aswaja': { ketIndex: 3, pengIndex: 4 },
      'Matematika': { ketIndex: 5, pengIndex: 6 },
      'Fisika': { ketIndex: 7, pengIndex: 8 }
    }

STEP 3: Processing Data (forEach row)
  → Row: [1, 445, 'Adinda', 85, [kosong], 81.5, [kosong], [kosong]]
  
  → Process Aswaja:
    - KET (index 3) = 85
    - PENG (index 4) = [kosong/undefined]
    - calculateAverage(85, undefined) → '-'
    
  → Process Matematika:
    - KET (index 5) = 81.5
    - PENG (index 6) = [kosong/undefined]
    - calculateAverage(81.5, undefined) → '-'
    
  → Process Fisika:
    - KET (index 7) = [kosong]
    - PENG (index 8) = [kosong]
    - calculateAverage(undefined, undefined) → '-'

RESULT:
{
  'Aswaja': { KET: 85, PENG: undefined, avg: '-' },
  'Matematika': { KET: 81.5, PENG: undefined, avg: '-' },
  'Fisika': { KET: undefined, PENG: undefined, avg: '-' }
}
// MAPEL_BARU tidak ada di sini (diabaikan di step 2)
```

---

### **4. NILAI INVALID (BUKAN ANGKA)**

#### Contoh Data Invalid
```
Aswaja KET: "Tidak Hadir"
Aswaja PENG: "N/A"
Matematika KET: "TBD"
Matematika PENG: "-"
```

#### Processing
```javascript
const calculateAverage = (ket, peng) => {
  // "Tidak Hadir" → parseFloat() → NaN
  const ketVal = parseFloat("Tidak Hadir".replace(',', '.'));
  // NaN === NaN → true
  
  if (isNaN(ketVal) || isNaN(pengVal)) return '-';
  // Return '-'
};

// Result: Diperlakukan sama seperti kosong
```

#### User View
```
Aswaja     | KET: Tidak Hadir | PENG: N/A | Nilai Akhir: -
Matematika | KET: TBD         | PENG: -   | Nilai Akhir: -
```

---

### **5. PARTIAL VALUES**

#### Skenario: Hanya KET ada, PENG kosong
```
Input: calculateAverage(85, '')
Processing:
  - ketVal = parseFloat('85') = 85
  - pengVal = parseFloat('') = NaN
  - isNaN(85) || isNaN(NaN) → true
  - return '-'
```

#### Skenario: KET kosong, PENG ada
```
Input: calculateAverage('', 88)
Processing:
  - ketVal = parseFloat('') = NaN
  - pengVal = parseFloat('88') = 88
  - isNaN(NaN) || isNaN(88) → true
  - return '-'
```

#### Decision Logic
```
Ada KET saja     → Tidak bisa hitung rata-rata (butuh 2 nilai)
Ada PENG saja    → Tidak bisa hitung rata-rata (butuh 2 nilai)
Ada KET & PENG   → Hitung dan tampilkan
Ada Keduanya 0   → Rata-rata = 0 (valid)
Keduanya kosong  → Tampilkan '-'
Ada yang invalid → Tampilkan '-'

RULE: Rata-rata hanya dihitung jika KEDUA nilai valid
```

---

## 📋 Summary Table: Edge Cases & Handling

| Skenario | Input | Processing | Output | Aplikasi | User Alert |
|----------|-------|-----------|--------|----------|-----------|
| **Normal** | 85, 81.5 | Valid parse → calc | 83.25 | ✅ Continue | None |
| **KET Kosong** | '', 88 | ketVal=NaN | '-' | ✅ Continue | None |
| **PENG Kosong** | 85, '' | pengVal=NaN | '-' | ✅ Continue | None |
| **Keduanya Kosong** | '', '' | Both NaN | '-' | ✅ Continue | None |
| **Value Invalid** | 'N/A', 88 | ketVal=NaN | '-' | ✅ Continue | None |
| **Mapel Typo** | Header: "Matematik" | Not found in list | Skip mapel | ✅ Continue | ⚠️ Warn in alert |
| **Mapel Unknown** | Header: "Musik" | Not in allSubjectNames | Skip mapel | ✅ Continue | ⚠️ Warn in alert |
| **Semua Mapel Typo** | Header: "ABC", "DEF" | None recognized | 0 subjects | ❌ STOP | ❌ Error alert |

---

## 🔍 Testing Checklist

```
TEST 1: Nilai Kosong
□ Upload file dengan beberapa nilai kosong
□ Verifikasi tampil '-' di Nilai Akhir
□ Cek console untuk values yang disimpan

TEST 2: Mapel Unknown
□ Upload file dengan kolom "Musik" (tidak ada di list)
□ Periksa alert warning
□ Verifikasi console menampilkan unrecognized subjects

TEST 3: Nilai Invalid
□ Upload file dengan nilai "N/A", "TBD"
□ Verifikasi tampil '-' di Nilai Akhir
□ Cek data structure di console

TEST 4: Kombinasi
□ File dengan nilai kosong + mapel unknown
□ Verifikasi alert menampilkan warning mapel
□ Verifikasi laporan menampilkan '-' untuk nilai kosong

TEST 5: Semua Mapel Typo
□ Upload file dengan semua mapel tidak dikenal
□ Verifikasi alert error (tidak bisa lanjut)
□ Verifikasi file tidak diload
```

---

## ✅ Summary Perbaikan

### Added Features
1. ✨ Fungsi `validateHeaderRow()` untuk deteksi unrecognized subjects
2. ✨ Enhanced alert message dengan warning details
3. ✨ Guard clause: jika tidak ada subject dikenal → stop dan error
4. ✨ Console logging untuk debugging

### Existing Strengths
1. ✅ `calculateAverage()` sudah handle nilai kosong & invalid dengan baik
2. ✅ Sistem lenient (permisif) - tidak crash, hanya skip/display '-'
3. ✅ Flexible - support berbagai format input (comma, space)

### User Experience
1. User tahu persis berapa mapel terdeteksi
2. User alert jika ada mapel tidak dikenal
3. User tidak perlu khawatir error → sistem robust
4. Laporan tetap tampil dengan '-' untuk nilai invalid

---

**Last Updated:** 19 Desember 2025  
**Topic:** Comprehensive Edge Case Handling & Improvements
