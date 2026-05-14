import React from 'react';
import { DollarSign, Wallet, TrendingDown, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const formatNumber = (value) => Number(value || 0).toLocaleString('fr-FR');

export const KpiCard = ({ label, value, note, icon: Icon, accentClass, bgAccentClass, trend, trendUp }) => (
  <div className="flex flex-col p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bgAccentClass} ${accentClass}`}>
          {Icon && <Icon size={20} />}
        </div>
        <span className="text-sm font-bold text-[var(--fg-muted)] uppercase tracking-wider">{label}</span>
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {trend}
        </span>
      )}
    </div>
    <div className="flex flex-col gap-1 mt-auto">
      <span className="text-2xl font-bold text-[var(--fg)]">{formatNumber(value)}</span>
      {note && <span className="text-xs text-[var(--fg-subtle)]">{note}</span>}
    </div>
  </div>
);

const FinanceKpiPage = ({ kpi = {} }) => {
  const beneficeNet = Number(kpi.beneficeNet || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
      <KpiCard label="Chiffre d'affaires" value={`${formatNumber(kpi.chiffreAffaire)} DT`} note="total facturé" icon={DollarSign} accentClass="text-emerald-500" bgAccentClass="bg-emerald-500/10" />
      <KpiCard label="Recettes encaissées" value={`${formatNumber(kpi.recettesEncaissees)} DT`} note="paiements reçus" icon={Wallet} accentClass="text-blue-500" bgAccentClass="bg-blue-500/10" />
      <KpiCard label="Dépenses" value={`${formatNumber(kpi.depensesTotal)} DT`} note="charges globales" icon={TrendingDown} accentClass="text-rose-500" bgAccentClass="bg-rose-500/10" />
      <KpiCard label="Bénéfice net" value={`${formatNumber(beneficeNet)} DT`} note="recettes moins dépenses" icon={Activity} accentClass={beneficeNet >= 0 ? 'text-emerald-500' : 'text-red-500'} bgAccentClass={beneficeNet >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'} trend={beneficeNet >= 0 ? 'positif' : 'négatif'} trendUp={beneficeNet >= 0} />
      <KpiCard label="Transactions" value={kpi.transactionsTotal} note="opérations validées" icon={ArrowUpRight} accentClass="text-indigo-500" bgAccentClass="bg-indigo-500/10" />
    </div>
  );
};

export default FinanceKpiPage;
