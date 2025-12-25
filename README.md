# 📊 Rapor App - Aplikasi Laporan Nilai Siswa

## 🎯 Deskripsi

Rapor App adalah aplikasi web berbasis React untuk mengelola dan menampilkan laporan nilai siswa (rapor) dengan fitur:

- ✅ Upload file Excel dengan data siswa dan nilai
- ✅ Dynamic column mapping (urutan kolom mata pelajaran fleksibel)
- ✅ Tampilkan data siswa dalam format terorganisir
- ✅ Cetak laporan nilai individual
- ✅ Generate & cetak semua siswa sekaligus
- ✅ Export data dalam format Excel

---

## 🚀 Quick Start

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

## 📚 Dokumentasi Utama

Semua panduan terbaru telah disatukan di satu file utama untuk memudahkan Bapak:

👉 **[PANDUAN_UTAMA.md](docs/PANDUAN_UTAMA.md)** (Panduan Lengkap & Terupdate)

---

### Folder Dokumentasi (`docs/`)
- **[REKAP_PERBAIKAN.md](docs/REKAP_PERBAIKAN.md)**: Ringkasan teknis perbaikan terakhir (Font Size, Menu 1-5, PWA).
- **[archive/](docs/archive/)**: Folder yang berisi arsip dokumentasi teknis versi lama.


---

## 📂 Project Structure

```
rapor-app/
├── src/
│   ├── App.js              # Main component
│   ├── App.css             # Styling
│   ├── index.js            # Entry point
│   └── ...
├── public/
│   ├── index.html
│   └── ...
├── docs/                   # Dokumentasi lengkap (12 file)
│   ├── QUICK_ANSWER.md
│   ├── COMPLETE_ANSWER_EDGE_CASES.md
│   ├── DYNAMIC_COLUMN_MAPPING.md
│   ├── EDGE_CASES_SUMMARY.md
│   ├── EDGE_CASE_HANDLING_DETAILED.md
│   ├── EDGE_CASE_VISUAL_FLOWS.md
│   ├── EDGE_CASES_ANALYSIS.md
│   ├── FAQ_EDGE_CASES.md
│   ├── TESTING_DYNAMIC_COLUMNS.md
│   ├── DOCUMENTATION_INDEX.md
│   ├── SUMMARY_IMPLEMENTATION.md
│   └── AGENT.md
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md               # File ini
```

---

## 🔧 Teknologi yang Digunakan

| Aspek | Teknologi |
|-------|-----------|
| Frontend | React 19 |
| Styling | Tailwind CSS 3 |
| Build Tool | Create React App 5 |
| Icons | Lucide React |
| Data Format | Excel (XLSX) |
| CSS Processing | PostCSS + Autoprefixer |

---

## 📖 Format File Excel yang Diharapkan

File Excel harus memiliki struktur:

**Baris 1-5:** Info sekolah  
**Baris 7:** Header mata pelajaran (case-insensitive, urutan boleh berbeda)  
**Baris 8:** Tipe komponen (KET/PENG)  
**Baris 9+:** Data siswa  

**Contoh Header:**
```
No;NIS;Nama;Aswaja;Matematika;Bahasa Indonesia;...
```

---

## 🎓 Mata Pelajaran yang Didukung (28 item)

1. Pendidikan Agama Islam
2. Pendidikan Pancasila dan Kewarganegaraan
3. Bahasa Indonesia
4. Matematika
5. Sejarah Indonesia
6. Bahasa Inggris
7. Pendidikan Jasmani Olahraga dan Kesehatan
8. Seni Budaya
9. Teknologi Informasi dan Komunikasi
10. Informatika
11. Prakarya dan Kewirausahaan
12. Bahasa Daerah/Jawa
13. Aswaja
14. Fisika
15. Kimia
16. Biologi
17. Sejarah/Sejarah Peminatan
18. Geografi
19. Sosiologi
20. Ekonomi
21. Ekonomi Akuntansi
22. Antropologi
23. Bahasa dan Sastra Arab
24. Bahasa dan Sastra Indonesia
25. Bahasa dan Sastra Inggris
26. Bahasa Indonesia Tingkat Lanjut
27. Bahasa Inggris Tingkat Lanjut
28. Keterampilan Bahasa Inggris

---

## ✨ Fitur Unggulan

### Dynamic Column Mapping
✅ File dengan urutan kolom berbeda bisa diproses otomatis  
✅ Asalkan nama mata pelajaran sama  
✅ Support kelas 10, 11, 12 dengan urutan berbeda-beda  

### Robust Edge Case Handling
✅ Nilai kosong → Display "-", tidak error  
✅ Mapel tidak dikenal → Skip & warn user  
✅ Sistem permissive tapi safe  
✅ User selalu informed  

---

## 🐛 Troubleshooting

### "Mapel tidak terdeteksi"
→ Lihat: [FAQ_EDGE_CASES.md](docs/FAQ_EDGE_CASES.md)

### "Nilai tampil dash (-)"
→ Lihat: [FAQ_EDGE_CASES.md](docs/FAQ_EDGE_CASES.md#q1-apa-yang-terjadi-jika-kolom-nilai-kosong)

### "Error saat upload file"
→ Lihat: [FAQ_EDGE_CASES.md](docs/FAQ_EDGE_CASES.md#q12-data-siswa-tidak-muncul-setelah-upload-kenapa)

### "Ingin test feature"
→ Lihat: [TESTING_DYNAMIC_COLUMNS.md](docs/TESTING_DYNAMIC_COLUMNS.md)

---

## 🔍 Debugging

1. Buka Browser DevTools (F12)
2. Buka Tab **Console**
3. Lihat log messages untuk debug info
4. Cari file dokumentasi terkait di folder `docs/`

---

## 📝 Catatan Pengembangan

- **Terakhir Update:** 19 Desember 2025
- **Status:** Production-Ready ✅
- **Version:** 0.1.0
- **Dokumentasi:** Lengkap (12 file di folder `docs/`)

---

## 📞 Support

Jika ada pertanyaan atau issue:

1. Buka file dokumentasi di folder `docs/`
2. Cari jawaban di [FAQ_EDGE_CASES.md](docs/FAQ_EDGE_CASES.md)
3. Lihat [DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md) untuk navigasi lengkap

---

**Dokumentasi lengkap tersedia di folder [`docs/`](docs/)**  
**Mulai dari: [QUICK_ANSWER.md](docs/QUICK_ANSWER.md) atau [DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)**

Happy coding! 🚀

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
