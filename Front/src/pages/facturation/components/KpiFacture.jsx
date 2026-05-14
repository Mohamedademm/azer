import React from 'react';
import { Users, FileText, ShoppingCart, DollarSign, AlertCircle } from 'lucide-react';

const formatNumber = (value) => Number(value || 0).toLocaleString('fr-FR');

export const KpiCard = ({ label, value, note, icon: Icon, accentClass, bgAccentClass }) => (
  <div className="flex flex-col p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all">
    <div className="flex items-center gap-3 mb-3">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bgAccentClass} ${accentClass}`}>
        {Icon && <Icon size={20} />}
      </div>
      <span className="text-sm font-bold text-[var(--fg-muted)] uppercase tracking-wider">{label}</span>
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-2xl font-bold text-[var(--fg)]">{formatNumber(value)}</span>
      {note && <span className="text-xs text-[var(--fg-subtle)]">{note}</span>}
    </div>
  </div>
);

const KpiFacture = ({ kpi = {} }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
    <KpiCard label="Total clients" value={kpi.totalClients} note="clients actifs" icon={Users} accentClass="text-indigo-500" bgAccentClass="bg-indigo-500/10" />

    {/* Total factures (Custom Card) */}
    <div className="flex flex-col p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] xl:col-span-2">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500">
          <FileText size={20} />
        </div>
        <span className="text-sm font-bold text-[var(--fg-muted)] uppercase tracking-wider">Total factures</span>
      </div>
      <div className="flex items-end justify-between mt-auto gap-4">
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-[var(--fg)]">{formatNumber(kpi.totalFactures)}</span>
        </div>
        <div className="flex flex-col gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-[var(--fg)]">{formatNumber(kpi.facturesPayees)}</span> <span className="text-[var(--fg-muted)]">Payées</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> <span className="text-[var(--fg)]">{formatNumber(kpi.facturesImpayees)}</span> <span className="text-[var(--fg-muted)]">Impayées</span></div>
        </div>
      </div>
    </div>

    <KpiCard label="Commandes" value={kpi.totalCommandes} note="commandes globales" icon={ShoppingCart} accentClass="text-blue-500" bgAccentClass="bg-blue-500/10" />
    <KpiCard label="Chiffre affaires" value={`${formatNumber(kpi.chiffreAffaires)} DT`} note="total facturé" icon={DollarSign} accentClass="text-emerald-500" bgAccentClass="bg-emerald-500/10" />
    <KpiCard label="Reste à payer" value={`${formatNumber(kpi.resteAPayer)} DT`} note="encours clients" icon={AlertCircle} accentClass="text-amber-500" bgAccentClass="bg-amber-500/10" />
  </div>
);

export default KpiFacture;
