import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, RefreshCw, AlertTriangle, TrendingUp, Download, PieChart, Users, BarChart3, Clock } from 'lucide-react';
import TopProduitsChart from './components/TopProduitsChart';
import MovementLineChart from './components/MovementChart';
import CategoriPieChart from './components/CategoriPieChart';
import KpiPage from './components/KpiPage';
import TopFournisseursChart from './components/TopFournisseursChart';
import dashboardStockService from '../../services/DashboardStockService';
import { extractApiErrorMessage } from '../../utils/frontendApiAdapters';

const DashboardStock = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [period, setPeriod] = useState('30');

  const loadDashboard = async (selectedPeriod) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await dashboardStockService.getDashboard(selectedPeriod);
      setDashboard(response.data || response);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, 'Impossible de charger le tableau de bord du stock.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(period) }, [period]);

  const movements = dashboard?.monthlyMovements || [];
  const topProducts = dashboard?.topProducts || [];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/12 text-emerald-500">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Analytique de Stock</h1>
            <p className="text-xs text-[var(--fg-muted)]">Suivi des mouvements et analyse des produits</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-1 mr-2">
            <Clock size={14} className="text-[var(--fg-subtle)] ml-2" />
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-7 text-xs font-semibold bg-transparent border-none outline-none pr-3 text-[var(--fg)] cursor-pointer">
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">3 derniers mois</option>
              <option value="365">Cette année</option>
            </select>
          </div>
          <button onClick={() => loadDashboard(period)} disabled={loading} className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-all disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
          <button className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-500/25 transition-all hover:-translate-y-px">
            <Download size={16} /> Rapport global
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
          <KpiPage kpi={dashboard?.kpi} />

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Mouvements */}
            <div className="xl:col-span-3 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] flex flex-col">
              <div className="flex-1 min-h-[300px] w-full relative">
                <MovementLineChart labels={movements.map(item => item.label)} dataEntree={movements.map(item => Number(item.entree || 0))} dataSortie={movements.map(item => Number(item.sortie || 0))} />
              </div>
            </div>

            {/* Top Produits */}
            <div className="xl:col-span-2 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] flex flex-col">
              <div className="flex-1 min-h-[300px] w-full">
                <TopProduitsChart labels={topProducts.map(item => item.name)} dataVentes={topProducts.map(item => Number(item.stock || item.value || 0))} />
              </div>
            </div>

            {/* Categories */}
            <div className="xl:col-span-1 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] flex flex-col">
              <div className="flex-1 min-h-[300px] w-full flex items-center justify-center">
                <CategoriPieChart categoriesData={dashboard?.categories} />
              </div>
            </div>

            {/* Top Fournisseurs */}
            <div className="xl:col-span-3 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] flex flex-col">
              <div className="flex-1 min-h-[300px] w-full flex items-center justify-center overflow-auto">
                <TopFournisseursChart data={dashboard?.topFournisseurs} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardStock;
