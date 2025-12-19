# FAQ - Edge Cases & Troubleshooting

## ❓ Pertanyaan yang Sering Diajukan

### **Q1: Apa yang terjadi jika kolom nilai kosong?**

**A:** 
Sistem akan:
1. ✅ **Tetap memproses data** - tidak ada error
2. ✅ **Menampilkan "-" (dash)** di kolom "Nilai Akhir" 
3. ✅ **Menyimpan nilai kosong** sesuai original

**Contoh:**
```
Aswaja       | KET: 85   | PENG: [kosong] | Nilai Akhir: -
Matematika   | KET: 90   | PENG: 88       | Nilai Akhir: 89.00
```

**Alasan:** Rata-rata hanya bisa dihitung jika **KEDUA** nilai (KET dan PENG) ada dan valid.

---

### **Q2: Mata pelajaran saya tidak ada di list. Apa yang terjadi?**

**A:**
Sistem akan:
1. ✅ **Mengabaikan mata pelajaran tersebut** (tidak diproses)
2. ⚠️ **Menampilkan warning** di alert atau console
3. ✅ **Tetap memproses mata pelajaran lain** yang dikenali

**Contoh Skenario:**
```
File Excel memiliki:
Aswaja | Matematika | MAPEL_BARU | Fisika

Sistem akan memproses:
Aswaja, Matematika, Fisika
(MAPEL_BARU diabaikan)

Alert User:
"⚠️ 1 mata pelajaran tidak dikenali (diabaikan):
MAPEL_BARU"
```

**Solusi:**
- Pastikan nama mata pelajaran benar (tidak typo)
- Lihat daftar mata pelajaran yang didukung
- Edit Excel dan gunakan nama yang tepat

---

### **Q3: Daftar lengkap mata pelajaran yang dikenali apa saja?**

**A:**
Berikut 17 mata pelajaran yang dikenali sistem (case-insensitive, bisa besar/kecil semua):

1. ✅ Aswaja
2. ✅ Bahasa dan Sastra Inggris
3. ✅ Bahasa Indonesia
4. ✅ Biologi
5. ✅ Ekonomi
6. ✅ Fisika
7. ✅ Geografi
8. ✅ Informatika
9. ✅ Kimia
10. ✅ Matematika
11. ✅ Pendidikan Agama Islam
12. ✅ Pendidikan Jasmani Olahraga dan Kesehatan
13. ✅ Pendidikan Pancasila dan Kewarganegaraan
14. ✅ Prakarya dan Kewirausahaan
15. ✅ Sejarah Indonesia
16. ✅ Seni Budaya
17. ✅ Sosiologi

**Catatan:**
- Nama harus **PERSIS** sama (tapi case boleh beda)
- Contoh BENAR: "ASWAJA", "aswaja", "Aswaja"
- Contoh SALAH: "Aswaja1", "Asw aja", "Aswaja " (ada spasi)

---

### **Q4: Bagaimana jika nilai bukan angka? Misalnya "N/A" atau "Tidak Hadir"?**

**A:**
Sistem akan diperlakukan sama seperti nilai kosong:
1. ✅ **Tidak error** - sistem tetap berjalan
2. ✅ **Menampilkan "-"** di Nilai Akhir
3. ✅ **Menyimpan nilai original**

**Contoh:**
```
Aswaja       | KET: Tidak Hadir | PENG: 85 | Nilai Akhir: -
Matematika   | KET: 90          | PENG: N/A| Nilai Akhir: -
Fisika       | KET: TBD         | PENG: TBD| Nilai Akhir: -
```

**Alasan:** `parseFloat("Tidak Hadir")` menghasilkan `NaN` (bukan angka).

---

### **Q5: Bagaimana jika SEMUA nama mata pelajaran typo atau tidak dikenal?**

**A:**
Sistem akan **STOP** dan menampilkan error:

```
❌ Error: Tidak ada mata pelajaran yang dikenali di file!

Pastikan nama mata pelajaran di baris header sudah benar.
```

**Apa yang terjadi:**
1. ❌ File TIDAK akan diload
2. ❌ Data siswa TIDAK akan ditampilkan
3. ✅ Sistem tetap aman (tidak crash)

**Solusi:**
- Periksa kembali nama mata pelajaran
- Bandingkan dengan daftar 17 mapel yang dikenali
- Perbaiki di Excel dan upload ulang

---

### **Q6: Urutan kolom mata pelajaran boleh berbeda antar kelas?**

**A:**
✅ **YA, BOLEH!** Itu adalah fitur utama dynamic column mapping.

**Contoh:**
```
FILE KELAS 10:
Aswaja | Matematika | Bahasa Indonesia | ...

FILE KELAS 11:
Matematika | Aswaja | Bahasa Indonesia | ...

FILE KELAS 12:
Bahasa Indonesia | Matematika | Aswaja | ...

HASIL: Semua bisa diproses dengan benar!
```

**Catatan:**
- Hanya nama yang perlu sama, urutan boleh beda
- Sistem otomatis detect urutan dari file
- Laporan akan tampil sesuai urutan file

---

### **Q7: Kolom KET dan PENG harus di sebelah mana?**

**A:**
✅ **Harus BERSEBELAHAN** - KET di kolom N, PENG di kolom N+1.

**Contoh BENAR:**
```
Kolom C: Aswaja (header)
Kolom D: KET (Ketakwaan)
Kolom E: PENG (Pengetahuan)

Kolom F: Matematika (header)
Kolom G: KET
Kolom H: PENG
```

**Contoh SALAH:**
```
Kolom C: Aswaja
Kolom D: Matematika (KET dipindah)
Kolom E: Aswaja KET
Kolom F: Aswaja PENG (sudah terpisah!)
```

**Akibat SALAH:** Nilai akan terbaca salah atau menjadi dash.

---

### **Q8: Bagaimana cara debug jika ada problem?**

**A:**
Buka **Browser DevTools** (tekan **F12**), lalu:

**Step 1: Tab Console**
```
Lihat semua log messages:

✅ "Dynamic subject columns found: {...}"
  → Menunjukkan mapel yang dideteksi

⚠️ "Unrecognized subjects (akan diabaikan): [...]"
  → Menunjukkan mapel yang tidak dikenal

"Header validation: {...}"
  → Menunjukkan breakdown recognized vs unrecognized
```

**Step 2: Copy data dari console**
```javascript
// Klik di console, copy-paste untuk analisis
{
  'Aswaja': { ketIndex: 3, pengIndex: 4 },
  'Matematika': { ketIndex: 5, pengIndex: 6 },
  ...
}
```

**Step 3: Verifikasi manually**
- Bandingkan `ketIndex` dan `pengIndex` dengan file Excel
- Cek apakah urutan kolom sesuai ekspektasi

---

### **Q9: Nilai 0 bagaimana? Apa dihitung sebagai kosong?**

**A:**
✅ **TIDAK, nilai 0 dihitung normal.**

**Contoh:**
```
Input: calculateAverage(0, 0)
Processing:
  - ketVal = 0
  - pengVal = 0
  - isNaN(0) → false (0 adalah valid!)
  - avg = (0 + 0) / 2 = 0
Output: "0.00"

Input: calculateAverage(80, 0)
Output: "40.00"

Input: calculateAverage(0, '')
Output: "-" (kosong tidak valid)
```

**Catatan:** Nilai 0 adalah nilai yang legitimate, bukan kosong.

---

### **Q10: Apakah ada limit jumlah siswa atau mata pelajaran?**

**A:**
Tidak ada limit hard-coded, tapi pertimbangkan:

**Jumlah Siswa:**
- ✅ Tested: 50+ siswa
- ⚠️ Performa: 1000+ siswa mungkin agak slow saat print
- Rekomendasi: Perkelompok max 100-200 siswa

**Jumlah Mata Pelajaran:**
- ✅ Built-in: 17 mapel
- ⚠️ Layout: Print halaman 1 fit jika ≤ 17 mapel
- Rekomendasi: Tidak tambah mapel baru tanpa test layout

---

### **Q11: Bagaimana jika file format (delimiter) salah?**

**A:**
Sistem akan error saat parsing:

```
Alert: "❌ Gagal membaca file.
Error: [error message]"
```

**Penyebab Umum:**
- File bukan Excel (.xlsx atau .csv)
- Delimiter bukan semicolon (;)
- File corrupt atau tidak valid

**Solusi:**
- Pastikan file .xlsx atau .csv
- Gunakan semicolon (;) sebagai delimiter
- Re-save file di Excel dan coba lagi

---

### **Q12: Data siswa tidak muncul setelah upload. Kenapa?**

**A:**
Beberapa kemungkinan:

**1. Baris header salah**
```
System mencari header di baris 7 (index 6).
Jika header bukan di baris itu → tidak deteksi mapel
```

**2. Tidak ada mata pelajaran yang dikenal**
```
Alert: "❌ Error: Tidak ada mata pelajaran yang dikenali"
→ Harus perbaiki nama mapel di file
```

**3. Tidak ada data siswa**
```
Alert: "✅ Berhasil memuat 0 siswa"
→ Periksa apakah data ada di baris 9+
```

**4. Nama siswa kosong**
```
Sistem skip baris jika kolom Nama (index 2) kosong
→ Pastikan ada nama di setiap baris siswa
```

---

### **Q13: Bisakah menggunakan format komma (,) untuk desimal?**

**A:**
✅ **YA, sudah support!**

Sistem otomatis convert:
```javascript
parseFloat(String(ket).replace(',', '.'))

// Contoh:
'85,5' → parseFloat('85.5') → 85.5
'90,25' → parseFloat('90.25') → 90.25
'85' → parseFloat('85') → 85
```

**Jadi kedua format bisa:**
```
Format 1: 85.5 (dot)   ✅ Supported
Format 2: 85,5 (comma) ✅ Supported (auto convert)
```

---

### **Q14: Berapa banyak subject yang bisa diakses?**

**A:**
Sistem bisa mendeteksi hingga **17 mata pelajaran yang terdaftar**.

Jika lebih dari 17 mata pelajaran dibutuhkan:
1. Tambahkan ke array `allSubjectNames` di code
2. Update dokumentasi
3. Test layout print apakah masih fit

**Contoh menambah mapel baru:**
```javascript
const allSubjectNames = [
  // ... existing 17 items ...
  'Mapel Baru Yang Ingin Ditambah'  // ← tambah di sini
];
```

---

### **Q15: Apakah ada minimal jumlah sheet yang harus ada?**

**A:**
✅ **Minimal 1 sheet (sheet Nilai saja).**

Tapi untuk fitur lengkap:
```
Sheet 1: Nilai (required)
  → Data nilai KET & PENG

Sheet 2: Deskripsi (optional)
  → Capaian kompetensi TP1 & TP2

Sheet 3: Pelengkap (optional)
  → Kokurikuler, ekstrakurikuler, ketidakhadiran
```

**Skenario:**
- Jika hanya Sheet 1 → Lapor dengan nilai saja
- Jika Sheet 1+2 → Lapor dengan nilai + deskripsi
- Jika semua → Lapor lengkap

Sistem otomatis detect dan process sesuai sheet yang ada.

---

## 🆘 Cara Report Issue

Jika menemukan masalah:

1. **Buka Console** (F12)
2. **Copy error message**
3. **Berikan info:**
   - File yang digunakan
   - Pesan error (dari alert atau console)
   - Screenshot jika perlu
4. **Hubungi developer**

---

**Last Updated:** 19 Desember 2025  
**Version:** 1.0 - Edge Case Handling  
**Questions?** Lihat documentation files lainnya atau hubungi developer.
