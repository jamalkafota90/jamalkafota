import React from 'react';
import { ViewTab, SchoolConfig, ElectionPeriod } from '../../types/election';
import { 
  BarChart3, 
  Vote, 
  Users, 
  ShieldCheck, 
  BookOpen, 
  School,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';
import { sound } from '../../lib/audio';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  school: SchoolConfig;
  activePeriod: ElectionPeriod | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  school,
  activePeriod
}) => {
  const handleNav = (tab: ViewTab) => {
    sound.playClickTick();
    onSelectTab(tab);
  };

  const isOSIM = school.type === 'OSIM';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & School Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNav('public')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white p-1 shadow-md flex items-center justify-center overflow-hidden border border-slate-700/60 shrink-0">
              {school.logoUrl ? (
                <img 
                  src={school.logoUrl} 
                  alt={school.name} 
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                  className="w-full h-full object-contain"
                />
              ) : (
                <School className="w-6 h-6 text-slate-700" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                  E-PILKETOS <span className="text-blue-400">SMP 90</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isOSIM 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {school.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
                {school.name} &bull; NPSN: {school.npsn}
              </p>
            </div>
          </div>

          {/* Active Period Status Pill */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                activePeriod?.status === 'aktif' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                activePeriod?.status === 'aktif' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {activePeriod ? activePeriod.academicYear : 'Tidak Ada Periode Aktif'}
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              ({activePeriod?.status === 'aktif' ? 'Pemilihan Berlangsung' : 'Arsip/Ditutup'})
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => handleNav('public')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'public'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Count</span>
            </button>

            <button
              onClick={() => handleNav('kiosk')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all relative ${
                currentTab === 'kiosk'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30'
              }`}
            >
              <Vote className="w-4 h-4 animate-pulse" />
              <span>Bilik Suara</span>
            </button>

            <button
              onClick={() => handleNav('panitia')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'panitia'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Panitia KPO</span>
            </button>

            <button
              onClick={() => handleNav('admin')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden md:inline">Admin Sekolah</span>
            </button>

            <button
              onClick={() => handleNav('prd')}
              className={`flex items-center space-x-1 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentTab === 'prd'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Product Requirements Document & SQL Schema"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden xl:inline text-xs font-mono">PRD &amp; DDL</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
