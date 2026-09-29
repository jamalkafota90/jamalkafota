import React from 'react';
import { 
  SchoolConfig, 
  ElectionPeriod, 
  Candidate, 
  QuickCountResult, 
  TurnoutStats, 
  Committee 
} from '../../types/election';
import { Printer, X, FileCheck, CheckCircle } from 'lucide-react';
import { sound } from '../../lib/audio';

interface PrintBahpModalProps {
  school: SchoolConfig;
  period: ElectionPeriod | null;
  candidates: Candidate[];
  quickCount: QuickCountResult[];
  turnout: TurnoutStats;
  committee: Committee[];
  onClose: () => void;
}

export const PrintBahpModal: React.FC<PrintBahpModalProps> = ({
  school,
  period,
  candidates,
  quickCount,
  turnout,
  committee,
  onClose
}) => {
  const handlePrint = () => {
    sound.playClickTick();
    window.print();
  };

  const isOSIM = school.type === 'OSIM';
  const orgName = isOSIM ? 'OSIM' : 'OSIS';
  const orgFullName = isOSIM ? 'Organisasi Siswa Intra Madrasah (OSIM)' : 'Organisasi Siswa Intra Sekolah (OSIS)';

  // Find winner
  const winner = quickCount.reduce((prev, curr) => (prev.voteCount > curr.voteCount) ? prev : curr, quickCount[0]);
  const winnerCandidate = candidates.find(c => c.id === winner?.candidateId);

  // Committee leaders
  const ketuaPanitia = committee.find(c => c.role === 'Ketua Panitia') || committee[0] || {
    memberName: 'Drs. Hendro Wibowo, M.Si.',
    skNumber: '421.3/089/SMAN1/SK-PILKETOS/2026'
  };

  const sekretaris = committee.find(c => c.role === 'Sekretaris') || {
    memberName: 'Siti Nurjanah, S.Pd.'
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md overflow-y-auto p-4 sm:p-8">
      {/* Control Bar */}
      <div className="max-w-4xl mx-auto mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 no-print">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Berita Acara Hasil Pemilihan (BAHP) Resmi
            </h3>
            <p className="text-xs text-slate-500">
              Dokumen pengesahan hukum hasil pemungutan suara masa bakti {period?.academicYear || '2026/2027'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Official Legal Document Paper (A4 Form) */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-2xl print:p-0 print:shadow-none text-slate-900 font-serif leading-relaxed text-xs sm:text-sm">
        {/* KOP SURAT RESMI */}
        <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 text-center relative">
          <div className="flex items-center justify-center space-x-4 mb-2">
            {school.logoUrl && (
              <img
                src={school.logoUrl}
                alt="Logo Sekolah"
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                className="w-16 h-16 object-contain rounded"
              />
            )}
            <div>
              <h2 className="text-xs sm:text-sm uppercase font-bold tracking-widest text-slate-600">
                PEMERINTAH DAERAH PROVINSI {school.province?.toUpperCase() || 'DKI JAKARTA'}
              </h2>
              <h1 className="text-base sm:text-xl uppercase font-black tracking-tight text-slate-950">
                {school.name.toUpperCase()}
              </h1>
              <p className="text-[11px] text-slate-600 not-italic font-sans">
                {school.address}, Kec. {school.district}, Kota {school.city} &bull; NPSN: {school.npsn}
              </p>
              <p className="text-[10px] text-slate-500 font-sans">
                Laman Resmi Pemilihan: https://pilketos-{school.npsn}.sch.id &bull; Surel: info@{school.npsn}.sch.id
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1 mb-6">
          <h3 className="text-base sm:text-lg font-black uppercase underline decoration-2 underline-offset-4 tracking-wider">
            BERITA ACARA HASIL PEMILIHAN KETUA DAN WAKIL KETUA {orgName}
          </h3>
          <p className="text-xs font-sans font-bold text-slate-700">
            Nomor: 421.3 / {Math.floor(Math.random() * 400 + 100)} / BA-PIL{orgName} / {new Date().getFullYear()}
          </p>
          <p className="text-[11px] font-sans text-slate-500">
            Masa Bakti Kepengurusan {period?.academicYear || '2026/2027'}
          </p>
        </div>

        {/* Legal Preamble */}
        <div className="space-y-3 text-justify">
          <p>
            Pada hari ini, <strong className="font-bold">{currentDate}</strong>, bertempat di Kampus {school.name}, Panitia Pemilihan Ketua dan Wakil Ketua {orgFullName} yang dibentuk berdasarkan Surat Keputusan Kepala Sekolah Nomor <strong className="font-mono">{ketuaPanitia.skNumber}</strong>, telah melaksanakan pemungutan dan penghitungan suara secara elektronik (E-Voting) berbasis asas Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil (LUBER-JURDIL).
          </p>

          <p>
            Berdasarkan audit rekaman sistem transaksi kotak suara terenkripsi dan verifikasi kehadiran bilik suara digital, diperoleh rekapitulasi akhir pemungutan suara sebagai berikut:
          </p>

          {/* Table: Summary of Turnout */}
          <div className="my-4 font-sans text-xs">
            <table className="w-full border-collapse border border-slate-400">
              <thead className="bg-slate-100 font-bold">
                <tr>
                  <th className="border border-slate-400 p-2 text-left">No.</th>
                  <th className="border border-slate-400 p-2 text-left">Uraian Rekapitulasi Pemilih</th>
                  <th className="border border-slate-400 p-2 text-right">Jumlah (Jiwa)</th>
                  <th className="border border-slate-400 p-2 text-right">Persentase (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-400 p-2">1</td>
                  <td className="border border-slate-400 p-2">Jumlah Pemilih Terdaftar dalam DPT</td>
                  <td className="border border-slate-400 p-2 text-right font-bold">{turnout.totalDpt}</td>
                  <td className="border border-slate-400 p-2 text-right">100.0%</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">2</td>
                  <td className="border border-slate-400 p-2 font-bold text-emerald-800">
                    Jumlah Pemilih yang Menggunakan Hak Suara (Suara Sah Masuk)
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-bold text-emerald-800">{turnout.totalVoted}</td>
                  <td className="border border-slate-400 p-2 text-right font-bold text-emerald-800">{turnout.percentageVoted}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">3</td>
                  <td className="border border-slate-400 p-2">Jumlah Pemilih yang Tidak Hadir / Belum Memilih</td>
                  <td className="border border-slate-400 p-2 text-right">{turnout.totalUnvoted}</td>
                  <td className="border border-slate-400 p-2 text-right">{turnout.percentageUnvoted}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            Rincian perolehan suara sah masing-masing Pasangan Calon Ketua dan Wakil Ketua {orgName} adalah sebagai berikut:
          </p>

          {/* Table: Candidate Votes Breakdown */}
          <div className="my-4 font-sans text-xs">
            <table className="w-full border-collapse border border-slate-400">
              <thead className="bg-slate-100 font-bold">
                <tr>
                  <th className="border border-slate-400 p-2 text-center">No. Urut</th>
                  <th className="border border-slate-400 p-2 text-left">Nama Pasangan Calon (Ketua &amp; Wakil)</th>
                  <th className="border border-slate-400 p-2 text-right">Perolehan Suara</th>
                  <th className="border border-slate-400 p-2 text-right">Persentase (%)</th>
                  <th className="border border-slate-400 p-2 text-center">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {quickCount.map((item) => {
                  const isTop = item.candidateId === winner?.candidateId && item.voteCount > 0;
                  return (
                    <tr key={item.candidateId} className={isTop ? 'bg-emerald-50/60 font-bold' : ''}>
                      <td className="border border-slate-400 p-2 text-center">
                        #{String(item.ballotNumber).padStart(2, '0')}
                      </td>
                      <td className="border border-slate-400 p-2">
                        {item.chairmanName} &amp; {item.viceChairmanName}
                      </td>
                      <td className="border border-slate-400 p-2 text-right font-mono">
                        {item.voteCount.toLocaleString('id-ID')}
                      </td>
                      <td className="border border-slate-400 p-2 text-right font-mono">
                        {item.percentage}%
                      </td>
                      <td className="border border-slate-400 p-2 text-center">
                        {isTop ? 'TERPILIH' : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Proclamation of Winner */}
          {winnerCandidate && winner && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 font-sans my-4">
              <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider mb-1">
                PENETAPAN PASANGAN CALON TERPILIH:
              </h4>
              <p className="text-xs leading-relaxed">
                Menetapkan Pasangan Calon Nomor Urut <strong>{winnerCandidate.ballotNumber}</strong> atas nama{' '}
                <strong>{winnerCandidate.chairmanName}</strong> (Ketua) dan{' '}
                <strong>{winnerCandidate.viceChairmanName}</strong> (Wakil Ketua) sebagai Pasangan Calon Terpilih Ketua dan Wakil Ketua {orgFullName} Periode {period?.academicYear || '2026/2027'} dengan perolehan suara sah sebanyak <strong>{winner.voteCount} suara ({winner.percentage}%)</strong>.
              </p>
            </div>
          )}

          <p>
            Demikian Berita Acara ini dibuat dengan sebenarnya dan penuh tanggung jawab untuk dipergunakan sebagaimana mestinya dan disahkan oleh Kepala Satuan Pendidikan.
          </p>
        </div>

        {/* Signature Blocks */}
        <div className="grid grid-cols-2 gap-8 pt-8 font-sans text-xs text-center">
          {/* Ketua Panitia */}
          <div className="space-y-16">
            <div>
              <p className="font-bold">Ketua Panitia Pemilihan,</p>
              <p className="text-[11px] text-slate-500">KPO / KPPS {orgName}</p>
            </div>

            <div>
              <div className="w-24 h-12 border-b border-slate-400 mx-auto flex items-center justify-center text-slate-300 font-mono text-[10px]">
                [Tanda Tangan Digital]
              </div>
              <p className="font-bold underline text-slate-900 mt-1">{ketuaPanitia.memberName}</p>
              <p className="text-[10px] text-slate-500">NIP/ID: Operator Panitia</p>
            </div>
          </div>

          {/* Kepala Sekolah */}
          <div className="space-y-16">
            <div>
              <p className="font-bold">Mengesahkan,</p>
              <p className="text-[11px] text-slate-500">Kepala {school.name}</p>
            </div>

            <div>
              <div className="w-24 h-12 border-b border-slate-400 mx-auto flex items-center justify-center text-slate-300 font-mono text-[10px]">
                [Stempel &amp; Tanda Tangan]
              </div>
              <p className="font-bold underline text-slate-900 mt-1">{school.principalName}</p>
              <p className="text-[10px] text-slate-500">NIP: {school.principalNip}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
