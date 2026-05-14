import React from 'react';
import { Package, AlertTriangle, Layers, ArrowRightLeft, DollarSign, Users } from 'lucide-react';

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

const KpiPage = ({ kpi = {} }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
    {/* Stock Total (Custom Card) */}
    <div className="flex flex-col p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] xl:col-span-2">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500">
          <Package size={20} />
        </div>
        <span className="text-sm font-bold text-[var(--fg-muted)] uppercase tracking-wider">Stock total</span>
      </div>
      <div className="flex items-end justify-between mt-auto gap-4">
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-[var(--fg)]">{formatNumber((kpi.produitsEnStock || 0) + (kpi.produitsEnRupture || 0))}</span>
          <span className="text-xs text-[var(--fg-subtle)]">produits au total</span>
        </div>
        <div className="flex flex-col gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-[var(--fg)]">{formatNumber(kpi.produitsEnStock)}</span> <span className="text-[var(--fg-muted)]">en stock</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> <span className="text-[var(--fg)]">{formatNumber(kpi.produitsEnRupture)}</span> <span className="text-[var(--fg-muted)]">rupture</span></div>
        </div>
      </div>
    </div>

    <KpiCard label="Stock faible" value={kpi.lowStock} note="produits sous seuil" icon={AlertTriangle} accentClass="text-amber-500" bgAccentClass="bg-amber-500/10" />
    <KpiCard label="Catégories" value={kpi.nombreCategories} note="familles de produits" icon={Layers} accentClass="text-indigo-500" bgAccentClass="bg-indigo-500/10" />
    
    {/* Total mouvements (Custom Card) */}
    <div className="flex flex-col p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] xl:col-span-2">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500">
          <ArrowRightLeft size={20} />
        </div>
        <span className="text-sm font-bold text-[var(--fg-muted)] uppercase tracking-wider">Total mouvements</span>
      </div>
      <div className="flex items-end justify-between mt-auto gap-4">
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-[var(--fg)]">{formatNumber(kpi.totalMouvements)}</span>
          <span className="text-xs text-[var(--fg-subtle)]">opérations</span>
        </div>
        <div className="flex flex-col gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-[var(--fg)]">{formatNumber(kpi.entreeMouvements)}</span> <span className="text-[var(--fg-muted)]">entrées</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> <span className="text-[var(--fg)]">{formatNumber(kpi.sortieMouvements)}</span> <span className="text-[var(--fg-muted)]">sorties</span></div>
        </div>
      </div>
    </div>

    {/* Valeur & Fournisseurs - hide on smaller screens or fit normally */}
    <KpiCard label="Valeur stock" value={`${formatNumber(kpi.stockValue)} DT`} note="valorisation estimée" icon={DollarSign} accentClass="text-emerald-500" bgAccentClass="bg-emerald-500/10" />
    <KpiCard label="Fournisseurs" value={kpi.totalFournisseurs} note="partenaires actifs" icon={Users} accentClass="text-purple-500" bgAccentClass="bg-purple-500/10" />
  </div>
);

export default KpiPage;
