/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ViewTab } from './types/election';
import { electionStore } from './lib/storage';
import { Navbar } from './components/navbar/Navbar';
import { QuickCountView } from './components/public/QuickCountView';
import { BilikSuaraKiosk } from './components/voting/BilikSuaraKiosk';
import { PanitiaDashboard } from './components/panitia/PanitiaDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PrintTokenCards } from './components/print/PrintTokenCards';
import { PrintBahpModal } from './components/print/PrintBahpModal';
import { PrdDocModal } from './components/prd/PrdDocModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('public');
  const [storeTick, setStoreTick] = useState(0);

  // Subscribe to real-time store changes
  useEffect(() => {
    const unsubscribe = electionStore.subscribe(() => {
      setStoreTick((t) => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const school = electionStore.getSchoolConfig();
  const periods = electionStore.getPeriods();
  const activePeriod = electionStore.getActivePeriod();

  // Active / selected period for viewing
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    activePeriod?.id || periods[0]?.id || 'period-2026'
  );

  // Keep selected period synced if periods change
  useEffect(() => {
    if (!periods.some(p => p.id === selectedPeriodId) && periods[0]) {
      setSelectedPeriodId(periods[0].id);
    }
  }, [periods, selectedPeriodId]);

  const candidates = electionStore.getCandidates(selectedPeriodId);
  const voters = electionStore.getVoters(selectedPeriodId);
  const quickCount = electionStore.getQuickCount(selectedPeriodId);
  const turnout = electionStore.getTurnoutStats(selectedPeriodId);
  const committees = electionStore.getCommittees(selectedPeriodId);
  const auditLogs = electionStore.getAuditLogs();

  // Print Modals
  const [isPrintCardsOpen, setIsPrintCardsOpen] = useState(false);
  const [isBahpOpen, setIsBahpOpen] = useState(false);

  const selectedPeriod = periods.find(p => p.id === selectedPeriodId) || activePeriod;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        school={school}
        activePeriod={activePeriod}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'public' && (
          <QuickCountView
            school={school}
            periods={periods}
            selectedPeriodId={selectedPeriodId}
            onSelectPeriod={setSelectedPeriodId}
            candidates={candidates}
            quickCount={quickCount}
            turnout={turnout}
            onOpenKiosk={() => setCurrentTab('kiosk')}
          />
        )}

        {currentTab === 'kiosk' && (
          <BilikSuaraKiosk
            school={school}
            activePeriod={activePeriod}
            candidates={electionStore.getCandidates(activePeriod?.id)}
            onVoteSuccessDone={() => {
              // Return to public quick count or stay in kiosk for next student
            }}
          />
        )}

        {currentTab === 'panitia' && (
          <PanitiaDashboard
            school={school}
            activePeriod={selectedPeriod}
            candidates={candidates}
            voters={voters}
            onOpenPrintCards={() => setIsPrintCardsOpen(true)}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            school={school}
            periods={periods}
            committees={committees}
            auditLogs={auditLogs}
            onOpenBahp={() => setIsBahpOpen(true)}
          />
        )}

        {currentTab === 'prd' && <PrdDocModal />}
      </main>

      {/* Modal: Cetak Kartu Token Pemilih */}
      {isPrintCardsOpen && (
        <PrintTokenCards
          school={school}
          period={selectedPeriod}
          voters={voters}
          onClose={() => setIsPrintCardsOpen(false)}
        />
      )}

      {/* Modal: Berita Acara Hasil Pemilihan (BAHP) */}
      {isBahpOpen && (
        <PrintBahpModal
          school={school}
          period={selectedPeriod}
          candidates={candidates}
          quickCount={quickCount}
          turnout={turnout}
          committee={committees}
          onClose={() => setIsBahpOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-6 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {school.name} &bull; Sistem Pemilihan Suara Elektronik Terenkripsi (E-Pilketos / E-Pilkosim)
          </p>
          <p className="text-[11px] text-slate-400">
            Asas LUBER-JURDIL: Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil &bull; Standar Integritas Tanpa Kecurangan
          </p>
        </div>
      </footer>
    </div>
  );
}
