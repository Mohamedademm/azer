import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';

// ─── DATA ─────────────────────────────────────────────────────────────────────
const fournisseurs = [
  {
    id: 1,
    nom: 'Alpha Supply',
    total: 48500,
    commandes: 34,
    produits: [
      { nom: 'Processeur i9', achat: 18000 },
      { nom: 'RAM 32GB', achat: 12000 },
      { nom: 'SSD 1TB', achat: 10500 },
      { nom: 'Carte mère Z790', achat: 8000 },
    ],
  },
  {
    id: 2,
    nom: 'Beta Logistics',
    total: 36200,
    commandes: 27,
    produits: [
      { nom: 'Écran 4K 27"', achat: 14000 },
      { nom: 'Clavier mec.', achat: 9500 },
      { nom: 'Souris Pro', achat: 7200 },
      { nom: 'Hub USB-C', achat: 5500 },
    ],
  },
  {
    id: 3,
    nom: 'Gamma Trade',
    total: 29800,
    commandes: 21,
    produits: [
      { nom: 'Switch réseau', achat: 11000 },
      { nom: 'Câble fibre', achat: 8800 },
      { nom: 'Patch panel', achat: 6000 },
      { nom: 'Rack 12U', achat: 4000 },
    ],
  },
  {
    id: 4,
    nom: 'Delta Pro',
    total: 21400,
    commandes: 15,
    produits: [
      { nom: 'Imprimante A3', achat: 9000 },
      { nom: 'Toner noir', achat: 5400 },
      { nom: 'Scanner doc.', achat: 4500 },
      { nom: 'Papier A4', achat: 2500 },
    ],
  },
  {
    id: 5,
    nom: 'Epsilon Co.',
    total: 15900,
    commandes: 11,
    produits: [
      { nom: 'Batterie UPS', achat: 7000 },
      { nom: 'Câble HDMI', achat: 4200 },
      { nom: 'Multiprise', achat: 2900 },
      { nom: 'Adaptateur', achat: 1800 },
    ],
  },
];

const COLORS = ['#60a5fa', '#34d399', '#a78bfa', '#f59e0b', '#f87171'];

// ─── EXPORT PNG (html2canvas FULL CARD) ─────────────────────────────────────
const exportPNG = async (ref) => {
  if (!ref) return;

  const canvas = await html2canvas(ref, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
  });

  const url = canvas.toDataURL('image/png');

  const link = document.createElement('a');
  link.href = url;
  link.download = 'fournisseurs.png';
  link.click();
};

// ─── EXPORT SVG (image wrapper) ─────────────────────────────────────────────
const exportSVG = (canvas) => {
  if (!canvas) return;

  const imgData = canvas.toDataURL("image/png");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${canvas.width}"
         height="${canvas.height}">
      <image href="${imgData}" width="100%" height="100%" />
    </svg>
  `;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'fournisseurs.svg';
  link.click();

  URL.revokeObjectURL(url);
};

// ─── CHART 1 ────────────────────────────────────────────────────────────────
const FournisseursBarChart = ({ fournisseursData, selected, onSelect, chartRefExport }) => {
  const ref = useRef(null);
  const instance = useRef(null);

  useEffect(() => {
    const ctx = ref.current.getContext('2d');

    if (instance.current) instance.current.destroy();

    instance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: fournisseursData.map(f => f.nom),
        datasets: [{
          label: 'CA total (DT)',
          data: fournisseursData.map(f => f.total),
          backgroundColor: fournisseursData.map((_, i) =>
            selected === i ? COLORS[i % COLORS.length] : COLORS[i % COLORS.length] + '55'
          ),
          borderColor: fournisseursData.map((_, i) => COLORS[i % COLORS.length]),
          borderWidth: 1.5,
          borderRadius: 7,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_, elements) => {
          if (elements.length > 0) onSelect(elements[0].index);
        },
        plugins: { legend: { display: false } },
      },
    });

    if (chartRefExport) chartRefExport.current = instance.current;

    return () => instance.current?.destroy();
  }, [fournisseursData, selected]);

  return (
    <div style={{ position: 'relative', height: '220px', cursor: 'pointer' }}>
      <canvas ref={ref} />
    </div>
  );
};

// ─── CHART 2 ────────────────────────────────────────────────────────────────
const ProduitsBarChart = ({ fournisseur, color }) => {
  const ref = useRef(null);
  const instance = useRef(null);
  const produits = Array.isArray(fournisseur.produits) ? fournisseur.produits : [];

  useEffect(() => {
    const ctx = ref.current.getContext('2d');

    if (instance.current) instance.current.destroy();

    instance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: produits.map(p => p.nom),
        datasets: [{
          data: produits.map(p => p.achat),
          backgroundColor: color + '33',
          borderColor: color,
          borderWidth: 1.5,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    });

    return () => instance.current?.destroy();
  }, [produits, color]);

  return (
    <div style={{ position: 'relative', height: `${Math.max(1, produits.length) * 52}px` }}>
      <canvas ref={ref} />
    </div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const TopFournisseursChart = ({ data }) => {
  const [selected, setSelected] = useState(0);
  const fournisseursData = Array.isArray(data) && data.length ? data : fournisseurs;
  const safeSelected = Math.min(selected, Math.max(0, fournisseursData.length - 1));
  const f = fournisseursData[safeSelected] || { nom: 'Fournisseur', total: 0, produits: [] };
  const color = COLORS[safeSelected % COLORS.length];

  const dashboardRef = useRef(null);
  const chartRef = useRef(null);

  const btnStyle = {
    background: '#1e293b',
    color: 'var(--fg)',
    border: '1px solid rgba(148,163,184,.2)',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    cursor: 'pointer',
  };

  return (
    <div ref={dashboardRef} style={{
      background: 'linear-gradient(145deg, #0f172a, #1e293b)',
      borderRadius: '16px',
      border: '1px solid rgba(148,163,184,0.1)',
      padding: '24px',
    }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3 style={{ color: 'var(--fg)' }}>Top fournisseurs</h3>

        {/* BUTTONS */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={btnStyle} onClick={() => exportPNG(dashboardRef.current)}>
            PNG
          </button>

          <button style={btnStyle} onClick={() => exportSVG(chartRef.current?.canvas)}>
            SVG
          </button>
        </div>
      </div>

      {/* CHART */}
      <FournisseursBarChart
        fournisseursData={fournisseursData}
        selected={safeSelected}
        onSelect={setSelected}
        chartRefExport={chartRef}
      />

      {/* DETAILS */}
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ color: 'var(--fg)' }}>{f.nom}</h4>
        <p style={{ color: 'var(--fg-muted)' }}>
          CA: {f.total.toLocaleString()} DT
        </p>
      </div>

      {/* PRODUCTS CHART */}
      <ProduitsBarChart fournisseur={f} color={color} />

    </div>
  );
};

export default TopFournisseursChart;
