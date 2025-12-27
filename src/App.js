import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Printer, FileSpreadsheet, Menu, X } from 'lucide-react';
import * as XLSX from 'xlsx';

// Daftar mata pelajaran wajib
const requiredSubjects = [
  'Pendidikan Agama Islam',
  'Pendidikan Pancasila dan Kewarganegaraan',
  'Bahasa Indonesia',
  'Matematika',
  'Sejarah Indonesia',
  'Bahasa Inggris',
  'Pendidikan Jasmani Olahraga dan Kesehatan',
  'Seni Budaya',
  'Teknologi Informasi dan Komunikasi',
  'Informatika',
  'Prakarya dan Kewirausahaan',
  'Bahasa Daerah/Jawa',
  'Aswaja',
  'Fisika',
  'Kimia',
  'Biologi'
];

// Daftar mata pelajaran pilihan
const electiveSubjects = [
  'Sejarah/Sejarah Peminatan',
  'Geografi',
  'Sosiologi',
  'Ekonomi',
  'Ekonomi Akuntansi',
  'Antropologi',
  'Bahasa dan Sastra Arab',
  'Bahasa dan Sastra Indonesia',
  'Bahasa dan Sastra Inggris',
  'Bahasa Indonesia Tingkat Lanjut',
  'Bahasa Inggris Tingkat Lanjut',
  'Keterampilan Bahasa Inggris'
];

// List of all subject names (for dynamic column matching)
const allSubjectNames = [
  ...requiredSubjects,
  ...electiveSubjects
];

// Helper functions moved outside component scope
const calculateAverage = (ket, peng) => {
  const ketVal = parseFloat(String(ket).replace(',', '.'));
  const pengVal = parseFloat(String(peng).replace(',', '.'));
  if (isNaN(ketVal) || isNaN(pengVal)) return '-';
  const avg = (ketVal + pengVal) / 2;
  return avg.toFixed(2);
};

const findSubjectColumns = (headerRow) => {
  const subjectColumns = {};
  const trimmedHeader = headerRow.map(h => h ? String(h).trim().toLowerCase() : '');
  allSubjectNames.forEach(subjectName => {
    const subjectLower = subjectName.toLowerCase();
    let foundIndex = -1;
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

const validateHeaderRow = (headerRow) => {
  const trimmedHeader = headerRow.map(h => h ? String(h).trim().toLowerCase() : '');
  const recognizedSubjects = [];
  const unrecognizedSubjects = new Set();
  allSubjectNames.forEach(subjectName => {
    if (trimmedHeader.includes(subjectName.toLowerCase())) {
      recognizedSubjects.push(subjectName);
    }
  });
  const systemColumns = [
    'no', 'nis', 'nama', 'rata-rata', 'keterangan', 'sakit', 'izin', 'tanpa',
    'kepala', 'wali', 'kelas', 'sekolah', 'fase', 'semester', 'tahun', 'tempat', 'tanggal', 'pramuka', 'pmr',
    'deskripsi kokurikuler', 'ekstrakurikuler', 'ketidakhadiran', 'catatan wali kelas'
  ];
  trimmedHeader.forEach((header) => {
    if (header &&
      !systemColumns.includes(header) &&
      !recognizedSubjects.map(s => s.toLowerCase()).includes(header) &&
      !header.match(/^(ket|peng|tp1|tp2|keterangan|ketakwaan|pengetahuan|target performa|kelompok)$/)) {
      unrecognizedSubjects.add(header);
    }
  });
  return { recognizedSubjects, unrecognizedSubjects: Array.from(unrecognizedSubjects) };
};

const parseKurikulum = (kurikulumData) => {
  const curriculumObj = {};
  for (let i = 1; i < kurikulumData.length; i++) {
    const row = kurikulumData[i];
    if (!row || !row[1]) break;
    const mapelName = String(row[1] || '').trim();
    if (!mapelName || mapelName === '') continue;
    curriculumObj[mapelName] = {
      class_10: { tp1: String(row[4] || '').trim(), tp2: String(row[5] || '').trim() },
      class_11: { tp1: String(row[7] || '').trim(), tp2: String(row[8] || '').trim() },
      class_12: { tp1: String(row[10] || '').trim(), tp2: String(row[11] || '').trim() }
    };
  }
  return curriculumObj;
};

const generateDescriptions = (ket, peng, mapelName, studentClass, curriculumData) => {
  const defaultTemplate = 'Kompetensi dasar tercapai dengan baik';
  const ketVal = parseFloat(String(ket || '').replace(',', '.'));
  const pengVal = parseFloat(String(peng || '').replace(',', '.'));
  const currMapel = curriculumData[mapelName];
  let classKey = 'class_10';
  if (studentClass && String(studentClass).includes('11')) {
    classKey = 'class_11';
  } else if (studentClass && String(studentClass).includes('12')) {
    classKey = 'class_12';
  }
  const tp = currMapel?.[classKey];
  let tp1Text = tp?.tp1 || '';
  let tp2Text = tp?.tp2 || '';
  if (!tp1Text && !tp2Text) return { row1: defaultTemplate, row2: '' };
  if (isNaN(ketVal) || isNaN(pengVal)) return { row1: defaultTemplate, row2: '' };
  if (ketVal > pengVal) return {
    row1: `Mencapai kompetensi dengan baik dalam ${tp1Text}`,
    row2: `Perlu peningkatan dalam ${tp2Text}`
  };
  if (pengVal > ketVal) return {
    row1: `Mencapai kompetensi dengan baik dalam ${tp2Text}`,
    row2: `Perlu peningkatan dalam ${tp1Text}`
  };
  return {
    row1: `Mencapai kompetensi dengan baik dalam ${tp1Text}`,
    row2: `Perlu peningkatan dalam ${tp2Text}`
  };
};

const RaporApp = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'
  const [subjectOrder, setSubjectOrder] = useState([]); // Track subject order from file
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [layoutType, setLayoutType] = useState('kelas10'); // 'kelas10' or 'kelas1112'
  const [spreadsheetId] = useState('1vNFphN9h2GPdVykILiHSLblilN8j7txN');
  const [selectedClassSheet, setSelectedClassSheet] = useState('');
  const [availableSheets, setAvailableSheets] = useState([]);
  const [isSheetsLoaded, setIsSheetsLoaded] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [competencyFontSize, setCompetencyFontSize] = useState(10);
  const [workbook, setWorkbook] = useState(null);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const processWorkbookData = useCallback((workbook, customClassSheet = null) => {
    const sheetNames = workbook.SheetNames;
    console.log('Available sheets:', sheetNames);

    // Tentukan sheet data nilai dan sheet kurikulum
    // Jika customClassSheet ada, cari sheet dengan nama tersebut. Jika tidak ada, pakai sheet pertama.
    let nilaiSheetName = sheetNames[0];
    if (customClassSheet) {
      const target = String(customClassSheet).trim().toLowerCase();
      const foundSheet = sheetNames.find(name =>
        String(name).trim().toLowerCase() === target
      );
      if (foundSheet) {
        nilaiSheetName = foundSheet;
      }
    }

    // Cari sheet kurikulum (biasanya sheet ke-7 atau bernama 'Kurikulum')
    let kurikulumSheetName = sheetNames[1]; // Fallback ke sheet ke-2
    const kurikulumIndex = sheetNames.findIndex(name => name.toLowerCase().includes('kurikulum'));
    if (kurikulumIndex !== -1) {
      kurikulumSheetName = sheetNames[kurikulumIndex];
    } else if (sheetNames.length >= 7) {
      kurikulumSheetName = sheetNames[6]; // Sheet ke-7
    }

    // School info dari nilaiSheet (baris 1-6)
    const schoolInfo = {};
    const nilaiSheet = workbook.Sheets[nilaiSheetName];
    const nilaiData = XLSX.utils.sheet_to_json(nilaiSheet, { header: 1 });

    // Parse info sekolah dari baris 1-6
    [0, 1, 2, 3, 4, 5].forEach(idx => {
      if (nilaiData[idx] && nilaiData[idx][0] && nilaiData[idx][1]) {
        const key = String(nilaiData[idx][0]).toLowerCase().trim();
        if (key === 'sekolah') schoolInfo.sekolah = nilaiData[idx][1];
        else if (key === 'alamat') schoolInfo.alamat = nilaiData[idx][1];
        else if (key === 'kelas') schoolInfo.kelas = nilaiData[idx][1];
        else if (key === 'fase') schoolInfo.fase = nilaiData[idx][1];
        else if (key === 'semester') schoolInfo.semester = nilaiData[idx][1];
        else if (key === 'tahun ajaran') schoolInfo.tahunAjaran = nilaiData[idx][1];
      }
    });

    // Find subject columns dynamically from header row (row 8, index 7)
    // Dynamically find main header row (normally Row 8, index 7)
    let mainHeaderIndex = 7; // default fallback
    for (let i = 0; i < Math.min(nilaiData.length, 20); i++) {
      const r = nilaiData[i] || [];
      const rowStr = r.map(c => String(c || '').toLowerCase()).join(' ');
      if (rowStr.includes('nama') && rowStr.includes('nis')) {
        mainHeaderIndex = i;
        break;
      }
    }

    const headerRow = nilaiData[mainHeaderIndex] || [];
    const subjectColumns = findSubjectColumns(headerRow);
    const headerValidation = validateHeaderRow(headerRow);

    if (headerValidation.recognizedSubjects.length === 0) {
      throw new Error('Tidak ada mata pelajaran yang dikenali di sheet ' + nilaiSheetName);
    }

    // Ekskul Header is Row 9 (index 8), which is mainHeaderIndex + 1
    const ekskulHeaderIndex = mainHeaderIndex + 1;
    const ekskulHeaderRow = nilaiData[ekskulHeaderIndex] || [];

    // Parse data siswa starts from index after ekskul header
    const nilaiRows = nilaiData.slice(ekskulHeaderIndex + 1);
    const studentMap = {};

    // Ekskul names: AP - AT (Indices 41 - 45)
    const ekskulNames = [];
    for (let i = 41; i <= 45; i++) {
      if (ekskulHeaderRow[i] && String(ekskulHeaderRow[i]).trim() !== '') {
        ekskulNames.push({ name: String(ekskulHeaderRow[i]).trim(), index: i });
      }
    }

    const getEkskulDescription = (grade) => {
      const g = String(grade || '').trim().toUpperCase();
      if (g === 'A') return 'Menunjukkan keaktifan, kedisiplinan, dan tanggung jawab yang sangat baik selama mengikuti setiap kegiatan.';
      if (g === 'B') return 'Menunjukkan keaktifan dan sikap yang baik dalam mengikuti setiap kegiatan meskipun masih perlu peningkatan konsistensi.';
      if (g === 'C') return 'Mengikuti setiap kegiatan dengan cukup baik namun perlu meningkatkan keaktifan dan kedisiplinan.';
      return null;
    };

    nilaiRows.forEach((row) => {
      if (!row[2] || row[2] === 'RATA-RATA KELAS' || String(row[2]).trim() === '') return;

      const nama = row[2];
      if (!studentMap[nama]) {
        studentMap[nama] = {
          No: row[0],
          NIS: row[1],
          Nama: nama,
          subjects: {},
          identitas: { ...schoolInfo },
          kokurikuler: row[40] || '', // AO
          ekstrakurikuler: [],
          ketidakhadiran: {
            sakit: row[46] || 0,   // AU
            izin: row[47] || 0,    // AV
            tanpaKet: row[48] || 0 // AW
          },
          catatanWaliKelas: row[49] || '' // AX
        };
      }

      // Populate Subjects
      Object.entries(subjectColumns).forEach(([subjectName, indices]) => {
        const ketVal = row[indices.ketIndex];
        const pengVal = row[indices.pengIndex];
        studentMap[nama].subjects[subjectName] = {
          KET: ketVal,
          PENG: pengVal,
          avg: calculateAverage(ketVal, pengVal)
        };
      });

      // Populate Ekskul
      const participations = [];
      ekskulNames.forEach(ekskul => {
        const grade = row[ekskul.index];
        const description = getEkskulDescription(grade);
        if (description) {
          participations.push({
            nama: ekskul.name,
            grade: grade,
            keterangan: description
          });
        }
      });
      studentMap[nama].ekstrakurikuler = participations;
    });

    // Parse Kurikulum (Dapatkan deskripsi TP-nya)
    let parsedCurriculum = {};
    const kurikulumSheet = workbook.Sheets[kurikulumSheetName];
    if (kurikulumSheet) {
      const kurikulumData = XLSX.utils.sheet_to_json(kurikulumSheet, { header: 1 });
      parsedCurriculum = parseKurikulum(kurikulumData);

      Object.keys(studentMap).forEach((namaStudent) => {
        const student = studentMap[namaStudent];
        Object.keys(student.subjects).forEach((mapelName) => {
          const subjectData = student.subjects[mapelName];
          const descriptions = generateDescriptions(
            subjectData.KET,
            subjectData.PENG,
            mapelName,
            schoolInfo.kelas,
            parsedCurriculum
          );
          subjectData.TP1 = descriptions.row1;
          subjectData.TP2 = descriptions.row2;
        });
      });
    }

    // Parse data pelengkap (info sekolah tambahan dari baris 1-4)
    [0, 1, 2, 3].forEach(idx => {
      if (nilaiData[idx] && nilaiData[idx][40] && nilaiData[idx][41]) {
        const key = String(nilaiData[idx][40]).toLowerCase().trim();
        if (key === 'tempat') studentMap[Object.keys(studentMap)[0]].identitas.tempat = nilaiData[idx][41];
        else if (key === 'tanggal') studentMap[Object.keys(studentMap)[0]].identitas.tanggal = nilaiData[idx][41];
        else if (key === 'nama kepala') studentMap[Object.keys(studentMap)[0]].identitas.namaKepala = nilaiData[idx][41];
        else if (key === 'nama wali kelas') studentMap[Object.keys(studentMap)[0]].identitas.namaWaliKelas = nilaiData[idx][41];
      }
    });

    // Sebarkan info identitas tambahan ke semua siswa
    const firstStudent = studentMap[Object.keys(studentMap)[0]];
    if (firstStudent) {
      const extraInfo = {
        tempat: firstStudent.identitas.tempat,
        tanggal: firstStudent.identitas.tanggal,
        namaKepala: firstStudent.identitas.namaKepala,
        namaWaliKelas: firstStudent.identitas.namaWaliKelas
      };
      Object.values(studentMap).forEach(s => {
        s.identitas = { ...s.identitas, ...extraInfo };
      });
    }

    return {
      processedStudents: Object.values(studentMap),
      orderedSubjects: Object.keys(subjectColumns),
      parsedCurriculum,
      headerValidation
    };
  }, []);

  const handleFetchSpreadsheet = async () => {
    setIsFetching(true);
    try {
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Gagal mendownload spreadsheet. Pastikan link disetel ke "Anyone with the link can view".');

      const buffer = await response.arrayBuffer();
      const wb = XLSX.read(buffer);
      setWorkbook(wb);

      // Detect and filter class sheets
      const sheetNames = wb.SheetNames;
      const classSheets = sheetNames.filter(name => {
        const lower = name.toLowerCase();
        // Aturan: mengandung angka (kelas) ATAU kata 'kelas', dan BUKAN 'kurikulum'
        return (lower.match(/\d+/) || lower.includes('kelas')) && !lower.includes('kurikulum');
      });

      if (classSheets.length === 0) {
        throw new Error('Tidak ditemukan sheet kelas yang sesuai kriteria penamaan.');
      }

      setAvailableSheets(classSheets);
      setIsSheetsLoaded(true);

      // Default to the first detected sheet
      const defaultSheet = classSheets[0];
      setSelectedClassSheet(defaultSheet);

      const result = processWorkbookData(wb, defaultSheet);

      setSubjectOrder(result.orderedSubjects);
      setStudents(result.processedStudents);
      if (result.processedStudents.length > 0) {
        setSelectedStudent(result.processedStudents[0]);
      }

      alert(`✅ Berhasil terhubung!\n📁 Terdeteksi ${classSheets.length} kelas.\n👥 Memuat data kelas: ${defaultSheet}`);
    } catch (error) {
      console.error('Fetch error:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setIsFetching(false);
    }
  };

  // Re-process if user changes the sheet from dropdown
  useEffect(() => {
    if (workbook && selectedClassSheet && isSheetsLoaded) {
      try {
        const result = processWorkbookData(workbook, selectedClassSheet);
        setSubjectOrder(result.orderedSubjects);
        setStudents(result.processedStudents);
        if (result.processedStudents.length > 0) {
          setSelectedStudent(result.processedStudents[0]);
        }
      } catch (error) {
        console.error('Error switching sheet:', error);
      }
    }
  }, [selectedClassSheet, workbook, isSheetsLoaded, processWorkbookData]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { delimiter: ';' });
      setWorkbook(wb);

      // Detect and filter class sheets
      const sheetNames = wb.SheetNames;
      const classSheets = sheetNames.filter(name => {
        const lower = name.toLowerCase();
        return (lower.match(/\d+/) || lower.includes('kelas')) && !lower.includes('kurikulum');
      });

      if (classSheets.length === 0) {
        throw new Error('Tidak ditemukan sheet kelas yang sesuai kriteria penamaan.');
      }

      setAvailableSheets(classSheets);
      setIsSheetsLoaded(true);

      // Default to the first detected sheet
      const defaultSheet = classSheets[0];
      setSelectedClassSheet(defaultSheet);

      const result = processWorkbookData(wb, defaultSheet);

      setSubjectOrder(result.orderedSubjects);
      setStudents(result.processedStudents);
      if (result.processedStudents.length > 0) {
        setSelectedStudent(result.processedStudents[0]);
      }

      alert(`✅ Berhasil memuat file!\n📁 Terdeteksi ${classSheets.length} kelas.\n👥 Memuat data kelas: ${defaultSheet}`);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('❌ Gagal membaca file: ' + error.message);
    }
  };



  // Function to get subjects that have at least one student with a value
  const getSubjectsWithValues = () => {
    // Filter subjects where at least one student has a non-empty, non-"-" value
    return subjectOrder.filter(subjectName => {
      return students.some(student => {
        const subjectData = student?.subjects[subjectName];
        // Check if avg is not '-' (meaning it has valid values)
        return subjectData?.avg && subjectData.avg !== '-';
      });
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const RaporPage1 = ({ student, layoutType: passedLayoutType }) => {
    const currentLayout = passedLayoutType || layoutType;
    const subjectsWithValues = getSubjectsWithValues();

    // Display only subjects with values, in the order they appeared in the file
    const displaySubjects = subjectsWithValues.map(subjectName => ({
      name: subjectName,
      data: student?.subjects[subjectName]
    })).filter(s => s.data);

    const pageStyle = isMobile ? {
      padding: '12px',
      fontSize: '11px'
    } : {
      padding: '0',
      fontSize: '12px'
    };

    return (
      <div className="bg-white rapor-page-1" style={pageStyle}>
        {/* Identitas Siswa */}
        <div className="mb-3 text-xs" style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '12px' }}>
          <div>
            <div className="flex mb-1">
              <span className="font-semibold w-28">Nama</span>
              <span>:</span>
              <span className="flex-1 ml-2">{student?.identitas?.nama || student?.Nama || '-'}</span>
            </div>
            <div className="flex mb-1">
              <span className="font-semibold w-28">NIS/NISN</span>
              <span>:</span>
              <span className="flex-1 ml-2">{student?.identitas?.nisn || student?.NIS || '-'}</span>
            </div>
            <div className="flex mb-1">
              <span className="font-semibold w-28">Nama Sekolah</span>
              <span>:</span>
              <span className="flex-1 ml-2">{student?.identitas?.sekolah || 'SMA Mamba\'unnur'}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-28">Alamat</span>
              <span>:</span>
              <span className="flex-1 ml-2 break-words">{student?.identitas?.alamat || '-'}</span>
            </div>
          </div>
          <div>
            <div className="flex mb-1">
              <span className="font-semibold w-28">Kelas</span>
              <span>:</span>
              <span className="flex-1 ml-2">{student?.identitas?.kelas || 'X'}</span>
            </div>
            <div className="flex mb-1">
              <span className="font-semibold w-28">Fase</span>
              <span>:</span>
              <span className="flex-1 ml-2">{student?.identitas?.fase || '-'}</span>
            </div>
            <div className="flex mb-1">
              <span className="font-semibold w-28">Semester</span>
              <span>:</span>
              <span className="flex-1 ml-2">{student?.identitas?.semester || '1'}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-28">Tahun Pelajaran</span>
              <span>:</span>
              <span className="flex-1 ml-2">{student?.identitas?.tahunAjaran || '2025/2026'}</span>
            </div>
          </div>
        </div>

        {/* Garis Pemisah */}
        <div className="border-b-2 border-black mb-3"></div>

        {/* Judul Laporan */}
        <div className="text-center mb-3 pb-2">
          <h1 className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>LAPORAN HASIL BELAJAR</h1>
        </div>

        {/* Tabel Nilai */}
        {currentLayout === 'kelas10' ? (
          // Layout Kelas 10 - Tampilan Standar
          <table className="w-full border-collapse text-xs mb-4 nilai-table" style={{ borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '5%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '57%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-300">
                <th className={`border border-black px-2 py-1.5 text-center ${isMobile ? 'text-xs' : 'w-8'}`}>No.</th>
                <th className={`border border-black px-2 py-1.5 text-center ${isMobile ? 'text-xs' : ''}`}>Mata Pelajaran</th>
                <th className={`border border-black px-2 py-1.5 text-center ${isMobile ? 'text-xs w-12' : 'w-16'}`}>Nilai Akhir</th>
                <th className={`border border-black px-2 py-1.5 text-center ${isMobile ? 'text-xs' : ''}`}>Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {displaySubjects.map((subject, idx) => {
                const tp1 = subject.data?.TP1 || 'Mencapai kompetensi dengan baik dalam mengaplikasikan konsep yang telah dipelajari dalam berbagai konteks.';
                const tp2 = subject.data?.TP2 || '';

                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td className="border border-black px-2 py-1 text-center align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: isMobile ? '10px' : '12px' }}>{idx + 1}</td>
                      <td className="border border-black px-2 py-1 align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: isMobile ? '10px' : '12px' }}>{subject.name}</td>
                      <td className="border border-black px-2 py-1 text-center font-bold align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: isMobile ? '10px' : '12px' }}>
                        {subject.data?.avg || '-'}
                      </td>
                      <td className={`border-t border-r border-l border-black px-1 ${tp2 ? 'tp1-cell' : ''}`} style={{ fontSize: `${competencyFontSize}px`, lineHeight: '1.2', paddingTop: '0.1rem', paddingBottom: tp2 ? '0.1rem' : '0.1rem', borderBottom: tp2 ? 'none' : '1px solid black' }}>
                        {tp1}
                      </td>
                    </tr>
                    {tp2 && (
                      <tr>
                        <td className="tp2-cell border-r border-b border-l border-black px-1" style={{ fontSize: `${competencyFontSize}px`, lineHeight: '1.2', paddingTop: '0.1rem', paddingBottom: '0.1rem' }}>
                          {tp2}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          // Layout Kelas 11/12 - Dua Tabel dengan Gap
          <div>
            {/* Tabel 1 - Mata Pelajaran Wajib */}
            <table className="w-full border-collapse text-xs mb-4 nilai-table" style={{ borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '57%' }} />
              </colgroup>
              <thead>
                <tr className="bg-gray-300">
                  <th className={`border border-black px-2 py-1.5 text-center ${isMobile ? 'text-xs' : 'w-8'}`}>No.</th>
                  <th className={`border border-black px-2 py-1.5 text-center ${isMobile ? 'text-xs' : ''}`}>Mata Pelajaran</th>
                  <th className={`border border-black px-2 py-1.5 text-center ${isMobile ? 'text-xs w-12' : 'w-16'}`}>Nilai Akhir</th>
                  <th className={`border border-black px-2 py-1.5 text-center ${isMobile ? 'text-xs' : ''}`}>Capaian Kompetensi</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-300">
                  <th colSpan="4" className="border border-black px-2 py-1.5 text-left font-bold">Kelompok Mata Pelajaran Wajib</th>
                </tr>
                {displaySubjects
                  .filter(subject => requiredSubjects.includes(subject.name))
                  .map((subject, idx) => {
                    const tp1 = subject.data?.TP1 || 'Mencapai kompetensi dengan baik dalam mengaplikasikan konsep yang telah dipelajari dalam berbagai konteks.';
                    const tp2 = subject.data?.TP2 || '';

                    return (
                      <React.Fragment key={idx}>
                        <tr>
                          <td className="border border-black px-2 py-1 text-center align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: isMobile ? '10px' : '12px' }}>{idx + 1}</td>
                          <td className="border border-black px-2 py-1 align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: isMobile ? '10px' : '12px' }}>{subject.name}</td>
                          <td className="border border-black px-2 py-1 text-center font-bold align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: isMobile ? '10px' : '12px' }}>
                            {subject.data?.avg || '-'}
                          </td>
                          <td className={`border-t border-r border-l border-black px-1 ${tp2 ? 'tp1-cell' : ''}`} style={{ fontSize: `${competencyFontSize}px`, lineHeight: '1.2', paddingTop: '0.1rem', paddingBottom: tp2 ? '0.1rem' : '0.1rem', borderBottom: tp2 ? 'none' : '1px solid black' }}>
                            {tp1}
                          </td>
                        </tr>
                        {tp2 && (
                          <tr>
                            <td className="tp2-cell border-r border-b border-l border-black px-1" style={{ fontSize: `${competencyFontSize}px`, lineHeight: '1.2', paddingTop: '0.1rem', paddingBottom: '0.1rem' }}>
                              {tp2}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>



            {/* Tabel 2 - Mata Pelajaran Pilihan */}
            <table className="w-full border-collapse text-xs mb-4 nilai-table" style={{ borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '57%' }} />
              </colgroup>
              <thead>
                <tr className="bg-gray-300">
                  <th className={`border border-black px-2 py-1.5 text-center ${isMobile ? 'text-xs' : 'w-8'}`}>No.</th>
                  <th className={`border border-black px-2 py-1.5 text-center ${isMobile ? 'text-xs' : ''}`}>Mata Pelajaran</th>
                  <th className={`border border-black px-2 py-1.5 text-center ${isMobile ? 'text-xs w-12' : 'w-16'}`}>Nilai Akhir</th>
                  <th className={`border border-black px-2 py-1.5 text-center ${isMobile ? 'text-xs' : ''}`}>Capaian Kompetensi</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-300">
                  <th colSpan="4" className="border border-black px-2 py-1.5 text-left font-bold">Kelompok Mata Pelajaran Pilihan</th>
                </tr>
                {displaySubjects
                  .filter(subject => electiveSubjects.includes(subject.name))
                  .map((subject, idx) => {
                    const tp1 = subject.data?.TP1 || 'Mencapai kompetensi dengan baik dalam mengaplikasikan konsep yang telah dipelajari dalam berbagai konteks.';
                    const tp2 = subject.data?.TP2 || '';

                    return (
                      <React.Fragment key={idx}>
                        <tr>
                          <td className="border border-black px-2 py-1 text-center align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: isMobile ? '10px' : '12px' }}>{idx + 1}</td>
                          <td className="border border-black px-2 py-1 align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: isMobile ? '10px' : '12px' }}>{subject.name}</td>
                          <td className="border border-black px-2 py-1 text-center font-bold align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: isMobile ? '10px' : '12px' }}>
                            {subject.data?.avg || '-'}
                          </td>
                          <td className={`border-t border-r border-l border-black px-1 ${tp2 ? 'tp1-cell' : ''}`} style={{ fontSize: `${competencyFontSize}px`, lineHeight: '1.2', paddingTop: '0.1rem', paddingBottom: tp2 ? '0.1rem' : '0.1rem', borderBottom: tp2 ? 'none' : '1px solid black' }}>
                            {tp1}
                          </td>
                        </tr>
                        {tp2 && (
                          <tr>
                            <td className="tp2-cell border-r border-b border-l border-black px-1" style={{ fontSize: `${competencyFontSize}px`, lineHeight: '1.2', paddingTop: '0.1rem', paddingBottom: '0.1rem' }}>
                              {tp2}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Kokurikuler (Follows mapel for BOTH layouts) */}
        <div className="text-xs mt-4 mb-4">
          <div className="bg-gray-300 border-t border-l border-r border-black px-2 py-1.5 font-bold text-center">Kokurikuler</div>
          <div className="border border-black px-1 py-1 min-h-12" style={{ fontSize: `${competencyFontSize}px`, lineHeight: '1.2' }}>
            {student?.kokurikuler || 'Ananda sudah baik dalam kreativitas yang terlihat dari kemampuan menemukan and mengembangkan alternatif solusi yang efektif pada tema konservasi energi. Ananda masih perlu berlatih dalam mengomunikasikan gagasan.'}
          </div>
        </div>

        {/* Ekstrakurikuler (Follows Kokurikuler) */}
        <div className="mb-4">
          <table className="w-full border-collapse text-xs table-fixed" style={{ borderCollapse: 'collapse', borderSpacing: '0' }}>
            <thead>
              <tr className="bg-gray-300">
                <th className="border border-black px-2 py-1.5 w-[5%] text-center">No.</th>
                <th className="border border-black px-2 py-1.5 text-left w-[30%]">Ekstrakurikuler</th>
                <th className="border border-black px-2 py-1.5 text-center w-[65%]">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {student?.ekstrakurikuler && student.ekstrakurikuler.length > 0 ? (
                <>
                  {student.ekstrakurikuler.map((ekskul, idx) => (
                    <tr key={idx}>
                      <td className="border border-black px-2 py-1 text-center align-middle" style={{ fontSize: isMobile ? '10px' : '12px' }}>{idx + 1}</td>
                      <td className="border border-black px-2 py-1 align-middle" style={{ fontSize: isMobile ? '10px' : '12px' }}>{ekskul.nama}</td>
                      <td className="border border-black px-1" style={{ fontSize: `${competencyFontSize}px`, lineHeight: '1.2', paddingTop: '0.1rem', paddingBottom: '0.1rem' }}>
                        {ekskul.keterangan}
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  <tr>
                    <td className="border border-black px-2 py-1 text-center align-middle" style={{ fontSize: isMobile ? '10px' : '12px' }}>1</td>
                    <td className="border border-black px-2 py-1 align-middle" style={{ fontSize: isMobile ? '10px' : '12px' }}>Pramuka</td>
                    <td className="border border-black px-1" style={{ fontSize: `${competencyFontSize}px`, lineHeight: '1.2', paddingTop: '0.1rem', paddingBottom: '0.1rem' }}>
                      Trampil dan disiplin dalam kegiatan kepramukaan
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-center align-middle" style={{ fontSize: isMobile ? '10px' : '12px' }}>2</td>
                    <td className="border border-black px-2 py-1 align-middle" style={{ fontSize: isMobile ? '10px' : '12px' }}>PMR</td>
                    <td className="border border-black px-1" style={{ fontSize: `${competencyFontSize}px`, lineHeight: '1.2', paddingTop: '0.1rem', paddingBottom: '0.1rem' }}>
                      Aktif remaja sehat peduli sesama dan kesehatan remaja
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Ketidakhadiran dan Catatan (Moved here for single-page flow) */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div>
            <div className="bg-gray-300 border-t border-l border-r border-black px-2 py-1.5 font-bold text-center">Ketidakhadiran</div>
            <table className="w-full border-collapse" style={{ borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1">Sakit</td>
                  <td className="border border-black px-2 py-1 text-right">{student?.ketidakhadiran?.sakit || 0} hari</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1">Izin</td>
                  <td className="border border-black px-2 py-1 text-right">{student?.ketidakhadiran?.izin || 0} hari</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1">Tanpa Keterangan</td>
                  <td className="border border-black px-2 py-1 text-right">{student?.ketidakhadiran?.tanpaKet || 0} hari</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <div className="bg-gray-300 border-t border-l border-r border-black px-2 py-1.5 font-bold text-center">Catatan Wali Kelas</div>
            <div className="border border-black px-1 py-1" style={{ minHeight: '72px', fontSize: `${competencyFontSize}px`, lineHeight: '1.2' }}>
              {student?.catatanWaliKelas || ''}
            </div>
          </div>
        </div>

        {/* Tanggapan Orang Tua */}
        <div className="mb-4 text-xs">
          <div className="bg-gray-300 border-t border-l border-r border-black px-2 py-1.5 font-bold text-center">Tanggapan Orang Tua/Wali Murid</div>
          <div className="border border-black px-2 py-2 min-h-12"></div>
        </div>

        {/* Tanda Tangan */}
        <div className="text-xs mt-4">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-left pl-8">
              <p>Orang Tua/Wali</p>
              <p className="mb-16"></p>
              <p className="border-t border-black pt-1 w-24"></p>
            </div>
            <div></div>
            <div className="text-left">
              <p>{student?.identitas?.tempat}, {(() => {
                const tanggal = student?.identitas?.tanggal;
                if (!tanggal) return '-';
                if (typeof tanggal === 'number') {
                  const date = new Date((tanggal - 25569) * 86400 * 1000);
                  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                }
                return tanggal;
              })()}</p>
              <p className="mb-16"></p>
              <p className="font-bold">{student?.identitas?.namaWaliKelas || 'Wali Kelas'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div></div>
            <div className="text-left">
              <p>Mengetahui,</p>
              <p>Kepala Sekolah</p>
              <p className="mb-16"></p>
              <p className="font-bold">{student?.identitas?.namaKepala || 'Kepala Sekolah'}</p>
            </div>
            <div></div>
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .page-break { page-break-after: always; }
          
          /* Table header repeat on every page */
          table thead { display: table-header-group; }
          /* Allow table rows to break across pages */
          table tbody tr { page-break-inside: avoid; }
          /* Table styling - single thin border */
          table { border-collapse: collapse; border-spacing: 0; border: none; }
          table td, table th { 
            border: 0.5pt solid #000;
            margin: 0;
            padding: inherit;
          }
          /* Hilangkan garis antara baris TP1 dan TP2 dalam satu mapel */
          .tp1-cell { border-bottom: none !important; }
          .tp2-cell { border-top: none !important; }
          /* Container untuk RaporPage1 bisa melanjut ke page 2 */
          .rapor-page-1 { 
            page-break-after: auto; 
            box-sizing: border-box;
            width: 100%;
            padding: 0;
            box-shadow: none !important;
            margin-bottom: 0 !important;
          }
        }
      `}</style>

      {/* Control Panel - Hidden saat print */}
      <div className="bg-white border-b border-gray-200 print:hidden sticky top-0 z-50">
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex items-center justify-between p-3 bg-blue-600 text-white">
            <h1 className="text-sm font-bold">APLIKASI RAPOR KURMER - EDISI REVISI 2025</h1>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 hover:bg-blue-700 rounded"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="max-w-7xl mx-auto px-4 py-3">
            <h1 className="text-lg font-bold text-gray-800">APLIKASI RAPOR KURMER - EDISI REVISI 2025</h1>
          </div>
        )}

        {/* Content - Collapsible on mobile */}
        {(!isMobile || mobileMenuOpen) && (
          <div className={isMobile ? 'p-3 border-t border-gray-200 space-y-3' : 'max-w-7xl mx-auto px-4 py-4'}>
            {isMobile ? (
              // Mobile: Two-column layout (Upload & Student Selection left, View/Print controls right)
              <>
                {/* Sidebar Menu Sections - 2 Columns */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Column 1: Section 1, 2, 3 */}
                  <div className="flex flex-col gap-2">
                    {/* Section 1: Upload */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <h2 className="font-bold mb-2 flex items-center gap-2 text-blue-700 text-xs">
                        <Upload size={16} /> 1. Upload Excel
                      </h2>
                      <label className="flex items-center justify-center gap-2 px-3 h-[36px] bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition text-[11px] font-bold w-full shadow-sm">
                        <Upload size={14} />
                        Pilih File
                        <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                      </label>
                      {students.length > 0 && <p className="mt-2 text-green-600 text-[10px] font-medium italic">✓ {students.length} siswa aktif</p>}
                    </div>

                    {/* Section 2: Spreadsheet (CLOUD) */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <h2 className="font-bold mb-2 flex items-center gap-2 text-blue-700 text-xs">
                        <FileSpreadsheet size={16} /> 2. Spreadsheet
                      </h2>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleFetchSpreadsheet}
                          disabled={isFetching}
                          className={`flex items-center justify-center gap-2 px-3 h-[36px] ${isFetching ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded transition text-[11px] font-bold shadow-sm`}
                        >
                          <FileSpreadsheet size={14} />
                          {isFetching ? 'Loading...' : 'Tarik Data'}
                        </button>
                        <select
                          value={selectedClassSheet}
                          onChange={(e) => setSelectedClassSheet(e.target.value)}
                          disabled={!isSheetsLoaded}
                          className={`w-full border ${isSheetsLoaded ? 'border-blue-300' : 'bg-gray-100 border-gray-200'} rounded px-2 h-[36px] text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition`}
                        >
                          {!isSheetsLoaded && <option value="">Pilih Kelas (Tarik Data dulu)</option>}
                          {availableSheets.map(cls => (
                            <option key={cls} value={cls}>Kelas {cls}</option>
                          ))}
                        </select>
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center text-blue-600 hover:underline text-[10px] font-medium"
                        >
                          Buka Spreadsheet ↗
                        </a>
                      </div>
                    </div>

                    {/* Section 3: Layout Selection */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <h2 className="font-bold mb-2 flex items-center gap-2 text-blue-700 text-xs">
                        <Menu size={16} /> 3. Pilih Layout
                      </h2>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setLayoutType('kelas10')}
                          className={`w-full h-[36px] rounded text-[11px] font-bold transition shadow-sm ${layoutType === 'kelas10' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                        >
                          Kelas 10
                        </button>
                        <button
                          onClick={() => setLayoutType('kelas1112')}
                          className={`w-full h-[36px] rounded text-[11px] font-bold transition shadow-sm ${layoutType === 'kelas1112' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                        >
                          Kelas 11/12
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Section 4, 5 */}
                  <div className="flex flex-col gap-2">
                    {students.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex-1">
                        <h2 className="font-bold mb-2 flex items-center gap-2 text-blue-700 text-xs">
                          <Menu size={16} /> 4. Pilih Siswa
                        </h2>
                        <div className="flex flex-col gap-2">
                          <select
                            className="w-full border border-gray-300 rounded px-2 h-[36px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                            onChange={(e) => {
                              setSelectedStudent(students[e.target.value]);
                              setViewMode('single');
                            }}
                          >
                            {students.map((student, index) => (
                              <option key={index} value={index}>{student.Nama} ({student.NIS})</option>
                            ))}
                          </select>

                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => setViewMode('single')}
                              className={`w-full h-[36px] rounded text-[11px] font-bold transition shadow-sm ${viewMode === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                              Lihat 1 Siswa
                            </button>
                            <button
                              onClick={() => setViewMode('all')}
                              className={`w-full h-[36px] rounded text-[11px] font-bold transition shadow-sm ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                              Lihat Semua
                            </button>
                            <button
                              onClick={handlePrint}
                              className="w-full h-[36px] bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center justify-center gap-2 text-[11px] font-bold shadow-sm"
                            >
                              <Printer size={14} />
                              Print
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 5: Font Size Control (Mobile) */}
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <h2 className="font-bold mb-2 flex items-center gap-2 text-orange-700 text-xs">
                        <Menu size={16} /> 5. Ukuran Font
                      </h2>
                      <div className="flex items-center justify-between gap-1 bg-white p-1 rounded border border-orange-200">
                        <button
                          onClick={() => setCompetencyFontSize(Math.max(8, competencyFontSize - 1))}
                          className="w-10 h-[36px] flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 font-bold transition"
                        > - </button>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] text-gray-500 font-medium leading-none mb-1">Font Deskripsi</span>
                          <span className="text-sm font-bold">{competencyFontSize}px</span>
                        </div>
                        <button
                          onClick={() => setCompetencyFontSize(Math.min(14, competencyFontSize + 1))}
                          className="w-10 h-[36px] flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 font-bold transition"
                        > + </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Desktop: Five-column layout
              <div className="gap-4" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1.1fr)' }}>
                {/* Column 1: Upload Section */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <h2 className="font-bold mb-3 flex items-center gap-2 text-blue-700 text-sm">
                    <Upload size={18} /> 1. Upload Excel
                  </h2>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition text-[11px] font-bold w-full shadow-sm">
                    <Upload size={14} />
                    Pilih File
                    <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {students.length > 0 && <p className="mt-2 text-green-600 text-[10px] font-medium italic">✓ {students.length} siswa aktif</p>}
                </div>

                {/* Column 2: Spreadsheet Section (CLOUD) */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <h2 className="font-bold mb-3 flex items-center gap-2 text-blue-700 text-sm">
                    <FileSpreadsheet size={18} /> 2. Spreadsheet
                  </h2>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleFetchSpreadsheet}
                      disabled={isFetching}
                      className={`flex items-center justify-center gap-2 px-3 py-2 ${isFetching ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded transition text-[11px] font-bold shadow-sm`}
                    >
                      <FileSpreadsheet size={14} />
                      {isFetching ? 'Loading...' : 'Tarik Data'}
                    </button>
                    <select
                      value={selectedClassSheet}
                      onChange={(e) => setSelectedClassSheet(e.target.value)}
                      disabled={!isSheetsLoaded}
                      className={`w-full border ${isSheetsLoaded ? 'border-blue-300' : 'bg-gray-100 border-gray-200'} rounded px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition`}
                    >
                      {!isSheetsLoaded && <option value="">Pilih Kelas (Tarik Data dulu)</option>}
                      {availableSheets.map(cls => (
                        <option key={cls} value={cls}>Kelas {cls}</option>
                      ))}
                    </select>
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-center text-blue-600 hover:underline text-[10px] font-medium"
                    >
                      Buka Spreadsheet ↗
                    </a>
                  </div>
                </div>

                {/* Column 3: Layout Selection */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <h2 className="font-bold mb-3 flex items-center gap-2 text-blue-700 text-sm">
                    <Menu size={18} /> 3. Pilih Layout
                  </h2>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setLayoutType('kelas10')}
                      className={`px-3 py-2 rounded text-[11px] font-bold transition w-full shadow-sm ${layoutType === 'kelas10' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                    >
                      Kelas 10
                    </button>
                    <button
                      onClick={() => setLayoutType('kelas1112')}
                      className={`px-3 py-2 rounded text-[11px] font-bold transition w-full shadow-sm ${layoutType === 'kelas1112' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                    >
                      Kelas 11/12
                    </button>
                  </div>
                </div>

                {/* Column 4: Student Selection */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <h2 className="font-bold mb-3 flex items-center gap-2 text-blue-700 text-sm">
                    <Menu size={18} /> 4. Pilih Siswa
                  </h2>
                  <div className="flex flex-col gap-2">
                    <select
                      className="w-full border border-gray-300 rounded px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onChange={(e) => {
                        setSelectedStudent(students[e.target.value]);
                        setViewMode('single');
                      }}
                    >
                      {students.map((student, index) => (
                        <option key={index} value={index}>{student.Nama} ({student.NIS})</option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewMode('single')}
                        className={`flex-1 py-2 rounded text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-sm ${viewMode === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                      >
                        Tampilkan 1 Siswa
                      </button>
                      <button
                        onClick={() => setViewMode('all')}
                        className={`flex-1 py-2 rounded text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-sm ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                      >
                        Tampilkan Semua
                      </button>
                      <button
                        onClick={handlePrint}
                        className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center justify-center gap-1 text-[11px] font-bold shadow-sm"
                      >
                        <Printer size={14} />
                        Cetak
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 5: Font Size Selection */}
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <h2 className="font-bold mb-3 flex items-center gap-2 text-orange-700 text-sm">
                    <Menu size={18} /> 5. Ukuran Font
                  </h2>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-orange-200">
                      <button
                        onClick={() => setCompetencyFontSize(Math.max(8, competencyFontSize - 1))}
                        className="w-10 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 font-bold text-gray-800 transition"
                      >
                        -
                      </button>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 font-medium">Font Deskripsi</span>
                        <span className="text-sm font-bold text-orange-700">{competencyFontSize}px</span>
                      </div>
                      <button
                        onClick={() => setCompetencyFontSize(Math.min(14, competencyFontSize + 1))}
                        className="w-10 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 font-bold text-gray-800 transition"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-[9px] text-orange-600 text-center italic">Atur besar teks capaian kompetensi</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className={`${isMobile ? 'p-2' : 'p-4'} print:p-0`}>
        {/* Rapor Display with Print Preview */}
        {students.length > 0 && (
          <div className="grid grid-cols-1 gap-4 print:grid-cols-1">
            {/* Main Rapor Display */}
            <div className={`${isMobile ? 'space-y-2' : 'mx-auto space-y-0 w-full'} print:m-0 print:max-w-none`} style={!isMobile ? { maxWidth: '210mm' } : {}}>
              {viewMode === 'single' ? (
                // Single student view - show both pages
                <>
                  <RaporPage1 student={selectedStudent} layoutType={layoutType} />
                </>
              ) : (
                // All students view
                <>
                  {students.map((student, index) => (
                    <div key={index} className={index < students.length - 1 ? "page-break" : ""}>
                      <RaporPage1 student={student} layoutType={layoutType} />
                      {index < students.length - 1 && (
                        <div className="border-t-4 border-double border-gray-400 py-3 my-2 text-center text-xs text-gray-500 font-semibold print:hidden">
                          ═══════ SISWA BERIKUTNYA ═══════
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {students.length === 0 && (
          <div className={`bg-white rounded-lg shadow p-6 text-center ${isMobile ? 'mt-4' : 'max-w-7xl mx-auto mt-8'}`}>
            <FileSpreadsheet size={isMobile ? 48 : 64} className="mx-auto mb-4 text-gray-400" />
            <h3 className={`font-bold mb-2 ${isMobile ? 'text-base' : 'text-xl'}`}>Belum Ada Data</h3>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Silakan upload file Excel untuk mulai membuat rapor</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RaporApp;