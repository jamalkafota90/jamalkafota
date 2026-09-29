import React, { useState } from 'react';
import { PRD_DOCUMENT, POSTGRES_DDL_SCHEMA } from '../../lib/prdData';
import { BookOpen, Copy, Check, ShieldCheck, Database, Layers, FileCode } from 'lucide-react';
import { sound } from '../../lib/audio';

export const PrdDocModal: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'prd' | 'ddl' | 'security'>('prd');

  const handleCopyDdl = () => {
    sound.playClickTick();
    navigator.clipboard.writeText(POSTGRES_DDL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {PRD_DOCUMENT.version} &bull; Enterprise Architecture
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
            {PRD_DOCUMENT.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {PRD_DOCUMENT.subtitle} &bull; {PRD_DOCUMENT.targetInstitution}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyDdl}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Skema SQL (DDL)'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('prd')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'prd'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Product Requirements Document (PRD)</span>
        </button>

        <button
          onClick={() => setActiveTab('ddl')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'ddl'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Skema PostgreSQL / Supabase DDL</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Matriks Keamanan &amp; LUBER-JURDIL</span>
        </button>
      </div>

      {/* TAB 1: PRD DOCUMENT */}
      {activeTab === 'prd' && (
        <div className="space-y-6">
          {/* 4 Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRD_DOCUMENT.pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2"
              >
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{pillar.title}</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Role Access Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Matriks Hak Akses Pengguna (3 Tingkatan Otorisasi)
              </h3>
              <p className="text-xs text-slate-500">
                Pemisahan tanggung jawab (Separation of Concerns) demi integritas suara sekolah.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PRD_DOCUMENT.roleMatrix.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {item.scope}
                      </span>
                      <h4 className="font-black text-base text-slate-900 dark:text-white">
                        {item.role}
                      </h4>
                    </div>

                    <div>
                      <h5 className="text-[11px] font-bold text-emerald-600 uppercase mb-1">
                        Hak Akses (Permissions):
                      </h5>
                      <ul className="space-y-1">
                        {item.permissions.map((p, pIdx) => (
                          <li key={pIdx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold shrink-0">&bull;</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[11px] font-bold text-rose-600 uppercase mb-1">
                      Batasan Ketat (Restrictions):
                    </h5>
                    <ul className="space-y-1">
                      {item.restrictions.map((r, rIdx) => (
                        <li key={rIdx} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold shrink-0">&times;</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POSTGRESQL / SUPABASE DDL */}
      {activeTab === 'ddl' && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 text-slate-200 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-blue-400" />
              <h3 className="font-mono text-sm font-bold text-white">schema.sql (Production Ready)</h3>
            </div>
            <button
              onClick={handleCopyDdl}
              className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Copy SQL'}</span>
            </button>
          </div>

          <pre className="font-mono text-xs text-slate-300 overflow-x-auto p-4 bg-slate-900 rounded-2xl max-h-[600px] leading-relaxed">
            {POSTGRES_DDL_SCHEMA}
          </pre>
        </div>
      )}

      {/* TAB 3: SECURITY & TAMPER-PROOFING */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Prinsip Dekopel Suara (Decoupled Anonymous Ballot Architecture)
            </h3>
            <p className="text-xs text-slate-500">
              Bagaimana sistem memastikan kerahasiaan pilihan siswa tetap terjamin 100% bahkan jika database diakses langsung oleh operator IT.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3">
            <h4 className="font-bold text-blue-800 dark:text-blue-300">
              Pemisahan Tabel Voters vs Tabel Votes:
            </h4>
            <p>
              Dalam sistem konvensional yang rentan, tabel pilihan suara seringkali menyimpan <code>voter_id</code> sebagai kunci asing. Hal ini membuka celah di mana siapa pun yang memiliki akses ke database dapat mengetahui paslon mana yang dicoblos oleh siswa tertentu.
            </p>
            <p>
              Pada <strong>E-Pilketos Enterprise</strong>, tabel <code>votes</code> sama sekali tidak memiliki relasi atau kunci asing ke <code>voters</code>. Ketika transaksi bilik suara dijalankan via fungsi atomik (Stored Procedure):
            </p>
            <ol className="list-decimal pl-5 space-y-1 font-mono text-xs">
              <li>Status pemilih diubah: <code>UPDATE voters SET has_voted = TRUE, pin_hash = 'INVALIDATED'</code></li>
              <li>Pilihan dicatat secara terpisah: <code>INSERT INTO votes (candidate_id, tamper_checksum)</code></li>
              <li>Sistem mengembalikan tanda bukti kriptografis anonim kepada pemilih tanpa merekam kaitan pilihan.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
