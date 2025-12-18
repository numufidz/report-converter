# Analisis Proyek Rapor App

## 📋 Ringkasan Proyek

**Nama Proyek:** Rapor App  
**Versi:** 0.1.0  
**Tipe Proyek:** React Web Application  
**Status:** Development

---

## 🎯 Deskripsi Proyek

Rapor App adalah aplikasi web berbasis React yang dirancang untuk mengelola dan menampilkan laporan nilai siswa (rapor). Aplikasi ini memungkinkan pengguna untuk:

- Mengunggah file Excel yang berisi data siswa dan nilai
- Menampilkan data siswa dalam format yang terorganisir
- Memilih tampilan antara single student atau all students
- Mencetak laporan nilai siswa
- Mengekspor data dalam format Excel

---

## 🏗️ Struktur Proyek

```
rapor-app/
├── public/              # Assets statis dan HTML utama
│   ├── index.html      # Template HTML utama
│   ├── manifest.json   # PWA manifest
│   └── robots.txt      # SEO robots directive
├── src/                # Source code aplikasi
│   ├── App.js          # Komponen utama aplikasi (461 lines)
│   ├── App.css         # Styling komponen App
│   ├── App.test.js     # Unit tests untuk App
│   ├── index.js        # Entry point aplikasi
│   ├── index.css       # Global styling
│   ├── setupTests.js   # Konfigurasi testing
│   └── reportWebVitals.js # Performance metrics
├── package.json        # Konfigurasi dependencies
├── tailwind.config.js  # Konfigurasi Tailwind CSS
├── postcss.config.js   # Konfigurasi PostCSS
└── README.md          # Dokumentasi standar CRA
```

---

## 📦 Dependencies

### Core Dependencies
- **react** (^19.2.3) - Framework utama
- **react-dom** (^19.2.3) - React DOM renderer
- **react-scripts** (5.0.1) - Build tools (Create React App)

### UI & Icons
- **lucide-react** (^0.561.0) - Icon library (Upload, Printer, FileSpreadsheet)

### Data Processing
- **xlsx** (^0.18.5) - Excel file parsing dan manipulation

### Testing
- @testing-library/react (^16.3.1)
- @testing-library/dom (^10.4.1)
- @testing-library/jest-dom (^6.9.1)
- @testing-library/user-event (^13.5.0)

### Styling
- **tailwindcss** (^3.4.19) - Utility-first CSS framework
- **autoprefixer** (^10.4.23) - CSS vendor prefixes
- **postcss** (^8.5.6) - CSS transformations

### Performance Monitoring
- **web-vitals** (^2.1.4) - Web performance metrics

---

## 🎨 Teknologi & Tools

| Aspek | Teknologi |
|-------|-----------|
| Frontend Framework | React 19 |
| Styling | Tailwind CSS 3 |
| Build Tool | Create React App 5 |
| Icon Library | Lucide React |
| Data Format | Excel (XLSX) |
| CSS Processing | PostCSS + Autoprefixer |
| Testing Framework | Jest + React Testing Library |

---

## 🔄 Fitur Utama (dari App.js)

### 1. Upload File CSV/Excel
- Menerima file CSV/Excel (.xlsx, .csv)
- Parse data dengan membaca baris 1 (nama mata pelajaran) dan baris 2 (komponen KET/PENG)
- Ekstrak semua mata pelajaran secara dinamis
- Skip baris "RATA-RATA KELAS" secara otomatis

### 2. Data Processing Dinamis
- Parsing otomatis untuk SEMUA mata pelajaran dalam file
- Menghitung rata-rata nilai dari KET (Ketakwaan) dan PENG (Pengetahuan)
- Struktur data siswa:
  ```javascript
  {
    No, NIS, Nama,
    subjects: {
      "Aswaja": { KET: 85, PENG: 81.5, avg: 83.25 },
      "Bahasa Indonesia": { ... },
      ...
    }
  }
  ```

### 3. Kategori Mata Pelajaran
- **Kelompok Wajib (A)**: 8 mata pelajaran inti
- **Kelompok Pilihan (B)**: Subjek pilihan siswa (min 1)
- Tampilan otomatis sesuai data yang ada

### 4. View Modes
- **Single View**: Menampilkan data satu siswa dengan laporan lengkap 2 halaman
- **All View**: Menampilkan semua siswa secara berurutan

### 5. Actions
- Print laporan individual
- Generate & Print Semua siswa sekaligus
- Tampilan laporan siap cetak dengan format A4

---

## 📊 Scripts Available

```bash
npm start       # Run development server (localhost:3000)
npm run build   # Build untuk production
npm test        # Run tests
npm run eject   # Eject dari Create React App (one-way operation)
```

---

## ✅ Checklist Implementasi

### Completed
- ✅ Setup React project dengan Create React App
- ✅ Integrasi Tailwind CSS
- ✅ Import Lucide React icons
- ✅ Excel file parsing dengan XLSX
- ✅ Component structure untuk Rapor App

### In Development
- 🔄 UI components rendering
- 🔄 Print functionality
- 🔄 Export to Excel feature
- 🔄 Pagination logic
- 🔄 Data validation

### To Do
- ⏳ Error handling & user feedback
- ⏳ Responsive design testing
- ⏳ Unit tests completion
- ⏳ Performance optimization
- ⏳ Deployment configuration

---

## 🚀 Cara Menjalankan

### Prerequisites
- Node.js (v14+)
- npm atau yarn

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build untuk production
npm run build
```

---

## 📝 Environment Notes

- **OS:** Windows (PowerShell)
- **Root Path:** `d:\Program\Antigravity\rapor-app`
- **Entry Point:** `src/index.js`
- **Main Component:** `src/App.js` (461 lines)

---

## 🔍 Data Format Expected

File CSV/Excel harus memiliki struktur:

**Baris 1 (Header Mata Pelajaran):**
```
No;NIS;Nama;Aswaja;Bahasa dan Sastra Inggris;Bahasa Indonesia;Biologi;Ekonomi;Fisika;Geografi;Informatika;Kimia;Matematika;Pendidikan Agama Islam;Pendidikan Jasmani Olahraga dan Kesehatan;Pendidikan Pancasila dan Kewarganegaraan;Prakarya dan Kewirausahaan;Sejarah Indonesia;Sosiologi;RATA-RATA
```

**Baris 2 (Komponen Penilaian):**
```
;;KET;PENG;KET;PENG;KET;PENG;KET;PENG;KET;PENG;KET;PENG;KET;PENG;KET;PENG;KET;PENG;KET;PENG;KET;PENG;KET;PENG;KET;PENG;KET;PENG;KET;PENG;
```

**Baris 3+ (Data Siswa):**
Setiap siswa memiliki:
- No, NIS, Nama
- Untuk setiap mata pelajaran: KET (Ketakwaan) dan PENG (Pengetahuan)

**Contoh:**
```
1;445;ADINDA FATISA;85;81,5;85;80,2;85;78,86;...
2;446;AMEL SITI NURJANNAH;85;76,5;80;76;80;78,86;...
```

**Baris Terakhir:** RATA-RATA KELAS (akan di-skip otomatis)

### Mata Pelajaran Wajib (Kelompok A):
1. Pendidikan Agama Islam
2. Aswaja
3. Pendidikan Pancasila dan Kewarganegaraan
4. Bahasa Indonesia
5. Matematika
6. Bahasa dan Sastra Inggris
7. Pendidikan Jasmani Olahraga dan Kesehatan
8. Sejarah Indonesia

### Mata Pelajaran Pilihan (Kelompok B):
1. Biologi
2. Ekonomi
3. Fisika
4. Geografi
5. Informatika
6. Kimia
7. Sosiologi
8. Prakarya dan Kewirausahaan

---

## 📌 Key Functions (App.js)

- `handleFileUpload()` - Proses upload dan parsing file Excel
- `calculateAverage()` - Hitung rata-rata nilai dua komponen
- View rendering untuk single & all students modes
- Print & Export handlers

---

## 🎓 Tujuan Aplikasi

Rapor App dirancang untuk mempermudah:
1. **Input Data** - Menggunakan Excel sebagai source
2. **Manajemen Nilai** - Tracking nilai siswa per subject
3. **Pelaporan** - Generate laporan yang bisa di-print
4. **Distribusi Data** - Export data dalam format Excel

---

## 📄 License

Default Create React App configuration

---

**Last Updated:** December 18, 2025  
**Created by:** AI Agent Analysis
