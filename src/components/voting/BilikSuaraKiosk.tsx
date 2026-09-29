import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  SchoolConfig, 
  ElectionPeriod, 
  Candidate, 
  Voter 
} from '../../types/election';
import { electionStore } from '../../lib/storage';
import { sound } from '../../lib/audio';
import { 
  Lock, 
  KeyRound, 
  Vote, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  RotateCcw,
  Check,
  AlertTriangle
} from 'lucide-react';

interface BilikSuaraKioskProps {
  school: SchoolConfig;
  activePeriod: ElectionPeriod | null;
  candidates: Candidate[];
  onVoteSuccessDone: () => void;
}

type KioskStep = 'LOGIN' | 'BALLOT' | 'SUCCESS';

export const BilikSuaraKiosk: React.FC<BilikSuaraKioskProps> = ({
  school,
  activePeriod,
  candidates,
  onVoteSuccessDone
}) => {
  const [step, setStep] = useState<KioskStep>('LOGIN');
  const [usernameOrNisn, setUsernameOrNisn] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Authenticated voter state for the current session
  const [authenticatedVoter, setAuthenticatedVoter] = useState<Voter | null>(null);

  // Candidate confirmation modal
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Success state
  const [receiptToken, setReceiptToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  const isOSIM = school.type === 'OSIM';

  // Available test credentials helper for easy evaluation
  const availableVoters = electionStore.getVoters(activePeriod?.id).slice(0, 8);

  const handleQuickFill = (v: Voter) => {
    sound.playClickTick();
    setUsernameOrNisn(v.username || v.nisn);
    setPin(v.plainPinPreview || '');
    setErrorMsg(null);
  };

  // Step 1: Login Handler (Username or NISN + PIN)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!activePeriod || activePeriod.status !== 'aktif') {
      sound.playErrorAlert();
      setErrorMsg('Bilik suara ditutup: Tidak ada periode pemilihan yang sedang aktif.');
      return;
    }

    if (!usernameOrNisn.trim() || !pin.trim()) {
      sound.playErrorAlert();
      setErrorMsg('Mohon masukkan Username (atau NISN) dan PIN 6-karakter Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const voters = electionStore.getVoters(activePeriod.id);
      const query = usernameOrNisn.trim().toLowerCase();
      const voter = voters.find(v => 
        (v.username && v.username.trim().toLowerCase() === query) || 
        v.nisn.trim().toLowerCase() === query
      );

      if (!voter) {
        sound.playErrorAlert();
        setErrorMsg('Username atau NISN tidak ditemukan dalam DPT. Hubungi Panitia Pemilihan.');
        setIsLoading(false);
        return;
      }

      if (voter.hasVoted) {
        sound.playErrorAlert();
        setErrorMsg(`Pelanggaran: Hak suara untuk akun ini (${voter.fullName}) telah digunakan. Tidak diperbolehkan memilih ganda!`);
        setIsLoading(false);
        return;
      }

      // Check PIN
      const normalizedInput = pin.trim().toUpperCase();
      const storedPin = (voter.plainPinPreview || '').trim().toUpperCase();

      if (normalizedInput !== storedPin) {
        sound.playErrorAlert();
        setErrorMsg('Token PIN tidak cocok dengan akun ini. Periksa kembali kartu pemilih Anda.');
        setIsLoading(false);
        return;
      }

      // Authenticated!
      sound.playClickTick();
      setAuthenticatedVoter(voter);
      setStep('BALLOT');
      setIsLoading(false);
    }, 400);
  };

  // Step 2: Open Confirmation Modal
  const handleSelectCandidate = (cand: Candidate) => {
    sound.playClickTick();
    setSelectedCandidate(cand);
    setIsConfirmModalOpen(true);
  };

  // Step 3: Atomic Final Vote Submission
  const handleConfirmVote = async () => {
    if (!selectedCandidate || !activePeriod || !authenticatedVoter) return;

    setIsLoading(true);
    setIsConfirmModalOpen(false);

    try {
      const result = await electionStore.castVote(
        activePeriod.id,
        authenticatedVoter.username || authenticatedVoter.nisn,
        pin,
        selectedCandidate.id
      );

      if (result.success) {
        sound.playVoteSuccess();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        setReceiptToken(result.receiptToken || 'REC-CONFIRMED');
        setStep('SUCCESS');
        setCountdown(5);
      } else {
        sound.playErrorAlert();
        setErrorMsg(result.message);
        setStep('LOGIN');
      }
    } catch {
      sound.playErrorAlert();
      setErrorMsg('Terjadi kendala jaringan bilik suara. Silakan hubungi Panitia.');
      setStep('LOGIN');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto Countdown to reset kiosk for next student
  useEffect(() => {
    if (step !== 'SUCCESS') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Reset kiosk
          setStep('LOGIN');
          setUsernameOrNisn('');
          setPin('');
          setAuthenticatedVoter(null);
          setSelectedCandidate(null);
          setReceiptToken(null);
          onVoteSuccessDone();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, onVoteSuccessDone]);

  // Reset manually
  const handleManualReset = () => {
    sound.playClickTick();
    setStep('LOGIN');
    setUsernameOrNisn('');
    setPin('');
    setAuthenticatedVoter(null);
    setSelectedCandidate(null);
    setReceiptToken(null);
    onVoteSuccessDone();
  };

  return (
    <div className="max-w-5xl mx-auto py-4 px-2 sm:px-6">
      {/* Kiosk Mode Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Kiosk Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 sm:py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                  BILIK SUARA DIGITAL (KIOSK MODE)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  LUBER-JURDIL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {school.name} &bull; Periode: {activePeriod?.academicYear || 'Aktif'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pilihan Anda Bersifat Rahasia &amp; Terenkripsi</span>
          </div>
        </div>

        {/* STEP 1: AUTHENTICATION (NISN + PIN) */}
        {step === 'LOGIN' && (
          <div className="p-6 sm:p-12 max-w-xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Verifikasi Hak Suara Pemilih
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Akses masuk bilik suara menggunakan <strong>Username</strong> (atau NISN) dan <strong>PIN Rahasia</strong> (4 angka) yang tertera pada Kartu Suara Anda.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Username / NISN Pemilih:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={usernameOrNisn}
                    onChange={(e) => setUsernameOrNisn(e.target.value)}
                    placeholder="Contoh: fauzan atau 0081234501"
                    className="w-full pl-4 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-mono text-base tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="absolute right-3.5 top-3.5 text-slate-400">
                    <Vote className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  *Masukkan Username yang tercantum di kartu pemilih Anda (atau gunakan NISN).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  PIN Rahasia Pemilih:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.toUpperCase())}
                    placeholder="Contoh: 1234"
                    className="w-full pl-4 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-mono text-lg font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-3.5 top-3.5 text-slate-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  *PIN sekali pakai dan langsung hangus setelah suara tersimpan.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Memverifikasi Kredensial...</span>
                ) : (
                  <>
                    <span>Buka Surat Suara Digital</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Helper */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Uji Coba Cepat (Klik Akun untuk Otomatis Isi):
                </span>
                {activePeriod && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Reset seluruh suara agar semua akun demo dapat memilih kembali untuk ujicoba?')) {
                        electionStore.resetElectionVotes(activePeriod.id);
                        sound.playVoteSuccess();
                        setUsernameOrNisn('');
                        setPin('');
                        setErrorMsg(null);
                      }
                    }}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
                  >
                    Reset Pemilu (Ujicoba)
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableVoters.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleQuickFill(v)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                      v.hasVoted 
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 line-through opacity-75' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{v.fullName}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">[{v.username} • PIN: {v.plainPinPreview || 'VOTED'}]</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DIGITAL BALLOT (SURAT SUARA DIGITAL) */}
        {step === 'BALLOT' && authenticatedVoter && (
          <div className="p-6 sm:p-10 space-y-8">
            {/* Voter Welcome Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Pemilih: {authenticatedVoter.fullName}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Kelas: <strong>{authenticatedVoter.className}</strong> &bull; Username: <strong className="font-mono text-blue-600 dark:text-blue-400">{authenticatedVoter.username || authenticatedVoter.nisn}</strong> &bull; NISN: <strong>{authenticatedVoter.nisn}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700">
                  Surat Suara Sah #{authenticatedVoter.id.slice(-4)}
                </span>
                <button
                  onClick={() => {
                    sound.playClickTick();
                    setStep('LOGIN');
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 p-2 cursor-pointer"
                >
                  Batal / Ganti
                </button>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                SURAT SUARA ELEKTRONIK CALON KETUA &amp; WAKIL KETUA {isOSIM ? 'OSIM' : 'OSIS'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Silakan pilih salah satu pasangan calon di bawah ini dengan menekan tombol <strong>"Pilih Paslon Ini"</strong>.
              </p>
            </div>

            {/* Candidate Cards Grid (Surat Suara) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Ballot Number Header */}
                    <div className="bg-slate-900 text-white text-center py-2.5 font-black text-lg sm:text-xl tracking-wider flex items-center justify-center gap-2 border-b border-slate-800">
                      <span>NOMOR URUT</span>
                      <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm">
                        {String(cand.ballotNumber).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Official Portrait */}
                    <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                      <img
                        src={cand.photoUrl}
                        alt={`Kandidat ${cand.ballotNumber}`}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const fallback = cand.ballotNumber === 1 ? 'https://i.imgur.com/1DgzXJS.png' : cand.ballotNumber === 2 ? 'https://i.imgur.com/M7UEbFI.png' : 'https://i.imgur.com/RHR5Hln.png';
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    {/* Candidate Names & Slogan */}
                    <div className="p-5 text-center space-y-2">
                      <h4 className="font-black text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                        {cand.chairmanName}
                      </h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        Calon Ketua ({cand.chairmanClass})
                      </p>

                      <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-700 mx-auto my-1"></div>

                      <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-tight">
                        {cand.viceChairmanName}
                      </h5>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                        Calon Wakil Ketua ({cand.viceChairmanClass})
                      </p>

                      <p className="text-xs italic text-slate-500 dark:text-slate-400 pt-2 line-clamp-2">
                        "{cand.vision}"
                      </p>
                    </div>
                  </div>

                  {/* Vote Button */}
                  <div className="p-5 pt-0">
                    <button
                      onClick={() => handleSelectCandidate(cand)}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                    >
                      <Vote className="w-5 h-5" />
                      <span>PILIH PASLON #{cand.ballotNumber}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS & RECEIPT CONFIRMATION */}
        {step === 'SUCCESS' && (
          <div className="p-8 sm:p-16 text-center max-w-xl mx-auto space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl animate-bounce">
              <Check className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Pencoblosan Berhasil
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Terima Kasih Atas Hak Suara Anda!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Suara Anda telah tersimpan secara atomik dan terenkripsi ke dalam kotak suara digital yang terisolasi dari data identitas Anda.
              </p>
            </div>

            {/* Cryptographic Receipt Badge */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Bukti Verifikasi Kriptografis (Anonymous Token):</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">TERVALIDASI</span>
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 truncate">
                {receiptToken}
              </div>
              <p className="text-[11px] text-slate-400">
                Kode ini menjamin suara sah Anda telah tercatat tanpa membocorkan kandidat yang Anda pilih.
              </p>
            </div>

            {/* Auto Logout Countdown */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-3 text-amber-700 dark:text-amber-300">
              <Clock className="w-5 h-5 animate-spin" />
              <span className="text-xs sm:text-sm font-semibold">
                Sistem akan kembali ke layar login pemilih berikutnya dalam <strong>{countdown} detik</strong>
              </span>
            </div>

            <button
              onClick={handleManualReset}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Selesai Lebih Cepat (Pemilih Berikutnya)</span>
            </button>
          </div>
        )}
      </div>

      {/* CONFIRMATION POP-UP MODAL */}
      {isConfirmModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Konfirmasi Pilihan Suara
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Apakah Anda yakin dengan pilihan pasangan calon berikut?
              </p>
            </div>

            {/* Candidate Card in Confirmation */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-4 text-left">
              <img
                src={selectedCandidate.photoUrl}
                alt={selectedCandidate.chairmanName}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const fallback = selectedCandidate.ballotNumber === 1 ? 'https://i.imgur.com/1DgzXJS.png' : selectedCandidate.ballotNumber === 2 ? 'https://i.imgur.com/M7UEbFI.png' : 'https://i.imgur.com/RHR5Hln.png';
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                className="w-16 h-20 rounded-xl object-cover object-top border border-slate-200 shrink-0"
              />
              <div className="space-y-1">
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white">
                  PASLON #{selectedCandidate.ballotNumber}
                </span>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {selectedCandidate.chairmanName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Wakil: {selectedCandidate.viceChairmanName}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium text-left">
              ⚠️ <strong>PENTING:</strong> Pilihan tidak dapat diubah setelah tombol konfirmasi ditekan. Token PIN Anda akan langsung hangus.
            </div>

            {/* Confirmation Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm cursor-pointer"
              >
                Kembali / Periksa
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleConfirmVote}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Menyimpan...' : 'Ya, Kirim Suara!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
