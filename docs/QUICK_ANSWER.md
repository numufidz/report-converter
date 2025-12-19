# ⚡ QUICK ANSWER - Pertanyaan Anda

## 🎯 Pertanyaan

> "Bagaimana code bekerja jika tidak ada nilai atau isi kolom nilai kosong? Atau ada nama mapel yang tidak ada pada list mapel yang dikenali oleh sistem?"

---

## ⚡ JAWABAN (30 detik baca)

### **Jika Nilai Kosong:**
```
✅ Sistem TIDAK ERROR
✅ Tampilkan "-" (dash) di kolom Nilai Akhir
✅ Proses lanjut ke siswa/mapel berikutnya
```

**Contoh:**
```
Aswaja KET: 85, PENG: [kosong]
→ Nilai Akhir: -
```

---

### **Jika Mapel Tidak Dikenal:**
```
✅ Sistem TIDAK ERROR
✅ Mapel DIABAIKAN (tidak diproses)
✅ Alert user: "X mapel tidak dikenali (diabaikan)"
```

**Contoh:**
```
Header: Aswaja | Matematika | MAPEL_BARU | Fisika
→ Diproses: Aswaja, Matematika, Fisika
→ SKIP: MAPEL_BARU (tidak dikenal)
```

---

### **Jika Semua Mapel Tidak Dikenal:**
```
❌ ERROR ALERT
❌ File TIDAK LOAD
User harus perbaiki Excel
```

---

## 🔍 Bagaimana Caranya?

### **Untuk Nilai Kosong:**
```javascript
const calculateAverage = (ket, peng) => {
  const ketVal = parseFloat(String(ket).replace(',', '.'));
  const pengVal = parseFloat(String(peng).replace(',', '.'));
  
  if (isNaN(ketVal) || isNaN(pengVal)) {
    return '-';  // ← Jika ada kosong → dash
  }
  
  return ((ketVal + pengVal) / 2).toFixed(2);
};
```

### **Untuk Mapel Tidak Dikenal:**
```javascript
const findSubjectColumns = (headerRow) => {
  const subjectColumns = {};
  
  // Loop hanya mapel yang DIKENAL di allSubjectNames
  allSubjectNames.forEach(subjectName => {
    // Cari di header
    const foundIndex = headerRow.findIndex(h => 
      h?.toString().trim().toLowerCase() === subjectName.toLowerCase()
    );
    
    // Hanya simpan jika DITEMUKAN
    if (foundIndex !== -1) {
      subjectColumns[subjectName] = {...};
    }
    // Jika tidak → AUTO SKIP
  });
  
  return subjectColumns;
};
```

---

## 💡 Key Points

| Aspek | Handling |
|-------|----------|
| **Nilai Kosong** | Display "-", continue |
| **Mapel Unknown** | Skip, warn user |
| **Semua Mapel Unknown** | Error, stop |
| **Error Graceful?** | ✅ YA |
| **Aplikasi Crash?** | ✅ TIDAK |

---

## 📚 Dokumentasi Lengkap

Lihat:
- **[COMPLETE_ANSWER_EDGE_CASES.md](COMPLETE_ANSWER_EDGE_CASES.md)** - Jawaban lengkap
- **[FAQ_EDGE_CASES.md](FAQ_EDGE_CASES.md)** - Q&A 15 pertanyaan
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Index semua docs

---

## ✅ Kesimpulan

```
SISTEM ROBUST ✓
✓ Lenient terhadap data invalid
✓ Safe terhadap struktur invalid
✓ User selalu informed
✓ Production-ready
```

---

**Butuh lebih detail?** Lihat [COMPLETE_ANSWER_EDGE_CASES.md](COMPLETE_ANSWER_EDGE_CASES.md)
