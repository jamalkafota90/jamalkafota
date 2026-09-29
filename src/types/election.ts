export type SchoolType = 'OSIS' | 'OSIM';

export type ElectionStatus = 'draft' | 'aktif' | 'selesai';

export interface SchoolConfig {
  id: string;
  name: string;
  npsn: string;
  type: SchoolType; // OSIS (Kemdikbud) or OSIM (Kemenag)
  logoUrl: string;
  address: string;
  district: string;
  city: string;
  province: string;
  principalName: string;
  principalNip: string;
  signatureUrl?: string;
}

export interface ElectionPeriod {
  id: string;
  schoolId: string;
  periodName: string; // e.g. "Pemilihan Ketua OSIS 2026/2027"
  academicYear: string; // e.g. "2026/2027"
  status: ElectionStatus;
  startDate: string;
  endDate: string;
  targetTurnout: number; // e.g. 95%
  createdAt: string;
  description?: string;
}

export interface Candidate {
  id: string;
  electionPeriodId: string;
  ballotNumber: number; // 1, 2, 3...
  chairmanName: string;
  chairmanClass: string;
  viceChairmanName: string;
  viceChairmanClass: string;
  photoUrl: string;
  vision: string;
  mission: string[];
  programs: string[];
  quote?: string;
  campaignVideoUrl?: string;
  colorScheme?: string;
}

export interface Voter {
  id: string;
  electionPeriodId: string;
  username: string; // Akses masuk login
  nisn: string;
  fullName: string;
  className: string;
  gender: 'L' | 'P';
  pinHash: string; // Stored as hash
  plainPinPreview?: string; // Revealed only to Panitia for printing tokens
  hasVoted: boolean;
  votedAt?: string;
}

export interface AdminCredentials {
  username: string;
  password: string; // Stored securely
  lastUpdated?: string;
}

// Decoupled Anonymous Ballot for LUBER-JURDIL
// Absolutely NO voter_id foreign key!
export interface AnonymousVote {
  id: string;
  electionPeriodId: string;
  candidateId: string;
  createdAt: string;
  tamperChecksum?: string;
}

export interface Committee {
  id: string;
  electionPeriodId: string;
  skNumber: string;
  skDate: string;
  memberName: string;
  role: 'Ketua Panitia' | 'Sekretaris' | 'Bendahara' | 'Seksi Teknis/Bilik' | 'Seksi Keamanan' | 'Pengawas';
  email: string;
  username: string;
  phone?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userRole: 'Siswa' | 'Panitia' | 'Admin' | 'System';
  userIdentifier: string; // "NISN: 0081234567" or "Admin: admin@sekolah.sch.id"
  action: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface QuickCountResult {
  candidateId: string;
  ballotNumber: number;
  chairmanName: string;
  viceChairmanName: string;
  voteCount: number;
  percentage: number;
}

export interface TurnoutStats {
  totalDpt: number;
  totalVoted: number;
  totalUnvoted: number;
  percentageVoted: number;
  percentageUnvoted: number;
}

export type ViewTab = 'public' | 'kiosk' | 'panitia' | 'admin' | 'prd';
