import React, { useState } from 'react';
import { Upload, Printer, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const RaporApp = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'

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
      
      // Parse info sekolah dari baris 1-5
      [0, 1, 2, 3, 4].forEach(idx => {
        if (nilaiData[idx] && nilaiData[idx][0] && nilaiData[idx][1]) {
          const key = nilaiData[idx][0].toLowerCase().trim();
          if (key === 'sekolah') schoolInfo.sekolah = nilaiData[idx][1];
          else if (key === 'kelas') schoolInfo.kelas = nilaiData[idx][1];
          else if (key === 'fase') schoolInfo.fase = nilaiData[idx][1];
          else if (key === 'semester') schoolInfo.semester = nilaiData[idx][1];
          else if (key === 'tahun ajaran') schoolInfo.tahunAjaran = nilaiData[idx][1];
        }
      });

      // Parse header mata pelajaran dari baris 7 (index 6)
      const subjectRow = nilaiData[6];
      const subjects = [];
      
      if (subjectRow) {
        for (let i = 3; i < subjectRow.length; i++) {
          const subject = subjectRow[i];
          if (subject && subject !== 'RATA-RATA' && subject.trim() !== '') {
            let subjectData = subjects.find(s => s.name === subject);
            if (!subjectData) {
              subjectData = { name: subject, KETimestamp: i, PENGTimestamp: i, TP1Timestamp: i, TP2Timestamp: i };
              subjects.push(subjectData);
            }
          }
        }
      }

      // Parse data siswa dari baris 9+ (index 8+)
      const nilaiRows = nilaiData.slice(8);
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

        subjects.forEach(subject => {
          const ketVal = row[subject.KETimestamp];
          const pengVal = row[subject.PENGTimestamp];
          
          studentMap[nama].subjects[subject.name] = {
            KET: ketVal,
            PENG: pengVal,
            avg: calculateAverage(ketVal, pengVal)
          };
        });
      });

      // Parse Sheet 2 - DESKRIPSI (Capaian Kompetensi)
      if (sheetNames.length > 1) {
        const deskripsiSheet = workbook.Sheets[sheetNames[1]];
        const deskripsiData = XLSX.utils.sheet_to_json(deskripsiSheet, { header: 1 });
        
        const deskripsiRows = deskripsiData.slice(8);
        deskripsiRows.forEach((row) => {
          if (!row[2] || row[2] === 'RATA-RATA KELAS' || row[2].trim() === '') return;

          const nama = row[2];
          if (studentMap[nama]) {
            subjects.forEach((subject) => {
              const tp1 = row[subject.KETimestamp];
              const tp2 = row[subject.PENGTimestamp];
              
              if (!studentMap[nama].subjects[subject.name]) {
                studentMap[nama].subjects[subject.name] = {};
              }
              
              studentMap[nama].subjects[subject.name].TP1 = tp1;
              studentMap[nama].subjects[subject.name].TP2 = tp2;
            });
          }
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

        // Parse data siswa dari baris 9+ (index 8+)
        const pelengkapRows = pelengkapData.slice(8);
        pelengkapRows.forEach((row) => {
          if (!row[2] || row[2] === 'RATA-RATA KELAS' || row[2].trim() === '') return;

          const nama = row[2];
          if (studentMap[nama]) {
            studentMap[nama].kokurikuler = row[3] || '';
            studentMap[nama].ekstrakurikuler = [
              { nama: 'Pramuka', keterangan: row[4] || '' },
              { nama: 'PMR', keterangan: row[5] || '' }
            ];
            studentMap[nama].ketidakhadiran = {
              sakit: row[6] || 0,
              izin: row[7] || 0,
              tanpaKet: row[8] || 0
            };
          }
        });
      }

      const processedStudents = Object.values(studentMap);
      
      setStudents(processedStudents);
      if (processedStudents.length > 0) {
        setSelectedStudent(processedStudents[0]);
      }
      alert(`Berhasil memuat ${processedStudents.length} siswa dari ${sheetNames.length} sheet`);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Gagal membaca file. Error: ' + error.message);
    }
  };

  const calculateAverage = (ket, peng) => {
    const ketVal = parseFloat(String(ket).replace(',', '.'));
    const pengVal = parseFloat(String(peng).replace(',', '.'));
    
    if (isNaN(ketVal) || isNaN(pengVal)) return '-';
    
    const avg = (ketVal + pengVal) / 2;
    return avg.toFixed(2);
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

  const RaporPage1 = ({ student }) => {
    // Semua mata pelajaran
    const allSubjects = [
      'Pendidikan Agama dan Budi Pekerti',
      'Pendidikan Pancasila',
      'Bahasa Indonesia',
      'Matematika',
      'Ilmu Pengetahuan Alam (Fisika, Kimia, Biologi)',
      'Ilmu Pengetahuan Sosial (Sosiologi, Ekonomi, Sejarah, Geografi)',
      'Bahasa Inggris',
      'Pendidikan Jasmani Olahraga dan Kesehatan',
      'Informatika',
      'Seni Budaya, dan Prakarya'
    ];

    // Filter hanya mata pelajaran yang ada di data - mapping yang lebih fleksibel
    const subjectMapping = {
      'Aswaja': 'Pendidikan Agama dan Budi Pekerti',
      'Pendidikan Pancasila dan Kewarganegaraan': 'Pendidikan Pancasila',
      'Bahasa Indonesia': 'Bahasa Indonesia',
      'Matematika': 'Matematika',
      'Biologi': 'Ilmu Pengetahuan Alam (Fisika, Kimia, Biologi)',
      'Fisika': 'Ilmu Pengetahuan Alam (Fisika, Kimia, Biologi)',
      'Kimia': 'Ilmu Pengetahuan Alam (Fisika, Kimia, Biologi)',
      'Sosiologi': 'Ilmu Pengetahuan Sosial (Sosiologi, Ekonomi, Sejarah, Geografi)',
      'Ekonomi': 'Ilmu Pengetahuan Sosial (Sosiologi, Ekonomi, Sejarah, Geografi)',
      'Sejarah Indonesia': 'Ilmu Pengetahuan Sosial (Sosiologi, Ekonomi, Sejarah, Geografi)',
      'Geografi': 'Ilmu Pengetahuan Sosial (Sosiologi, Ekonomi, Sejarah, Geografi)',
      'Bahasa dan Sastra Inggris': 'Bahasa Inggris',
      'Pendidikan Jasmani Olahraga dan Kesehatan': 'Pendidikan Jasmani Olahraga dan Kesehatan',
      'Informatika': 'Informatika',
      'Prakarya dan Kewirausahaan': 'Seni Budaya, dan Prakarya'
    };

    // Get unique mapped subjects
    const uniqueSubjects = [];
    const seenSubjects = new Set();
    
    Object.entries(subjectMapping).forEach(([originalName, displayName]) => {
      if (student?.subjects[originalName] && !seenSubjects.has(displayName)) {
        seenSubjects.add(displayName);
        uniqueSubjects.push({
          displayName,
          originalName,
          value: student.subjects[originalName]
        });
      }
    });

    return (
      <div className="bg-white page-break" style={{width: '210mm', minHeight: '297mm', padding: '15mm', fontSize: '11px'}}>
        {/* Header */}
        <div className="text-center mb-3 pb-2 border-b-2 border-black">
          <h1 className="text-lg font-bold">LAPORAN HASIL BELAJAR (RAPOR)</h1>
          <p className="text-xs">SMA MAMBA'UNNUR - KURIKULUM MERDEKA</p>
        </div>

        {/* Identitas Siswa */}
        <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
          <div>
            <div className="flex mb-1">
              <span className="w-20 font-semibold">Nama Murid</span>
              <span className="w-2">:</span>
              <span className="flex-1">{student?.identitas?.nama || student?.Nama || '-'}</span>
            </div>
            <div className="flex mb-1">
              <span className="w-20 font-semibold">NISN</span>
              <span className="w-2">:</span>
              <span className="flex-1">{student?.identitas?.nisn || student?.NIS || '-'}</span>
            </div>
            <div className="flex mb-1">
              <span className="w-20 font-semibold">Sekolah</span>
              <span className="w-2">:</span>
              <span className="flex-1">{student?.identitas?.sekolah || 'SMA Mamba\'unnur'}</span>
            </div>
            <div className="flex">
              <span className="w-20 font-semibold">Alamat</span>
              <span className="w-2">:</span>
              <span className="flex-1">{student?.identitas?.alamat || '-'}</span>
            </div>
          </div>
          <div>
            <div className="flex mb-1">
              <span className="w-16 font-semibold">Kelas</span>
              <span className="w-2">:</span>
              <span className="flex-1">{student?.identitas?.kelas || 'X'}</span>
            </div>
            <div className="flex mb-1">
              <span className="w-16 font-semibold">Fase</span>
              <span className="w-2">:</span>
              <span className="flex-1">{student?.identitas?.fase || '-'}</span>
            </div>
            <div className="flex mb-1">
              <span className="w-16 font-semibold">Semester</span>
              <span className="w-2">:</span>
              <span className="flex-1">{student?.identitas?.semester || '1'}</span>
            </div>
            <div className="flex">
              <span className="w-16 font-semibold">Tahun Ajaran</span>
              <span className="w-2">:</span>
              <span className="flex-1">{student?.identitas?.tahunAjaran || '2025/2026'}</span>
            </div>
          </div>
        </div>

        {/* Tabel Nilai */}
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-300">
              <th className="border border-black px-2 py-2 w-8">No.</th>
              <th className="border border-black px-2 py-2 text-left">Mata Pelajaran</th>
              <th className="border border-black px-2 py-2 w-16">Nilai Akhir</th>
              <th className="border border-black px-2 py-2">Capaian Kompetensi</th>
            </tr>
          </thead>
          <tbody>
            {uniqueSubjects.map((subject, idx) => (
              <tr key={idx}>
                <td className="border border-black px-2 py-2 text-center align-top">{idx + 1}</td>
                <td className="border border-black px-2 py-2 align-top">{subject.displayName}</td>
                <td className="border border-black px-2 py-2 text-center font-bold align-top">
                  {subject.value?.avg || '-'}
                </td>
                <td className="border border-black px-2 py-1 text-xs">
                  {subject.value?.TP1 || 'Mencapai kompetensi dengan baik dalam menunjukkan perilaku yang konsisten sesuai dengan nilai-nilai yang dipelajari.'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const RaporPage2 = ({ student }) => {
    return (
      <div className="bg-white page-break" style={{width: '210mm', minHeight: '297mm', padding: '15mm', fontSize: '11px'}}>
        {/* Lanjutan Tabel jika ada */}
        <div className="mb-3">
          <table className="w-full border-collapse border border-black text-xs">
            <tbody>
              <tr className="bg-gray-300">
                <td className="border border-black px-2 py-2 w-8 text-center font-bold">No.</td>
                <td className="border border-black px-2 py-2 text-left font-bold">Mata Pelajaran</td>
                <td className="border border-black px-2 py-2 w-16 text-center font-bold">Nilai Akhir</td>
                <td className="border border-black px-2 py-2 font-bold">Capaian Kompetensi</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Kokurikuler */}
        <div className="mb-3">
          <div className="bg-gray-300 border border-black px-2 py-2 font-bold text-xs">Kokurikuler</div>
          <div className="border border-black px-2 py-2 min-h-12 text-xs">
            {student?.kokurikuler || 'Ananda sudah baik dalam kreativitas yang terlihat dari kemampuan menemukan dan mengembangkan alternatif solusi yang efektif pada tema konservasi energi. Ananda masih perlu berlatih dalam mengomunikasikan gagasan.'}
          </div>
        </div>

        {/* Ekstrakurikuler */}
        <div className="mb-3">
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-gray-300">
                <th className="border border-black px-2 py-2 w-8">No.</th>
                <th className="border border-black px-2 py-2 text-left">Ekstrakurikuler</th>
                <th className="border border-black px-2 py-2">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {student?.ekstrakurikuler && student.ekstrakurikuler.length > 0 ? (
                <>
                  {student.ekstrakurikuler.map((ekskul, idx) => (
                    <tr key={idx}>
                      <td className="border border-black px-2 py-2 text-center">{idx + 1}</td>
                      <td className="border border-black px-2 py-2">{ekskul.nama}</td>
                      <td className="border border-black px-2 py-2">{ekskul.keterangan}</td>
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  <tr>
                    <td className="border border-black px-2 py-2 text-center">1</td>
                    <td className="border border-black px-2 py-2">Pramuka</td>
                    <td className="border border-black px-2 py-2">Trampil dan disiplin dalam kegiatan kepramukaan</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-2 text-center">2</td>
                    <td className="border border-black px-2 py-2">PMR</td>
                    <td className="border border-black px-2 py-2">Aktif remaja sehat peduli sesama dan kesehatan remaja</td>
                  </tr>
                </>
              )}
              <tr>
                <td className="border border-black px-2 py-2 text-center">dst.</td>
                <td className="border border-black px-2 py-2">-</td>
                <td className="border border-black px-2 py-2">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Ketidakhadiran dan Catatan */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
          <div>
            <div className="bg-gray-300 border border-black px-2 py-2 font-bold">Ketidakhadiran</div>
            <table className="w-full border-collapse border border-black">
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
            <div className="bg-gray-300 border border-black px-2 py-2 font-bold">Catatan Wali Kelas</div>
            <div className="border border-black px-2 py-2 min-h-20 text-xs">
              
            </div>
          </div>
        </div>

        {/* Tanggapan Orang Tua */}
        <div className="mb-3 text-xs">
          <div className="bg-gray-300 border border-black px-2 py-2 font-bold">Tanggapan Orang Tua/Wali Murid</div>
          <div className="border border-black px-2 py-2 min-h-12"></div>
        </div>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-3 gap-3 text-xs text-center mt-4">
          <div>
            <p className="font-semibold mb-16">Orang Tua Murid</p>
            <p className="border-t border-black pt-1">TTD</p>
          </div>
          <div>
            <p className="font-semibold mb-2">{student?.identitas?.tempat}, {student?.identitas?.tanggal}</p>
            <p className="font-semibold mb-12">{student?.identitas?.namaKepala || 'Kepala Sekolah'}</p>
            <p className="border-t border-black pt-1">TTD</p>
          </div>
          <div>
            <p className="font-semibold mb-16">{student?.identitas?.namaWaliKelas || 'Wali Kelas'}</p>
            <p className="border-t border-black pt-1">TTD</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .page-break { page-break-after: always; }
        }
      `}</style>

      {/* Control Panel - Hidden saat print */}
      <div className="max-w-6xl mx-auto mb-4 print:hidden">
        <div className="bg-white rounded-lg shadow p-4">
          {/* Upload Section */}
          <div className="mb-4 pb-4 border-b">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <FileSpreadsheet /> Upload File Excel
            </h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
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
                <span className="text-sm text-gray-600">
                  {students.length} siswa berhasil dimuat
                </span>
              )}
            </div>
          </div>

          {students.length > 0 && (
            <>
              {/* View Controls */}
              <div className="flex gap-4 items-center mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Pilih Siswa:</label>
                  <select 
                    className="w-full border rounded px-3 py-2"
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
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('single')}
                    className={`px-4 py-2 rounded ${viewMode === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  >
                    Lihat 1 Siswa
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-4 py-2 rounded ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  >
                    Lihat Semua
                  </button>
                </div>
              </div>



              {/* Print Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
                >
                  <Printer size={20} />
                  {viewMode === 'single' ? 'Print Siswa Ini' : 'Print Semua Siswa'}
                </button>
                {viewMode === 'single' && (
                  <button
                    onClick={handleGenerateAll}
                    className="bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-purple-700"
                  >
                    <Printer size={20} />
                    Generate & Print Semua
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rapor Display */}
      {students.length > 0 && (
        <div className="max-w-6xl mx-auto">
          {viewMode === 'single' ? (
            // Single student view - show both pages
            <>
              <RaporPage1 student={selectedStudent} />
              <RaporPage2 student={selectedStudent} />
            </>
          ) : (
            // All students view
            <>
              {students.map((student, index) => (
                <React.Fragment key={index}>
                  <RaporPage1 student={student} />
                  <RaporPage2 student={student} />
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      )}

      {students.length === 0 && (
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <FileSpreadsheet size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold mb-2">Belum Ada Data</h3>
          <p className="text-gray-600">Silakan upload file Excel untuk mulai membuat rapor</p>
        </div>
      )}
    </div>
  );
};

export default RaporApp;