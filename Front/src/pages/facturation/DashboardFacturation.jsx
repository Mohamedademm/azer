import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, RefreshCw, AlertTriangle, TrendingUp, Download, PieChart, Users, FileText } from 'lucide-react';
import CommandeParMois from './components/CommandeParMois';
import TotalCommandeParClient from './components/TotalCommandeParClient';
import FactureStatus from './components/FactureStatus';
import ClientFidele from './components/ClientFidele';
import KpiFacture from './components/KpiFacture';
import dashboardFacturationService from '../../services/DashboardFacturationService';
import { extractApiErrorMessage } from '../../utils/frontendApiAdapters';

const DashboardFacturation = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await dashboardFacturationService.getDashboard();
      setDashboard(response.data || response);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, 'Impossible de charger le tableau de bord facturation.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard() }, []);

  const commandes = dashboard?.commandesParMois || [];
  const factureStatus = dashboard?.factureStatus || [];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/12 text-orange-500">
            <Receipt size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Tableau de Bord Facturation</h1>
            <p className="text-xs text-[var(--fg-muted)]">Suivi des performances et de la trésorerie</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadDashboard} disabled={loading} className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-all disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
          <button className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 shadow-sm shadow-orange-500/25 transition-all hover:-translate-y-px">
            <Download size={16} /> Rapport mensuel
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
            <div className="h-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl xl:col-span-2" />
            <div className="h-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl xl:col-span-1" />
            <div className="h-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl xl:col-span-1" />
            <div className="h-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl xl:col-span-2" />
          </div>
        </div>
      ) : (
        <>
          <KpiFacture kpi={dashboard?.kpi} />

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Commandes par Mois */}
            <div className="xl:col-span-2 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] flex flex-col">
              <h3 className="font-bold text-[var(--fg)] text-lg mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-orange-500" /> Évolution des commandes</h3>
              <div className="flex-1 min-h-[300px] w-full">
                <CommandeParMois labels={commandes.map(item => item.label)} dataCommandes={commandes.map(item => Number(item.count || 0))} />
              </div>
            </div>

            {/* Statut des Factures */}
            <div className="xl:col-span-1 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] flex flex-col">
              <h3 className="font-bold text-[var(--fg)] text-lg mb-4 flex items-center gap-2"><PieChart size={18} className="text-indigo-500" /> Statut des factures</h3>
              <div className="flex-1 min-h-[300px] w-full flex items-center justify-center">
                <FactureStatus labels={factureStatus.map(item => item.label)} dataPaye={factureStatus.map(item => Number(item.paye || 0))} dataImpaye={factureStatus.map(item => Number(item.impaye || 0))} />
              </div>
            </div>

            {/* Top Clients - Revenu */}
            <div className="xl:col-span-1 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] flex flex-col">
              <h3 className="font-bold text-[var(--fg)] text-lg mb-4 flex items-center gap-2"><FileText size={18} className="text-emerald-500" /> Top Clients (Revenus)</h3>
              <div className="flex-1 min-h-[300px] w-full flex items-center justify-center overflow-auto">
                <TotalCommandeParClient data={dashboard?.topCustomers} />
              </div>
            </div>

            {/* Clients Fidèles */}
            <div className="xl:col-span-2 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] flex flex-col">
              <h3 className="font-bold text-[var(--fg)] text-lg mb-4 flex items-center gap-2"><Users size={18} className="text-rose-500" /> Top Clients (Fidélité)</h3>
              <div className="flex-1 min-h-[300px] w-full overflow-auto">
                <ClientFidele data={dashboard?.loyalCustomers} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardFacturation;
