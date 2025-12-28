# 🤖 AGENT.md - Panduan Agen AI

## Gambaran Proyek
Proyek ini adalah **Aplikasi Rapor Kurikulum Merdeka** berbasis web (React.js) yang dirancang untuk mengelola dan mencetak laporan hasil belajar siswa. Aplikasi ini fokus pada kemudahan penggunaan (User Experience), tampilan yang bersih, dan kemampuan offline/online (PWA).

## 🛠 Tech Stack
- **Framework**: React.js (Create React App)
- **Styling**: Tailwind CSS (Utility-first) + Vanilla CSS (`App.css` untuk style spesifik print)
- **Icons**: Lucide React
- **Data Handling**: `xlsx` (SheetJS) untuk parsing Excel.
- **Build Tool**: `npm` / `react-scripts`

## 📂 Struktur Penting
- `src/App.js`: Komponen utama yang berisi **seluruh logika bisnis** aplikasi (State management, render tabel, parsing Excel).
- `public/`: Folder statis. Logo-logo yang tidak terpakai sudah dibersihkan.
- `docs/`: Dokumentasi pengguna (`PANDUAN_UTAMA.md`) dan riwayat teknis (`REKAP_PERBAIKAN.md`).

## 📝 Konvensi Kode & Gaya
1.  **Bahasa**: Gunakan **Bahasa Indonesia** untuk komentar, dokumentasi, dan komunikasi dengan user (sesuai `user_rules`).
2.  **Styling**: Utama gunakan class Tailwind. Gunakan `style={{}}` inline hanya untuk kebutuhan dinamis (seperti `fontSize` user-controlled).
3.  **Print Friendly**: Pastikan tampilan tetap rapi saat dicetak (`@media print` di `App.css` atau class `print:hidden`).
4.  **Error Handling**: Jangan biarkan aplikasi crash. Jika data kosong, tampilkan `-` atau pesan fallback yang sopan.

## 🚀 Fitur Utama untuk Diperhatikan
- **Dynamic Column Mapping**: Header Excel dideteksi secara case-insensitive. Jangan hardcode indeks kolom jika bisa dihindari.
- **Font Size Control**: User bisa menambah/mengurangi ukuran font deskripsi (TP) melalui UI (Menu 5).
- **Responsive**: Layout berubah drastis antara Desktop (5 kolom menu) dan Mobile (Grid 2 kolom).

## ⚠️ Known Edge Cases
- **Header Excel**: Kadang user mengupload file dengan header di baris yang salah. Logika deteksi header ada di `processWorkbookData` di `App.js`.
- **Nilai Kosong**: Pastikan `calculateAverage` dan render sel menangani `null`/`undefined` dengan mengembalikan `"-"`.

## 🔄 Workflow Agen
1.  **Cek Task**: Selalu update `task.md` sebelum memulai pekerjaan besar.
2.  **Validasi**: Sebelum commit, pastikan `npm start` tidak error dan fitur utama (Render tabel) berjalan.
3.  **Dokumentasi**: Update `REKAP_PERBAIKAN.md` jika melakukan perubahan fitur yang signifikan.
