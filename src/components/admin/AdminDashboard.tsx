import React, { useState } from 'react';
import { 
  SchoolConfig, 
  ElectionPeriod, 
  Committee, 
  AuditLog, 
  SchoolType,
  AdminCredentials
} from '../../types/election';
import { electionStore } from '../../lib/storage';
import { sound } from '../../lib/audio';
import { 
  ShieldCheck, 
  Building2, 
  Calendar, 
  FileText, 
  Activity, 
  Plus, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  Printer, 
  Trash2, 
  Lock, 
  Settings,
  X,
  FileCheck,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  Unlock,
  Key,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface AdminDashboardProps {
  school: SchoolConfig;
  periods: ElectionPeriod[];
  committees: Committee[];
  auditLogs: AuditLog[];
  onOpenBahp: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  school,
  periods,
  committees,
  auditLogs,
  onOpenBahp
}) => {
  const [activeTab, setActiveTab] = useState<'school' | 'periods' | 'committee' | 'audit' | 'credentials'>('school');

  // School config form state
  const [schoolName, setSchoolName] = useState(school.name);
  const [schoolNpsn, setSchoolNpsn] = useState(school.npsn);
  const [schoolType, setSchoolType] = useState<SchoolType>(school.type);
  const [schoolLogo, setSchoolLogo] = useState(school.logoUrl);
  const [schoolAddress, setSchoolAddress] = useState(school.address);
  const [schoolDistrict, setSchoolDistrict] = useState(school.district);
  const [schoolCity, setSchoolCity] = useState(school.city);
  const [schoolProvince, setSchoolProvince] = useState(school.province);
  const [principalName, setPrincipalName] = useState(school.principalName);
  const [principalNip, setPrincipalNip] = useState(school.principalNip);

  // Admin Credentials form state
  const [adminCreds, setAdminCreds] = useState<AdminCredentials>(() => electionStore.getAdminCredentials());
  const [adminUsernameInput, setAdminUsernameInput] = useState(adminCreds.username);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Session Lock for testing admin login
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [lockUsernameInput, setLockUsernameInput] = useState('');
  const [lockPasswordInput, setLockPasswordInput] = useState('');
  const [lockError, setLockError] = useState<string | null>(null);

  // New period modal
  const [isAddPeriodModalOpen, setIsAddPeriodModalOpen] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('2027/2028');
  const [newTargetTurnout, setNewTargetTurnout] = useState(95);

  // Committee modal
  const [isAddCommitteeModalOpen, setIsAddCommitteeModalOpen] = useState(false);
  const [commSkNumber, setCommSkNumber] = useState('421.3/089/SMAN1/SK-PILKETOS/2026');
  const [commSkDate, setCommSkDate] = useState('2026-08-15');
  const [commName, setCommName] = useState('');
  const [commRole, setCommRole] = useState<Committee['role']>('Ketua Panitia');
  const [commEmail, setCommEmail] = useState('');
  const [commUsername, setCommUsername] = useState('');

  // Notification alert
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // Save school configuration
  const handleSaveSchoolConfig = (e: React.FormEvent) => {
    e.preventDefault();
    electionStore.updateSchoolConfig({
      name: schoolName,
      npsn: schoolNpsn,
      type: schoolType,
      logoUrl: schoolLogo,
      address: schoolAddress,
      district: schoolDistrict,
      city: schoolCity,
      province: schoolProvince,
      principalName,
      principalNip
    });
    sound.playVoteSuccess();
    showAlert('success', 'Konfigurasi instansi dan satuan pendidikan berhasil disimpan.');
  };

  // Create new period
  const handleCreatePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodName.trim() || !newAcademicYear.trim()) {
      showAlert('error', 'Nama periode dan tahun ajaran wajib diisi.');
      return;
    }

    electionStore.addPeriod({
      schoolId: school.id,
      periodName: newPeriodName.trim(),
      academicYear: newAcademicYear.trim(),
      status: 'draft',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      targetTurnout: Number(newTargetTurnout)
    });

    sound.playVoteSuccess();
    showAlert('success', `Tahun periode pemilihan ${newAcademicYear} berhasil dibuat.`);
    setIsAddPeriodModalOpen(false);
    setNewPeriodName('');
  };

  // Set active period
  const handleSetActivePeriod = (pId: string) => {
    if (confirm('Aktifkan tahun periode pemilihan ini? Hanya satu periode yang dapat berstatus AKTIF. Periode aktif sebelumnya akan otomatis diarsipkan.')) {
      electionStore.setActivePeriod(pId);
      sound.playClickTick();
      showAlert('success', 'Status periode aktif berhasil dialihkan.');
    }
  };

  // Close period
  const handleClosePeriod = (pId: string) => {
    if (confirm('Tutup pemungutan suara untuk periode ini? Bilik suara siswa tidak akan dapat diakses lagi untuk periode ini.')) {
      electionStore.closePeriod(pId);
      sound.playClickTick();
      showAlert('success', 'Periode pemilihan telah ditutup.');
    }
  };

  // Add Committee member
  const handleAddCommittee = (e: React.FormEvent) => {
    e.preventDefault();
    const activeP = electionStore.getActivePeriod();
    if (!activeP) return;

    if (!commName.trim() || !commEmail.trim()) {
      showAlert('error', 'Nama anggota dan email wajib diisi.');
      return;
    }

    electionStore.saveCommittee({
      id: `comm-${Date.now()}`,
      electionPeriodId: activeP.id,
      skNumber: commSkNumber,
      skDate: commSkDate,
      memberName: commName.trim(),
      role: commRole,
      email: commEmail.trim(),
      username: commUsername.trim() || commEmail.split('@')[0]
    });

    sound.playVoteSuccess();
    showAlert('success', `Anggota kepanitiaan SK berhasil ditambahkan.`);
    setIsAddCommitteeModalOpen(false);
    setCommName('');
    setCommEmail('');
  };

  const handleDeleteCommittee = (id: string) => {
    if (confirm('Hapus anggota panitia ini?')) {
      electionStore.deleteCommittee(id);
      sound.playClickTick();
      showAlert('success', 'Anggota panitia dihapus.');
    }
  };

  const handleResetFactory = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh database aplikasi ke pengaturan awal default?')) {
      electionStore.resetToFactoryDefaults();
      sound.playVoteSuccess();
      window.location.reload();
    }
  };

  // Admin Credentials Handlers
  const handleSaveAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsernameInput.trim()) {
      sound.playErrorAlert();
      showAlert('error', 'Username admin tidak boleh kosong.');
      return;
    }

    // Check if password change is requested
    if (newPasswordInput || oldPasswordInput) {
      if (!oldPasswordInput) {
        sound.playErrorAlert();
        showAlert('error', 'Masukkan kata sandi lama untuk konfirmasi perubahan kredensial.');
        return;
      }
      if (oldPasswordInput !== adminCreds.password) {
        sound.playErrorAlert();
        showAlert('error', 'Kata sandi lama yang Anda masukkan salah.');
        return;
      }
      if (newPasswordInput.length < 6) {
        sound.playErrorAlert();
        showAlert('error', 'Kata sandi baru minimal 6 karakter.');
        return;
      }
      if (newPasswordInput !== confirmPasswordInput) {
        sound.playErrorAlert();
        showAlert('error', 'Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
    }

    const finalPassword = newPasswordInput ? newPasswordInput : adminCreds.password;
    const updated = electionStore.updateAdminCredentials(adminUsernameInput.trim(), finalPassword);
    setAdminCreds(updated);
    setOldPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    sound.playVoteSuccess();
    showAlert('success', `Kredensial Administrator berhasil disimpan! Username: "${updated.username}".`);
  };

  const handleResetAdminCredentials = () => {
    if (confirm('Kembalikan kredensial admin ke setelan awal default (username: admin, kata sandi: admin123)?')) {
      const def = electionStore.resetAdminCredentials();
      setAdminCreds(def);
      setAdminUsernameInput(def.username);
      setOldPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      sound.playVoteSuccess();
      showAlert('success', 'Kredensial admin di-reset ke default (admin / admin123).');
    }
  };

  const handleUnlockSession = (e: React.FormEvent) => {
    e.preventDefault();
    setLockError(null);
    const valid = electionStore.verifyAdminCredentials(lockUsernameInput, lockPasswordInput);
    if (!valid) {
      sound.playErrorAlert();
      setLockError('Username atau kata sandi admin salah. Periksa kembali.');
      return;
    }
    sound.playClickTick();
    setIsSessionLocked(false);
    setLockUsernameInput('');
    setLockPasswordInput('');
    showAlert('success', 'Sesi Administrator berhasil dibuka.');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Pusat Otoritas &amp; Pengesahan
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
            Panel Administrator Sekolah / Madrasah
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kepala Sekolah &bull; {school.name} &bull; NPSN: {school.npsn}
          </p>
        </div>

        {/* Action: Berita Acara BAHP & Kunci Sesi */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              sound.playClickTick();
              onOpenBahp();
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Berita Acara Hasil Pemilihan (BAHP)</span>
          </button>

          <button
            onClick={() => {
              sound.playClickTick();
              setIsSessionLocked(true);
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm border border-slate-700 transition cursor-pointer"
            title="Kunci sesi admin untuk menguji login dengan kredensial baru"
          >
            <Lock className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Kunci Sesi</span>
          </button>
        </div>
      </div>

      {alert && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold transition ${
          alert.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-700 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-300 text-rose-700 dark:text-rose-300'
        }`}>
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('school')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'school'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Konfigurasi Sekolah / OSIS-OSIM</span>
        </button>

        <button
          onClick={() => setActiveTab('periods')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'periods'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Manajemen Periode Pemilu ({periods.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('committee')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'committee'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>SK Panitia Pemilihan ({committees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Trail &amp; Rekam Sistem ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'credentials'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>Kredensial &amp; Akun Admin</span>
        </button>
      </div>

      {/* TAB 1: SCHOOL CONFIG */}
      {activeTab === 'school' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Identitas Satuan Pendidikan</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Konfigurasi ini digunakan pada kop resmi surat suara, kartu token pemilih, dan dokumen BAHP.
            </p>
          </div>

          <form onSubmit={handleSaveSchoolConfig} className="space-y-5 text-xs sm:text-sm">
            {/* Type Switcher: OSIS vs OSIM */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                Jenis Organisasi Kepengurusan:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`p-4 rounded-xl border flex items-center space-x-3 cursor-pointer transition ${
                  schoolType === 'OSIS' 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-bold' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="schoolType"
                    value="OSIS"
                    checked={schoolType === 'OSIS'}
                    onChange={() => setSchoolType('OSIS')}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-extrabold text-sm">OSIS (Sekolah Umum / Kemdikbud)</div>
                    <div className="text-[11px] text-slate-500 font-normal">Organisasi Siswa Intra Sekolah (SMA / SMK / SMP)</div>
                  </div>
                </label>

                <label className={`p-4 rounded-xl border flex items-center space-x-3 cursor-pointer transition ${
                  schoolType === 'OSIM' 
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="schoolType"
                    value="OSIM"
                    checked={schoolType === 'OSIM'}
                    onChange={() => setSchoolType('OSIM')}
                    className="text-emerald-600"
                  />
                  <div>
                    <div className="font-extrabold text-sm">OSIM (Madrasah / Kemenag)</div>
                    <div className="text-[11px] text-slate-500 font-normal">Organisasi Siswa Intra Madrasah (MA / MTs)</div>
                  </div>
                </label>
              </div>
            </div>

            {/* School Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Resmi Satuan Pendidikan:
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nomor Pokok Sekolah Nasional (NPSN):
                </label>
                <input
                  type="text"
                  required
                  value={schoolNpsn}
                  onChange={(e) => setSchoolNpsn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  URL Logo Instansi (Transparan):
                </label>
                <button
                  type="button"
                  onClick={() => setSchoolLogo('https://i.imgur.com/xduwCzW.png')}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  Gunakan Logo Resmi (Imgur ggY0db6)
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                  <img
                    src={schoolLogo || '/logo.png'}
                    alt="Logo Preview"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <input
                  type="text"
                  value={schoolLogo}
                  onChange={(e) => setSchoolLogo(e.target.value)}
                  placeholder="https://i.imgur.com/xduwCzW.png"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                *Mendukung link Imgur album <code>https://imgur.com/a/ggY0db6</code>, link langsung CDN <code>https://i.imgur.com/xduwCzW.png</code>, atau file lokal <code>/logo.png</code>.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Alamat Lengkap:
              </label>
              <input
                type="text"
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kecamatan:</label>
                <input
                  type="text"
                  value={schoolDistrict}
                  onChange={(e) => setSchoolDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kabupaten/Kota:</label>
                <input
                  type="text"
                  value={schoolCity}
                  onChange={(e) => setSchoolCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Provinsi:</label>
                <input
                  type="text"
                  value={schoolProvince}
                  onChange={(e) => setSchoolProvince(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {/* Principal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Kepala Sekolah / Madrasah:
                </label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  NIP Kepala Sekolah:
                </label>
                <input
                  type="text"
                  value={principalNip}
                  onChange={(e) => setPrincipalNip(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={handleResetFactory}
                className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Reset Database ke Pengaturan Awal Pabrik
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MULTI-PERIOD REUSABLE LIFECYCLE */}
      {activeTab === 'periods' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-slate-500">
              Sistem mendukung penggunaan berkelanjutan setiap tahun. Hanya ada <strong>1 periode berstatus AKTIF</strong> dalam satu waktu.
            </p>
            <button
              onClick={() => setIsAddPeriodModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Periode Baru</span>
            </button>
          </div>

          <div className="space-y-3">
            {periods.map((period) => (
              <div
                key={period.id}
                className={`p-5 rounded-2xl border transition-all ${
                  period.status === 'aktif'
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {period.periodName}
                      </h4>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {period.academicYear}
                      </span>
                      {period.status === 'aktif' && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                          AKTIF
                        </span>
                      )}
                      {period.status === 'selesai' && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500">
                          DIARSIPKAN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Target Partisipasi: {period.targetTurnout}% &bull; Dibuat: {new Date(period.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {period.status !== 'aktif' ? (
                      <button
                        onClick={() => handleSetActivePeriod(period.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Jadikan Aktif
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClosePeriod(period.id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Tutup Pemilihan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pusat Reset Pemilu untuk Uji Coba & Gladi Bersih */}
          <div className="mt-8 p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Fitur Pengujian &amp; Gladi Bersih
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-1 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  Pusat Reset Pemilu (Uji Coba &amp; Pemilihan Bersih)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gunakan bagian ini untuk mereset hasil pemilu saat simulasi/gladi bersih, atau mengosongkan kotak suara sebelum pemilihan resmi dimulai.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    Reset Suara Pemilu
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mengosongkan semua surat suara yang telah masuk (kembali ke 0). Seluruh akun pemilih dapat mencoblos kembali. Data DPT &amp; Paslon tetap aman.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const activeP = periods.find(p => p.status === 'aktif') || periods[0];
                    if (!activeP) return;
                    if (confirm(`RESET SUARA: Kosongkan seluruh suara untuk periode "${activeP.periodName}"?`)) {
                      electionStore.resetElectionVotes(activeP.id);
                      sound.playVoteSuccess();
                      showAlert('success', 'Suara pemilu berhasil direset ke 0! Kotak suara bersih dan siap digunakan.');
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow cursor-pointer text-center"
                >
                  Reset Suara (Mulai Bersih)
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Isi Suara Simulasi
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Membuat 10 suara acak otomatis untuk menguji pembacaan Quick Count 1 per 1 tanpa harus login manual berulang kali.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const activeP = periods.find(p => p.status === 'aktif') || periods[0];
                    if (!activeP) return;
                    const added = electionStore.seedSimulationVotes(activeP.id, 10);
                    sound.playVoteSuccess();
                    showAlert('success', `Berhasil menambahkan ${added} suara simulasi untuk demonstrasi!`);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow cursor-pointer text-center"
                >
                  + Tambah 10 Suara Simulasi
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    Reset Total (Pabrik)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Menghapus seluruh database aplikasi di peramban ini dan mengembalikan ke setelan awal default SMP Negeri 90.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetFactory}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs transition shadow cursor-pointer text-center"
                >
                  Reset Seluruh Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMMITTEE SK MANAGEMENT */}
      {activeTab === 'committee' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-slate-500">
              Daftar susunan panitia pemilihan (KPO) yang disahkan melalui Surat Keputusan (SK) Kepala Sekolah.
            </p>
            <button
              onClick={() => setIsAddCommitteeModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Panitia SK</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Nama Anggota</th>
                  <th className="py-3 px-4">Jabatan Kepanitiaan</th>
                  <th className="py-3 px-4">Nomor SK Penetapan</th>
                  <th className="py-3 px-4">Email / Akun Operator</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {committees.map((comm) => (
                  <tr key={comm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{comm.memberName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs">
                        {comm.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{comm.skNumber}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{comm.email}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteCommittee(comm.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAILS */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Audit Trails &amp; Rekaman Aktivitas Sistem</h3>
            <p className="text-xs text-slate-500">
              Log aktivitas tamper-proof yang mencatat setiap peristiwa voting, autentikasi, dan konfigurasi master.
            </p>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      log.userRole === 'Siswa' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                      log.userRole === 'Panitia' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' :
                      'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                    }`}>
                      {log.userRole}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                    <span className="text-slate-400 font-mono text-[11px]">&bull; {log.userIdentifier}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{log.details}</p>
                </div>

                <div className="text-right text-slate-400 font-mono text-[11px] shrink-0">
                  <div>{new Date(log.timestamp).toLocaleTimeString('id-ID')}</div>
                  <div>IP: {log.ipAddress}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN CREDENTIALS & ACCOUNT */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-gradient-to-r from-purple-900/60 via-slate-900 to-indigo-950 border border-purple-800/60 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 shadow-inner">
                  <KeyRound className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Aktif &amp; Terenkripsi
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      Role: Super Admin
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Username Administrator: <span className="text-amber-400 font-mono underline decoration-amber-400/40">{adminCreds.username}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Akun ini memegang otoritas tertinggi untuk konfigurasi satuan pendidikan, pengesahan periode pemilu, penetapan panitia SK, dan cetak Berita Acara BAHP.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSessionLocked(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs shadow-md transition cursor-pointer border border-purple-400/30"
                >
                  <Lock className="w-4 h-4" />
                  <span>Kunci &amp; Uji Login Akun</span>
                </button>
                <div className="text-[11px] text-slate-400 text-right">
                  Terakhir Diubah: {adminCreds.lastUpdated ? new Date(adminCreds.lastUpdated).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Setelan Pabrik'}
                </div>
              </div>
            </div>
          </div>

          {/* Form: Ubah Username & Password */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Perbarui Username &amp; Kata Sandi Admin
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Ubah nama pengguna (username) dan kata sandi untuk memastikan keamanan akses panel administrator.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetAdminCredentials}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Default (admin / admin123)</span>
              </button>
            </div>

            <form onSubmit={handleSaveAdminCredentials} className="space-y-6 max-w-2xl text-xs sm:text-sm">
              {/* Username Input */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
                  Username Administrator:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    placeholder="Contoh: admin atau admin_smp90"
                    className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="absolute right-3.5 top-3.5 text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Username digunakan saat masuk ke panel administrator sekolah. Huruf kecil dan angka disarankan.
                </p>
              </div>

              {/* Password Section */}
              <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/50 space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Ganti Kata Sandi (Password)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">
                  Kosongkan kolom kata sandi baru jika hanya ingin memperbarui username tanpa mengubah kata sandi saat ini.
                </p>

                {/* Old Password */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Kata Sandi Lama (Dibutuhkan untuk verifikasi keamanan):
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPasswordInput}
                      onChange={(e) => setOldPasswordInput(e.target.value)}
                      placeholder="Masukkan kata sandi lama (Default: admin123)"
                      className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* New Password */}
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Kata Sandi Baru:
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Konfirmasi Kata Sandi Baru:
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Kredensial Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SESSION LOCK / ADMIN LOGIN VERIFICATION */}
      {isSessionLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                Kunci Akses Administrator
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Sesi administrator dikunci. Masukkan username dan kata sandi Anda untuk melanjutkan.
              </p>
            </div>

            {lockError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{lockError}</span>
              </div>
            )}

            <form onSubmit={handleUnlockSession} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold block mb-1">Username Admin:</label>
                <input
                  type="text"
                  required
                  value={lockUsernameInput}
                  onChange={(e) => setLockUsernameInput(e.target.value)}
                  placeholder="Username admin"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Kata Sandi (Password):</label>
                <input
                  type="password"
                  required
                  value={lockPasswordInput}
                  onChange={(e) => setLockPasswordInput(e.target.value)}
                  placeholder="Kata sandi admin"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm"
                />
              </div>

              {/* Demo Helper Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClickTick();
                    setLockUsernameInput(adminCreds.username);
                    setLockPasswordInput(adminCreds.password);
                    setLockError(null);
                  }}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Isi Otomatis Kredensial Saat Ini ({adminCreds.username})</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSessionLocked(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
                >
                  Batal Kunci
                </button>

                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Buka Akses</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PERIOD */}
      {isAddPeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Buat Periode Pemilihan Baru</h3>
              <button onClick={() => setIsAddPeriodModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="font-bold block mb-1">Nama Pemilihan:</label>
                <input
                  type="text"
                  required
                  value={newPeriodName}
                  onChange={(e) => setNewPeriodName(e.target.value)}
                  placeholder="Pemilihan Ketua & Wakil OSIS 2027/2028"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Tahun Ajaran:</label>
                <input
                  type="text"
                  required
                  value={newAcademicYear}
                  onChange={(e) => setNewAcademicYear(e.target.value)}
                  placeholder="2027/2028"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Target Partisipasi Pemilih (%):</label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={newTargetTurnout}
                  onChange={(e) => setNewTargetTurnout(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPeriodModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Simpan Periode Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD COMMITTEE */}
      {isAddCommitteeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Anggota Panitia SK</h3>
              <button onClick={() => setIsAddCommitteeModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCommittee} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="font-bold block mb-1">Nomor SK Kepanitiaan:</label>
                <input
                  type="text"
                  required
                  value={commSkNumber}
                  onChange={(e) => setCommSkNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Nama Lengkap &amp; Gelar:</label>
                <input
                  type="text"
                  required
                  value={commName}
                  onChange={(e) => setCommName(e.target.value)}
                  placeholder="Drs. Ahmad Jauhari, M.Pd."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Peran / Posisi:</label>
                <select
                  value={commRole}
                  onChange={(e) => setCommRole(e.target.value as Committee['role'])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="Ketua Panitia">Ketua Panitia</option>
                  <option value="Sekretaris">Sekretaris</option>
                  <option value="Bendahara">Bendahara</option>
                  <option value="Seksi Teknis/Bilik">Seksi Teknis / Operator Bilik</option>
                  <option value="Seksi Keamanan">Seksi Keamanan &amp; Ketertiban</option>
                  <option value="Pengawas">Pengawas Independen</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Email Resmi / Akun:</label>
                <input
                  type="email"
                  required
                  value={commEmail}
                  onChange={(e) => setCommEmail(e.target.value)}
                  placeholder="panitia@sekolah.sch.id"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCommitteeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Simpan Panitia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
