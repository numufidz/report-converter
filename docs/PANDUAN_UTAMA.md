# 📄 Panduan Utama: Aplikasi Rapor Kurikulum Merdeka

Selamat datang di panduan lengkap penggunaan Aplikasi Rapor Kurikulum Merdeka. Dokumen ini adalah sumber informasi tunggal untuk seluruh fitur, konfigurasi, dan panduan penggunaan aplikasi.

---

## 🎯 1. Gambaran Umum Aplikasi
Aplikasi ini dirancang untuk memudahkan Guru dan Wali Kelas dalam mengelola laporan hasil belajar siswa secara digital. Mendukung data dari file Excel fisik maupun integrasi langsung dengan Google Sheets.

### Fitur Unggulan:
*   **Multi-Platform**: Lancar diakses melalui Laptop (Desktop) maupun HP (Mobile).
*   **Dual Mode Data**: Bisa upload file `.xlsx` manual atau tarik data otomatis dari Cloud.
*   **Dynamic Mapping**: Urutan kolom mata pelajaran di Excel bebas, sistem akan mendeteksi secara otomatis.
*   **PWA Ready**: Bisa diinstal sebagai aplikasi di layar utama HP (Home Screen).
*   **Kontrol Presisi**: Pengaturan ukuran font untuk memastikan laporan pas di kertas.

---

## ⚙️ 2. Alur Navigasi (Menu 1 - 5)
Navigasi disusun secara logis (1-5) untuk memandu alur kerja Bapak:

1.  **1. Upload Excel**: Gunakan jika Bapak memiliki file rapor di komputer.
2.  **2. Spreadsheet (Cloud)**: Gunakan jika Bapak menggunakan data yang tersinkron di Google Sheets. Pilih kelas, lalu klik "Tarik Data Terbaru".
3.  **3. Pilih Layout**: Pilih antara **Kelas 10** atau **Kelas 11/12** sesuai kebutuhan format rapor.
4.  **4. Pilih Siswa**: Pilih nama siswa, lalu tentukan mode tampilan (1 Siswa / Semua) dan gunakan tombol **Cetak**.
5.  **5. Ukuran Font**: Fitur khusus untuk mengecilkan teks deskripsi (TP) jika laporan meluas hingga 3 halaman.

---

## 📏 3. Pengaturan Ukuran Font (Fitur Baru)
Jika jumlah mata pelajaran sangat banyak, tulisan "Capaian Kompetensi" mungkin akan memakan terlalu banyak ruang.
- Klik **[ - ]** untuk mengecilkan font (sampai 8px).
- Klik **[ + ]** untuk membesarkan font (sampai 14px).
- **Rekomendasi**: Gunakan ukuran **9px atau 10px** untuk laporan yang sangat padat.

---

## 📱 4. Penggunaan di Smartphone (Mobile & PWA)
Aplikasi ini sudah dioptimalkan untuk HP:
- **Logo Lingkaran**: Manifest sudah diperbaiki agar logo tampil lingkaran sempurna (tanpa kotak putih).
- **Instalasi**: Di browser HP, klik menu browser lalu pilih "**Add to Home Screen**" (Tambahkan ke Layar Utama).
- **Shortcuts**: Tahan ikon aplikasi di layar utama untuk masuk langsung ke menu *Upload* atau *Tarik Data Cloud*.

---

## 📊 5. Format File Excel yang Diharapkan
Agar sistem dapat membaca data dengan benar, file Excel harus mengikuti standar berikut:

| Baris | Konten |
|-------|---------|
| 1 - 6 | Identitas sekolah (Nama Sekolah, Alamat, Kelas, Fase, Semester, Tahun Ajaran) |
| 7 | Nama Mata Pelajaran (Contoh: Matematika, Bahasa Indonesia, dll) |
| 8 | Header Teknis (KET, PENG, TP1, TP2) |
| 10+ | Data Siswa (No, NIS, Nama, dan Nilai) |

> [!IMPORTANT]
> Sistem akan mendeteksi mapel secara dinamis berdasarkan nama kolom di baris 7. Pastikan nama mapel sesuai dengan daftar 28 mapel standar yang didukung.

---

## 🐛 6. Troubleshooting & FAQ

**Q: Kenapa mapel tertentu tidak muncul?**
Pastikan nama kolom di Excel Bapak persis sama dengan daftar mapel yang dikenali sistem. Cek juga konsol browser (F12) untuk melihat pesan bantuan.

**Q: Nilai tampil tanda strip (-)?**
Ini terjadi jika kolom KET atau PENG di Excel kosong. Sistem akan menampilkan strip agar laporan tetap terlihat rapi bukannya menampilkan error.

**Q: Bagaimana cara menyimpan sebagai PDF?**
Setelah klik tombol **Cetak**, pada menu Printer, pilih tujuan tujuan: "**Save as PDF**" atau "**Simpan sebagai PDF**".

---
**Status Dokumentasi**: Terupdate per 26 Desember 2025  
**Lokasi Arsip**: Jika Bapak membutuhkan detail teknis versi lama, silakan cek folder `docs/archive/`.
