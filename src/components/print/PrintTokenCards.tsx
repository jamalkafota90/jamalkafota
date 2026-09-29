import React, { useEffect, useState } from 'react';
import { SchoolConfig, ElectionPeriod, Voter } from '../../types/election';
import { generateQrDataUrl } from '../../lib/security';
import { Printer, X, Filter } from 'lucide-react';
import { sound } from '../../lib/audio';

interface PrintTokenCardsProps {
  school: SchoolConfig;
  period: ElectionPeriod | null;
  voters: Voter[];
  onClose: () => void;
}

export const PrintTokenCards: React.FC<PrintTokenCardsProps> = ({
  school,
  period,
  voters,
  onClose
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});

  // Get distinct classes
  const classes = Array.from(new Set(voters.map(v => v.className))).sort();

  const filteredVoters = voters.filter(v => {
    if (selectedClass === 'ALL') return true;
    return v.className === selectedClass;
  });

  // Generate QR codes for visible voters (contains NISN:PIN)
  useEffect(() => {
    let isMounted = true;
    const loadQrs = async () => {
      const urls: Record<string, string> = {};
      for (const v of filteredVoters.slice(0, 100)) {
        const payload = `EPILKETOS|${v.nisn}|${v.plainPinPreview || 'PIN'}`;
        const dataUrl = await generateQrDataUrl(payload);
        if (isMounted) {
          urls[v.id] = dataUrl;
        }
      }
      if (isMounted) {
        setQrCodeUrls(urls);
      }
    };
    loadQrs();
    return () => {
      isMounted = false;
    };
  }, [filteredVoters]);

  const handlePrint = () => {
    sound.playClickTick();
    window.print();
  };

  const isOSIM = school.type === 'OSIM';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md overflow-y-auto p-4 sm:p-8">
      {/* Print Control Toolbar - Hidden on Print */}
      <div className="max-w-6xl mx-auto mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Cetak Kartu Token Pemilih (Layout Siap Potong)
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredVoters.length} kartu suara &bull; Format 6 kartu per lembar A4
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">Semua Kelas ({classes.length})</option>
              {classes.map(c => (
                <option key={c} value={c}>Kelas {c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Sekarang (Print / PDF)</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="max-w-6xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-2xl print:p-0 print:shadow-none print:bg-white text-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
          {filteredVoters.map((voter) => (
            <div
              key={voter.id}
              className="border-2 border-dashed border-slate-400 rounded-2xl p-4 bg-white flex flex-col justify-between print-avoid-break relative"
              style={{ minHeight: '230px' }}
            >
              {/* Card Header with School Name & Logo */}
              <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-2">
                <div className="flex items-center space-x-2">
                  {school.logoUrl && (
                    <img
                      src={school.logoUrl}
                      alt={school.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                      className="w-8 h-8 rounded-md object-contain"
                    />
                  )}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-tight text-slate-900 leading-tight">
                      {school.name}
                    </h4>
                    <p className="text-[9px] font-bold text-blue-700 uppercase">
                      KARTU SUARA &bull; {isOSIM ? 'OSIM' : 'OSIS'} {period?.academicYear || '2026/2027'}
                    </p>
                  </div>
                </div>

                <div className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300">
                  {voter.className}
                </div>
              </div>

              {/* Student Details & Credentials */}
              <div className="flex items-center justify-between gap-2 my-auto">
                <div className="space-y-1">
                  <div className="text-[9px] uppercase font-bold text-slate-400">Nama Pemilih:</div>
                  <div className="text-xs font-black text-slate-900 leading-tight">
                    {voter.fullName}
                  </div>

                  <div className="pt-1 flex items-center gap-3">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">USERNAME LOGIN:</span>
                      <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        {voter.username || voter.nisn}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">NISN:</span>
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {voter.nisn}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">PIN RAHASIA:</span>
                    <span className="font-mono text-sm font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 tracking-widest inline-block">
                      {voter.plainPinPreview || '••••••'}
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="shrink-0 text-center">
                  {qrCodeUrls[voter.id] ? (
                    <img
                      src={qrCodeUrls[voter.id]}
                      alt="QR Token"
                      className="w-20 h-20 border border-slate-300 p-0.5 rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400 border border-slate-300">
                      QR Code
                    </div>
                  )}
                  <span className="text-[8px] text-slate-400 block mt-0.5 font-mono">Scan Bilik</span>
                </div>
              </div>

              {/* Card Footer Rules */}
              <div className="pt-2 border-t border-slate-200 text-[8px] text-slate-500 flex justify-between items-center">
                <span>*Akses masuk bilik suara menggunakan Username &amp; PIN. Hanya 1x pakai.</span>
                <span className="font-bold text-slate-700">PANITIA KPO</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
