# Edge Cases Analysis - Dynamic Column Mapping

## 📋 Skenario Edge Cases & Cara Kerjanya

### **1. Kolom Nilai Kosong**

#### Skenario: Siswa tidak memiliki nilai untuk mata pelajaran tertentu
```
Contoh di Excel:
Nama: Adinda Fatisa
Aswaja KET: 85
Aswaja PENG: [KOSONG]
```

#### Cara Kerja Sekarang:
```javascript
const calculateAverage = (ket, peng) => {
  const ketVal = parseFloat(String(ket).replace(',', '.'));
  const pengVal = parseFloat(String(peng).replace(',', '.'));
  
  if (isNaN(ketVal) || isNaN(pengVal)) return '-';  // ← Jika ada yang kosong
  
  const avg = (ketVal + pengVal) / 2;
  return avg.toFixed(2);
};
```

**Hasil:**
- Jika KET atau PENG kosong → nilai average ditampilkan sebagai **"-"** (dash)
- Data KET dan PENG tetap disimpan apa adanya
- Laporan akan menampilkan dash di kolom "Nilai Akhir"

**Contoh Output:**
```
Aswaja      | KET: 85   | PENG: [kosong] | Nilai Akhir: -
```

---

### **2. Mata Pelajaran Tidak Ada di List yang Dikenali**

#### Skenario: File Excel memiliki mata pelajaran yang tidak terdaftar
```
Contoh Header di Excel:
No;NIS;Nama;Aswaja;Matematika;MAPEL_BARU_YANG_TIDAK_DIKENAL;...
```

#### Cara Kerja Sekarang:
```javascript
const findSubjectColumns = (headerRow) => {
  const subjectColumns = {};
  
  const trimmedHeader = headerRow.map(h => 
    h ? String(h).trim().toLowerCase() : ''
  );
  
  allSubjectNames.forEach(subjectName => {
    const subjectLower = subjectName.toLowerCase();
    let foundIndex = -1;
    
    // Cari hanya mata pelajaran yang ada di allSubjectNames
    for (let i = 0; i < trimmedHeader.length; i++) {
      if (trimmedHeader[i] === subjectLower) {
        foundIndex = i;
        break;
      }
    }
    
    if (foundIndex !== -1) {
      subjectColumns[subjectName] = {
        ketIndex: foundIndex,
        pengIndex: foundIndex + 1
      };
    }
  });
  
  return subjectColumns;
};
```

**Hasil:**
- Mata pelajaran yang **TIDAK dikenali akan diabaikan** (tidak diproses)
- Hanya mata pelajaran yang ada di `allSubjectNames` yang diproses
- Tidak ada error, sistem tetap berjalan normal
- Di console akan terlihat hanya mata pelajaran yang dikenali dalam `subjectColumns`

**Contoh Output Console:**
```
Available sheets: (3) ['Nilai', 'Deskripsi', 'Pelengkap']

Dynamic subject columns found: {
  'Aswaja': { ketIndex: 3, pengIndex: 4 },
  'Matematika': { ketIndex: 5, pengIndex: 6 },
  // 'MAPEL_BARU_YANG_TIDAK_DIKENAL' → TIDAK MUNCUL DI SINI
}
```

---

### **3. Kombinasi: Nilai Kosong + Mapel Tidak Dikenal**

#### Skenario: File memiliki keduanya
```
Header:
No;NIS;Nama;Aswaja;Matematika;MAPEL_TIDAK_DIKENAL;Informatika;...

Data Siswa:
1;445;Adinda;85;81,5;;90;
                      ↑
                   KOSONG
```

#### Cara Kerja:
1. `findSubjectColumns()` akan melewati "MAPEL_TIDAK_DIKENAL"
2. Processing hanya untuk: Aswaja, Matematika, Informatika
3. Nilai kosong pada Matematika PENG akan ditampilkan sebagai "-"
4. Tidak ada error atau warning

---

## ⚠️ Potensi Masalah & Rekomendasi

### **Masalah 1: Mata Pelajaran Typo Tidak Terdeteksi**

**Contoh:**
- File memiliki: "Matematka" (typo, seharusnya Matematika)
- Sistem tidak akan mengenali dan mapel akan diabaikan

**Rekomendasi:**
- Validasi header sebelum processing
- Tampilkan warning list mata pelajaran yang tidak dikenali

---

### **Masalah 2: Kolom Tidak Berurutan (KET-PENG Terpisah)**

**Contoh SALAH:**
```
Aswaja | Matematika | Aswaja_PENG | Matematika_PENG |
                ↑
           Kolom tidak bersebelahan!
```

**Rekomendasi:**
- KET dan PENG harus selalu bersebelahan (N, N+1)
- Jika tidak, validasi akan gagal dan nilai akan salah

---

### **Masalah 3: Nilai Tidak Berupa Angka**

**Contoh:**
```
Nilai: "Tidak Hadir" atau "N/A" atau "TBD"
```

**Cara Kerja:**
```javascript
const ketVal = parseFloat(String(ket).replace(',', '.'));
// "Tidak Hadir" → NaN
// If isNaN → return "-"
```

**Result:** Akan menampilkan "-" (sama seperti kosong)

---

## 🛠️ Perbaikan yang Bisa Ditambahkan

### **Opsi 1: Tambah Validasi Header & Warning**

```javascript
const validateAndReportMissingSubjects = (headerRow) => {
  const trimmedHeader = headerRow.map(h => 
    h ? String(h).trim().toLowerCase() : ''
  );
  
  const foundSubjects = [];
  const unrecognizedSubjects = [];
  
  allSubjectNames.forEach(subjectName => {
    if (trimmedHeader.includes(subjectName.toLowerCase())) {
      foundSubjects.push(subjectName);
    }
  });
  
  // Check untuk mata pelajaran yang ada di file tapi tidak dikenali
  trimmedHeader.forEach((header, idx) => {
    if (header && !header.match(/^(no|nis|nama|rata-rata|keterangan|sakit|izin|tanpa|kepala|wali|kelas|sekolah|fase|semester|tahun|tempat|tanggal|pramuka|pmr)/) 
        && !foundSubjects.map(s => s.toLowerCase()).includes(header)) {
      unrecognizedSubjects.push(header);
    }
  });
  
  return { foundSubjects, unrecognizedSubjects };
};
```

### **Opsi 2: Tambah Logging untuk Debugging**

```javascript
console.warn('⚠️ Unrecognized subjects:', unrecognizedSubjects);
console.info('✅ Recognized subjects:', foundSubjects);
```

### **Opsi 3: User Friendly Alert**

```javascript
if (unrecognizedSubjects.length > 0) {
  alert(`⚠️ Mata pelajaran berikut tidak dikenali dan akan diabaikan:\n${unrecognizedSubjects.join('\n')}`);
}
```

---

## 📊 Truth Table: Edge Cases

| Skenario | Nilai | Mapel Dikenal | Hasil |
|----------|-------|---------------|-------|
| Normal | Ada | Ya | ✅ Nilai ditampilkan |
| Kosong | Kosong | Ya | ➖ Dash (-) ditampilkan |
| Typo | Ada | Tidak | ❌ Mapel diabaikan |
| Invalid | "N/A" | Ya | ➖ Dash (-) ditampilkan |
| Kosong+Typo | Kosong | Tidak | ❌ Mapel diabaikan |

---

## 🔧 Test Cases untuk Validasi

```javascript
// Test Case 1: Nilai Kosong
calculateAverage('', '') → '-'
calculateAverage(85, '') → '-'
calculateAverage('', 81.5) → '-'

// Test Case 2: Nilai Invalid
calculateAverage('N/A', 'N/A') → '-'
calculateAverage('tidak ada', 85) → '-'

// Test Case 3: Nilai Normal
calculateAverage(85, 81.5) → '83.25'
calculateAverage('85', '81,5') → '83.25' (dengan comma)

// Test Case 4: Mata Pelajaran Typo
findSubjectColumns(['Aswaja', 'Matematka', 'Informatika'])
→ { 'Aswaja': {...}, 'Informatika': {...} }
// 'Matematka' tidak akan ada karena typo
```

---

## ✅ Rekomendasi Best Practice

1. **Validasi File Sebelum Upload**
   - Pastikan semua nama mata pelajaran benar (tidak typo)
   - Pastikan KET dan PENG bersebelahan
   - Gunakan data validation di Excel

2. **Dokumentasi untuk Pengguna**
   - Sediakan template Excel yang benar
   - Jelaskan struktur yang diharapkan
   - Buat daftar mata pelajaran yang valid

3. **Logging & Debugging**
   - Console log semua mata pelajaran yang ditemukan
   - Console warn mata pelajaran yang tidak dikenali
   - Tampilkan summary di alert

4. **User Feedback**
   - Tampilkan berapa mata pelajaran yang berhasil dideteksi
   - Warning jika ada mata pelajaran tidak dikenali
   - Helpful error messages

---

## 📝 Catatan Penting

- **Sistem bersifat lenient** (permisif) - tidak error, hanya diabaikan
- **Tidak ada validasi ketat** untuk nama mata pelajaran
- **Nilai kosong** ditampilkan sebagai "-" (user-friendly)
- **Nilai invalid** (bukan angka) juga menampilkan "-"

---

**Last Updated:** 19 Desember 2025  
**Tujuan:** Dokumentasi edge cases dan rekomendasi perbaikan
