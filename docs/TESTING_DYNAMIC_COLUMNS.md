# Panduan Testing Dynamic Column Mapping

## 📋 Daftar Mata Pelajaran yang Didukung

Berikut adalah nama-nama mata pelajaran yang dapat dikenali oleh sistem (case-insensitive):

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

## 🔬 Cara Testing

### Test Case 1: Urutan Kolom Berbeda (Kelas 10 vs Kelas 11)

**File Kelas 10:**
```
Kolom D: Aswaja
Kolom E: Aswaja (PENG)
Kolom F: Bahasa dan Sastra Inggris
Kolom G: Bahasa dan Sastra Inggris (PENG)
Kolom H: Bahasa Indonesia
Kolom I: Bahasa Indonesia (PENG)
... (urutan sesuai original)
```

**File Kelas 11:**
```
Kolom D: Matematika
Kolom E: Matematika (PENG)
Kolom F: Aswaja
Kolom G: Aswaja (PENG)
Kolom H: Bahasa dan Sastra Inggris
Kolom I: Bahasa dan Sastra Inggris (PENG)
... (urutan BERBEDA)
```

**Hasil yang diharapkan:**
- File Kelas 10 → Aswaja di posisi pertama di laporan
- File Kelas 11 → Matematika di posisi pertama di laporan
- Tapi data Aswaja, Matematika, dll tetap akurat sesuai nama

### Test Case 2: Format Header yang Berbeda (Case-Insensitive)

**Opsi A:**
```
aswaja;matematika;bahasa indonesia;...
```

**Opsi B:**
```
ASWAJA;MATEMATIKA;BAHASA INDONESIA;...
```

**Opsi C:**
```
Aswaja;Matematika;Bahasa Indonesia;...
```

**Hasil yang diharapkan:** Semua opsi harus berhasil karena comparison adalah case-insensitive

---

## ✅ Checklist Verifikasi

- [ ] Upload file Excel dengan urutan kolom berbeda
- [ ] Cek Console (F12 → Console tab) untuk melihat "Dynamic subject columns found"
- [ ] Verifikasi bahwa semua mata pelajaran terdeteksi dengan benar
- [ ] Buka laporan siswa dan periksa:
  - [ ] Urutan mata pelajaran sesuai file (bukan hard-coded)
  - [ ] Nilai KET dan PENG benar
  - [ ] Rata-rata nilai benar
  - [ ] Deskripsi (TP1 & TP2) benar

---

## 🐛 Troubleshooting

### Masalah: Mata pelajaran tidak terdeteksi
**Solusi:**
1. Periksa bahwa nama mata pelajaran di file **persis sesuai** dengan daftar di atas (huruf besar/kecil boleh beda)
2. Periksa bahwa mata pelajaran ada di baris 7 (index 6) file Excel
3. Lihat console log untuk melihat header apa yang terdeteksi

### Masalah: Nilai KET/PENG salah
**Solusi:**
1. Verifikasi bahwa KET dan PENG di kolom yang bersebelahan (N dan N+1)
2. Contoh: Jika "Aswaja" di kolom D, maka:
   - Kolom D = Aswaja (header)
   - Kolom E = KET
   - Kolom F = PENG
   
   ❌ SALAH: Jika layout adalah D=Aswaja, E=Aswaja, F=KET, G=PENG
   ✅ BENAR: Jika layout adalah D=Aswaja, E=KET, F=PENG

### Masalah: Hanya beberapa mata pelajaran terdeteksi
**Solusi:**
1. Pastikan semua mata pelajaran adalah pada **satu baris yang sama** (baris 7)
2. Jangan ada merge cell di baris header
3. Periksa bahwa tidak ada spasi ekstra sebelum/sesudah nama (aplikasi otomatis trim, tapi gunakan TRIM() di Excel jika ragu)

---

## 📊 Contoh Output Harapan (Console)

```
Available sheets: (3) ['Nilai', 'Deskripsi', 'Pelengkap']

Dynamic subject columns found: {
  'Aswaja': { ketIndex: 3, pengIndex: 4 },
  'Bahasa dan Sastra Inggris': { ketIndex: 5, pengIndex: 6 },
  'Bahasa Indonesia': { ketIndex: 7, pengIndex: 8 },
  'Biologi': { ketIndex: 9, pengIndex: 10 },
  'Ekonomi': { ketIndex: 11, pengIndex: 12 },
  'Fisika': { ketIndex: 13, pengIndex: 14 },
  'Geografi': { ketIndex: 15, pengIndex: 16 },
  'Informatika': { ketIndex: 17, pengIndex: 18 },
  'Kimia': { ketIndex: 19, pengIndex: 20 },
  'Matematika': { ketIndex: 21, pengIndex: 22 },
  'Pendidikan Agama Islam': { ketIndex: 23, pengIndex: 24 },
  'Pendidikan Jasmani Olahraga dan Kesehatan': { ketIndex: 25, pengIndex: 26 },
  'Pendidikan Pancasila dan Kewarganegaraan': { ketIndex: 27, pengIndex: 28 },
  'Prakarya dan Kewirausahaan': { ketIndex: 29, pengIndex: 30 },
  'Sejarah Indonesia': { ketIndex: 31, pengIndex: 32 },
  'Seni Budaya': { ketIndex: 33, pengIndex: 34 },
  'Sosiologi': { ketIndex: 35, pengIndex: 36 }
}

Berhasil memuat 25 siswa dari 3 sheet dengan 17 mata pelajaran
```

---

## 🎯 Tips

1. **Console adalah teman Anda**: Selalu periksa console untuk melihat kolom apa yang terdeteksi
2. **Validasi Nama**: Pastikan nama mata pelajaran sama di semua file Excel (kelas 10, 11, 12)
3. **Urutan Boleh Beda**: Urutan kolom mata pelajaran boleh berbeda antar file, asalkan nama sama
4. **KET-PENG Harus Bersebelahan**: KET dan PENG harus selalu di kolom yang bersebelahan (N dan N+1)

---

**Last Updated:** 19 Desember 2025  
**Testing Guide for:** Dynamic Column Mapping Feature
