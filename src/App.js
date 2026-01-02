import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Printer, FileSpreadsheet, Menu, MessageCircle, FileText, ChevronLeft, ChevronRight, Layout, Type, Users, ZoomIn, ZoomOut } from 'lucide-react';
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
  const [zoomLevel, setZoomLevel] = useState(0.5); // Default zoom for mobile

  const [layoutType, setLayoutType] = useState('kelas10'); // 'kelas10' or 'kelas1112'
  const [spreadsheetId] = useState('1vNFphN9h2GPdVykILiHSLblilN8j7txN');
  const [selectedClassSheet, setSelectedClassSheet] = useState('');
  const [availableSheets, setAvailableSheets] = useState([]);
  const [isSheetsLoaded, setIsSheetsLoaded] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [competencyFontSize, setCompetencyFontSize] = useState(10);
  const [workbook, setWorkbook] = useState(null);
  const [paperSize, setPaperSize] = useState('A4'); // 'A4' or 'F4'
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

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

    const pageStyle = {
      padding: '0',
      fontSize: '12px'
    };

    return (
      <div className="bg-white rapor-page-1" style={pageStyle}>
        {/* Identitas Siswa */}
        <div className="mb-3 text-xs" style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '12px' }}>
          <div>
            <table className="w-full no-border-table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '130px' }} />
                <col style={{ width: '15px' }} />
                <col style={{ width: 'auto' }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className="font-semibold align-top pb-1">Nama</td>
                  <td className="align-top pb-1">:</td>
                  <td className="align-top pb-1">{student?.identitas?.nama || student?.Nama || '-'}</td>
                </tr>
                <tr>
                  <td className="font-semibold align-top pb-1">NIS/NISN</td>
                  <td className="align-top pb-1">:</td>
                  <td className="align-top pb-1">{student?.identitas?.nisn || student?.NIS || '-'}</td>
                </tr>
                <tr>
                  <td className="font-semibold align-top pb-1">Nama Sekolah</td>
                  <td className="align-top pb-1">:</td>
                  <td className="align-top pb-1">{student?.identitas?.sekolah || 'SMA Mamba\'unnur'}</td>
                </tr>
                <tr>
                  <td className="font-semibold align-top">Alamat</td>
                  <td className="align-top">:</td>
                  <td className="align-top break-words">{student?.identitas?.alamat || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full no-border-table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '130px' }} />
                <col style={{ width: '15px' }} />
                <col style={{ width: 'auto' }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className="font-semibold align-top pb-1">Kelas</td>
                  <td className="align-top pb-1">:</td>
                  <td className="align-top pb-1">{student?.identitas?.kelas || 'X'}</td>
                </tr>
                <tr>
                  <td className="font-semibold align-top pb-1">Fase</td>
                  <td className="align-top pb-1">:</td>
                  <td className="align-top pb-1">{student?.identitas?.fase || '-'}</td>
                </tr>
                <tr>
                  <td className="font-semibold align-top pb-1">Semester</td>
                  <td className="align-top pb-1">:</td>
                  <td className="align-top pb-1">{student?.identitas?.semester || '1'}</td>
                </tr>
                <tr>
                  <td className="font-semibold align-top">Tahun Pelajaran</td>
                  <td className="align-top">:</td>
                  <td className="align-top">{student?.identitas?.tahunAjaran || '2025/2026'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Garis Pemisah */}
        <div className="border-b-2 border-black mb-3"></div>

        {/* Judul Laporan */}
        <div className="text-center mb-3 pb-2">
          <h1 className="font-bold text-lg">LAPORAN HASIL BELAJAR</h1>
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
                <th className="border border-black px-2 py-1.5 text-center w-8">No.</th>
                <th className="border border-black px-2 py-1.5 text-center">Mata Pelajaran</th>
                <th className="border border-black px-2 py-1.5 text-center w-16">Nilai Akhir</th>
                <th className="border border-black px-2 py-1.5 text-center">Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {displaySubjects.map((subject, idx) => {
                const tp1 = subject.data?.TP1 || 'Mencapai kompetensi dengan baik dalam mengaplikasikan konsep yang telah dipelajari dalam berbagai konteks.';
                const tp2 = subject.data?.TP2 || '';

                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td className="border border-black px-2 py-1 text-center align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: '12px' }}>{idx + 1}</td>
                      <td className="border border-black px-2 py-1 align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: '12px' }}>{subject.name}</td>
                      <td className="border border-black px-2 py-1 text-center font-bold align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: '12px' }}>
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
                  <th className="border border-black px-2 py-1.5 text-center w-8">No.</th>
                  <th className="border border-black px-2 py-1.5 text-center">Mata Pelajaran</th>
                  <th className="border border-black px-2 py-1.5 text-center w-16">Nilai Akhir</th>
                  <th className="border border-black px-2 py-1.5 text-center">Capaian Kompetensi</th>
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
                          <td className="border border-black px-2 py-1 text-center align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: '12px' }}>{idx + 1}</td>
                          <td className="border border-black px-2 py-1 align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: '12px' }}>{subject.name}</td>
                          <td className="border border-black px-2 py-1 text-center font-bold align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: '12px' }}>
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
                  <th className="border border-black px-2 py-1.5 text-center w-8">No.</th>
                  <th className="border border-black px-2 py-1.5 text-center">Mata Pelajaran</th>
                  <th className="border border-black px-2 py-1.5 text-center w-16">Nilai Akhir</th>
                  <th className="border border-black px-2 py-1.5 text-center">Capaian Kompetensi</th>
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
                          <td className="border border-black px-2 py-1 text-center align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: '12px' }}>{idx + 1}</td>
                          <td className="border border-black px-2 py-1 align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: '12px' }}>{subject.name}</td>
                          <td className="border border-black px-2 py-1 text-center font-bold align-middle" rowSpan={tp2 ? 2 : 1} style={{ fontSize: '12px' }}>
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
                      <td className="border border-black px-2 py-1 text-center align-middle" style={{ fontSize: '12px' }}>{idx + 1}</td>
                      <td className="border border-black px-2 py-1 align-middle" style={{ fontSize: '12px' }}>{ekskul.nama}</td>
                      <td className="border border-black px-1" style={{ fontSize: `${competencyFontSize}px`, lineHeight: '1.2', paddingTop: '0.1rem', paddingBottom: '0.1rem' }}>
                        {ekskul.keterangan}
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  <tr>
                    <td className="border border-black px-2 py-1 text-center align-middle" style={{ fontSize: '12px' }}>1</td>
                    <td className="border border-black px-2 py-1 align-middle" style={{ fontSize: '12px' }}>Pramuka</td>
                    <td className="border border-black px-1" style={{ fontSize: `${competencyFontSize}px`, lineHeight: '1.2', paddingTop: '0.1rem', paddingBottom: '0.1rem' }}>
                      Trampil dan disiplin dalam kegiatan kepramukaan
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-center align-middle" style={{ fontSize: '12px' }}>2</td>
                    <td className="border border-black px-2 py-1 align-middle" style={{ fontSize: '12px' }}>PMR</td>
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
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      <style>{`
        @media print {
          @page {
            size: ${paperSize === 'F4' ? '215mm 330mm' : 'A4'};
            margin: 20mm;
          }
          body { margin: 0; background: white; }
          
          /* Reset layout for print - MUST be defined before hiding rules or have lower specificity */
          .flex, .h-screen, .overflow-hidden { 
            display: block !important; 
            height: auto !important; 
            overflow: visible !important; 
          }
          
          /* Hiding rules - Must come AFTER reset rules to override them */
          .print\\:hidden, aside, header { display: none !important; }
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
          /* Remove borders for identity tables */
          .no-border-table td, .no-border-table th { border: none !important; }
          
          /* Hilangkan garis antara baris TP1 dan TP2 dalam satu mapel */
          .tp1-cell { border-bottom: none !important; }
          .tp2-cell { border-top: none !important; }
          
          /* Container untuk RaporPage1 bisa melanjut ke page 2 */
          .rapor-page-1 { 
            page-break-after: auto; 
            box-sizing: border-box;
            width: 100%;
            padding: 0 !important;
            font-size: 12px !important;
            box-shadow: none !important;
            margin-bottom: 0 !important;
          }

          /* Reset zoom for print */
          .report-wrapper {
            transform: none !important;
            margin: 0 !important;
            width: 100% !important;
            min-width: unset !important;
          }
        }
        
        /* Custom Scrollbar for Sidebar */
        .sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: #2d3748; 
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #4a5568; 
          border-radius: 5px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #718096; 
        }
      `}</style>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (AdminLTE Style) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#343a40] text-gray-400 flex flex-col transition-transform duration-300 ease-in-out shadow-xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
          } print:hidden`}
      >
        {/* Brand Logo */}
        <div className="h-14 flex items-center px-4 bg-[#343a40] border-b border-gray-700 shrink-0">
          <FileText className="text-blue-500 mr-2" size={20} />
          <span className="text-lg font-semibold text-gray-200 tracking-wide">Converter Rapor <span className="text-[10px] font-normal text-gray-500 bg-gray-800 px-1 rounded ml-1">v2.0</span></span>
        </div>


        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto sidebar-scroll p-3 space-y-6">

          {/* Group 1: Data Source */}
          <div>
            <p className="px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">OPSI DATA SOURCE</p>
            <div className="space-y-2">
              {/* Upload Excel */}
              <div className="relative group">
                <label className="flex items-center gap-3 px-3 h-[42px] rounded-md border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors text-sm shadow-sm">
                  <Upload size={16} className={`text-blue-400`} />
                  <span className="text-gray-300 group-hover:text-white">Upload Excel</span>
                  <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Spreadsheet */}
              <div className="space-y-2">
                <button
                  onClick={handleFetchSpreadsheet}
                  disabled={isFetching}
                  className={`w-full flex items-center gap-3 px-3 h-[42px] rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm text-left group shadow-sm ${isFetching ? 'opacity-50' : ''}`}
                >
                  <FileSpreadsheet size={16} className="text-green-400" />
                  <span className="text-gray-300 group-hover:text-white">{isFetching ? 'Loading...' : 'Google Sheets'}</span>
                </button>

                {/* Class Selector */}
                <div className="ml-9 pr-2">
                  <select
                    value={selectedClassSheet}
                    onChange={(e) => setSelectedClassSheet(e.target.value)}
                    disabled={!isSheetsLoaded}
                    className="w-full bg-[#2c3136] border border-gray-600 text-gray-300 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {!isSheetsLoaded && <option value="">Pilih Kelas...</option>}
                    {availableSheets.map(cls => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>

                  {/* Buka Spreadsheet Button */}
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 mt-2 w-full bg-[#2c3136] border border-white/10 hover:border-white/30 text-blue-400 hover:text-blue-300 text-[10px] rounded px-2 py-1.5 transition-all shadow-sm"
                  >
                    <span>Buka Spreadsheet</span>
                    <span className="text-[8px]">↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Group 2: Konfigurasi */}
          <div>
            <p className="px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Konfigurasi Rapor</p>
            <div className="space-y-4 px-2">
              {/* Layout Type */}
              <div>
                <div className="flex items-center gap-2 mb-1 text-gray-400">
                  <Layout size={14} /> <span className="text-xs">Layout</span>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-black/20 p-1 rounded border border-white/5">
                  <button onClick={() => setLayoutType('kelas10')} className={`text-[10px] py-1 rounded transition-colors ${layoutType === 'kelas10' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>Kelas 10</button>
                  <button onClick={() => setLayoutType('kelas1112')} className={`text-[10px] py-1 rounded transition-colors ${layoutType === 'kelas1112' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>11 / 12</button>
                </div>
              </div>

              {/* Paper Size */}
              <div>
                <div className="flex items-center gap-2 mb-1 text-gray-400">
                  <FileText size={14} /> <span className="text-xs">Ukuran Kertas</span>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-black/20 p-1 rounded border border-white/5">
                  <button onClick={() => setPaperSize('A4')} className={`text-[10px] py-1 rounded transition-colors ${paperSize === 'A4' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>A4</button>
                  <button onClick={() => setPaperSize('F4')} className={`text-[10px] py-1 rounded transition-colors ${paperSize === 'F4' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>F4</button>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <div className="flex items-center gap-2 mb-1 text-gray-400">
                  <Type size={14} /> <span className="text-xs">Font Deskripsi</span>
                </div>
                <div className="flex items-center gap-2 bg-black/20 p-1 rounded border border-white/5">
                  <button onClick={() => setCompetencyFontSize(Math.max(8, competencyFontSize - 1))} className="w-6 h-6 bg-white/5 rounded hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white">-</button>
                  <span className="flex-1 text-center font-bold text-xs text-white">{competencyFontSize}px</span>
                  <button onClick={() => setCompetencyFontSize(Math.min(14, competencyFontSize + 1))} className="w-6 h-6 bg-white/5 rounded hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Group 3: Cetak */}
          <div className="pt-2">
            <button
              onClick={handlePrint}
              className="w-full h-[42px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-md shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95"
            >
              <Printer size={16} /> <span className="font-bold text-sm">Cetak Rapor</span>
            </button>

            {/* Tanya Admin Button */}
            <a
              href="https://wa.me/6285731447357"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-3 px-3 h-[42px] rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm group shadow-sm"
            >
              <MessageCircle size={16} className="text-[#25D366]" />
              <span className="text-gray-300 group-hover:text-white">Tanya Admin</span>
            </a>
          </div>
        </div>

        {/* Footer Sidebar */}
        <div className="p-3 text-[10px] text-gray-600 text-center border-t border-gray-700 bg-[#2f353a]">
          &copy; 2026 M.M.Tech
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-gray-100 transition-all duration-300 print:overflow-visible print:h-auto">

        {/* Top Navbar */}
        <header className="h-14 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 shrink-0 print:hidden z-30 relative">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Page Title / Breadcrumb */}
            <div className="flex flex-col">
              <h1 className="font-bold text-gray-800 text-sm md:text-base leading-tight flex items-center gap-2">
                Preview Rapor
                {students.length > 0 && <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                  {students.length} Siswa
                </span>}
              </h1>
            </div>
          </div>

          {/* Right Side Tools */}
          <div className="flex items-center gap-3">
            {/* Only show if students exist */}
            {students.length > 0 && (
              <>
                {/* Student Selector */}
                <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-md px-2 hover:border-blue-300 transition-colors">
                  <Users size={14} className="text-gray-400 mr-2" />
                  <select
                    className="bg-transparent border-none text-xs md:text-sm py-1.5 w-48 focus:ring-0 cursor-pointer text-gray-700 font-medium focus:outline-none"
                    onChange={(e) => {
                      setSelectedStudent(students[e.target.value]);
                      setViewMode('single');
                    }}
                    value={selectedStudent ? students.findIndex(s => s.Nama === selectedStudent.Nama) : 0}
                  >
                    {students.map((student, index) => (
                      <option key={index} value={index}>{student.Nama}</option>
                    ))}
                  </select>
                </div>

                {/* Prev/Next Navigation (Simple) */}
                <div className="flex border border-gray-200 rounded-md overflow-hidden shadow-sm">
                  <button
                    onClick={() => {
                      const currentIndex = selectedStudent ? students.findIndex(s => s.Nama === selectedStudent.Nama) : 0;
                      const prevIndex = Math.max(0, currentIndex - 1);
                      setSelectedStudent(students[prevIndex]);
                      setViewMode('single');
                    }}
                    className="px-2 py-1.5 bg-white hover:bg-gray-50 border-r border-gray-200 text-gray-600"
                    title="Siswa Sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => {
                      const currentIndex = selectedStudent ? students.findIndex(s => s.Nama === selectedStudent.Nama) : 0;
                      const nextIndex = Math.min(students.length - 1, currentIndex + 1);
                      setSelectedStudent(students[nextIndex]);
                      setViewMode('single');
                    }}
                    className="px-2 py-1.5 bg-white hover:bg-gray-50 text-gray-600"
                    title="Siswa Berikutnya"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200">
                  <button
                    onClick={() => setViewMode('single')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'single' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'all' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    All
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content Area (Scrollable) */}
        <main className="flex-1 overflow-x-auto overflow-y-auto bg-gray-100 p-4 print:p-0 print:bg-white print:overflow-visible relative">
          {students.length > 0 ? (
            <div
              className={`report-wrapper mx-auto bg-white shadow-lg print:shadow-none min-h-[29.7cm] transition-all duration-300 w-[210mm] min-w-[210mm] print:w-full print:max-w-none origin-top`}
              style={!isMobile ? {} : {
                transform: `scale(${zoomLevel})`,
                marginBottom: `-${(1 - zoomLevel) * 100}%` // Offset to reduce huge bottom gap when scaled down
              }}
            >
              {/* View Logic */}
              {viewMode === 'single' ? (
                <div className="p-8 print:p-0">
                  <RaporPage1 student={selectedStudent} layoutType={layoutType} />
                </div>
              ) : (
                <div>
                  {students.map((student, index) => (
                    <div key={index} className={index < students.length - 1 ? "page-break" : ""}>
                      <div className="p-8 print:p-0">
                        <RaporPage1 student={student} layoutType={layoutType} />
                      </div>
                      {index < students.length - 1 && (
                        <div className="border-t-4 border-double border-gray-300 py-3 my-4 text-center text-xs text-gray-400 font-semibold print:hidden">
                          ---- Halaman Berikutnya (Siswa: {students[index + 1]?.Nama}) ----
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                <Upload size={40} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">Belum ada data rapor</h3>
              <p className="max-w-md mx-auto mb-8">Silakan upload file Excel atau tarik data dari Spreadsheet melalui menu di sidebar sebelah kiri.</p>

              {/* Quick Actions removed as per request */}
            </div>
          )}
        </main>
      </div>



      {/* Floating Zoom Controls (Mobile Only) */}
      {isMobile && students.length > 0 && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 print:hidden">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 1.5))}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 active:scale-95 border border-gray-200"
            title="Zoom In"
          >
            <ZoomIn size={24} />
          </button>
          <div className="bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-gray-600 text-center shadow-sm border border-gray-100">
            {Math.round(zoomLevel * 100)}%
          </div>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.2))}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 active:scale-95 border border-gray-200"
            title="Zoom Out"
          >
            <ZoomOut size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RaporApp;