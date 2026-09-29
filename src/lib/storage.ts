import { 
  SchoolConfig, 
  ElectionPeriod, 
  Candidate, 
  Voter, 
  AnonymousVote, 
  Committee, 
  AuditLog, 
  QuickCountResult, 
  TurnoutStats,
  AdminCredentials
} from '../types/election';
import { generateSecurePin, hashPin, generateReceiptToken } from './security';

const STORAGE_KEY_PREFIX = 'epilketos_';

// Helper to ensure direct image URL from Imgur links
export function normalizeLogoUrl(url?: string): string {
  if (!url || !url.trim()) return '/logo.png';
  const trimmed = url.trim();
  if (trimmed.includes('imgur.com/a/ggY0db6') || trimmed.includes('ggY0db6')) {
    return 'https://i.imgur.com/xduwCzW.png';
  }
  return trimmed;
}

export function normalizeCandidatePhoto(url?: string, defaultFallback: string = '/candidates/cand1.png'): string {
  if (!url || !url.trim()) return defaultFallback;
  const trimmed = url.trim();
  if (trimmed.includes('1DgzXJS')) return 'https://i.imgur.com/1DgzXJS.png';
  if (trimmed.includes('M7UEbFI')) return 'https://i.imgur.com/M7UEbFI.png';
  if (trimmed.includes('RHR5Hln')) return 'https://i.imgur.com/RHR5Hln.png';
  if (trimmed.includes('ggY0db6')) return 'https://i.imgur.com/xduwCzW.png';
  return trimmed;
}

// Initial School: SMP Negeri 90 with official logo
const DEFAULT_SCHOOL: SchoolConfig = {
  id: 'sch-001',
  name: 'SMP Negeri 90',
  npsn: '20108890',
  type: 'OSIS',
  logoUrl: 'https://i.imgur.com/xduwCzW.png',
  address: 'Jl. Raya SMP 90 No. 45, Kompleks Pendidikan',
  district: 'Duren Sawit',
  city: 'Jakarta Timur',
  province: 'DKI Jakarta',
  principalName: 'Drs. H. Bambang Suryono, M.Pd.',
  principalNip: '19740512 199803 1 004'
};

// Initial Election Periods
const DEFAULT_PERIODS: ElectionPeriod[] = [
  {
    id: 'period-2026',
    schoolId: 'sch-001',
    periodName: 'Pemilihan Ketua & Wakil Ketua OSIS SMP 90 Masa Bakti 2026/2027',
    academicYear: '2026/2027',
    status: 'aktif',
    startDate: '2026-09-28T07:00:00Z',
    endDate: '2026-09-29T16:00:00Z',
    targetTurnout: 95.0,
    createdAt: '2026-09-01T08:00:00Z',
    description: 'Pemilihan raya kepengurusan OSIS SMP 90 secara langsung, bebas, rahasia, jujur, dan adil berbasis digital.'
  },
  {
    id: 'period-2025',
    schoolId: 'sch-001',
    periodName: 'Pemilihan Ketua OSIS SMP 90 Masa Bakti 2025/2026 (Arsip)',
    academicYear: '2025/2026',
    status: 'selesai',
    startDate: '2025-09-25T07:00:00Z',
    endDate: '2025-09-25T15:00:00Z',
    targetTurnout: 92.4,
    createdAt: '2025-09-01T08:00:00Z',
    description: 'Pemilihan periode sebelumnya yang telah disahkan dan diarsipkan.'
  }
];

// Candidates for active period 2026/2027 with requested candidate pairs & Imgur photos
const DEFAULT_CANDIDATES: Candidate[] = [
  {
    id: 'cand-01',
    electionPeriodId: 'period-2026',
    ballotNumber: 1,
    chairmanName: 'Andini Intopiana',
    chairmanClass: 'VIII-1',
    viceChairmanName: 'Apriani Intopiana',
    viceChairmanClass: 'VII-2',
    photoUrl: 'https://i.imgur.com/1DgzXJS.png',
    vision: 'Mewujudkan OSIS SMP 90 yang Aktif, Kreatif, Berakhlak Mulia, dan Menjadi Wadah Aspirasi Utama Seluruh Siswa.',
    mission: [
      'Meningkatkan kedisiplinan dan kepedulian sosial di lingkungan SMP 90.',
      'Mengembangkan bakat seni, olahraga, dan literasi digital siswa.',
      'Menjalin komunikasi terbuka antara pengurus OSIS, siswa, dan dewan guru.',
      'Menyelenggarakan program keakraban siswa yang inklusif dan menyenangkan.'
    ],
    programs: [
      'Kotak Aspirasi Digital Siswa SMP 90',
      'Pekan Seni, Olahraga & Bakat Pelajar',
      'Gerakan Sekolah Ramah, Asri & Bersih',
      'Program Tutor Sebaya & Sahabat Belajar'
    ],
    quote: '"Karya Nyata, Bukan Sekadar Kata: Bersama Membangun Almamater SMP 90 Tercinta!"',
    campaignVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    colorScheme: 'emerald'
  },
  {
    id: 'cand-02',
    electionPeriodId: 'period-2026',
    ballotNumber: 2,
    chairmanName: 'Farel Usman',
    chairmanClass: 'VIII-3',
    viceChairmanName: 'Rifi Tidore',
    viceChairmanClass: 'VII-1',
    photoUrl: 'https://i.imgur.com/M7UEbFI.png',
    vision: 'Terwujudnya Siswa SMP 90 yang Berkarakter Pemimpin, Solid, Berprestasi, dan Berwawasan Lingkungan.',
    mission: [
      'Mempererat kebersamaan antarkelas melalui kegiatan positif dan sportivitas.',
      'Optimalisasi ekstrakurikuler kepemimpinan dan bimbingan karakter.',
      'Menanamkan nilai sopan santun dan budaya gotong royong di lingkungan sekolah.',
      'Mendorong budaya membaca dan riset sains sederhana bagi siswa.'
    ],
    programs: [
      'SMP 90 Champions Cup Antarkelas',
      'Aksi Bersih Kampus & Bank Sampah Peduli',
      'Forum Literasi & Pojok Kreativitas Siswa',
      'Pelatihan Public Speaking & Kepemimpinan OSIS'
    ],
    quote: '"Pemimpin Sejati Berakar dari Karakter Luhur, Bergerak Melalui Aksi Nyata!"',
    campaignVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    colorScheme: 'indigo'
  },
  {
    id: 'cand-03',
    electionPeriodId: 'period-2026',
    ballotNumber: 3,
    chairmanName: 'Rahmad Sidek',
    chairmanClass: 'VIII-2',
    viceChairmanName: 'Iswar Obeng',
    viceChairmanClass: 'VII-4',
    photoUrl: 'https://i.imgur.com/RHR5Hln.png',
    vision: 'Membangun OSIS SMP 90 yang Inovatif, Responsif, Harmonis, dan Berprestasi Unggul di Tingkat Kota.',
    mission: [
      'Mendorong pemanfaatan teknologi positif dalam seluruh kegiatan kesiswaan.',
      'Menciptakan iklim sekolah yang aman, toleran, dan bebas dari perundungan (anti-bullying).',
      'Meningkatkan partisipasi aktif siswa dalam berbagai lomba akademik & non-akademik.',
      'Mengembangkan jaringan kolaborasi antarsekolah tingkat SMP se-wilayah.'
    ],
    programs: [
      'Ruang Sahabat Anti-Bullying SMP 90',
      'Digital Student Showcase & Expo Karya',
      'Aksi Gemar Belajar & Ekskul Juara',
      'Festival Budaya & Kolaborasi Pelajar'
    ],
    quote: '"Harmonis dalam Perbedaan, Bersatu Menggapai Prestasi Impian SMP 90!"',
    campaignVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    colorScheme: 'amber'
  }
];

// Candidates for past 2025/2026 archive
const ARCHIVE_CANDIDATES: Candidate[] = [
  {
    id: 'cand-2025-01',
    electionPeriodId: 'period-2025',
    ballotNumber: 1,
    chairmanName: 'Bintang Ramadhan',
    chairmanClass: 'IX-1',
    viceChairmanName: 'Clarissa Maharani',
    viceChairmanClass: 'VIII-3',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    vision: 'OSIS Berwibawa dan Berprestasi.',
    mission: ['Meningkatkan disiplin', 'Memajukan ekstrakurikuler'],
    programs: ['Porseni 2025', 'Bakti Sosial'],
    colorScheme: 'blue'
  },
  {
    id: 'cand-2025-02',
    electionPeriodId: 'period-2025',
    ballotNumber: 2,
    chairmanName: 'Ananda Bagas Saputra (Pemenang)',
    chairmanClass: 'IX-2',
    viceChairmanName: 'Safira Amani',
    viceChairmanClass: 'VIII-1',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    vision: 'OSIS Bersahabat dan Berdaya Saing.',
    mission: ['Revitalisasi mading dan digitalisasi kegiatan'],
    programs: ['E-Classmeeting', 'Green Canteen'],
    colorScheme: 'purple'
  }
];

// Initial DPT Voters with easy username + 4-digit PIN (SMP 90)
const DEFAULT_VOTERS: Voter[] = [
  { id: 'v-001', electionPeriodId: 'period-2026', username: 'fauzan', nisn: '0081234501', fullName: 'Achmad Fauzan', className: 'VIII-1', gender: 'L', pinHash: '', plainPinPreview: '1234', hasVoted: false },
  { id: 'v-002', electionPeriodId: 'period-2026', username: 'adinda', nisn: '0081234502', fullName: 'Adinda Nur Haliza', className: 'VIII-1', gender: 'P', pinHash: '', plainPinPreview: '2345', hasVoted: false },
  { id: 'v-003', electionPeriodId: 'period-2026', username: 'agung', nisn: '0081234503', fullName: 'Agung Wicaksono', className: 'VIII-2', gender: 'L', pinHash: '', plainPinPreview: '3456', hasVoted: false },
  { id: 'v-004', electionPeriodId: 'period-2026', username: 'anisa', nisn: '0081234504', fullName: 'Anisa Rahmawati', className: 'VIII-2', gender: 'P', pinHash: '', plainPinPreview: '4567', hasVoted: false },
  { id: 'v-005', electionPeriodId: 'period-2026', username: 'bagus', nisn: '0081234505', fullName: 'Bagus Tri Pamungkas', className: 'VIII-3', gender: 'L', pinHash: '', plainPinPreview: '5678', hasVoted: false },
  { id: 'v-006', electionPeriodId: 'period-2026', username: 'bella', nisn: '0081234506', fullName: 'Bella Cantika Dewi', className: 'VIII-3', gender: 'P', pinHash: '', plainPinPreview: '6789', hasVoted: false },
  { id: 'v-007', electionPeriodId: 'period-2026', username: 'cahya', nisn: '0081234507', fullName: 'Cahya Ramadhan', className: 'IX-1', gender: 'L', pinHash: '', plainPinPreview: '1122', hasVoted: false },
  { id: 'v-008', electionPeriodId: 'period-2026', username: 'citra', nisn: '0081234508', fullName: 'Citra Kirana', className: 'IX-1', gender: 'P', pinHash: '', plainPinPreview: '2233', hasVoted: false },
  { id: 'v-009', electionPeriodId: 'period-2026', username: 'danang', nisn: '0081234509', fullName: 'Danang Prasetyo', className: 'IX-2', gender: 'L', pinHash: '', plainPinPreview: '3344', hasVoted: false },
  { id: 'v-010', electionPeriodId: 'period-2026', username: 'dinda', nisn: '0081234510', fullName: 'Dinda Permata Sari', className: 'IX-2', gender: 'P', pinHash: '', plainPinPreview: '4455', hasVoted: false },
  { id: 'v-011', electionPeriodId: 'period-2026', username: 'eko', nisn: '0081234511', fullName: 'Eko Wahyudi', className: 'VII-1', gender: 'L', pinHash: '', plainPinPreview: '5566', hasVoted: false },
  { id: 'v-012', electionPeriodId: 'period-2026', username: 'fani', nisn: '0081234512', fullName: 'Fani Oktaviani', className: 'VII-1', gender: 'P', pinHash: '', plainPinPreview: '6677', hasVoted: false },
  { id: 'v-013', electionPeriodId: 'period-2026', username: 'gilang', nisn: '0081234513', fullName: 'Gilang Dirgantara', className: 'VII-2', gender: 'L', pinHash: '', plainPinPreview: '7788', hasVoted: false },
  { id: 'v-014', electionPeriodId: 'period-2026', username: 'hana', nisn: '0081234514', fullName: 'Hana Safitri', className: 'VII-2', gender: 'P', pinHash: '', plainPinPreview: '8899', hasVoted: false },
  { id: 'v-015', electionPeriodId: 'period-2026', username: 'ilham', nisn: '0081234515', fullName: 'Ilham Syahputra', className: 'VII-3', gender: 'L', pinHash: '', plainPinPreview: '9900', hasVoted: false },
  { id: 'v-016', electionPeriodId: 'period-2026', username: 'jessica', nisn: '0081234516', fullName: 'Jessica Aurelia', className: 'VII-3', gender: 'P', pinHash: '', plainPinPreview: '1357', hasVoted: false }
];

// Initial Admin Credentials (modifiable by Admin)
const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  username: 'admin',
  password: 'admin123',
  lastUpdated: '2026-09-01T08:00:00Z'
};

// Initial Anonymous Votes (Strictly decoupled, no voter_id)
const DEFAULT_VOTES: AnonymousVote[] = [
  { id: 'vote-001', electionPeriodId: 'period-2026', candidateId: 'cand-01', createdAt: '2026-09-28T08:15:20Z', tamperChecksum: 'VOTE-SIG-8A1C49F' },
  { id: 'vote-002', electionPeriodId: 'period-2026', candidateId: 'cand-02', createdAt: '2026-09-28T08:18:40Z', tamperChecksum: 'VOTE-SIG-7F3B21E' },
  { id: 'vote-003', electionPeriodId: 'period-2026', candidateId: 'cand-01', createdAt: '2026-09-28T08:24:10Z', tamperChecksum: 'VOTE-SIG-9D2E14A' },
  { id: 'vote-004', electionPeriodId: 'period-2026', candidateId: 'cand-03', createdAt: '2026-09-28T08:30:05Z', tamperChecksum: 'VOTE-SIG-3C8A76B' },
  { id: 'vote-005', electionPeriodId: 'period-2026', candidateId: 'cand-01', createdAt: '2026-09-28T08:35:12Z', tamperChecksum: 'VOTE-SIG-1B9F65D' },
  { id: 'vote-006', electionPeriodId: 'period-2026', candidateId: 'cand-02', createdAt: '2026-09-28T08:42:00Z', tamperChecksum: 'VOTE-SIG-6E4D82C' },
  { id: 'vote-007', electionPeriodId: 'period-2026', candidateId: 'cand-01', createdAt: '2026-09-28T08:50:30Z', tamperChecksum: 'VOTE-SIG-5A3B91F' },
  { id: 'vote-008', electionPeriodId: 'period-2026', candidateId: 'cand-03', createdAt: '2026-09-28T09:05:10Z', tamperChecksum: 'VOTE-SIG-4F2C77E' },
  // Past archive votes
  { id: 'vote-past-01', electionPeriodId: 'period-2025', candidateId: 'cand-2025-01', createdAt: '2025-09-25T08:00:00Z' },
  { id: 'vote-past-02', electionPeriodId: 'period-2025', candidateId: 'cand-2025-02', createdAt: '2025-09-25T08:05:00Z' },
  { id: 'vote-past-03', electionPeriodId: 'period-2025', candidateId: 'cand-2025-02', createdAt: '2025-09-25T08:10:00Z' }
];

// Initial Committee under official SK
const DEFAULT_COMMITTEE: Committee[] = [
  {
    id: 'comm-01',
    electionPeriodId: 'period-2026',
    skNumber: '421.3/089/SMAN1/SK-PILKETOS/2026',
    skDate: '2026-08-15',
    memberName: 'Drs. Hendro Wibowo, M.Si.',
    role: 'Ketua Panitia',
    email: 'panitia.pilketos@sman1pb.sch.id',
    username: 'panitia_hendro',
    phone: '081234567890'
  },
  {
    id: 'comm-02',
    electionPeriodId: 'period-2026',
    skNumber: '421.3/089/SMAN1/SK-PILKETOS/2026',
    skDate: '2026-08-15',
    memberName: 'Siti Nurjanah, S.Pd.',
    role: 'Sekretaris',
    email: 'sekretaris.pilketos@sman1pb.sch.id',
    username: 'panitia_siti',
    phone: '081234567891'
  },
  {
    id: 'comm-03',
    electionPeriodId: 'period-2026',
    skNumber: '421.3/089/SMAN1/SK-PILKETOS/2026',
    skDate: '2026-08-15',
    memberName: 'Ari Wibisono, S.Kom. (IT Admin)',
    role: 'Seksi Teknis/Bilik',
    email: 'teknis.bilik@sman1pb.sch.id',
    username: 'panitia_ari',
    phone: '081234567892'
  }
];

// Initial Audit Logs
const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-09-28T07:00:00Z',
    userRole: 'Admin',
    userIdentifier: 'Admin: Bambang Suryono',
    action: 'START_ELECTION_PERIOD',
    details: 'Periode Pemilihan 2026/2027 diaktifkan secara resmi.',
    ipAddress: '192.168.1.10',
    status: 'SUCCESS'
  },
  {
    id: 'log-002',
    timestamp: '2026-09-28T07:15:00Z',
    userRole: 'Panitia',
    userIdentifier: 'Panitia: Ari Wibisono',
    action: 'GENERATE_VOTER_TOKENS',
    details: 'Penetapan dan enkripsi PIN 6-digit DPT kelas X, XI, XII berhasil.',
    ipAddress: '192.168.1.25',
    status: 'SUCCESS'
  },
  {
    id: 'log-003',
    timestamp: '2026-09-28T08:15:20Z',
    userRole: 'Siswa',
    userIdentifier: 'NISN: 0081234505',
    action: 'VOTE_CAST_ANONYMOUS',
    details: 'Suara berhasil disimpan ke kotak suara anonim. Status pemilih diubah menjadi has_voted = true.',
    ipAddress: '192.168.10.101',
    status: 'SUCCESS'
  }
];

class ElectionStore {
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // 1. School Config
    const storedSchoolRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}school`);
    if (!storedSchoolRaw) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}school`, JSON.stringify(DEFAULT_SCHOOL));
    } else {
      try {
        const parsed = JSON.parse(storedSchoolRaw);
        // Automatically migrate to new official logo from https://imgur.com/a/ggY0db6
        if (!parsed.logoUrl || parsed.logoUrl.includes('unsplash.com') || parsed.logoUrl.includes('ggY0db6')) {
          parsed.logoUrl = 'https://i.imgur.com/xduwCzW.png';
        }
        if (parsed.name.includes('Prestasi Bangsa') || parsed.name.includes('SMAN')) {
          parsed.name = 'SMP Negeri 90';
        }
        localStorage.setItem(`${STORAGE_KEY_PREFIX}school`, JSON.stringify(parsed));
      } catch {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}school`, JSON.stringify(DEFAULT_SCHOOL));
      }
    }

    // 2. Periods
    if (!localStorage.getItem(`${STORAGE_KEY_PREFIX}periods`)) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}periods`, JSON.stringify(DEFAULT_PERIODS));
    }

    // 3. Candidates (Sync with requested candidates for period-2026)
    const storedCandidatesRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}candidates`);
    if (!storedCandidatesRaw) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}candidates`, JSON.stringify([...DEFAULT_CANDIDATES, ...ARCHIVE_CANDIDATES]));
    } else {
      try {
        const parsedCands: Candidate[] = JSON.parse(storedCandidatesRaw);
        const hasRequestedCands = parsedCands.some(c => c.chairmanName === 'Andini Intopiana');
        if (!hasRequestedCands) {
          const archiveCands = parsedCands.filter(c => c.electionPeriodId !== 'period-2026');
          localStorage.setItem(`${STORAGE_KEY_PREFIX}candidates`, JSON.stringify([...DEFAULT_CANDIDATES, ...archiveCands]));
        } else {
          // Normalize photos for requested candidates
          let modified = false;
          parsedCands.forEach(c => {
            if (c.chairmanName === 'Andini Intopiana') {
              c.photoUrl = 'https://i.imgur.com/1DgzXJS.png';
              c.viceChairmanName = 'Apriani Intopiana';
              modified = true;
            }
            if (c.chairmanName === 'Farel Usman') {
              c.photoUrl = 'https://i.imgur.com/M7UEbFI.png';
              c.viceChairmanName = 'Rifi Tidore';
              modified = true;
            }
            if (c.chairmanName === 'Rahmad Sidek') {
              c.photoUrl = 'https://i.imgur.com/RHR5Hln.png';
              c.viceChairmanName = 'Iswar Obeng';
              modified = true;
            }
          });
          if (modified) {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}candidates`, JSON.stringify(parsedCands));
          }
        }
      } catch {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}candidates`, JSON.stringify([...DEFAULT_CANDIDATES, ...ARCHIVE_CANDIDATES]));
      }
    }

    // 4. Voters (Ensure easy username and 4-digit PIN for each voter)
    const storedVotersRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}voters`);
    if (!storedVotersRaw) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}voters`, JSON.stringify(DEFAULT_VOTERS));
    } else {
      try {
        const parsedVoters: Voter[] = JSON.parse(storedVotersRaw);
        let votersModified = false;
        parsedVoters.forEach(v => {
          // Normalize username to easy simple format
          if (!v.username || v.username.includes('90')) {
            const defaultMatch = DEFAULT_VOTERS.find(dv => dv.nisn === v.nisn);
            if (defaultMatch) {
              v.username = defaultMatch.username;
              v.plainPinPreview = defaultMatch.plainPinPreview;
              votersModified = true;
            } else if (!v.username) {
              v.username = v.fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
              votersModified = true;
            }
          }
          // Normalize PIN to clean 4-digit numeric if it contains letters or is too long
          if (v.plainPinPreview && (/[a-zA-Z]/.test(v.plainPinPreview) || v.plainPinPreview.length > 4)) {
            const defaultMatch = DEFAULT_VOTERS.find(dv => dv.nisn === v.nisn);
            v.plainPinPreview = defaultMatch ? defaultMatch.plainPinPreview : Math.floor(1000 + Math.random() * 9000).toString();
            votersModified = true;
          }
        });
        if (votersModified) {
          localStorage.setItem(`${STORAGE_KEY_PREFIX}voters`, JSON.stringify(parsedVoters));
        }
      } catch {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}voters`, JSON.stringify(DEFAULT_VOTERS));
      }
    }

    // 5. Admin Credentials
    if (!localStorage.getItem(`${STORAGE_KEY_PREFIX}admin_credentials`)) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}admin_credentials`, JSON.stringify(DEFAULT_ADMIN_CREDENTIALS));
    }

    // 6. Votes
    if (!localStorage.getItem(`${STORAGE_KEY_PREFIX}votes`)) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}votes`, JSON.stringify(DEFAULT_VOTES));
    }

    // 7. Committee
    if (!localStorage.getItem(`${STORAGE_KEY_PREFIX}committee`)) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}committee`, JSON.stringify(DEFAULT_COMMITTEE));
    }

    // 8. Audit Logs
    if (!localStorage.getItem(`${STORAGE_KEY_PREFIX}audit_logs`)) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}audit_logs`, JSON.stringify(DEFAULT_AUDIT_LOGS));
    }
  }

  public subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // --- SCHOOL CONFIG ---
  public getSchoolConfig(): SchoolConfig {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}school`);
    return raw ? JSON.parse(raw) : DEFAULT_SCHOOL;
  }

  public updateSchoolConfig(partial: Partial<SchoolConfig>): SchoolConfig {
    const current = this.getSchoolConfig();
    const normalizedPartial = {
      ...partial,
      logoUrl: partial.logoUrl !== undefined ? normalizeLogoUrl(partial.logoUrl) : current.logoUrl
    };
    const updated = { ...current, ...normalizedPartial };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}school`, JSON.stringify(updated));
    this.addAuditLog('Admin', 'admin@sekolah.sch.id', 'UPDATE_SCHOOL_CONFIG', 'Memperbarui konfigurasi identitas sekolah/madrasah.');
    this.notify();
    return updated;
  }

  // --- PERIODS ---
  public getPeriods(): ElectionPeriod[] {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}periods`);
    return raw ? JSON.parse(raw) : DEFAULT_PERIODS;
  }

  public getActivePeriod(): ElectionPeriod | null {
    const periods = this.getPeriods();
    return periods.find(p => p.status === 'aktif') || periods[0] || null;
  }

  public setActivePeriod(periodId: string) {
    const periods = this.getPeriods().map(p => ({
      ...p,
      status: (p.id === periodId ? 'aktif' : (p.status === 'aktif' ? 'selesai' : p.status)) as ElectionPeriod['status']
    }));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}periods`, JSON.stringify(periods));
    this.addAuditLog('Admin', 'admin@sekolah.sch.id', 'SWITCH_ACTIVE_PERIOD', `Mengubah periode aktif ke ID: ${periodId}`);
    this.notify();
  }

  public addPeriod(period: Omit<ElectionPeriod, 'id' | 'createdAt'>): ElectionPeriod {
    const newPeriod: ElectionPeriod = {
      ...period,
      id: `period-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    let periods = this.getPeriods();
    if (newPeriod.status === 'aktif') {
      periods = periods.map(p => ({
        ...p,
        status: (p.status === 'aktif' ? 'selesai' : p.status) as ElectionPeriod['status']
      }));
    }
    periods.push(newPeriod);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}periods`, JSON.stringify(periods));
    this.addAuditLog('Admin', 'admin@sekolah.sch.id', 'CREATE_PERIOD', `Membuat tahun periode pemilihan baru: ${newPeriod.periodName}`);
    this.notify();
    return newPeriod;
  }

  public closePeriod(periodId: string) {
    const periods = this.getPeriods().map(p => {
      if (p.id === periodId) {
        return { ...p, status: 'selesai' as ElectionPeriod['status'] };
      }
      return p;
    });
    localStorage.setItem(`${STORAGE_KEY_PREFIX}periods`, JSON.stringify(periods));
    this.addAuditLog('Admin', 'admin@sekolah.sch.id', 'CLOSE_PERIOD', `Menutup pemungutan suara untuk periode ID: ${periodId}`);
    this.notify();
  }

  // --- CANDIDATES ---
  public getCandidates(periodId?: string): Candidate[] {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}candidates`);
    const all: Candidate[] = raw ? JSON.parse(raw) : DEFAULT_CANDIDATES;
    if (!periodId) return all;
    return all.filter(c => c.electionPeriodId === periodId).sort((a, b) => a.ballotNumber - b.ballotNumber);
  }

  public saveCandidate(candidate: Candidate): void {
    const all = this.getCandidates();
    const idx = all.findIndex(c => c.id === candidate.id);
    if (idx >= 0) {
      all[idx] = candidate;
    } else {
      all.push(candidate);
    }
    localStorage.setItem(`${STORAGE_KEY_PREFIX}candidates`, JSON.stringify(all));
    this.addAuditLog('Panitia', 'panitia@sekolah.sch.id', 'SAVE_CANDIDATE', `Menyimpan data Paslon No. ${candidate.ballotNumber} (${candidate.chairmanName})`);
    this.notify();
  }

  public deleteCandidate(candidateId: string): void {
    const all = this.getCandidates().filter(c => c.id !== candidateId);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}candidates`, JSON.stringify(all));
    this.addAuditLog('Panitia', 'panitia@sekolah.sch.id', 'DELETE_CANDIDATE', `Menghapus kandidat ID: ${candidateId}`);
    this.notify();
  }

  // --- VOTERS (DPT) ---
  public getVoters(periodId?: string): Voter[] {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}voters`);
    const all: Voter[] = raw ? JSON.parse(raw) : DEFAULT_VOTERS;
    if (!periodId) return all;
    return all.filter(v => v.electionPeriodId === periodId);
  }

  public addVoter(voter: Omit<Voter, 'id'>): Voter {
    const baseUsername = voter.username?.trim() || (voter.fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) + voter.nisn.slice(-2));
    const newVoter: Voter = {
      ...voter,
      username: baseUsername,
      id: `v-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    const all = this.getVoters();
    all.push(newVoter);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}voters`, JSON.stringify(all));
    this.notify();
    return newVoter;
  }

  public bulkImportVoters(periodId: string, newVoters: { nisn: string; fullName: string; className: string; gender: 'L' | 'P'; username?: string }[]): number {
    const current = this.getVoters();
    const added: Voter[] = [];

    newVoters.forEach(nv => {
      // Avoid duplicate NISN in the same period
      if (!current.some(v => v.electionPeriodId === periodId && v.nisn === nv.nisn)) {
        const plainPin = generateSecurePin();
        const baseUsername = nv.username?.trim() || (nv.fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) + nv.nisn.slice(-2));
        added.push({
          id: `v-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          electionPeriodId: periodId,
          username: baseUsername,
          nisn: nv.nisn,
          fullName: nv.fullName,
          className: nv.className,
          gender: nv.gender,
          plainPinPreview: plainPin,
          pinHash: '', // Will be validated or generated
          hasVoted: false
        });
      }
    });

    const updated = [...current, ...added];
    localStorage.setItem(`${STORAGE_KEY_PREFIX}voters`, JSON.stringify(updated));
    this.addAuditLog('Panitia', 'panitia@sekolah.sch.id', 'BULK_IMPORT_VOTERS', `Impor DPT berhasil sebanyak ${added.length} siswa.`);
    this.notify();
    return added.length;
  }

  public resetVoterPin(voterId: string): string {
    const all = this.getVoters();
    const target = all.find(v => v.id === voterId);
    if (!target) throw new Error('Pemilih tidak ditemukan');
    if (target.hasVoted) throw new Error('PIN tidak dapat direset karena siswa telah menggunakan hak suaranya.');

    const newPin = generateSecurePin();
    target.plainPinPreview = newPin;
    target.pinHash = ''; // Will match against plainPinPreview
    localStorage.setItem(`${STORAGE_KEY_PREFIX}voters`, JSON.stringify(all));
    this.addAuditLog('Panitia', 'panitia@sekolah.sch.id', 'RESET_VOTER_PIN', `Reset PIN untuk Pemilih: ${target.username || target.nisn} (${target.fullName})`);
    this.notify();
    return newPin;
  }

  public batchRegeneratePins(periodId: string): number {
    const all = this.getVoters();
    let count = 0;
    all.forEach(v => {
      if (v.electionPeriodId === periodId && !v.hasVoted) {
        v.plainPinPreview = generateSecurePin();
        v.pinHash = '';
        count++;
      }
    });
    localStorage.setItem(`${STORAGE_KEY_PREFIX}voters`, JSON.stringify(all));
    this.addAuditLog('Panitia', 'panitia@sekolah.sch.id', 'BATCH_REGENERATE_PINS', `Regenerasi PIN acak untuk ${count} pemilih belum mencoblos.`);
    this.notify();
    return count;
  }

  // --- ATOMIC VOTE CASTING (LUBER-JURDIL) ---
  public async castVote(periodId: string, usernameOrNisn: string, plainPin: string, candidateId: string): Promise<{ success: boolean; message: string; receiptToken?: string }> {
    const period = this.getPeriods().find(p => p.id === periodId);
    if (!period || period.status !== 'aktif') {
      return { success: false, message: 'Bilik suara ditutup: Periode pemilihan tidak sedang aktif.' };
    }

    const voters = this.getVoters();
    const query = usernameOrNisn.trim().toLowerCase();
    const voter = voters.find(v => 
      v.electionPeriodId === periodId && 
      ((v.username && v.username.trim().toLowerCase() === query) || v.nisn.trim().toLowerCase() === query)
    );

    if (!voter) {
      this.addAuditLog('Siswa', `User/NISN: ${usernameOrNisn}`, 'VOTE_FAILED', 'Otentikasi gagal: Username atau NISN tidak terdaftar dalam DPT.', 'FAILED');
      return { success: false, message: 'Username atau NISN tidak terdaftar dalam Daftar Pemilih Tetap (DPT).' };
    }

    if (voter.hasVoted) {
      this.addAuditLog('Siswa', `User: ${voter.username || voter.nisn}`, 'DOUBLE_VOTE_BLOCKED', 'Percobaan coblos ganda berhasil dicegah oleh sistem.', 'FAILED');
      return { success: false, message: 'Hak suara untuk akun ini telah digunakan dan tidak dapat memilih kembali.' };
    }

    // Verify PIN
    const normalizedInputPin = plainPin.trim().toUpperCase();
    const storedPin = (voter.plainPinPreview || '').trim().toUpperCase();

    if (normalizedInputPin !== storedPin) {
      this.addAuditLog('Siswa', `User: ${voter.username || voter.nisn}`, 'INVALID_PIN', 'Kombinasi PIN 6-digit salah.', 'FAILED');
      return { success: false, message: 'PIN 6-digit salah. Silakan periksa kembali kartu pemilih Anda.' };
    }

    // Candidate validation
    const candidate = this.getCandidates(periodId).find(c => c.id === candidateId);
    if (!candidate) {
      return { success: false, message: 'Pasangan calon yang dipilih tidak valid.' };
    }

    // ATOMIC TRANSACTION:
    // 1. Record decoupled anonymous vote (Zero voter identity link)
    const receiptToken = generateReceiptToken(periodId);
    const anonymousVote: AnonymousVote = {
      id: `vote-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      electionPeriodId: periodId,
      candidateId: candidateId,
      createdAt: new Date().toISOString(),
      tamperChecksum: receiptToken
    };

    const votes = this.getVotes();
    votes.push(anonymousVote);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}votes`, JSON.stringify(votes));

    // 2. Mark voter as voted and invalidate PIN
    voter.hasVoted = true;
    voter.votedAt = new Date().toISOString();
    voter.plainPinPreview = undefined; // Invalidate plain preview
    voter.pinHash = await hashPin(plainPin + '_EXPIRED_' + Date.now()); // Destroy PIN
    localStorage.setItem(`${STORAGE_KEY_PREFIX}voters`, JSON.stringify(voters));

    // 3. Record anonymous audit log
    const maskedUser = voter.username ? `${voter.username.slice(0, 2)}***` : `NISN: ${voter.nisn.slice(0, 3)}****`;
    this.addAuditLog('Siswa', `User: ${maskedUser}`, 'VOTE_CAST_ANONYMOUS', `Suara sah tercatat secara anonim. Receipt: ${receiptToken}`, 'SUCCESS');

    this.notify();
    return {
      success: true,
      message: 'Suara Anda berhasil tercatat dengan aman, rahasia, dan terverifikasi.',
      receiptToken
    };
  }

  // --- ADMIN CREDENTIALS MANAGEMENT ---
  public getAdminCredentials(): AdminCredentials {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}admin_credentials`);
    return raw ? JSON.parse(raw) : DEFAULT_ADMIN_CREDENTIALS;
  }

  public updateAdminCredentials(newUsername: string, newPassword: string): AdminCredentials {
    const current = this.getAdminCredentials();
    const updated: AdminCredentials = {
      username: newUsername.trim(),
      password: newPassword.trim(),
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}admin_credentials`, JSON.stringify(updated));
    this.addAuditLog('Admin', `Admin: ${updated.username}`, 'UPDATE_ADMIN_CREDENTIALS', `Admin memperbarui kredensial username (${current.username} -> ${updated.username}) dan kata sandi.`);
    this.notify();
    return updated;
  }

  public verifyAdminCredentials(usernameInput: string, passwordInput: string): boolean {
    const creds = this.getAdminCredentials();
    return (
      creds.username.trim().toLowerCase() === usernameInput.trim().toLowerCase() &&
      creds.password === passwordInput
    );
  }

  public resetAdminCredentials(): AdminCredentials {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}admin_credentials`, JSON.stringify(DEFAULT_ADMIN_CREDENTIALS));
    this.addAuditLog('Admin', 'admin', 'RESET_ADMIN_CREDENTIALS', 'Kredensial admin di-reset ke nilai default (admin / admin123).');
    this.notify();
    return DEFAULT_ADMIN_CREDENTIALS;
  }

  // --- VOTES & AGGREGATIONS ---
  public getVotes(periodId?: string): AnonymousVote[] {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}votes`);
    const all: AnonymousVote[] = raw ? JSON.parse(raw) : DEFAULT_VOTES;
    if (!periodId) return all;
    return all.filter(v => v.electionPeriodId === periodId);
  }

  public getQuickCount(periodId: string): QuickCountResult[] {
    const candidates = this.getCandidates(periodId);
    const votes = this.getVotes(periodId);
    const totalVotes = votes.length;

    return candidates.map(c => {
      const count = votes.filter(v => v.candidateId === c.id).length;
      const percentage = totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(1)) : 0;
      return {
        candidateId: c.id,
        ballotNumber: c.ballotNumber,
        chairmanName: c.chairmanName,
        viceChairmanName: c.viceChairmanName,
        voteCount: count,
        percentage
      };
    }).sort((a, b) => a.ballotNumber - b.ballotNumber);
  }

  public getTurnoutStats(periodId: string): TurnoutStats {
    const voters = this.getVoters(periodId);
    const totalDpt = voters.length;
    const totalVoted = voters.filter(v => v.hasVoted).length;
    const totalUnvoted = totalDpt - totalVoted;
    const percentageVoted = totalDpt > 0 ? Number(((totalVoted / totalDpt) * 100).toFixed(1)) : 0;
    const percentageUnvoted = totalDpt > 0 ? Number(((totalUnvoted / totalDpt) * 100).toFixed(1)) : 0;

    return {
      totalDpt,
      totalVoted,
      totalUnvoted,
      percentageVoted,
      percentageUnvoted
    };
  }

  // --- COMMITTEE ---
  public getCommittees(periodId?: string): Committee[] {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}committee`);
    const all: Committee[] = raw ? JSON.parse(raw) : DEFAULT_COMMITTEE;
    if (!periodId) return all;
    return all.filter(c => c.electionPeriodId === periodId);
  }

  public saveCommittee(committee: Committee): void {
    const all = this.getCommittees();
    const idx = all.findIndex(c => c.id === committee.id);
    if (idx >= 0) {
      all[idx] = committee;
    } else {
      all.push(committee);
    }
    localStorage.setItem(`${STORAGE_KEY_PREFIX}committee`, JSON.stringify(all));
    this.addAuditLog('Admin', 'admin@sekolah.sch.id', 'SAVE_COMMITTEE', `Menyimpan data panitia: ${committee.memberName} (${committee.role})`);
    this.notify();
  }

  public deleteCommittee(committeeId: string): void {
    const all = this.getCommittees().filter(c => c.id !== committeeId);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}committee`, JSON.stringify(all));
    this.addAuditLog('Admin', 'admin@sekolah.sch.id', 'DELETE_COMMITTEE', `Menghapus anggota panitia ID: ${committeeId}`);
    this.notify();
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}audit_logs`);
    return raw ? JSON.parse(raw) : DEFAULT_AUDIT_LOGS;
  }

  public addAuditLog(
    userRole: AuditLog['userRole'],
    userIdentifier: string,
    action: string,
    details: string,
    status: AuditLog['status'] = 'SUCCESS'
  ): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userRole,
      userIdentifier,
      action,
      details,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
      status
    };
    // Keep most recent 200 logs
    const updated = [newLog, ...logs].slice(0, 200);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}audit_logs`, JSON.stringify(updated));
    this.notify();
  }

  // --- ELECTION RESET FOR TRIAL / TESTING (UJICOBA) & REAL ELECTION ---
  /**
   * Resets all cast votes for a specific period to 0 and marks all voters as unvoted.
   * Keeps DPT voters and candidates intact!
   * Ready for trial testing and then fresh real election day.
   */
  public resetElectionVotes(periodId: string): { clearedVotesCount: number; resetVotersCount: number } {
    const allVotes = this.getVotes();
    const periodVotes = allVotes.filter(v => v.electionPeriodId === periodId);
    const remainingVotes = allVotes.filter(v => v.electionPeriodId !== periodId);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}votes`, JSON.stringify(remainingVotes));

    const allVoters = this.getVoters();
    let resetCount = 0;
    allVoters.forEach(v => {
      if (v.electionPeriodId === periodId) {
        if (v.hasVoted) resetCount++;
        v.hasVoted = false;
        delete v.votedAt;
      }
    });
    localStorage.setItem(`${STORAGE_KEY_PREFIX}voters`, JSON.stringify(allVoters));

    this.addAuditLog('Admin', 'admin@sekolah.sch.id', 'RESET_ELECTION_VOTES', `Pemilu di-reset untuk ujicoba/pemilihan baru. Menghapus ${periodVotes.length} surat suara dan mereset status ${resetCount} pemilih.`);
    this.notify();
    return { clearedVotesCount: periodVotes.length, resetVotersCount: resetCount };
  }

  /**
   * Generates mock/trial votes for testing so users can test quick count and 1-by-1 vote reading.
   */
  public seedSimulationVotes(periodId: string, targetCount: number = 8): number {
    const candidates = this.getCandidates(periodId);
    if (candidates.length === 0) return 0;

    const allVoters = this.getVoters();
    const unvoted = allVoters.filter(v => v.electionPeriodId === periodId && !v.hasVoted);
    const toVote = unvoted.slice(0, Math.min(targetCount, unvoted.length));
    if (toVote.length === 0) return 0;

    const allVotes = this.getVotes();
    const newVotes: AnonymousVote[] = [];

    toVote.forEach((voter, idx) => {
      const cand = candidates[idx % candidates.length];
      voter.hasVoted = true;
      voter.votedAt = new Date(Date.now() - (toVote.length - idx) * 35000).toISOString();

      newVotes.push({
        id: `sim-vote-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        electionPeriodId: periodId,
        candidateId: cand.id,
        createdAt: voter.votedAt,
        tamperChecksum: `SIM-SIG-${Math.random().toString(16).substring(2, 9).toUpperCase()}`
      });
    });

    localStorage.setItem(`${STORAGE_KEY_PREFIX}voters`, JSON.stringify(allVoters));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}votes`, JSON.stringify([...allVotes, ...newVotes]));

    this.addAuditLog('Admin', 'admin@sekolah.sch.id', 'SIMULATE_TEST_VOTES', `Membuat simulasi ${newVotes.length} suara ujicoba untuk demonstrasi Quick Count 1 per 1.`);
    this.notify();
    return newVotes.length;
  }

  // --- FACTORY RESET ---
  public resetToFactoryDefaults(): void {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}school`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}periods`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}candidates`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}voters`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}votes`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}committee`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}audit_logs`);
    this.init();
    this.notify();
  }
}

export const electionStore = new ElectionStore();
