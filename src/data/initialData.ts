import { Student, AttendanceRecord, AppSettings, BKNote } from '../types';

export const defaultSettings: AppSettings = {
  academicYear: '2025/2026',
  semester: 'Ganjil',
  classList: [
    'X-1',
    'X-2',
    'X-3',
    'XI MIPA 1',
    'XI MIPA 2',
    'XI IPS 1',
    'XI IPS 2',
    'XII MIPA 1',
    'XII IPS 1',
  ],
  warningThresholds: {
    yellow: 3,
    red: 5,
    priority: 10,
  },
  teacherProfile: {
    name: 'Riska Puspita, S.Pd., Kons.',
    nip: '19880412 201403 2 004',
    schoolName: 'SMAN 1 LEUWILIANG by Riska Puspita',
    schoolAddress: 'Jl. Raya Leuwiliang No. 106, Leuwiliang, Kab. Bogor, Jawa Barat',
    headmasterName: 'Drs. H. Bambang Sujatmiko, M.Pd.',
    headmasterNip: '19680715 199303 1 002',
    email: 'riskapuspita32@guru.sma.belajar.id',
  },
};

export const initialStudents: Student[] = [
  // Kelas X-1
  {
    id: 'std-101',
    nisn: '0078291001',
    nis: '24251001',
    nama: 'Ahmad Rizky Pratama',
    kelas: 'X-1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Bambang Pratama',
    no_hp_ortu: '081234567890',
    alamat: 'Jl. Merpati No. 12',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-102',
    nisn: '0078291002',
    nis: '24251002',
    nama: 'Alya Putri Salsabila',
    kelas: 'X-1',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Drs. Hendro Wibowo',
    no_hp_ortu: '081298765432',
    alamat: 'Jl. Kenanga No. 5',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-103',
    nisn: '0078291003',
    nis: '24251003',
    nama: 'Budi Santoso',
    kelas: 'X-1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Santoso Tedjo',
    no_hp_ortu: '081377889900',
    alamat: 'Jl. Cendrawasih No. 24',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-104',
    nisn: '0078291004',
    nis: '24251004',
    nama: 'Citra Dewi Lestari',
    kelas: 'X-1',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Kurniawan Lestari',
    no_hp_ortu: '081566778899',
    alamat: 'Jl. Mawar No. 8',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-105',
    nisn: '0078291005',
    nis: '24251005',
    nama: 'Dinda Rahmawati',
    kelas: 'X-1',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Rahman Hakim',
    no_hp_ortu: '081822334455',
    alamat: 'Jl. Melati Blok C2',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-106',
    nisn: '0078291006',
    nis: '24251006',
    nama: 'Eko Prasetyo Utomo',
    kelas: 'X-1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Suhartono',
    no_hp_ortu: '081911223344',
    alamat: 'Jl. Dahlia No. 17',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-107',
    nisn: '0078291007',
    nis: '24251007',
    nama: 'Fajar Ramadhan',
    kelas: 'X-1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'H. Ramli',
    no_hp_ortu: '085244556677',
    alamat: 'Jl. Anggrek No. 3',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-108',
    nisn: '0078291008',
    nis: '24251008',
    nama: 'Gita Savitri Maharani',
    kelas: 'X-1',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Maharani Kusuma',
    no_hp_ortu: '085788990011',
    alamat: 'Jl. Flamboyan No. 19',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-109',
    nisn: '0078291009',
    nis: '24251009',
    nama: 'Haryanto Wijaya',
    kelas: 'X-1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Wijaya Kusuma',
    no_hp_ortu: '087812345678',
    alamat: 'Jl. Pahlawan No. 40',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-110',
    nisn: '0078291010',
    nis: '24251010',
    nama: 'Indah Permatasari',
    kelas: 'X-1',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Sugeng Permana',
    no_hp_ortu: '081233445566',
    alamat: 'Jl. Rajawali No. 7',
    created_at: '2025-07-15T07:00:00.000Z',
  },

  // Kelas X-2
  {
    id: 'std-201',
    nisn: '0078292001',
    nis: '24252001',
    nama: 'Joko Widodo Susilo',
    kelas: 'X-2',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Susilo Bambang',
    no_hp_ortu: '081211112222',
    alamat: 'Jl. Garuda No. 11',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-202',
    nisn: '0078292002',
    nis: '24252002',
    nama: 'Kirana Larasati',
    kelas: 'X-2',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Laras Wibisono',
    no_hp_ortu: '081322223333',
    alamat: 'Jl. Teratai No. 6',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-203',
    nisn: '0078292003',
    nis: '24252003',
    nama: 'Muhammad Aditya Pratama',
    kelas: 'X-2',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Pratama Jaya',
    no_hp_ortu: '081533334444',
    alamat: 'Jl. Semeru No. 88',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-204',
    nisn: '0078292004',
    nis: '24252004',
    nama: 'Nabila Zahra Khairunnisa',
    kelas: 'X-2',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Khairul Anam',
    no_hp_ortu: '081644445555',
    alamat: 'Jl. Bromo No. 14',
    created_at: '2025-07-15T07:00:00.000Z',
  },
  {
    id: 'std-205',
    nisn: '0078292005',
    nis: '24252005',
    nama: 'Rian Hidayat',
    kelas: 'X-2',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Hidayatullah',
    no_hp_ortu: '081755556666',
    alamat: 'Jl. Merbabu No. 2',
    created_at: '2025-07-15T07:00:00.000Z',
  },

  // Kelas XI MIPA 1
  {
    id: 'std-301',
    nisn: '0068293001',
    nis: '23241001',
    nama: 'Arya Dimas Nugroho',
    kelas: 'XI MIPA 1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Nugroho Tri',
    no_hp_ortu: '081866667777',
    alamat: 'Jl. Diponegoro No. 10',
    created_at: '2024-07-15T07:00:00.000Z',
  },
  {
    id: 'std-302',
    nisn: '0068293002',
    nis: '23241002',
    nama: 'Bella Septiana Putri',
    kelas: 'XI MIPA 1',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Septian Hadi',
    no_hp_ortu: '081977778888',
    alamat: 'Jl. Sudirman No. 55',
    created_at: '2024-07-15T07:00:00.000Z',
  },
  {
    id: 'std-303',
    nisn: '0068293003',
    nis: '23241003',
    nama: 'Danang Tri Saputra',
    kelas: 'XI MIPA 1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Saputro Utomo',
    no_hp_ortu: '085288889999',
    alamat: 'Jl. Thamrin No. 20',
    created_at: '2024-07-15T07:00:00.000Z',
  },
  {
    id: 'std-304',
    nisn: '0068293004',
    nis: '23241004',
    nama: 'Fatimah Az-Zahra',
    kelas: 'XI MIPA 1',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Ahmad Faisal',
    no_hp_ortu: '085799990000',
    alamat: 'Jl. Gatot Subroto No. 33',
    created_at: '2024-07-15T07:00:00.000Z',
  },
  {
    id: 'std-305',
    nisn: '0068293005',
    nis: '23241005',
    nama: 'Gilang Maulana Ibrahim',
    kelas: 'XI MIPA 1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Ibrahim Basri',
    no_hp_ortu: '087800001111',
    alamat: 'Jl. Rasuna Said No. 4',
    created_at: '2024-07-15T07:00:00.000Z',
  },

  // Kelas XI IPS 1
  {
    id: 'std-401',
    nisn: '0068294001',
    nis: '23242001',
    nama: 'Bagus Setiawan',
    kelas: 'XI IPS 1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Setiawan Budi',
    no_hp_ortu: '081200112233',
    alamat: 'Jl. Kartini No. 9',
    created_at: '2024-07-15T07:00:00.000Z',
  },
  {
    id: 'std-402',
    nisn: '0068294002',
    nis: '23242002',
    nama: 'Dian Anggraini',
    kelas: 'XI IPS 1',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Anggoro Kasih',
    no_hp_ortu: '081311223344',
    alamat: 'Jl. Cut Nyak Dien No. 15',
    created_at: '2024-07-15T07:00:00.000Z',
  },
  {
    id: 'std-403',
    nisn: '0068294003',
    nis: '23242003',
    nama: 'Kevin Sanjaya Pratama',
    kelas: 'XI IPS 1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Pratama Wijaya',
    no_hp_ortu: '081522334455',
    alamat: 'Jl. Teuku Umar No. 25',
    created_at: '2024-07-15T07:00:00.000Z',
  },
  {
    id: 'std-404',
    nisn: '0068294004',
    nis: '23242004',
    nama: 'Lestari Handayani',
    kelas: 'XI IPS 1',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Handoyo',
    no_hp_ortu: '081633445566',
    alamat: 'Jl. Hasanuddin No. 18',
    created_at: '2024-07-15T07:00:00.000Z',
  },
  {
    id: 'std-405',
    nisn: '0068294005',
    nis: '23242005',
    nama: 'Rizky Alamsyah (Kasus Alfa Tinggi)',
    kelas: 'XI IPS 1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Alamsyah M.',
    no_hp_ortu: '081744556677',
    alamat: 'Jl. Pattimura No. 71',
    created_at: '2024-07-15T07:00:00.000Z',
  },

  // Kelas XII MIPA 1
  {
    id: 'std-501',
    nisn: '0058295001',
    nis: '22231001',
    nama: 'Ananda Putri Pertiwi',
    kelas: 'XII MIPA 1',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Pertiwi Wardhana',
    no_hp_ortu: '081855667788',
    alamat: 'Jl. Veteran No. 1',
    created_at: '2023-07-15T07:00:00.000Z',
  },
  {
    id: 'std-502',
    nisn: '0058295002',
    nis: '22231002',
    nama: 'Bayu Segara',
    kelas: 'XII MIPA 1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Segara Banyu',
    no_hp_ortu: '081966778899',
    alamat: 'Jl. Hayam Wuruk No. 8',
    created_at: '2023-07-15T07:00:00.000Z',
  },
  {
    id: 'std-503',
    nisn: '0058295003',
    nis: '22231003',
    nama: 'Clara Shinta Dewi',
    kelas: 'XII MIPA 1',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Dewi Sartika',
    no_hp_ortu: '085277889900',
    alamat: 'Jl. Gajah Mada No. 14',
    created_at: '2023-07-15T07:00:00.000Z',
  },
  {
    id: 'std-504',
    nisn: '0058295004',
    nis: '22231004',
    nama: 'Doni Firmansyah',
    kelas: 'XII MIPA 1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: 'Firman Utina',
    no_hp_ortu: '085788990011',
    alamat: 'Jl. Imam Bonjol No. 30',
    created_at: '2023-07-15T07:00:00.000Z',
  },
  {
    id: 'std-505',
    nisn: '0058295005',
    nis: '22231005',
    nama: 'Evelyn Natalia',
    kelas: 'XII MIPA 1',
    jenis_kelamin: 'P',
    status: 'Aktif',
    nama_ortu: 'Natalia Tan',
    no_hp_ortu: '087899001122',
    alamat: 'Jl. KH Ahmad Dahlan No. 12',
    created_at: '2023-07-15T07:00:00.000Z',
  },
];

// Helper to generate dates for past N school days (excluding weekends)
export function getPastSchoolDays(count: number): string[] {
  const dates: string[] = [];
  const curr = new Date(); // Using current local reference
  
  let daysBack = 0;
  while (dates.length < count && daysBack < 40) {
    const d = new Date(curr);
    d.setDate(curr.getDate() - daysBack);
    const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const formatted = d.toISOString().split('T')[0];
      dates.push(formatted);
    }
    daysBack++;
  }
  return dates.reverse();
}

// Generate realistic attendance records
export function generateInitialAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const schoolDays = getPastSchoolDays(14); // Past 14 school days

  initialStudents.forEach((student) => {
    schoolDays.forEach((date, idx) => {
      let status: 'hadir' | 'sakit' | 'izin' | 'alfa' = 'hadir';
      let note: string | undefined = undefined;

      // Special cases to showcase BK Warning triggers
      if (student.id === 'std-405') {
        // Rizky Alamsyah: High Alfa (prioritas tindak lanjut)
        if ([1, 3, 5, 7, 8, 10, 12, 13].includes(idx)) {
          status = 'alfa';
          note = 'Tidak ada keterangan / bolos';
        } else if ([2, 6].includes(idx)) {
          status = 'sakit';
          note = 'Demam';
        }
      } else if (student.id === 'std-106') {
        // Eko Prasetyo: Red warning (6 Alfa)
        if ([2, 4, 6, 8, 11, 13].includes(idx)) {
          status = 'alfa';
          note = 'Bangun kesiangan / tidak masuk';
        } else if (idx === 1) {
          status = 'izin';
          note = 'Acara keluarga';
        }
      } else if (student.id === 'std-103') {
        // Budi Santoso: Yellow warning (4 Alfa)
        if ([3, 7, 9, 12].includes(idx)) {
          status = 'alfa';
          note = 'Tanpa kabar';
        } else if (idx === 5) {
          status = 'sakit';
          note = 'Flu';
        }
      } else if (student.id === 'std-303') {
        // Danang Tri: Yellow warning (3 Alfa)
        if ([2, 8, 10].includes(idx)) {
          status = 'alfa';
          note = 'Tanpa surat';
        }
      } else if (student.id === 'std-104') {
        // Citra: 2 Izin, 1 Sakit
        if (idx === 4 || idx === 9) {
          status = 'izin';
          note = 'Izin keperluan keluarga ke luar kota';
        } else if (idx === 11) {
          status = 'sakit';
          note = 'Surat dokter RSUD';
        }
      } else if (student.id === 'std-204') {
        // Nabila: 2 Sakit
        if (idx === 6 || idx === 7) {
          status = 'sakit';
          note = 'Sakit tifus (istirahat dokter)';
        }
      } else {
        // General realistic distribution: mostly Hadir, occasionally Sakit or Izin
        const randomSeed = (student.nama.length + idx * 7) % 30;
        if (randomSeed === 3) {
          status = 'sakit';
          note = 'Sakit flu';
        } else if (randomSeed === 11) {
          status = 'izin';
          note = 'Izin urusan keluarga';
        } else if (randomSeed === 28) {
          status = 'alfa';
          note = 'Tanpa keterangan';
        }
      }

      records.push({
        id: `att-${student.id}-${date}`,
        student_id: student.id,
        attendance_date: date,
        status,
        note,
        created_at: `${date}T07:30:00.000Z`,
        updated_at: `${date}T07:30:00.000Z`,
      });
    });
  });

  return records;
}

export const initialBKNotes: BKNote[] = [
  {
    id: 'note-001',
    student_id: 'std-405',
    date: '2026-08-20',
    category: 'Panggilan Orang Tua',
    title: 'Panggilan Orang Tua Siswa - Akumulasi 8x Alfa',
    content: 'Orang tua siswa (Bpk. Alamsyah M.) diundang ke ruang BK karena siswa tidak masuk sekolah tanpa keterangan sebanyak 8 kali. Siswa mengaku sering bermain game hingga larut malam.',
    actionTaken: 'Membuat surat perjanjian kehadiran bertanda tangan siswa dan orang tua. Orang tua berkomitmen membatasi penggunaan gawai malam hari.',
    followUpDate: '2026-08-27',
    created_at: '2026-08-20T10:15:00.000Z',
  },
  {
    id: 'note-002',
    student_id: 'std-106',
    date: '2026-08-21',
    category: 'Bimbingan Pribadi',
    title: 'Konseling Individual Motivasi Belajar dan Kedisiplinan',
    content: 'Siswa Eko Prasetyo dipanggil untuk bimbingan konseling individual terkait 6 kali ketidakhadiran alfa. Kendala utama transportasi dan motivasi bangun pagi.',
    actionTaken: 'Menyusun jadwal harian mandiri dan koordinasi dengan wali kelas X-1 untuk pemantauan presensi jam pertama.',
    followUpDate: '2026-08-28',
    created_at: '2026-08-21T08:45:00.000Z',
  },
  {
    id: 'note-003',
    student_id: 'std-103',
    date: '2026-08-22',
    category: 'Peringatan Lisan',
    title: 'Pemberitahuan Peringatan Kuning (3+ Alfa)',
    content: 'Memberikan arahan kepada Budi Santoso mengenai ketentuan tata tertib presensi SMA Negeri 1 Nusantara.',
    actionTaken: 'Mengingatkan agar setiap ketidakhadiran wajib menyertakan surat izin resmi dari orang tua atau surat dokter.',
    created_at: '2026-08-22T09:30:00.000Z',
  },
];
