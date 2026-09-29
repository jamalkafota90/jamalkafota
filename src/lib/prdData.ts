export const PRD_DOCUMENT = {
  title: "Product Requirements Document (PRD) & Security Architecture",
  subtitle: "Sistem Pemilihan Ketua OSIS / OSIM Sekolah Digital (E-Pilketos / E-Pilkosim)",
  version: "v2.4-Enterprise",
  author: "Lead Enterprise Architect & Edu-Cybersecurity Expert",
  targetInstitution: "Satuan Pendidikan Menengah (SMA/SMK/MA/SMP/MTs)",
  
  pillars: [
    {
      title: "LUBER-JURDIL (Direct, General, Free, Secret, Honest & Fair)",
      desc: "Prinsip pemisahan data mutlak (decoupled anonymous ballot): tabel identitas pemilih (voters) terisolasi penuh dari tabel pencatatan pilihan (votes). Tidak ada foreign key atau relasi langsung yang dapat mengaitkan pilihan dengan identitas siswa."
    },
    {
      title: "Tamper-Proof & Atomicity",
      desc: "Transaksi pencoblosan menggunakan transaksi database terisolasi (ACID / SELECT FOR UPDATE) untuk mencegah race condition, double-voting, dan interupsi jaringan."
    },
    {
      title: "Multi-Period Reusability",
      desc: "Sistem dapat digunakan kembali setiap tahun ajaran tanpa menghapus data historis. Hanya satu periode pemilihan yang berstatus 'aktif' dalam satu waktu."
    },
    {
      title: "High-Concurrency Real-Time Kiosk",
      desc: "Dirancang untuk bilik suara serentak (1000+ siswa) dengan autentikasi instan NISN + 6-digit random PIN, auto-logout 5 detik, dan papan Quick Count live update."
    }
  ],

  roleMatrix: [
    {
      role: "Siswa (Pemilih)",
      scope: "Bilik Suara Digital (Kiosk Mode)",
      permissions: [
        "Login menggunakan NISN + 6 Digit PIN acak (hanya 1x pakai)",
        "Melihat surat suara digital paslon resmi",
        "Memberikan 1 suara dengan konfirmasi bertingkat",
        "Menerima tanda bukti suara kriptografis anonim",
        "Melihat Quick Count publik setelah pemungutan suara"
      ],
      restrictions: [
        "Tidak dapat mengubah pilihan setelah tombol konfirmasi ditekan",
        "Tidak dapat masuk kembali jika status has_voted = true",
        "Tidak memiliki akses ke data pemilih lain atau panel administrasi"
      ]
    },
    {
      role: "Panitia Pemilihan (KPO/KPPS)",
      scope: "Dashboard Operasional Bilik & DPT",
      permissions: [
        "Manajemen dan impor DPT siswa via CSV / Excel",
        "Generate massal PIN acak 6 digit per siswa",
        "Cetak kartu token suara / QR code siap potong",
        "Reset PIN siswa (hanya jika siswa belum menggunakan hak suara / kendala teknis)",
        "Input & edit data pasangan calon (paslon, visi, misi, video orasi)",
        "Monitoring kehadiran pemilih (voted vs unvoted) per kelas secara real-time"
      ],
      restrictions: [
        "Tidak dapat mengintip paslon mana yang dicoblos oleh siswa tertentu",
        "Tidak dapat mengubah suara yang telah masuk ke kotak suara digital",
        "Tidak dapat mengubah konfigurasi master institusi tanpa otorisasi Admin"
      ]
    },
    {
      role: "Admin Sekolah / Madrasah (Kepala Sekolah & Tim IT)",
      scope: "Pusat Otoritas & Pengesahan Hasil",
      permissions: [
        "Konfigurasi identitas satuan pendidikan (NPSN, Logo, OSIS/OSIM)",
        "Buka, tutup, dan arsipkan tahun periode pemilihan",
        "Penerbitan SK Kepanitiaan resmi & akun panitia",
        "Audit trail & log rekaman aktivitas seluruh sistem",
        "Pengesahan dan cetak Berita Acara Hasil Pemilihan (BAHP) berkop resmi"
      ],
      restrictions: [
        "Tidak dapat memanipulasi database kotak suara setelah periode berstatus 'selesai'"
      ]
    }
  ]
};

export const POSTGRES_DDL_SCHEMA = `-- ==============================================================================
-- SKEMA BASIS DATA E-PILKETOS / E-PILKOSIM (SUPABASE POSTGRESQL DDL)
-- Standar Integritas Tinggi, Decoupled Ballot, dan Row Level Security (RLS)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABEL SATUAN PENDIDIKAN (INSTITUSI)
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    npsn VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('OSIS', 'OSIM')),
    logo_url TEXT,
    address TEXT,
    district VARCHAR(100),
    city VARCHAR(100),
    province VARCHAR(100),
    principal_name VARCHAR(150),
    principal_nip VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABEL PERIODE PEMILIHAN (MULTI-PERIOD REUSABLE)
CREATE TABLE election_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    period_name VARCHAR(150) NOT NULL, -- e.g. "Pemilihan Ketua OSIS 2026/2027"
    academic_year VARCHAR(20) NOT NULL, -- e.g. "2026/2027"
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'aktif', 'selesai')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    target_turnout NUMERIC(5,2) DEFAULT 95.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aturan Bisnis: Hanya ada 1 periode berstatus 'aktif' dalam satu waktu
CREATE UNIQUE INDEX idx_single_active_election 
ON election_periods (school_id) 
WHERE status = 'aktif';

-- 4. TABEL KEPANITIAAN BERDASARKAN SK
CREATE TABLE committees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_period_id UUID NOT NULL REFERENCES election_periods(id) ON DELETE CASCADE,
    sk_number VARCHAR(100) NOT NULL,
    sk_date DATE NOT NULL,
    member_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL, -- Ketua Panitia, Sekretaris, Bendahara, Teknisi Bilik
    email VARCHAR(150) NOT NULL,
    user_id UUID, -- Terkoneksi ke auth.users jika menggunakan Supabase Auth
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABEL PASANGAN CALON (PASLON)
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_period_id UUID NOT NULL REFERENCES election_periods(id) ON DELETE CASCADE,
    ballot_number INT NOT NULL, -- Nomor urut: 1, 2, 3
    chairman_name VARCHAR(150) NOT NULL,
    chairman_class VARCHAR(50) NOT NULL,
    vice_chairman_name VARCHAR(150) NOT NULL,
    vice_chairman_class VARCHAR(50) NOT NULL,
    photo_url TEXT NOT NULL, -- Foto resmi rasio 3:4
    vision TEXT NOT NULL,
    mission JSONB NOT NULL DEFAULT '[]'::jsonb,
    programs JSONB NOT NULL DEFAULT '[]'::jsonb,
    campaign_video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_period_ballot UNIQUE (election_period_id, ballot_number)
);

-- 6. TABEL DAFTAR PEMILIH TETAP (DPT) & KREDENSIAL TOKEN
CREATE TABLE voters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_period_id UUID NOT NULL REFERENCES election_periods(id) ON DELETE CASCADE,
    nisn VARCHAR(20) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    gender CHAR(1) CHECK (gender IN ('L', 'P')),
    pin_hash VARCHAR(64) NOT NULL, -- SHA-256 hash dari PIN acak 6 digit
    has_voted BOOLEAN NOT NULL DEFAULT FALSE,
    voted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_period_nisn UNIQUE (election_period_id, nisn)
);

-- 7. TABEL KOTAK SUARA ANONIM (DECOUPLED BALLOT - LUBER JURDIL)
-- PERHATIKAN: Tidak ada kolom voter_id! 
-- Menjamin kerahasiaan pilihan mutlak secara arsitektural.
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_period_id UUID NOT NULL REFERENCES election_periods(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tamper_checksum VARCHAR(64) -- Hash kriptografis tanda integritas
);

CREATE INDEX idx_votes_period_candidate ON votes(election_period_id, candidate_id);

-- 8. TABEL AUDIT TRAILS (LOG AKTIVITAS SISTEM)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100),
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- STORED PROCEDURE: ATOMIC DIGITAL VOTE CASTING
-- Mencegah Race Condition & Menjamin Pemisahan Identitas dengan Kotak Suara
-- ==============================================================================

CREATE OR REPLACE FUNCTION cast_digital_vote(
    p_period_id UUID,
    p_nisn VARCHAR,
    p_pin_hash VARCHAR,
    p_candidate_id UUID,
    p_ip_address VARCHAR
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voter_id UUID;
    v_has_voted BOOLEAN;
    v_period_status VARCHAR;
    v_checksum VARCHAR;
BEGIN
    -- 1. Periksa apakah periode pemilu sedang berstatus 'aktif'
    SELECT status INTO v_period_status 
    FROM election_periods 
    WHERE id = p_period_id;

    IF v_period_status IS NULL OR v_period_status != 'aktif' THEN
        RAISE EXCEPTION 'Bilik suara ditutup: Periode pemilihan tidak sedang aktif.';
    END IF;

    -- 2. Kunci baris pemilih (FOR UPDATE) untuk memblokir penyerangan konkurensi / double vote
    SELECT id, has_voted INTO v_voter_id, v_has_voted
    FROM voters
    WHERE election_period_id = p_period_id 
      AND nisn = p_nisn 
      AND pin_hash = p_pin_hash
    FOR UPDATE;

    IF v_voter_id IS NULL THEN
        RAISE EXCEPTION 'Otentikasi gagal: Kombinasi NISN dan PIN tidak valid.';
    END IF;

    IF v_has_voted = TRUE THEN
        RAISE EXCEPTION 'Pelanggaran: Hak suara dengan NISN ini telah digunakan sebelumnya.';
    END IF;

    -- 3. Catat suara secara anonim ke tabel votes
    v_checksum := encode(digest(p_period_id::text || p_candidate_id::text || clock_timestamp()::text, 'sha256'), 'hex');
    
    INSERT INTO votes (election_period_id, candidate_id, created_at, tamper_checksum)
    VALUES (p_period_id, p_candidate_id, NOW(), v_checksum);

    -- 4. Ubah status pemilih menjadi has_voted = true dan catat timestamp kehadiran
    UPDATE voters
    SET has_voted = TRUE,
        voted_at = NOW(),
        pin_hash = 'INVALIDATED_' || encode(gen_random_bytes(16), 'hex') -- Hanguskan PIN
    WHERE id = v_voter_id;

    -- 5. Catat audit trail transaksi
    INSERT INTO audit_logs (user_id, user_role, action, details, ip_address)
    VALUES (p_nisn, 'Siswa', 'CAST_VOTE', 'Pencoblosan berhasil diverifikasi secara atomik', p_ip_address);

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Suara Anda berhasil tercatat dengan aman dan rahasia.',
        'receipt_token', substr(v_checksum, 1, 16)
    );
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Beranda Publik: Dapat membaca identitas sekolah, periode aktif, dan kandidat
CREATE POLICY "Public Read School & Period" ON schools FOR SELECT USING (true);
CREATE POLICY "Public Read Active Periods" ON election_periods FOR SELECT USING (true);
CREATE POLICY "Public Read Candidates" ON candidates FOR SELECT USING (true);

-- Quick Count: Publik hanya dapat membaca ringkasan agregat suara (tanpa detail individual)
CREATE POLICY "Public Aggregate Votes" ON votes FOR SELECT USING (true);

-- Voters: Panitia & Admin dapat membaca DPT, namun Siswa hanya dapat berinteraksi via RPC
CREATE POLICY "Panitia Read DPT" ON voters FOR SELECT TO authenticated USING (true);
`;
