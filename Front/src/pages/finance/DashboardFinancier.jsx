import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Download, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import KpiFinance from './components/KpiFinance';
import EvolutionRecettes from './components/EvolutionRecettes';
import RecetteDepense from './components/RecetteDepense';
import TypeDepenses from './components/TypeDepenses';
import dashboardFinancierService from '../../services/DashboardFinancierService';
import { extractApiErrorMessage } from '../../utils/frontendApiAdapters';

const DashboardFinancier = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await dashboardFinancierService.getDashboard();
      setDashboard(response.data || response);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, 'Impossible de charger le tableau de bord financier.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard() }, []);

  const monthly = dashboard?.monthly || [];
  const labels = monthly.map((item) => item.label);
  const recettes = monthly.map((item) => Number(item.recettes || 0));
  const depenses = monthly.map((item) => Number(item.depenses || 0));
  const net = monthly.map((item) => Number(item.net || 0));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-500">
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Tableau de Bord Financier</h1>
            <p className="text-xs text-[var(--fg-muted)]">Aperçu en temps réel de votre situation financière</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadDashboard} disabled={loading} className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-all disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
          <button className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25 transition-all hover:-translate-y-px">
            <Download size={16} /> Exporter
          </button>
        </div>
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-medium">
              <AlertTriangle size={18} />
              {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-32 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="h-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl xl:col-span-3" />
            <div className="h-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl xl:col-span-2" />
            <div className="h-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl xl:col-span-1" />
          </div>
        </div>
      ) : (
        <>
          <KpiFinance kpi={dashboard?.kpi} />

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Evolution des recettes (Full Width on XL) */}
            <div className="xl:col-span-3 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] flex flex-col">
              <h3 className="font-bold text-[var(--fg)] text-lg mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500" /> Évolution des recettes</h3>
              <div className="flex-1 min-h-[300px] w-full">
                <EvolutionRecettes labels={labels} dataRecette={recettes} />
              </div>
            </div>

            {/* Recettes vs Dépenses */}
            <div className="xl:col-span-2 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] flex flex-col">
              <h3 className="font-bold text-[var(--fg)] text-lg mb-4 flex items-center gap-2"><ArrowLeftRight size={18} className="text-indigo-500" /> Recettes vs Dépenses</h3>
              <div className="flex-1 min-h-[300px] w-full">
                <RecetteDepense labels={labels} dataRecettes={recettes} dataDepenses={depenses} dataNet={net} />
              </div>
            </div>

            {/* Types de dépenses */}
            <div className="xl:col-span-1 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] flex flex-col">
              <h3 className="font-bold text-[var(--fg)] text-lg mb-4 flex items-center gap-2"><Wallet size={18} className="text-rose-500" /> Répartition des dépenses</h3>
              <div className="flex-1 min-h-[300px] w-full flex items-center justify-center">
                <TypeDepenses data={dashboard?.depensesByCategory} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Assuming ArrowLeftRight is not imported above, I will just use standard Wallet icon where appropriate, or import it.
// I'll leave the icons as they were but I used an unimported ArrowLeftRight so I should fix the import.
import { ArrowLeftRight } from 'lucide-react';

export default DashboardFinancier;
