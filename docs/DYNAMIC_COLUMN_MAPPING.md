# Dynamic Column Mapping - Dokumentasi Perubahan

## 📋 Ringkasan Perubahan

Aplikasi telah diperbarui dengan **logika dynamic column mapping** yang memungkinkan file Excel dengan urutan mata pelajaran yang berbeda tetap dapat diproses dengan benar, selama nama mata pelajaran identik di semua tingkat (kelas 10, 11, 12).

---

## 🔄 Perubahan Utama

### 1. Penghapusan Hard-Coded Column Mapping
**Sebelumnya:**
```javascript
const subjectMappings = [
  { name: 'Pendidikan Agama Islam', ket: 'X', peng: 'Y' },
  { name: 'Aswaja', ket: 'D', peng: 'E' },
  // ... fixed column positions
];
```

**Sesudahnya:**
```javascript
const allSubjectNames = [
  'Pendidikan Agama Islam',
  'Aswaja',
  // ... nama mata pelajaran saja, tanpa posisi tetap
];
```

### 2. Fungsi Baru: `findSubjectColumns()`
Fungsi ini secara dinamis mencari posisi kolom mata pelajaran dengan:
- Membaca header dari baris 7 (index 6) file Excel
- Membandingkan nama mata pelajaran (case-insensitive)
- Mengembalikan index kolom KET dan PENG untuk setiap mata pelajaran yang ditemukan

```javascript
const findSubjectColumns = (headerRow) => {
  const subjectColumns = {};
  
  // Trim dan lowercase header untuk perbandingan
  const trimmedHeader = headerRow.map(h => 
    h ? String(h).trim().toLowerCase() : ''
  );
  
  allSubjectNames.forEach(subjectName => {
    const subjectLower = subjectName.toLowerCase();
    let foundIndex = -1;
    
    // Cari index kolom yang sesuai dengan nama mata pelajaran
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

### 3. State Baru: `subjectOrder`
```javascript
const [subjectOrder, setSubjectOrder] = useState([]); // Track subject order from file
```

Menyimpan urutan mata pelajaran seperti yang muncul di file Excel.

### 4. Parsing Data yang Dinamis
**handleFileUpload** sekarang:
1. Membaca header dari baris 7
2. Menggunakan `findSubjectColumns()` untuk menemukan kolom
3. Memproses data siswa berdasarkan index kolom yang ditemukan (bukan hard-coded)
4. Menyimpan urutan mata pelajaran untuk rendering

```javascript
// Find subject columns dynamically from header row (row 7, index 6)
const headerRow = nilaiData[6] || [];
const subjectColumns = findSubjectColumns(headerRow);

console.log('Dynamic subject columns found:', subjectColumns);

// ... processing menggunakan subjectColumns
Object.entries(subjectColumns).forEach(([subjectName, indices]) => {
  const ketVal = row[indices.ketIndex];
  const pengVal = row[indices.pengIndex];
  
  studentMap[nama].subjects[subjectName] = {
    KET: ketVal,
    PENG: pengVal,
    avg: calculateAverage(ketVal, pengVal)
  };
});
```

### 5. Render dengan Urutan Dinamis
**RaporPage1** sekarang menggunakan `subjectOrder` dari state:
```javascript
const RaporPage1 = ({ student }) => {
  // Display subjects in the order they appeared in the file
  const displaySubjects = subjectOrder.map(subjectName => ({
    name: subjectName,
    data: student?.subjects[subjectName]
  })).filter(s => s.data);
  
  // ... render
};
```

---

## ✅ Keuntungan

| Fitur | Sebelumnya | Sesudahnya |
|-------|-----------|-----------|
| **Fleksibilitas Urutan Kolom** | Hanya urutan tetap (X, Y, D, E, ...) | Urutan kolom apapun bisa |
| **Nama Identik Antar Kelas** | Harus posisi kolom sama | Cukup nama sama, posisi boleh beda |
| **Perubahan File** | Perlu edit kode | Otomatis detect dari file |
| **Support Kelas 10, 11, 12** | Terbatas posisi tetap | Support otomatis semua urutan |
| **Maintainability** | Sulit saat perubahan struktur | Robust terhadap perubahan |

---

## 📊 Format File yang Didukung

File Excel harus tetap memiliki struktur:
- **Baris 1-5**: Info sekolah
- **Baris 7**: Header dengan nama mata pelajaran (case-insensitive, bisa urutan apapun)
- **Baris 8**: Tipe komponen (KET/PENG)
- **Baris 9+**: Data siswa

Contoh Header yang Valid:
```
No;NIS;Nama;Aswaja;Matematika;Bahasa Indonesia;Fisika;...
```

atau

```
No;NIS;Nama;Matematika;Aswaja;Fisika;Bahasa Indonesia;...
```

Keduanya akan bekerja karena nama mata pelajaran sama dan urutan dideteksi otomatis!

---

## 🔍 Debugging Console

Setiap kali file diupload, console akan menampilkan:
```
Available sheets: (3) ['Nilai', 'Deskripsi', 'Pelengkap']
Dynamic subject columns found: {
  'Aswaja': { ketIndex: 3, pengIndex: 4 },
  'Matematika': { ketIndex: 4, pengIndex: 5 },
  ...
}
```

Gunakan Browser DevTools (F12) → Console untuk debugging.

---

## 🎯 Use Cases

### Skenario 1: Kelas 10 - Urutan Awal
```
Aswaja | Matematika | Bahasa Indonesia | ...
```

### Skenario 2: Kelas 11 - Urutan Berbeda
```
Matematika | Aswaja | Bahasa Indonesia | ...
```

### Skenario 3: Kelas 12 - Urutan Lain
```
Bahasa Indonesia | Aswaja | Matematika | ...
```

**Hasil:** Semua bisa diproses dengan benar karena nama mata pelajaran sudah sama! ✅

---

## 📝 Catatan Penting

1. **Header Row Index**: Masih menggunakan index 6 (baris 7). Jika struktur file berubah, update nilai ini di:
   ```javascript
   const headerRow = nilaiData[6] || [];
   ```

2. **Case Sensitivity**: Header comparison adalah case-insensitive, jadi "Aswaja" = "ASWAJA" = "aswaja"

3. **KET & PENG**: Fungsi masih menganggap KET selalu di kolom N, PENG di kolom N+1. Jika berbeda, modifikasi `findSubjectColumns()`

4. **Multiple Sheets**: Logika juga diterapkan ke sheet 2 (Deskripsi) dan sheet 3 (Pelengkap) secara otomatis

---

## 🚀 Testing

Untuk test aplikasi:

1. Buat file Excel dengan susunan kolom berbeda
2. Pastikan nama mata pelajaran tetap sama di semua tingkat
3. Upload file
4. Lihat console untuk memverifikasi kolom terdeteksi dengan benar
5. Laporan harus menampilkan data dengan urutan sesuai file

---

**Last Updated:** 19 Desember 2025  
**Modified by:** Dynamic Column Mapping Implementation
