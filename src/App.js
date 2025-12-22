import React, { useState, useEffect } from 'react';
import { Upload, Printer, FileSpreadsheet, Menu, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const RaporApp = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'
  const [subjectOrder, setSubjectOrder] = useState([]); // Track subject order from file
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [layoutType, setLayoutType] = useState('kelas10'); // 'kelas10' or 'kelas1112'

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

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // List of all subject names (for dynamic column matching)
  const allSubjectNames = [
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
    'Biologi',
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

  // Function to find subject columns dynamically from header
  const findSubjectColumns = (headerRow) => {
    const subjectColumns = {};
    
    // Trim and lowercase header for comparison
    const trimmedHeader = headerRow.map(h => 
      h ? String(h).trim().toLowerCase() : ''
    );
    
    allSubjectNames.forEach(subjectName => {
      const subjectLower = subjectName.toLowerCase();
      let foundIndex = -1;
      
      // Find the column index that contains the subject name
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

  // Function to validate header and identify unrecognized subjects
  const validateHeaderRow = (headerRow) => {
    const trimmedHeader = headerRow.map(h => 
      h ? String(h).trim().toLowerCase() : ''
    );
    
    const recognizedSubjects = [];
    const unrecognizedSubjects = new Set();
    
    // Check recognized subjects
    allSubjectNames.forEach(subjectName => {
      if (trimmedHeader.includes(subjectName.toLowerCase())) {
        recognizedSubjects.push(subjectName);
      }
    });
    
    // Check for unrecognized subjects (exclude system columns)
    const systemColumns = ['no', 'nis', 'nama', 'rata-rata', 'keterangan', 'sakit', 'izin', 'tanpa', 'kepala', 'wali', 'kelas', 'sekolah', 'fase', 'semester', 'tahun', 'tempat', 'tanggal', 'pramuka', 'pmr'];
    
    trimmedHeader.forEach((header) => {
      if (header && 
          !systemColumns.includes(header) && 
          !recognizedSubjects.map(s => s.toLowerCase()).includes(header) &&
          !header.match(/^(ket|peng|tp1|tp2|keterangan|ketakwaan|pengetahuan|target performa|kelompok)$/)) {
        unrecognizedSubjects.add(header);
      }
    });
    
    return {
      recognizedSubjects,
      unrecognizedSubjects: Array.from(unrecognizedSubjects)
    };
  };

  // New function: Parse curriculum from Sheet 2
  const parseKurikulum = (kurikulumData) => {
    const curriculumObj = {};
    
    // Start from row 2 (index 1) - skip header
    for (let i = 1; i < kurikulumData.length; i++) {
      const row = kurikulumData[i];
      if (!row || !row[1]) break; // Stop if no mapel name
      
      const mapelName = String(row[1] || '').trim();
      if (!mapelName || mapelName === '') continue;
      
      // Structure: Col 0=No, 1=Mapel, 2=Kelompok, 3=Kelas10, 4=TP1_10, 5=TP2_10, 6=Kelas11, 7=TP1_11, 8=TP2_11, 9=Kelas12, 10=TP1_12, 11=TP2_12
      curriculumObj[mapelName] = {
        class_10: {
          tp1: String(row[4] || '').trim(),
          tp2: String(row[5] || '').trim()
        },
        class_11: {
          tp1: String(row[7] || '').trim(),
          tp2: String(row[8] || '').trim()
        },
        class_12: {
          tp1: String(row[10] || '').trim(),
          tp2: String(row[11] || '').trim()
        }
      };
    }
    
    return curriculumObj;
  };

  // New function: Generate descriptions based on KET vs PENG comparison
  const generateDescriptions = (ket, peng, mapelName, studentClass, curriculumData) => {
    const defaultTemplate = 'Kompetensi dasar tercapai dengan baik';
    
    // Parse values
    const ketVal = parseFloat(String(ket || '').replace(',', '.'));
    const pengVal = parseFloat(String(peng || '').replace(',', '.'));
    
    // Get curriculum data for the subject and class - use parameter instead of state
    const currMapel = curriculumData[mapelName];
    let classKey = 'class_10'; // Default
    
    if (studentClass && String(studentClass).includes('11')) {
      classKey = 'class_11';
    } else if (studentClass && String(studentClass).includes('12')) {
      classKey = 'class_12';
    }
    
    const tp = currMapel?.[classKey];
    let tp1Text = tp?.tp1 || '';
    let tp2Text = tp?.tp2 || '';
    
    // Debug log
    console.log(`generateDescriptions: mapel=${mapelName}, class=${classKey}, tp1=${tp1Text}, tp2=${tp2Text}, ket=${ketVal}, peng=${pengVal}`);
    
    // If no curriculum data, use defaults
    if (!tp1Text && !tp2Text) {
      return {
        row1: defaultTemplate,
        row2: ''
      };
    }
    
    // If either value is invalid, use default
    if (isNaN(ketVal) || isNaN(pengVal)) {
      return {
        row1: defaultTemplate,
        row2: ''
      };
    }
    
    // Compare values
    if (ketVal > pengVal) {
      // KET > PENG: tp1 with "Mencapai kompetensi..." prefix
      return {
        row1: `Mencapai kompetensi dengan baik dalam ${tp1Text}`,
        row2: `Perlu peningkatan dalam ${tp2Text}`
      };
    } else if (pengVal > ketVal) {
      // PENG > KET: tp2 with "Mencapai kompetensi..." prefix (nilai lebih tinggi)
      return {
        row1: `Mencapai kompetensi dengan baik dalam ${tp2Text}`,
        row2: `Perlu peningkatan dalam ${tp1Text}`
      };
    } else {
      // Equal: TP1 is considered higher (better), TP2 is lower
      return {
        row1: `Mencapai kompetensi dengan baik dalam ${tp1Text}`,
        row2: `Perlu peningkatan dalam ${tp2Text}`
      };
    }
  };


  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      // Parse CSV with semicolon delimiter
      const workbook = XLSX.read(data, { delimiter: ';' });
      
      const sheetNames = workbook.SheetNames;
      console.log('Available sheets:', sheetNames);

      // School info dari sheet pertama (baris 1-5)
      const schoolInfo = {};
      const nilaiSheet = workbook.Sheets[sheetNames[0]];
      const nilaiData = XLSX.utils.sheet_to_json(nilaiSheet, { header: 1 });
      
      // Parse info sekolah dari baris 1-6
      [0, 1, 2, 3, 4, 5].forEach(idx => {
        if (nilaiData[idx] && nilaiData[idx][0] && nilaiData[idx][1]) {
          const key = nilaiData[idx][0].toLowerCase().trim();
          if (key === 'sekolah') schoolInfo.sekolah = nilaiData[idx][1];
          else if (key === 'alamat') schoolInfo.alamat = nilaiData[idx][1];
          else if (key === 'kelas') schoolInfo.kelas = nilaiData[idx][1];
          else if (key === 'fase') schoolInfo.fase = nilaiData[idx][1];
          else if (key === 'semester') schoolInfo.semester = nilaiData[idx][1];
          else if (key === 'tahun ajaran') schoolInfo.tahunAjaran = nilaiData[idx][1];
        }
      });

      // Find subject columns dynamically from header row (row 8, index 7 - setelah alamat ditambah)
      const headerRow = nilaiData[7] || [];
      const subjectColumns = findSubjectColumns(headerRow);
      const headerValidation = validateHeaderRow(headerRow);
      
      console.log('Dynamic subject columns found:', subjectColumns);
      console.log('Header validation:', headerValidation);
      
      // Alert user if there are unrecognized subjects
      if (headerValidation.unrecognizedSubjects.length > 0) {
        console.warn('⚠️ Unrecognized subjects (akan diabaikan):', headerValidation.unrecognizedSubjects);
      }
      
      if (headerValidation.recognizedSubjects.length === 0) {
        alert('❌ Error: Tidak ada mata pelajaran yang dikenali di file!\n\nPastikan nama mata pelajaran di baris header sudah benar.');
        return;
      }

      // Parse data siswa dari baris 10+ (index 9+)
      const nilaiRows = nilaiData.slice(9);
      const studentMap = {};

      nilaiRows.forEach((row) => {
        if (!row[2] || row[2] === 'RATA-RATA KELAS' || row[2].trim() === '') return;

        const nama = row[2];
        if (!studentMap[nama]) {
          studentMap[nama] = {
            No: row[0],
            NIS: row[1],
            Nama: nama,
            subjects: {},
            identitas: schoolInfo,
            kokurikuler: '',
            ekstrakurikuler: [],
            ketidakhadiran: {}
          };
        }

        // Process subjects using dynamically found columns
        Object.entries(subjectColumns).forEach(([subjectName, indices]) => {
          const ketVal = row[indices.ketIndex];
          const pengVal = row[indices.pengIndex];
          
          studentMap[nama].subjects[subjectName] = {
            KET: ketVal,
            PENG: pengVal,
            avg: calculateAverage(ketVal, pengVal)
          };
        });
      });

      // Parse Sheet 2 - KURIKULUM (NEW: Changed from DESKRIPSI)
      let parsedCurriculum = {};
      if (sheetNames.length > 1) {
        const kurikulumSheet = workbook.Sheets[sheetNames[1]];
        const kurikulumData = XLSX.utils.sheet_to_json(kurikulumSheet, { header: 1 });
        
        // Parse kurikulum structure
        parsedCurriculum = parseKurikulum(kurikulumData);
        console.log('Curriculum parsed:', parsedCurriculum);
        
        // Auto-generate descriptions for each student and subject
        Object.keys(studentMap).forEach((namaStudent) => {
          const student = studentMap[namaStudent];
          Object.keys(student.subjects).forEach((mapelName) => {
            const subjectData = student.subjects[mapelName];
            const descriptions = generateDescriptions(
              subjectData.KET,
              subjectData.PENG,
              mapelName,
              schoolInfo.kelas,
              parsedCurriculum  // Pass curriculum data as parameter
            );
            subjectData.TP1 = descriptions.row1;
            subjectData.TP2 = descriptions.row2;
          });
        });
      }

      // Parse Sheet 3 - PELENGKAP
      if (sheetNames.length > 2) {
        const pelengkapSheet = workbook.Sheets[sheetNames[2]];
        const pelengkapData = XLSX.utils.sheet_to_json(pelengkapSheet, { header: 1 });
        
        // Parse info tambahan dari baris 1-4
        [0, 1, 2, 3].forEach(idx => {
          if (pelengkapData[idx] && pelengkapData[idx][0] && pelengkapData[idx][1]) {
            const key = pelengkapData[idx][0].toLowerCase().trim();
            if (key === 'tempat') schoolInfo.tempat = pelengkapData[idx][1];
            else if (key === 'tanggal') schoolInfo.tanggal = pelengkapData[idx][1];
            else if (key === 'nama kepala') schoolInfo.namaKepala = pelengkapData[idx][1];
            else if (key === 'nama wali kelas') schoolInfo.namaWaliKelas = pelengkapData[idx][1];
          }
        });

        // Get ekstrakurikuler names from row 8 (index 7), columns E and F (index 4 and 5)
        const ekskul1Name = pelengkapData[7]?.[4] || 'Pramuka';
        const ekskul2Name = pelengkapData[7]?.[5] || 'PMR';

        // Parse data siswa dari baris 9+ (index 8+)
        const pelengkapRows = pelengkapData.slice(8);
        pelengkapRows.forEach((row) => {
          if (!row[2] || row[2] === 'RATA-RATA KELAS' || row[2].trim() === '') return;

          const nama = row[2];
          if (studentMap[nama]) {
            studentMap[nama].kokurikuler = row[3] || '';
            studentMap[nama].ekstrakurikuler = [
              { nama: ekskul1Name, keterangan: row[4] || '' },
              { nama: ekskul2Name, keterangan: row[5] || '' }
            ];
            studentMap[nama].ketidakhadiran = {
              sakit: row[6] || 0,
              izin: row[7] || 0,
              tanpaKet: row[8] || 0
            };
            // Catatan Wali Kelas dari kolom J (index 9)
            studentMap[nama].catatanWaliKelas = row[9] || '';
          }
        });
      }

      const processedStudents = Object.values(studentMap);
      
      // Save subject order from the file
      const orderedSubjects = Object.keys(subjectColumns);
      setSubjectOrder(orderedSubjects);
      
      setStudents(processedStudents);
      if (processedStudents.length > 0) {
        setSelectedStudent(processedStudents[0]);
      }
      
      // Build detailed success message
      let successMessage = `✅ Berhasil memuat ${processedStudents.length} siswa dari ${sheetNames.length} sheet\n`;
      successMessage += `📚 Mata pelajaran terdeteksi: ${orderedSubjects.length}`;
      
      if (Object.keys(parsedCurriculum).length > 0) {
        successMessage += `\n📖 Kurikulum dimuat: ${Object.keys(parsedCurriculum).length} mapel`;
      }
      
      if (headerValidation.unrecognizedSubjects.length > 0) {
        successMessage += `\n\n⚠️ ${headerValidation.unrecognizedSubjects.length} mata pelajaran tidak dikenali (diabaikan):\n`;
        successMessage += headerValidation.unrecognizedSubjects.slice(0, 5).join(', ');
        if (headerValidation.unrecognizedSubjects.length > 5) {
          successMessage += `, +${headerValidation.unrecognizedSubjects.length - 5} lainnya`;
        }
      }
      
      alert(successMessage);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('❌ Gagal membaca file.\n\nError: ' + error.message);
    }
  };

  const calculateAverage = (ket, peng) => {
    const ketVal = parseFloat(String(ket).replace(',', '.'));
    const pengVal = parseFloat(String(peng).replace(',', '.'));
    
    if (isNaN(ketVal) || isNaN(pengVal)) return '-';
    
    const avg = (ketVal + pengVal) / 2;
    return avg.toFixed(2);
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

  const handleGenerateAll = () => {
    setViewMode('all');
    setTimeout(() => {
      window.print();
    }, 100);
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
        <div className="mb-3 text-xs" style={{display: 'grid', gridTemplateColumns: '60% 40%', gap: '12px'}}>
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
          <table className="w-full border-collapse text-xs mb-6 nilai-table" style={{borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'fixed'}}>
            <colgroup>
              <col style={{width: '5%'}} />
              <col style={{width: '30%'}} />
              <col style={{width: '8%'}} />
              <col style={{width: '57%'}} />
            </colgroup>
            <thead>
              <tr className="bg-gray-300">
                <th className={`border border-black px-2 py-1 text-center ${isMobile ? 'text-xs' : 'w-8'}`}>No.</th>
                <th className={`border border-black px-2 py-1 text-center ${isMobile ? 'text-xs' : ''}`}>Mata Pelajaran</th>
                <th className={`border border-black px-2 py-1 text-center ${isMobile ? 'text-xs w-12' : 'w-16'}`}>Nilai Akhir</th>
                <th className={`border border-black px-2 py-1 text-center ${isMobile ? 'text-xs' : ''}`}>Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {displaySubjects.map((subject, idx) => {
                const tp1 = subject.data?.TP1 || 'Mencapai kompetensi dengan baik dalam mengaplikasikan konsep yang telah dipelajari dalam berbagai konteks.';
                const tp2 = subject.data?.TP2 || '';
                
                return (
                  <React.Fragment key={idx}>
                  <tr>
                    <td className="border border-black px-2 py-1 text-center align-middle" rowSpan={tp2 ? 2 : 1} style={{fontSize: isMobile ? '10px' : '12px'}}>{idx + 1}</td>
                    <td className="border border-black px-2 py-1 align-middle" rowSpan={tp2 ? 2 : 1} style={{fontSize: isMobile ? '10px' : '12px'}}>{subject.name}</td>
                    <td className="border border-black px-2 py-1 text-center font-bold align-middle" rowSpan={tp2 ? 2 : 1} style={{fontSize: isMobile ? '10px' : '12px'}}>
                      {subject.data?.avg || '-'}
                    </td>
                    <td className="border-t border-r border-l border-black px-1" style={{fontSize: isMobile ? '11px' : '12px', lineHeight: '1.3', paddingTop: '0.2rem', paddingBottom: tp2 ? '0.2rem' : '0.2rem', borderBottom: tp2 ? 'none' : '1px solid black'}}>
                      {tp1}
                    </td>
                  </tr>
                  {tp2 && (
                    <tr>
                      <td className="border-r border-b border-l border-black px-1" style={{fontSize: isMobile ? '11px' : '12px', lineHeight: '1.3', paddingTop: '0.2rem', paddingBottom: '0.2rem'}}>
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
            <table className="w-full border-collapse text-xs mb-6 nilai-table" style={{borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'fixed'}}>
              <colgroup>
                <col style={{width: '5%'}} />
                <col style={{width: '30%'}} />
                <col style={{width: '8%'}} />
                <col style={{width: '57%'}} />
              </colgroup>
              <thead>
                <tr className="bg-gray-300">
                  <th className={`border border-black px-2 py-1 text-center ${isMobile ? 'text-xs' : 'w-8'}`}>No.</th>
                  <th className={`border border-black px-2 py-1 text-center ${isMobile ? 'text-xs' : ''}`}>Mata Pelajaran</th>
                  <th className={`border border-black px-2 py-1 text-center ${isMobile ? 'text-xs w-12' : 'w-16'}`}>Nilai Akhir</th>
                  <th className={`border border-black px-2 py-1 text-center ${isMobile ? 'text-xs' : ''}`}>Capaian Kompetensi</th>
                </tr>
                <tr className="bg-gray-300">
                  <th colSpan="4" className="border border-black px-2 py-2 text-left font-bold">A. Kelompok Mata Pelajaran Wajib</th>
                </tr>
              </thead>
              <tbody>
                {displaySubjects
                  .filter(subject => requiredSubjects.includes(subject.name))
                  .map((subject, idx) => {
                    const tp1 = subject.data?.TP1 || 'Mencapai kompetensi dengan baik dalam mengaplikasikan konsep yang telah dipelajari dalam berbagai konteks.';
                    const tp2 = subject.data?.TP2 || '';
                    
                    return (
                      <React.Fragment key={idx}>
                      <tr>
                        <td className="border border-black px-2 py-1 text-center align-middle" rowSpan={tp2 ? 2 : 1} style={{fontSize: isMobile ? '10px' : '12px'}}>{idx + 1}</td>
                        <td className="border border-black px-2 py-1 align-middle" rowSpan={tp2 ? 2 : 1} style={{fontSize: isMobile ? '10px' : '12px'}}>{subject.name}</td>
                        <td className="border border-black px-2 py-1 text-center font-bold align-middle" rowSpan={tp2 ? 2 : 1} style={{fontSize: isMobile ? '10px' : '12px'}}>
                          {subject.data?.avg || '-'}
                        </td>
                        <td className="border-t border-r border-l border-black px-1" style={{fontSize: isMobile ? '11px' : '12px', lineHeight: '1.3', paddingTop: '0.2rem', paddingBottom: tp2 ? '0.2rem' : '0.2rem', borderBottom: tp2 ? 'none' : '1px solid black'}}>
                          {tp1}
                        </td>
                      </tr>
                      {tp2 && (
                        <tr>
                          <td className="border-r border-b border-l border-black px-1" style={{fontSize: isMobile ? '11px' : '12px', lineHeight: '1.3', paddingTop: '0.2rem', paddingBottom: '0.2rem'}}>
                            {tp2}
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>

            {/* Gap */}
            <div className="mb-6"></div>

            {/* Tabel 2 - Mata Pelajaran Pilihan */}
            <table className="w-full border-collapse text-xs mb-6 nilai-table" style={{borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'fixed'}}>
              <colgroup>
                <col style={{width: '5%'}} />
                <col style={{width: '30%'}} />
                <col style={{width: '8%'}} />
                <col style={{width: '57%'}} />
              </colgroup>
              <thead>
                <tr className="bg-gray-300">
                  <th className={`border border-black px-2 py-1 text-center ${isMobile ? 'text-xs' : 'w-8'}`}>No.</th>
                  <th className={`border border-black px-2 py-1 text-center ${isMobile ? 'text-xs' : ''}`}>Mata Pelajaran</th>
                  <th className={`border border-black px-2 py-1 text-center ${isMobile ? 'text-xs w-12' : 'w-16'}`}>Nilai Akhir</th>
                  <th className={`border border-black px-2 py-1 text-center ${isMobile ? 'text-xs' : ''}`}>Capaian Kompetensi</th>
                </tr>
                <tr className="bg-gray-300">
                  <th colSpan="4" className="border border-black px-2 py-2 text-left font-bold">B. Kelompok Mata Pelajaran Pilihan</th>
                </tr>
              </thead>
              <tbody>
                {displaySubjects
                  .filter(subject => electiveSubjects.includes(subject.name))
                  .map((subject, idx) => {
                    const tp1 = subject.data?.TP1 || 'Mencapai kompetensi dengan baik dalam mengaplikasikan konsep yang telah dipelajari dalam berbagai konteks.';
                    const tp2 = subject.data?.TP2 || '';
                    
                    return (
                      <React.Fragment key={idx}>
                      <tr>
                        <td className="border border-black px-2 py-1 text-center align-middle" rowSpan={tp2 ? 2 : 1} style={{fontSize: isMobile ? '10px' : '12px'}}>{idx + 1}</td>
                        <td className="border border-black px-2 py-1 align-middle" rowSpan={tp2 ? 2 : 1} style={{fontSize: isMobile ? '10px' : '12px'}}>{subject.name}</td>
                        <td className="border border-black px-2 py-1 text-center font-bold align-middle" rowSpan={tp2 ? 2 : 1} style={{fontSize: isMobile ? '10px' : '12px'}}>
                          {subject.data?.avg || '-'}
                        </td>
                        <td className="border-t border-r border-l border-black px-1" style={{fontSize: isMobile ? '11px' : '12px', lineHeight: '1.3', paddingTop: '0.2rem', paddingBottom: tp2 ? '0.2rem' : '0.2rem', borderBottom: tp2 ? 'none' : '1px solid black'}}>
                          {tp1}
                        </td>
                      </tr>
                      {tp2 && (
                        <tr>
                          <td className="border-r border-b border-l border-black px-1" style={{fontSize: isMobile ? '11px' : '12px', lineHeight: '1.3', paddingTop: '0.2rem', paddingBottom: '0.2rem'}}>
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
      </div>
    );
  };

  const RaporPage2 = ({ student }) => {
    const pageStyle = isMobile ? {
      padding: '12px',
      fontSize: '11px'
    } : {
      padding: '0',
      fontSize: '12px'
    };

    return (
      <div className="bg-white rapor-page-2" style={pageStyle}>
        {/* Kokurikuler */}
        <div className="mb-3 mt-6">
          <div className="bg-gray-300 border-t border-l border-r border-black px-2 py-2 font-bold text-xs">Kokurikuler</div>
          <div className="border border-black px-2 py-2 min-h-12 text-xs">
            {student?.kokurikuler || 'Ananda sudah baik dalam kreativitas yang terlihat dari kemampuan menemukan dan mengembangkan alternatif solusi yang efektif pada tema konservasi energi. Ananda masih perlu berlatih dalam mengomunikasikan gagasan.'}
          </div>
        </div>

        {/* Ekstrakurikuler */}
        <div className="mb-3">
          <table className="w-full border-collapse text-xs" style={{borderCollapse: 'collapse', borderSpacing: '0'}}>
            <thead>
              <tr className="bg-gray-300">
                <th className="border border-black px-2 py-2 w-8">No.</th>
                <th className="border border-black px-2 py-2 text-left" style={{width: '30%'}}>Ekstrakurikuler</th>
                <th className="border border-black px-2 py-2">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {student?.ekstrakurikuler && student.ekstrakurikuler.length > 0 ? (
                <>
                  {student.ekstrakurikuler.map((ekskul, idx) => (
                    <tr key={idx}>
                      <td className="border border-black px-2 py-2 text-center">{idx + 1}</td>
                      <td className="border border-black px-2 py-2" style={{width: '30%'}}>{ekskul.nama}</td>
                      <td className="border border-black px-2 py-2">{ekskul.keterangan}</td>
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  <tr>
                    <td className="border border-black px-2 py-2 text-center">1</td>
                    <td className="border border-black px-2 py-2" style={{width: '30%'}}>Pramuka</td>
                    <td className="border border-black px-2 py-2">Trampil dan disiplin dalam kegiatan kepramukaan</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-2 text-center">2</td>
                    <td className="border border-black px-2 py-2" style={{width: '30%'}}>PMR</td>
                    <td className="border border-black px-2 py-2">Aktif remaja sehat peduli sesama dan kesehatan remaja</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Ketidakhadiran dan Catatan */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
          <div>
            <div className="bg-gray-300 border-t border-l border-r border-black px-2 py-2 font-bold">Ketidakhadiran</div>
            <table className="w-full border-collapse" style={{borderCollapse: 'collapse', borderSpacing: '0'}}>
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
            <div className="bg-gray-300 border-t border-l border-r border-black px-2 py-2 font-bold">Catatan Wali Kelas</div>
            <div className="border border-black px-2 py-2 text-xs" style={{minHeight: '72px'}}>
              {student?.catatanWaliKelas || ''}
            </div>
          </div>
        </div>

        {/* Tanggapan Orang Tua */}
        <div className="mb-3 text-xs">
          <div className="bg-gray-300 border-t border-l border-r border-black px-2 py-2 font-bold">Tanggapan Orang Tua/Wali Murid</div>
          <div className="border border-black px-2 py-2 min-h-12"></div>
        </div>

        {/* Tanda Tangan */}
        <div className="text-xs mt-4">
          {/* Row 1: Orang Tua (left) and Tempat/Tanggal + Wali Kelas (right) */}
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
                // If it's a number (Excel date), convert it
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

          {/* Row 2: Mengetahui Kepala Sekolah (middle) */}
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
          /* Remove border between TP rows in same subject - only for Nilai table */
          .nilai-table tbody tr:nth-child(odd) td:last-child {
            border-bottom: none !important;
          }
          .nilai-table tbody tr:nth-child(even) td:last-child {
            border-top: none !important;
          }
          /* Container untuk RaporPage1 bisa melanjut ke page 2 */
          .rapor-page-1 { 
            page-break-after: auto; 
            box-sizing: border-box;
            width: 100%;
            padding: 0;
            box-shadow: none !important;
            margin-bottom: 0 !important;
          }
          .rapor-page-2 { 
            page-break-before: auto; 
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
                <div className="grid grid-cols-2 gap-3">
                  {/* Left: Upload Section & Student Selection */}
                  <div className="border-r border-gray-200 pr-3 space-y-3">
                    {/* Upload Section */}
                    <div>
                      <h2 className="font-semibold mb-2 flex items-center gap-2 text-xs">
                        <FileSpreadsheet size={14} /> Upload File Excel
                      </h2>
                      <label className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition text-base w-full justify-center">
                        <Upload size={20} />
                        Pilih File
                        <input 
                          type="file" 
                          accept=".xlsx,.xls" 
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      {students.length > 0 && (
                        <p className="mt-2 text-gray-600 text-xs">
                          ✓ {students.length} siswa berhasil dimuat
                        </p>
                      )}
                    </div>

                    {/* Layout Selection Buttons */}
                    {students.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="font-semibold mb-2 text-xs">Layout:</p>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setLayoutType('kelas10')}
                            className={`px-2 py-1 rounded text-xs font-medium transition w-full ${layoutType === 'kelas10' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                          >
                            Kelas 10
                          </button>
                          <button
                            onClick={() => setLayoutType('kelas1112')}
                            className={`px-2 py-1 rounded text-xs font-medium transition w-full ${layoutType === 'kelas1112' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                          >
                            Kelas 11/12
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Student Selection & View Mode & Print Buttons */}
                  {students.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {/* Student Selection */}
                      <div>
                        <label className="block font-semibold mb-1 text-xs">Pilih Siswa:</label>
                        <select 
                          className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                          onChange={(e) => {
                            setSelectedStudent(students[e.target.value]);
                            setViewMode('single');
                            if (isMobile) setMobileMenuOpen(false);
                          }}
                        >
                          {students.map((student, index) => (
                            <option key={index} value={index}>
                              {student.Nama} ({student.NIS})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* View Mode Buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setViewMode('single');
                            if (isMobile) setMobileMenuOpen(false);
                          }}
                          className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${viewMode === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                        >
                          1 Siswa
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('all');
                            if (isMobile) setMobileMenuOpen(false);
                          }}
                          className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                        >
                          Semua
                        </button>
                      </div>

                      {/* Print Buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={handlePrint}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs font-medium"
                        >
                          <Printer size={14} />
                          Print
                        </button>
                        {viewMode === 'single' && (
                          <button
                            onClick={handleGenerateAll}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-xs font-medium"
                          >
                            <Printer size={14} />
                            Semua
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Desktop: Three-column layout (Upload 15%, Layout 15%, Student 70%)
              <div className="gap-6" style={{display: 'grid', gridTemplateColumns: '3fr 3fr 14fr'}}>
                {/* Column 1: Upload Section */}
                <div>
                  <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                    <FileSpreadsheet size={20} /> Upload File Excel
                  </h2>
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition text-sm font-medium w-full justify-center">
                    <Upload size={20} />
                    Pilih File Excel
                    <input 
                      type="file" 
                      accept=".xlsx,.xls" 
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {students.length > 0 && (
                    <p className="mt-3 text-gray-600 text-sm">
                      ✓ {students.length} siswa berhasil dimuat
                    </p>
                  )}
                </div>

                {/* Column 2: Layout Selection */}
                {students.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Pilih Layout:</h3>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setLayoutType('kelas10')}
                        className={`px-4 py-2 rounded text-sm font-medium transition w-full ${layoutType === 'kelas10' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                      >
                        Layout Kelas 10
                      </button>
                      <button
                        onClick={() => setLayoutType('kelas1112')}
                        className={`px-4 py-2 rounded text-sm font-medium transition w-full ${layoutType === 'kelas1112' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                      >
                        Layout Kelas 11/12
                      </button>
                    </div>
                  </div>
                )}

                {/* Column 3: Student Selection Controls */}
                {students.length > 0 && (
                  <div className="flex flex-col">
                    {/* Student Selection - aligned with Layout Kelas 10 */}
                    <div className="mb-1">
                      <label className="block font-semibold mb-2 text-sm">Pilih Siswa:</label>
                      <select 
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onChange={(e) => {
                          setSelectedStudent(students[e.target.value]);
                          setViewMode('single');
                        }}
                      >
                        {students.map((student, index) => (
                          <option key={index} value={index}>
                            {student.Nama} (NIS: {student.NIS})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* View Mode & Print Buttons Row - aligned with Layout Kelas 11/12 */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewMode('single')}
                        className={`flex-1 px-4 py-2 rounded text-sm font-medium transition ${viewMode === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                      >
                        Lihat 1 Siswa
                      </button>
                      <button
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium"
                      >
                        <Printer size={18} />
                        {viewMode === 'single' ? 'Print Siswa Ini' : 'Print Semua Siswa'}
                      </button>
                      <button
                        onClick={() => setViewMode('all')}
                        className={`flex-1 px-4 py-2 rounded text-sm font-medium transition ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                      >
                        Lihat Semua
                      </button>
                      {viewMode === 'single' && (
                        <button
                          onClick={handleGenerateAll}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm font-medium"
                        >
                          <Printer size={18} />
                          Generate Semua
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
            <div className={`${isMobile ? 'space-y-2' : 'mx-auto space-y-0 w-full'} print:m-0 print:max-w-none`} style={!isMobile ? {maxWidth: '210mm'} : {}}>
              {viewMode === 'single' ? (
                // Single student view - show both pages
                <>
                  <RaporPage1 student={selectedStudent} layoutType={layoutType} />
                  <div className="border-t-2 border-dashed border-gray-300 py-2 text-center text-xs text-gray-400 print:hidden">
                    ────── HALAMAN 2 ──────
                  </div>
                  <RaporPage2 student={selectedStudent} />
                </>
              ) : (
                // All students view
                <>
                  {students.map((student, index) => (
                    <React.Fragment key={index}>
                      <RaporPage1 student={student} layoutType={layoutType} />
                      <div className="border-t-2 border-dashed border-gray-300 py-2 text-center text-xs text-gray-400 print:hidden">
                        ────── HALAMAN 2 ──────
                      </div>
                      <RaporPage2 student={student} />
                      {index < students.length - 1 && (
                        <div className="border-t-4 border-double border-gray-400 py-3 my-2 text-center text-xs text-gray-500 font-semibold print:hidden">
                          ═══════ SISWA BERIKUTNYA ═══════
                        </div>
                      )}
                    </React.Fragment>
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