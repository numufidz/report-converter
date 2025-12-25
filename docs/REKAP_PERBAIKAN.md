# Dokumentasi Perbaikan Aplikasi Rapor Kurikulum Merdeka

Dokumen ini merangkum seluruh perubahan dan fitur baru yang telah diimplementasikan untuk meningkatkan fungsionalitas dan tampilan profesional aplikasi.

---

## 1. Kontrol Ukuran Font Capaian Kompetensi 📏

### Tujuan
Memberikan kendali kepada pengguna untuk menyesuaikan ukuran teks pada kolom "Capaian Kompetensi" agar laporan tidak meluber ke halaman ketiga saat jumlah mata pelajaran banyak.

### Detail Implementasi
- **State Management**: Menambahkan state `competencyFontSize` (default: 10px, urutan: 8px - 14px).
- **UI Kontrol**: Menu baru "**5. Ukuran Font**" dengan tombol **[ - ]** dan **[ + ]**.
- **Rendering**: Menggunakan inline style `fontSize` dan `lineHeight: 1.2` pada sel tabel deskripsi (TP1 & TP2).
- **Cakupan**: Berlaku pada Layout Kelas 10 dan Kelas 11/12, serta sinkron saat *Print Preview*.

### Cara Penggunaan
1. Lihat seksi berwarna oranye (Menu 5) di navigasi.
2. Klik tombol **[ - ]** untuk memperkecil jika teks terlalu panjang.
3. Klik tombol **[ + ]** untuk memperbesar jika ruang masih tersedia.
4. Perubahan akan langsung terlihat di layar dan saat dicetak.

---

## 2. Restrukturisasi Navigasi UI

### Desktop
- Menu disusun ulang menjadi 5 kolom berurutan:
  1. **Upload Excel**
  2. **Spreadsheet (Cloud)**
  3. **Pilih Layout**
  4. **Pilih Siswa** (diberi proporsi lebih lebar)
  5. **Ukuran Font**
- Penyesuaian `gridTemplateColumns` untuk keseimbangan visual yang optimal.

### Mobile
- Menu diatur dalam 2 kolom:
  - **Kolom Kiri**: Navigasi urutan 1, 2, dan 3.
  - **Kolom Kanan**: Navigasi urutan 4 dan 5 (Ukuran Font berada di bawah Pilih Siswa).
- Menu tidak tertutup otomatis setelah aksi (seperti Tarik Data) agar user bisa melakukan penyesuaian berulang dengan mudah.

---

## 3. Optimasi PWA & Manifest Profesional

### PWA Manifest (`manifest.json`)
- **Nama Aplikasi**: "Aplikasi Rapor Kurikulum Merdeka".
- **Short Name**: "Rapor Kurmer".
- **Deskripsi**: Penyesuaian deskripsi agar lebih formal dan profesional.
- **Warna Tema**: Indigo Blue (`#1e40af`) untuk menyelaraskan dengan UI.
- **Shortcuts**: Menambahkan akses cepat untuk "Tarik Data Cloud" dan "Upload Excel".

### Ikon & Logo (Fix Kotak Putih)
- **Maskable Icons**: Menggunakan konfigurasi `purpose: "maskable"`.
- **Lokasi Aset**: Semua ikon dipusatkan di folder `public/icons/`.
- **Transparansi**: Memastikan logo tetap berbentuk lingkaran sempurna di Android/iOS tanpa latar belakang kotak putih.

---

## 4. Perbaikan Teknis Lainnya
- Menghapus fungsi tidak terpakai untuk membersihkan build pada Netlify.
- Sinkronisasi meta tags pada `index.html` dengan manifest PWA.
- Penyesuaian proporsi tabel agar lebih presisi.

---
> [!TIP]
> **Rekomendasi Font**: Gunakan ukuran **9px - 10px** untuk laporan padat dan **12px** untuk tampilan standar.
