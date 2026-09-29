import React, { useState, useEffect, useRef } from 'react';
import { 
  Candidate, 
  AnonymousVote, 
  SchoolConfig 
} from '../../types/election';
import { sound } from '../../lib/audio';
import { electionStore } from '../../lib/storage';
import { 
  X, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Award, 
  Vote, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  FileCheck,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

interface LiveTally1By1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodId: string;
  periodName: string;
  candidates: Candidate[];
  school: SchoolConfig;
  onResetVotesNeeded?: () => void;
}

export const LiveTally1By1Modal: React.FC<LiveTally1By1ModalProps> = ({
  isOpen,
  onClose,
  periodId,
  periodName,
  candidates,
  school,
  onResetVotesNeeded
}) => {
  const [votes, setVotes] = useState<AnonymousVote[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load votes whenever modal opens or period changes
  useEffect(() => {
    if (isOpen) {
      const currentVotes = electionStore.getVotes(periodId);
      setVotes(currentVotes);
      setCurrentIndex(-1);
      setIsPlaying(false);
      setIsFinished(false);
      setSpeechBubbleText(null);
    }
  }, [isOpen, periodId]);

  // Clean timer on unmount or close
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Web Speech API Voice synthesis helper
  const speakAnnouncement = (text: string) => {
    if (!isAudioEnabled || typeof window === 'undefined') return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // cancel previous speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = speed === 'fast' ? 1.2 : speed === 'slow' ? 0.9 : 1.0;
        utterance.pitch = 1.0;
        
        // Try finding Indonesian voice if available
        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
        if (idVoice) {
          utterance.voice = idVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // SpeechSynthesis fails gracefully
    }
  };

  // Compute tallied scores up to currentIndex
  const readVotes = votes.slice(0, currentIndex + 1);
  const totalReadCount = readVotes.length;

  const tallyScores = candidates.map(c => {
    const count = readVotes.filter(v => v.candidateId === c.id).length;
    const percentage = totalReadCount > 0 ? Number(((count / totalReadCount) * 100).toFixed(1)) : 0;
    return {
      candidate: c,
      count,
      percentage
    };
  }).sort((a, b) => b.count - a.count);

  const highestScore = tallyScores[0];
  const currentVote = currentIndex >= 0 && currentIndex < votes.length ? votes[currentIndex] : null;
  const currentCandidate = currentVote ? candidates.find(c => c.id === currentVote.candidateId) : null;

  // Read next vote function
  const readNextVote = () => {
    if (votes.length === 0) return;

    if (currentIndex + 1 < votes.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextVote = votes[nextIdx];
      const cand = candidates.find(c => c.id === nextVote.candidateId);

      if (cand) {
        sound.playTallyDing(cand.ballotNumber);
        const speech = `Surat suara ke-${nextIdx + 1}. Sah untuk pasangan calon nomor urut ${cand.ballotNumber}, ${cand.chairmanName}!`;
        setSpeechBubbleText(`"Surat suara #${nextIdx + 1}: SAH untuk Paslon ${String(cand.ballotNumber).padStart(2, '0')} (${cand.chairmanName})!"`);
        speakAnnouncement(speech);
      }

      if (nextIdx + 1 === votes.length) {
        setIsFinished(true);
        setIsPlaying(false);
        setTimeout(() => {
          sound.playVoteSuccess();
          const winText = `Penghitungan suara selesai! Total ${votes.length} suara sah telah dibacakan.`;
          speakAnnouncement(winText);
        }, 1200);
      }
    } else {
      setIsPlaying(false);
      setIsFinished(true);
    }
  };

  // Handle Autoplay Loop
  useEffect(() => {
    if (isPlaying && !isFinished) {
      const delay = speed === 'fast' ? 1400 : speed === 'slow' ? 3800 : 2400;
      timerRef.current = setInterval(() => {
        readNextVote();
      }, delay);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentIndex, isFinished, speed, votes]);

  const handleTogglePlay = () => {
    sound.playClickTick();
    if (isFinished) {
      handleRestart();
      setIsPlaying(true);
      return;
    }
    if (currentIndex === -1) {
      readNextVote();
    }
    setIsPlaying(!isPlaying);
  };

  const handleManualNext = () => {
    sound.playClickTick();
    if (isPlaying) setIsPlaying(false);
    readNextVote();
  };

  const handleRestart = () => {
    sound.playClickTick();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
    setIsFinished(false);
    setCurrentIndex(-1);
    setSpeechBubbleText(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleGenerateSimulationVotes = () => {
    sound.playVoteSuccess();
    const added = electionStore.seedSimulationVotes(periodId, 10);
    const updatedVotes = electionStore.getVotes(periodId);
    setVotes(updatedVotes);
    handleRestart();
  };

  const handleResetForTesting = () => {
    if (confirm('Reset seluruh suara ujicoba ke 0 agar pemilu bersih kembali?')) {
      electionStore.resetElectionVotes(periodId);
      setVotes([]);
      handleRestart();
      sound.playClickTick();
      if (onResetVotesNeeded) onResetVotesNeeded();
    }
  };

  if (!isOpen) return null;

  // Helper to draw turus (tally marks) in Indonesian election style
  const renderTurus = (count: number) => {
    if (count === 0) return <span className="text-slate-400 text-xs italic">Belum ada suara</span>;
    const bundles = Math.floor(count / 5);
    const remainder = count % 5;
    const bundleElements = [];

    for (let i = 0; i < bundles; i++) {
      bundleElements.push(
        <span key={`b-${i}`} className="inline-block px-1.5 py-0.5 font-mono text-sm font-extrabold tracking-tighter bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded border border-amber-300/60 line-through">
          ||||
        </span>
      );
    }

    if (remainder > 0) {
      bundleElements.push(
        <span key="rem" className="inline-block px-1.5 py-0.5 font-mono text-sm font-extrabold tracking-tighter bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded border border-blue-300/60">
          {'|'.repeat(remainder)}
        </span>
      );
    }

    return <div className="flex flex-wrap items-center gap-1">{bundleElements}</div>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full text-white shadow-2xl overflow-hidden my-4 flex flex-col max-h-[96vh]">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Vote className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Simulasi Pembacaan KPPS
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                  {school.name}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white leading-tight mt-0.5">
                Mode Pembacaan Suara 1 per 1 (Live Tally)
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Empty State if No Votes */}
        {votes.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Vote className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Kotak Suara Masih Kosong</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Belum ada surat suara yang masuk untuk periode <strong className="text-white">{periodName}</strong>. 
              Untuk mencoba sensasi suara terbaca 1 per 1, Anda dapat mengisi simulasi suara ujicoba secara instan.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleGenerateSimulationVotes}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Isi 10 Suara Ujicoba (Auto-Vote)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* Control Bar & Progress Status */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-semibold text-slate-300">
                  Kemajuan Pembacaan:
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-extrabold text-sm sm:text-base font-mono">
                  {currentIndex + 1} / {votes.length}
                </span>
                <span className="text-xs text-slate-400">
                  Surat Suara Sah
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Audio Toggle */}
                <button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    isAudioEnabled 
                      ? 'bg-blue-600/30 border-blue-500/50 text-blue-300' 
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title={isAudioEnabled ? 'Suara Aktif (Voice ON)' : 'Suara Bisu (Muted)'}
                >
                  {isAudioEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isAudioEnabled ? 'Suara ON' : 'Mute'}</span>
                </button>

                {/* Speed Selector */}
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setSpeed('slow')}
                    className={`px-2 py-1 rounded-lg font-medium transition ${speed === 'slow' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Lambat
                  </button>
                  <button
                    onClick={() => setSpeed('normal')}
                    className={`px-2 py-1 rounded-lg font-medium transition ${speed === 'normal' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setSpeed('fast')}
                    className={`px-2 py-1 rounded-lg font-medium transition ${speed === 'fast' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Cepat
                  </button>
                </div>

                {/* Play / Pause Autoplay */}
                <button
                  onClick={handleTogglePlay}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-md transition cursor-pointer ${
                    isPlaying 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Jeda</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>{currentIndex >= 0 && !isFinished ? 'Lanjutkan' : isFinished ? 'Putar Ulang' : 'Mulai Baca Otomatis'}</span>
                    </>
                  )}
                </button>

                {/* Manual Next */}
                <button
                  onClick={handleManualNext}
                  disabled={isFinished}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer"
                  title="Buka surat suara berikutnya secara manual (gaya KPPS)"
                >
                  <SkipForward className="w-4 h-4" />
                  <span className="hidden sm:inline">Buka Berikutnya</span>
                </button>

                {/* Restart */}
                <button
                  onClick={handleRestart}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Ulangi dari surat suara pertama"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Central Stage: Animated Ballot Reveal + Audio Speech Bubble */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Realistic Ballot Paper Being Read (5 Cols) */}
              <div className="lg:col-span-5 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div>
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Surat Suara Digital #{currentIndex + 1 > 0 ? currentIndex + 1 : '—'}
                      </span>
                    </div>
                    {currentCandidate && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-extrabold uppercase animate-pulse">
                        ✓ SAH
                      </span>
                    )}
                  </div>

                  {/* Active Ballot Display */}
                  {currentCandidate ? (
                    <div className="space-y-4">
                      {/* Candidate Card on Ballot */}
                      <div className="bg-white dark:bg-slate-900 border-2 border-amber-400/80 rounded-2xl p-4 shadow-lg text-slate-900 dark:text-white relative">
                        {/* Stamp Effect */}
                        <div className="absolute -top-3 -right-2 rotate-12 px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md border border-white">
                          Coblosan Sah
                        </div>

                        <div className="flex gap-4 items-center">
                          {/* Ballot Number Big Circle */}
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow border-2 border-amber-400">
                            {String(currentCandidate.ballotNumber).padStart(2, '0')}
                          </div>

                          {/* Candidate Photo */}
                          <div className="w-16 h-20 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
                            <img
                              src={currentCandidate.photoUrl}
                              alt={currentCandidate.chairmanName}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const fallback = currentCandidate.ballotNumber === 1 ? 'https://i.imgur.com/1DgzXJS.png' : currentCandidate.ballotNumber === 2 ? 'https://i.imgur.com/M7UEbFI.png' : 'https://i.imgur.com/RHR5Hln.png';
                                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                              }}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-black text-base sm:text-lg leading-tight text-slate-900 dark:text-white">
                              {currentCandidate.chairmanName}
                            </h4>
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                              &amp; {currentCandidate.viceChairmanName}
                            </p>
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              Kelas: {currentCandidate.chairmanClass} &bull; {currentCandidate.viceChairmanClass}
                            </span>
                          </div>
                        </div>

                        {/* Punch mark visual */}
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Stempel Verifikasi:</span>
                          <span className="font-mono text-[11px] text-emerald-500 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {currentVote?.tamperChecksum || 'VERIFIED-LUBER'}
                          </span>
                        </div>
                      </div>

                      {/* Live Speech Announcement Bubble */}
                      {speechBubbleText && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-semibold flex items-start gap-2.5 animate-bounce">
                          <Volume2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{speechBubbleText}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-slate-500 flex items-center justify-center mx-auto">
                        <Vote className="w-7 h-7" />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 font-medium">
                        Tekan tombol <strong>"Mulai Baca Otomatis"</strong> atau <strong>"Buka Berikutnya"</strong> untuk membuka amplop surat suara satu per satu.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Controls for Testing */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sensasi TPS Asli</span>
                  <button
                    onClick={handleResetForTesting}
                    className="text-rose-400 hover:text-rose-300 font-semibold underline text-xs cursor-pointer"
                  >
                    Reset Suara Ujicoba
                  </button>
                </div>
              </div>

              {/* Right Column: Live Tally Sheet (Papan Turus Real-time) (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-800/60 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-400" />
                      <h3 className="font-extrabold text-base sm:text-lg text-white">
                        Papan Rekapitulasi Suara (Tally Turus)
                      </h3>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                      Total Sah: <strong className="text-amber-400">{totalReadCount}</strong> / {votes.length}
                    </span>
                  </div>

                  {/* Candidate Tally Rows */}
                  <div className="space-y-4">
                    {tallyScores.map(({ candidate, count, percentage }, idx) => {
                      const isLeading = totalReadCount > 0 && count === highestScore.count && count > 0;
                      const isCurrentVoteCand = currentCandidate?.id === candidate.id;

                      return (
                        <div
                          key={candidate.id}
                          className={`p-4 rounded-2xl border transition-all duration-300 ${
                            isCurrentVoteCand 
                              ? 'bg-blue-950/60 border-blue-400 shadow-md ring-2 ring-blue-500/30' 
                              : 'bg-slate-900/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center border border-slate-700">
                                #{String(candidate.ballotNumber).padStart(2, '0')}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                                    {candidate.chairmanName} &amp; {candidate.viceChairmanName}
                                  </h4>
                                  {isLeading && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                      <Award className="w-3 h-3" />
                                      Memimpin
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  Paslon {candidate.ballotNumber} &bull; {candidate.chairmanClass}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                                {count} <span className="text-xs font-semibold text-slate-400">suara</span>
                              </span>
                              <div className="text-[11px] font-bold text-slate-300">
                                {percentage}%
                              </div>
                            </div>
                          </div>

                          {/* Turus Display */}
                          <div className="mb-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800 min-h-[32px] flex items-center">
                            {renderTurus(count)}
                          </div>

                          {/* Dynamic Progress Bar */}
                          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                candidate.ballotNumber === 1 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                                  : candidate.ballotNumber === 2 
                                  ? 'bg-gradient-to-r from-indigo-500 to-blue-400' 
                                  : 'bg-gradient-to-r from-amber-500 to-orange-400'
                              }`}
                              style={{ width: `${percentage > 0 ? percentage : 1}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grand Finale Banner */}
                {isFinished && (
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border border-amber-400/50 text-center space-y-2 animate-pulse">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase shadow">
                      <Sparkles className="w-3.5 h-3.5" />
                      Penghitungan Selesai Resmi
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-white">
                      Perolehan Tertinggi: {highestScore?.candidate.chairmanName} &amp; {highestScore?.candidate.viceChairmanName}
                    </h4>
                    <p className="text-xs text-slate-300">
                      Dengan total <strong className="text-amber-300">{highestScore?.count} suara ({highestScore?.percentage}%)</strong> dari {votes.length} suara sah masuk.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Count Reset Info Card */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>
                  Mode Uji Coba: Anda dapat melakukan simulasi berkali-kali untuk gladi bersih sebelum pemungutan suara resmi berlangsung.
                </span>
              </div>
              <button
                onClick={handleGenerateSimulationVotes}
                className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shrink-0 cursor-pointer"
              >
                + Tambah 10 Suara Ujicoba
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Sistem E-PILKETOS SMP 90 &bull; Transparan &amp; LUBER JURDIL</span>
          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
          >
            Tutup Jendela
          </button>
        </div>

      </div>
    </div>
  );
};
