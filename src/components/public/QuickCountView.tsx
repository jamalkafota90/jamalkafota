import React, { useState } from 'react';
import { 
  SchoolConfig, 
  ElectionPeriod, 
  Candidate, 
  QuickCountResult, 
  TurnoutStats 
} from '../../types/election';
import { 
  BarChart3, 
  PieChart, 
  Users, 
  CheckCircle, 
  Clock, 
  Vote, 
  Sparkles, 
  ShieldCheck, 
  PlayCircle, 
  ChevronRight, 
  Award, 
  Calendar,
  X,
  RefreshCw,
  ExternalLink,
  Target
} from 'lucide-react';
import { sound } from '../../lib/audio';
import { electionStore } from '../../lib/storage';
import { LiveTally1By1Modal } from './LiveTally1By1Modal';
import { 
  Volume2, 
  RotateCcw, 
  Layers 
} from 'lucide-react';

interface QuickCountViewProps {
  school: SchoolConfig;
  periods: ElectionPeriod[];
  selectedPeriodId: string;
  onSelectPeriod: (periodId: string) => void;
  candidates: Candidate[];
  quickCount: QuickCountResult[];
  turnout: TurnoutStats;
  onOpenKiosk: () => void;
}

export const QuickCountView: React.FC<QuickCountViewProps> = ({
  school,
  periods,
  selectedPeriodId,
  onSelectPeriod,
  candidates,
  quickCount,
  turnout,
  onOpenKiosk
}) => {
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState<Candidate | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveTallyOpen, setIsLiveTallyOpen] = useState(false);
  const [feedbackAlert, setFeedbackAlert] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'info', message: string) => {
    setFeedbackAlert({ type, message });
    setTimeout(() => setFeedbackAlert(null), 4000);
  };

  const currentPeriod = periods.find(p => p.id === selectedPeriodId) || periods[0];
  const isOSIM = school.type === 'OSIM';
  const orgTitle = isOSIM ? 'OSIM (Organisasi Siswa Intra Madrasah)' : 'OSIS (Organisasi Siswa Intra Sekolah)';

  // Calculate leader if votes exist
  const highestVote = quickCount.reduce((prev, current) => (prev.voteCount > current.voteCount) ? prev : current, quickCount[0]);
  const hasVotes = quickCount.some(q => q.voteCount > 0);

  const handleRefresh = () => {
    sound.playClickTick();
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleResetPemiluUjicoba = () => {
    if (confirm('RESET PEMILU: Apakah Anda ingin mengosongkan seluruh suara yang masuk agar sistem bersih kembali untuk ujicoba atau pemilihan asli?')) {
      electionStore.resetElectionVotes(selectedPeriodId);
      sound.playVoteSuccess();
      showFeedback('success', 'Hasil suara pemilu berhasil direset ke 0! Kotak suara bersih dan pemilih dapat mencoblos kembali.');
    }
  };

  const handleSimulate10Votes = () => {
    const added = electionStore.seedSimulationVotes(selectedPeriodId, 10);
    sound.playVoteSuccess();
    showFeedback('info', `Berhasil menambahkan ${added} suara simulasi! Buka 'Mode Baca Suara 1 per 1' untuk mendengarkan pembacaan.`);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner with Dynamic School Identity */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-10 text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 max-w-3xl">
            {school.logoUrl && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-xl flex items-center justify-center shrink-0 border border-slate-700/60">
                <img
                  src={school.logoUrl}
                  alt={school.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm ${
                  isOSIM 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  {orgTitle}
                </span>

                {currentPeriod?.status === 'aktif' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-2"></span>
                    Bilik Suara Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/40">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Periode Diarsipkan / Selesai
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Papan Hitung Cepat (Live Quick Count)
              </h1>

              <p className="text-slate-300 text-sm sm:text-base font-normal max-w-2xl leading-relaxed">
                Selamat datang di portal transparansi pemilihan ketua dan wakil ketua kepengurusan{' '}
                <strong className="text-white font-semibold">{school.name}</strong>. Sistem menerapkan asas LUBER-JURDIL dengan penyimpanan suara terenkripsi dan nir-kecurangan.
              </p>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Tahun Ajaran: <strong className="text-slate-200">{currentPeriod?.academicYear}</strong>
                </span>
                <span>&bull;</span>
                <span>NPSN: <strong className="text-slate-200">{school.npsn}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action Button & Period Switcher */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[260px]">
            {currentPeriod?.status === 'aktif' && (
              <button
                onClick={() => {
                  sound.playClickTick();
                  onOpenKiosk();
                }}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Vote className="w-5 h-5 text-slate-950" />
                <span>Masuk Bilik Suara Siswa</span>
                <ChevronRight className="w-4 h-4 text-slate-950" />
              </button>
            )}

            {/* Multi-Period Selector */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-3 border border-slate-700/80">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Pilih Tahun Periode Pemilihan:
              </label>
              <select
                value={selectedPeriodId}
                onChange={(e) => onSelectPeriod(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.academicYear} - {p.periodName} {p.status === 'aktif' ? '(AKTIF)' : '(Arsip)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Row (Partisipasi & Suara Masuk) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Total DPT */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs sm:text-sm font-semibold">Total Hak Pilih (DPT)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {turnout.totalDpt.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Siswa terdaftar resmi
          </p>
        </div>

        {/* Metric 2: Suara Masuk */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs sm:text-sm font-semibold">Suara Telah Masuk</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {turnout.totalVoted.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mt-1">
            <span>Partisipasi Pemilih:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{turnout.percentageVoted}%</strong>
          </div>
        </div>

        {/* Metric 3: Suara Belum Masuk */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs sm:text-sm font-semibold">Belum Menggunakan Hak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {turnout.totalUnvoted.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mt-1">
            <span>Sisa Antrean:</span>
            <strong className="text-amber-600 dark:text-amber-400 font-bold">{turnout.percentageUnvoted}%</strong>
          </div>
        </div>

        {/* Metric 4: Target Partisipasi & Indikator Luber */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs sm:text-sm font-semibold">Target Turnout</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
            {currentPeriod?.targetTurnout || 95}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(turnout.percentageVoted, 100)}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* Feedback Alert for Reset & Simulation */}
      {feedbackAlert && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold transition ${
          feedbackAlert.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
        }`}>
          <span>{feedbackAlert.message}</span>
          <button onClick={() => setFeedbackAlert(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fitur Utama: Pembacaan Suara 1 per 1 (Sensasi KPPS Real-time) & Reset Ujicoba */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 via-indigo-950/60 to-purple-950/40 border-2 border-amber-500/40 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Sensasi Hitung Suara Riil TPS / KPPS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              Mode Penghitungan Suara Terbaca 1 per 1
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Saksikan pembacaan surat suara satu per satu dengan narasi vokal resmi, papan turus digital real-time, dan surat suara yang terbuka secara interaktif!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => {
                sound.playClickTick();
                setIsLiveTallyOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Volume2 className="w-5 h-5 text-slate-950" />
              <span>Mulai Pembacaan 1 per 1</span>
            </button>

            <button
              onClick={handleSimulate10Votes}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
              title="Isi 10 suara simulasi untuk demonstrasi pembacaan"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Simulasi +10 Suara</span>
            </button>

            <button
              onClick={handleResetPemiluUjicoba}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-rose-950/80 text-rose-300 hover:text-rose-200 text-xs font-bold border border-slate-700 hover:border-rose-700/50 transition cursor-pointer"
              title="Kosongkan suara untuk memulai pemilihan baru yang bersih"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Reset Pemilu</span>
            </button>
          </div>
        </div>
      </section>

      {/* Realtime Quick Count Visualization Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Perolehan Suara Pasangan Calon
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Data teragregasi secara otomatis tanpa mencatat identitas siswa (Asas Kerahasiaan Pemilu).
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>

        {/* Visual Vote Progress Bars */}
        <div className="mt-8 space-y-6">
          {quickCount.map((item, idx) => {
            const isWinner = hasVotes && item.candidateId === highestVote.candidateId;
            const barColors = [
              'from-emerald-500 to-teal-500',
              'from-indigo-500 to-blue-500',
              'from-amber-500 to-orange-500',
              'from-rose-500 to-pink-500'
            ];
            const colorClass = barColors[idx % barColors.length];

            return (
              <div 
                key={item.candidateId}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 transition hover:border-blue-400"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center shadow">
                      {String(item.ballotNumber).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                          {item.chairmanName} &amp; {item.viceChairmanName}
                        </h3>
                        {isWinner && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                            <Award className="w-3 h-3" />
                            Memimpin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pasangan Calon No. Urut {item.ballotNumber}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex items-baseline sm:flex-col sm:items-end justify-between sm:justify-start">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {item.percentage}%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {item.voteCount.toLocaleString('id-ID')} Suara Sah
                    </span>
                  </div>
                </div>

                {/* Animated Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700/80 rounded-full h-4 overflow-hidden shadow-inner p-0.5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out`}
                    style={{ width: `${item.percentage > 0 ? item.percentage : 1}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Profil Paslon Resmi (Official Candidate Cards) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Profil Resmi Pasangan Calon (Paslon)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Pelajari rekam jejak, visi, misi, dan program kerja unggulan sebelum memberikan suara di bilik.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            {candidates.length} Paslon Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Card Header & Photo 3:4 */}
              <div>
                <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={cand.photoUrl}
                    alt={`Paslon ${cand.ballotNumber}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const fallback = cand.ballotNumber === 1 ? 'https://i.imgur.com/1DgzXJS.png' : cand.ballotNumber === 2 ? 'https://i.imgur.com/M7UEbFI.png' : 'https://i.imgur.com/RHR5Hln.png';
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Nomor Urut Badge */}
                  <div className="absolute top-4 left-4">
                    <div className="px-3.5 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white font-black text-xl shadow-lg border border-white/20">
                      #{String(cand.ballotNumber).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Video Orasi Button Overlay if available */}
                  {cand.campaignVideoUrl && (
                    <button
                      onClick={() => setVideoModalUrl(cand.campaignVideoUrl || null)}
                      className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-red-600 text-white text-xs font-semibold backdrop-blur-md transition shadow-md cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4 text-white" />
                      <span>Video Kampanye</span>
                    </button>
                  )}
                </div>

                {/* Candidate Info */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                      {cand.chairmanName}
                    </h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                      Calon Ketua ({cand.chairmanClass})
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {cand.viceChairmanName}
                    </h4>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                      Calon Wakil Ketua ({cand.viceChairmanClass})
                    </p>
                  </div>

                  {cand.quote && (
                    <blockquote className="text-xs italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border-l-2 border-blue-500">
                      {cand.quote}
                    </blockquote>
                  )}

                  {/* Vision Summary */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Visi Utama:
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      "{cand.vision}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Action: Open Full Vision & Programs Modal */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => {
                    sound.playClickTick();
                    setSelectedCandidateForModal(cand);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold transition duration-200 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Lihat Visi, Misi &amp; Program Kerja</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Candidate Detail Modal */}
      {selectedCandidateForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl my-8">
            <button
              onClick={() => setSelectedCandidateForModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <span className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg">
                #{String(selectedCandidateForModal.ballotNumber).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {selectedCandidateForModal.chairmanName} &amp; {selectedCandidateForModal.viceChairmanName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kandidat Pasangan Calon {isOSIM ? 'OSIM' : 'OSIS'} {currentPeriod?.academicYear}
                </p>
              </div>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Vision */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                  Visi Kepengurusan:
                </h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  "{selectedCandidateForModal.vision}"
                </p>
              </div>

              {/* Mission */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Misi Paslon:
                </h4>
                <ul className="space-y-2">
                  {selectedCandidateForModal.mission.map((m, idx) => (
                    <li key={idx} className="flex items-start text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mr-2.5 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Program Unggulan */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Program Kerja Unggulan:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedCandidateForModal.programs.map((prog, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{prog}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCandidateForModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Video Modal */}
      {videoModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 text-white relative shadow-2xl">
            <button
              onClick={() => setVideoModalUrl(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-red-500" />
              <span>Orasi &amp; Video Kampanye Paslon</span>
            </h3>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
              <div className="text-center p-6 space-y-3">
                <PlayCircle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                <p className="text-sm font-medium text-slate-300">
                  Tautan Video Resmi: {videoModalUrl}
                </p>
                <a
                  href={videoModalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold"
                >
                  <span>Buka di Tab Baru</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Live Tally 1 by 1 Audio & Visual Modal */}
      <LiveTally1By1Modal
        isOpen={isLiveTallyOpen}
        onClose={() => setIsLiveTallyOpen(false)}
        periodId={selectedPeriodId}
        periodName={currentPeriod?.periodName || 'Pemilihan Ketua OSIS'}
        candidates={candidates}
        school={school}
        onResetVotesNeeded={handleRefresh}
      />
    </div>
  );
};
