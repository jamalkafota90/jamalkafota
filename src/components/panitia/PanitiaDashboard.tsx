import React, { useState, useMemo } from 'react';
import { 
  SchoolConfig, 
  ElectionPeriod, 
  Candidate, 
  Voter 
} from '../../types/election';
import { electionStore, normalizeCandidatePhoto } from '../../lib/storage';
import { sound } from '../../lib/audio';
import { 
  Users, 
  UserPlus, 
  Upload, 
  FileSpreadsheet, 
  Printer, 
  KeyRound, 
  RotateCcw, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Plus, 
  Save, 
  X, 
  Sparkles,
  QrCode,
  Download,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface PanitiaDashboardProps {
  school: SchoolConfig;
  activePeriod: ElectionPeriod | null;
  candidates: Candidate[];
  voters: Voter[];
  onOpenPrintCards: () => void;
}

export const PanitiaDashboard: React.FC<PanitiaDashboardProps> = ({
  school,
  activePeriod,
  candidates,
  voters,
  onOpenPrintCards
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dpt' | 'candidates' | 'monitor'>('dpt');
  
  // Search & Filters for DPT
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'VOTED' | 'UNVOTED'>('ALL');
  const [showPlainPin, setShowPlainPin] = useState(false);

  // Manual Add Voter Modal
  const [isAddVoterModalOpen, setIsAddVoterModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newNisn, setNewNisn] = useState('');
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('X-1');
  const [newGender, setNewGender] = useState<'L' | 'P'>('L');

  // CSV Import Modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState<string | null>(null);

  // Candidate Edit / Add Modal
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // Form states for candidate
  const [candBallotNumber, setCandBallotNumber] = useState(1);
  const [candChairmanName, setCandChairmanName] = useState('');
  const [candChairmanClass, setCandChairmanClass] = useState('');
  const [candViceChairmanName, setCandViceChairmanName] = useState('');
  const [candViceChairmanClass, setCandViceChairmanClass] = useState('');
  const [candPhotoUrl, setCandPhotoUrl] = useState('');
  const [candVision, setCandVision] = useState('');
  const [candMissionText, setCandMissionText] = useState('');
  const [candProgramsText, setCandProgramsText] = useState('');
  const [candVideoUrl, setCandVideoUrl] = useState('');

  // Notification message
  const [bannerAlert, setBannerAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setBannerAlert({ type, message });
    setTimeout(() => setBannerAlert(null), 4000);
  };

  // Distinct classes list for filter
  const distinctClasses = useMemo(() => {
    const set = new Set<string>();
    voters.forEach(v => set.add(v.className));
    return Array.from(set).sort();
  }, [voters]);

  // Filtered Voters
  const filteredVoters = useMemo(() => {
    return voters.filter(v => {
      const matchSearch = 
        v.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        v.nisn.includes(searchQuery) ||
        (v.username && v.username.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchClass = selectedClassFilter === 'ALL' || v.className === selectedClassFilter;
      const matchStatus = 
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'VOTED' && v.hasVoted) ||
        (selectedStatusFilter === 'UNVOTED' && !v.hasVoted);

      return matchSearch && matchClass && matchStatus;
    });
  }, [voters, searchQuery, selectedClassFilter, selectedStatusFilter]);

  // Reset PIN for a single voter
  const handleResetPin = (voter: Voter) => {
    if (voter.hasVoted) {
      sound.playErrorAlert();
      showAlert('error', `Tidak dapat mereset PIN: Siswa ${voter.fullName} telah menggunakan hak suaranya.`);
      return;
    }

    try {
      const newPin = electionStore.resetVoterPin(voter.id);
      sound.playClickTick();
      showAlert('success', `PIN untuk ${voter.fullName} berhasil direset menjadi: ${newPin}`);
    } catch (err: unknown) {
      sound.playErrorAlert();
      showAlert('error', (err as Error).message || 'Gagal mereset PIN');
    }
  };

  // Batch regenerate pins for all unvoted
  const handleBatchRegenerate = () => {
    if (!activePeriod) return;
    if (confirm('Apakah Anda yakin ingin meregenerasi PIN untuk SELURUH pemilih yang belum mencoblos? PIN lama akan otomatis diganti.')) {
      const count = electionStore.batchRegeneratePins(activePeriod.id);
      sound.playVoteSuccess();
      showAlert('success', `Berhasil meregenerasi PIN acak untuk ${count} pemilih.`);
    }
  };

  // Save manual voter
  const handleSaveVoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePeriod) return;

    if (!newNisn.trim() || !newName.trim()) {
      showAlert('error', 'NISN dan Nama Lengkap wajib diisi.');
      return;
    }

    // Check duplicate
    if (voters.some(v => v.nisn === newNisn.trim())) {
      showAlert('error', 'NISN ini sudah terdaftar dalam DPT!');
      return;
    }

    const finalUsername = newUsername.trim() || (newName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) + newNisn.slice(-2));

    electionStore.bulkImportVoters(activePeriod.id, [{
      nisn: newNisn.trim(),
      fullName: newName.trim(),
      className: newClass.trim(),
      gender: newGender,
      username: finalUsername
    }]);

    sound.playVoteSuccess();
    showAlert('success', `Data pemilih ${newName} (Username: "${finalUsername}") berhasil ditambahkan ke DPT.`);
    setIsAddVoterModalOpen(false);
    setNewNisn('');
    setNewName('');
    setNewUsername('');
  };

  // Handle CSV Import
  const handleProcessCsv = () => {
    if (!activePeriod || !csvText.trim()) return;

    try {
      const lines = csvText.trim().split('\n');
      const parsed: { nisn: string; fullName: string; className: string; gender: 'L' | 'P' }[] = [];

      lines.forEach((line) => {
        const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          const [rawNisn, rawName, rawClass, rawGender] = parts;
          if (rawNisn && rawName && rawClass && !isNaN(Number(rawNisn.replace(/\D/g, '')))) {
            parsed.push({
              nisn: rawNisn.replace(/\D/g, ''),
              fullName: rawName,
              className: rawClass,
              gender: (rawGender && rawGender.toUpperCase() === 'P') ? 'P' : 'L'
            });
          }
        }
      });

      if (parsed.length === 0) {
        setImportResult('Format data tidak sesuai. Pastikan format: NISN, Nama Lengkap, Kelas, Gender (L/P)');
        return;
      }

      const addedCount = electionStore.bulkImportVoters(activePeriod.id, parsed);
      sound.playVoteSuccess();
      showAlert('success', `Berhasil mengimpor ${addedCount} data pemilih baru.`);
      setIsCsvModalOpen(false);
      setCsvText('');
      setImportResult(null);
    } catch {
      setImportResult('Terjadi kesalahan saat memproses data CSV.');
    }
  };

  // Sample CSV Downloader
  const handleDownloadSampleCsv = () => {
    const sample = `NISN,Nama Lengkap,Kelas,Jenis Kelamin\n0089012001,Ahmad Pratama,X-1,L\n0089012002,Bunga Lestari,X-1,P\n0089012003,Dimas Anggara,XI MIPA 1,L\n0089012004,Eka Rahayu,XII IPS 2,P`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_dpt_pilketos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Candidate Modal Open
  const handleOpenCandidateModal = (cand?: Candidate) => {
    sound.playClickTick();
    if (cand) {
      setEditingCandidate(cand);
      setCandBallotNumber(cand.ballotNumber);
      setCandChairmanName(cand.chairmanName);
      setCandChairmanClass(cand.chairmanClass);
      setCandViceChairmanName(cand.viceChairmanName);
      setCandViceChairmanClass(cand.viceChairmanClass);
      setCandPhotoUrl(cand.photoUrl);
      setCandVision(cand.vision);
      setCandMissionText(cand.mission.join('\n'));
      setCandProgramsText(cand.programs.join('\n'));
      setCandVideoUrl(cand.campaignVideoUrl || '');
    } else {
      setEditingCandidate(null);
      setCandBallotNumber(candidates.length + 1);
      setCandChairmanName('');
      setCandChairmanClass('XI MIPA 1');
      setCandViceChairmanName('');
      setCandViceChairmanClass('X-1');
      setCandPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80');
      setCandVision('');
      setCandMissionText('');
      setCandProgramsText('');
      setCandVideoUrl('');
    }
    setIsCandidateModalOpen(true);
  };

  const handleSaveCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePeriod) return;

    const missionArr = candMissionText.split('\n').map(m => m.trim()).filter(Boolean);
    const programsArr = candProgramsText.split('\n').map(p => p.trim()).filter(Boolean);

    const candData: Candidate = {
      id: editingCandidate ? editingCandidate.id : `cand-${Date.now()}`,
      electionPeriodId: activePeriod.id,
      ballotNumber: Number(candBallotNumber),
      chairmanName: candChairmanName.trim(),
      chairmanClass: candChairmanClass.trim(),
      viceChairmanName: candViceChairmanName.trim(),
      viceChairmanClass: candViceChairmanClass.trim(),
      photoUrl: candPhotoUrl.trim() 
        ? normalizeCandidatePhoto(candPhotoUrl.trim()) 
        : (candBallotNumber === 1 ? 'https://i.imgur.com/1DgzXJS.png' : candBallotNumber === 2 ? 'https://i.imgur.com/M7UEbFI.png' : 'https://i.imgur.com/RHR5Hln.png'),
      vision: candVision.trim(),
      mission: missionArr.length ? missionArr : ['Mewujudkan integritas siswa'],
      programs: programsArr.length ? programsArr : ['Pekan Kreativitas'],
      campaignVideoUrl: candVideoUrl.trim() || undefined
    };

    electionStore.saveCandidate(candData);
    sound.playVoteSuccess();
    showAlert('success', `Paslon No. Urut ${candData.ballotNumber} berhasil disimpan.`);
    setIsCandidateModalOpen(false);
  };

  const handleDeleteCandidate = (candId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data kandidat paslon ini?')) {
      electionStore.deleteCandidate(candId);
      sound.playClickTick();
      showAlert('success', 'Data kandidat telah dihapus.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              Dashboard Panitia Pemilihan (KPO / KPPS)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
            Pengelolaan Data Pemilih &amp; Surat Suara
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Satuan Pendidikan: {school.name} &bull; Periode: {activePeriod?.periodName || '2026/2027'}
          </p>
        </div>

        {/* Action Buttons: Cetak Kartu Token */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              sound.playClickTick();
              onOpenPrintCards();
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Token Pemilih (PDF)</span>
          </button>
        </div>
      </div>

      {bannerAlert && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold transition ${
          bannerAlert.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-700 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-300 text-rose-700 dark:text-rose-300'
        }`}>
          <span>{bannerAlert.message}</span>
          <button onClick={() => setBannerAlert(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('dpt')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'dpt'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Pemilih Tetap (DPT) &amp; Token ({voters.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('candidates')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'candidates'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Manajemen Paslon ({candidates.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('monitor')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'monitor'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Monitoring Kehadiran Bilik</span>
        </button>
      </div>

      {/* SUBTAB 1: DPT & TOKEN MANAGEMENT */}
      {activeSubTab === 'dpt' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan NISN atau Nama Pemilih..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Class Filter */}
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">Semua Kelas ({distinctClasses.length})</option>
                {distinctClasses.map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as 'ALL' | 'VOTED' | 'UNVOTED')}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="VOTED">Sudah Memilih</option>
                <option value="UNVOTED">Belum Memilih</option>
              </select>

              {/* Toggle Plain PIN view */}
              <button
                onClick={() => setShowPlainPin(!showPlainPin)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                title="Tampilkan / Sembunyikan PIN rahasia untuk keperluan cetak"
              >
                {showPlainPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPlainPin ? 'Sembunyikan PIN' : 'Lihat PIN'}</span>
              </button>

              {/* Action: Add Voter */}
              <button
                onClick={() => setIsAddVoterModalOpen(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Siswa</span>
              </button>

              {/* Action: Import CSV */}
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Impor CSV/Excel</span>
              </button>

              {/* Action: Batch Regenerate */}
              <button
                onClick={handleBatchRegenerate}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow cursor-pointer"
                title="Regenerasi token untuk semua siswa belum memilih"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerate PIN</span>
              </button>
            </div>
          </div>

          {/* DPT Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">No.</th>
                    <th className="py-3.5 px-4">Username Login</th>
                    <th className="py-3.5 px-4">NISN</th>
                    <th className="py-3.5 px-4">Nama Lengkap</th>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4">L/P</th>
                    <th className="py-3.5 px-4">Token PIN (6-Digit)</th>
                    <th className="py-3.5 px-4">Status Hak Suara</th>
                    <th className="py-3.5 px-4 text-right">Aksi Panitia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredVoters.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Tidak ada data pemilih yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredVoters.map((voter, idx) => (
                      <tr key={voter.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                          {voter.username || voter.nisn}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {voter.nisn}
                        </td>
                        <td className="py-3 px-4 text-slate-900 dark:text-white font-bold">
                          {voter.fullName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
                            {voter.className}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{voter.gender}</td>
                        <td className="py-3 px-4 font-mono font-black tracking-widest">
                          {voter.hasVoted ? (
                            <span className="text-slate-400 text-xs italic">HANGUS (VOTED)</span>
                          ) : showPlainPin ? (
                            <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs">
                              {voter.plainPinPreview || 'TERKUNCI'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs tracking-widest font-mono">••••••</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {voter.hasVoted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Sudah Memilih
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                              <XCircle className="w-3.5 h-3.5" />
                              Belum Memilih
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!voter.hasVoted ? (
                            <button
                              onClick={() => handleResetPin(voter)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                              title="Reset PIN baru jika terjadi kendala pada kartu fisik"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-500" />
                              <span>Reset PIN</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Tuntas</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CANDIDATES MANAGEMENT */}
      {activeSubTab === 'candidates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-slate-500">
              Kelola nomor urut, foto resmi (3:4), visi, misi, dan video orasi kampanye pasangan calon.
            </p>
            <button
              onClick={() => handleOpenCandidateModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Paslon Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((cand) => (
              <div
                key={cand.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[3/4] rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
                    <img
                      src={cand.photoUrl}
                      alt={cand.chairmanName}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const fallback = cand.ballotNumber === 1 ? 'https://i.imgur.com/1DgzXJS.png' : cand.ballotNumber === 2 ? 'https://i.imgur.com/M7UEbFI.png' : 'https://i.imgur.com/RHR5Hln.png';
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-slate-900 text-white font-black text-sm">
                      #{String(cand.ballotNumber).padStart(2, '0')}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {cand.chairmanName} ({cand.chairmanClass})
                  </h3>
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                    &amp; {cand.viceChairmanName} ({cand.viceChairmanClass})
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    "{cand.vision}"
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenCandidateModal(cand)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sunting</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCandidate(cand.id)}
                    className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-bold transition cursor-pointer"
                    title="Hapus paslon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: MONITORING KEHADIRAN BILIK */}
      {activeSubTab === 'monitor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Hak Pilih</span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {voters.length}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold uppercase">Telah Mencoblos</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                {voters.filter(v => v.hasVoted).length} ({voters.length > 0 ? ((voters.filter(v => v.hasVoted).length / voters.length) * 100).toFixed(1) : 0}%)
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold uppercase">Sisa Belum Memilih</span>
              <div className="text-3xl font-extrabold text-amber-600 mt-1">
                {voters.filter(v => !v.hasVoted).length}
              </div>
            </div>
          </div>

          {/* Breakdown Per Kelas */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Partisipasi Kehadiran per Tingkat Kelas
            </h3>
            <div className="space-y-4">
              {distinctClasses.map(cls => {
                const classVoters = voters.filter(v => v.className === cls);
                const classVoted = classVoters.filter(v => v.hasVoted).length;
                const pct = classVoters.length > 0 ? Math.round((classVoted / classVoters.length) * 100) : 0;

                return (
                  <div key={cls} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">Kelas {cls}</span>
                      <span className="text-slate-500">
                        {classVoted} / {classVoters.length} Siswa ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH SISWA MANUAL */}
      {isAddVoterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Pemilih Baru</h3>
              <button onClick={() => setIsAddVoterModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVoter} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  NISN (10 Digit):
                </label>
                <input
                  type="text"
                  required
                  value={newNisn}
                  onChange={(e) => setNewNisn(e.target.value.replace(/\D/g, ''))}
                  placeholder="0081234599"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Username Pemilih (Login):
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="Opsional (otomatis digenerate jika kosong, cth: ahmad90)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Digunakan siswa saat login di bilik suara selain NISN.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Lengkap:
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama Siswa Sesuai Dapodik"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kelas:
                  </label>
                  <input
                    type="text"
                    required
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value.toUpperCase())}
                    placeholder="X-1 atau XI MIPA 1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Jenis Kelamin:
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                *Sistem akan otomatis menghasilkan PIN 6-digit acak tanpa karakter ambigu.
              </p>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddVoterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Simpan ke DPT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPOR DPT CSV/EXCEL */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Impor DPT Massal (CSV/Excel)</h3>
              </div>
              <button onClick={() => setIsCsvModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Salin data dari Excel atau CSV dengan susunan kolom: <strong>NISN, Nama Lengkap, Kelas, Jenis Kelamin (L/P)</strong>.
            </p>

            <button
              onClick={handleDownloadSampleCsv}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Format Template CSV Contoh</span>
            </button>

            {importResult && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                {importResult}
              </div>
            )}

            <textarea
              rows={7}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="0089123001, Ahmad Fauzi, X-1, L&#10;0089123002, Citra Lestari, X-2, P"
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleProcessCsv}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer"
              >
                Proses &amp; Generate PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / SUNTING PASLON */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingCandidate ? 'Sunting Data Paslon' : 'Tambah Pasangan Calon'}
              </h3>
              <button onClick={() => setIsCandidateModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Nomor Urut:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={candBallotNumber}
                    onChange={(e) => setCandBallotNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Foto URL (Rasio 3:4):</label>
                  <input
                    type="text"
                    value={candPhotoUrl}
                    onChange={(e) => setCandPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setCandPhotoUrl('https://i.imgur.com/1DgzXJS.png')}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-blue-600 font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      Foto Paslon 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setCandPhotoUrl('https://i.imgur.com/M7UEbFI.png')}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-blue-600 font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      Foto Paslon 2
                    </button>
                    <button
                      type="button"
                      onClick={() => setCandPhotoUrl('https://i.imgur.com/RHR5Hln.png')}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-blue-600 font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      Foto Paslon 3
                    </button>
                  </div>
                </div>
              </div>

              {/* Chairman & Vice Chairman */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Nama Calon Ketua:</label>
                  <input
                    type="text"
                    required
                    value={candChairmanName}
                    onChange={(e) => setCandChairmanName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Kelas Ketua:</label>
                  <input
                    type="text"
                    required
                    value={candChairmanClass}
                    onChange={(e) => setCandChairmanClass(e.target.value)}
                    placeholder="XI MIPA 1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Nama Calon Wakil:</label>
                  <input
                    type="text"
                    required
                    value={candViceChairmanName}
                    onChange={(e) => setCandViceChairmanName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Kelas Wakil:</label>
                  <input
                    type="text"
                    required
                    value={candViceChairmanClass}
                    onChange={(e) => setCandViceChairmanClass(e.target.value)}
                    placeholder="X-2"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Visi Paslon:</label>
                <textarea
                  rows={2}
                  required
                  value={candVision}
                  onChange={(e) => setCandVision(e.target.value)}
                  placeholder="Visi strategis kepengurusan"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Misi (1 baris per poin):</label>
                <textarea
                  rows={3}
                  value={candMissionText}
                  onChange={(e) => setCandMissionText(e.target.value)}
                  placeholder="Misi 1&#10;Misi 2&#10;Misi 3"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Program Unggulan (1 baris per poin):</label>
                <textarea
                  rows={2}
                  value={candProgramsText}
                  onChange={(e) => setCandProgramsText(e.target.value)}
                  placeholder="Program 1&#10;Program 2"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Tautan Video Kampanye (Opsional):</label>
                <input
                  type="text"
                  value={candVideoUrl}
                  onChange={(e) => setCandVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Simpan Paslon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
