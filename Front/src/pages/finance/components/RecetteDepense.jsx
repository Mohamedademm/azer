import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';

const LABELS       = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
const DEF_RECETTES = [5000, 7000, 6000, 9000, 8000, 10000];
const DEF_DEPENSES = [3000, 4000, 5500, 6000, 7000, 8500];
const DEF_NET      = [2000, 3000, 500, 3000, 1000, 1500];

const RecetteDepense = ({ labels, dataRecettes, dataDepenses, dataNet }) => {

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const containerRef = useRef(null);

  const chartLabels = Array.isArray(labels) && labels.length ? labels : LABELS;
  const recettes = Array.isArray(dataRecettes) && dataRecettes.length ? dataRecettes : DEF_RECETTES;
  const depenses = Array.isArray(dataDepenses) && dataDepenses.length ? dataDepenses : DEF_DEPENSES;
  const net = Array.isArray(dataNet) && dataNet.length ? dataNet : DEF_NET;

  /* ================= CHART ================= */
  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(ctx, {
      data: {
        labels: chartLabels,
        datasets: [
          {
            type: 'bar',
            label: 'Recettes',
            data: recettes,
            backgroundColor: 'rgba(29,158,117,0.25)',
            borderColor: '#1D9E75',
            borderWidth: 1.5,
            borderRadius: 6,
            order: 2,
          },
          {
            type: 'bar',
            label: 'Dépenses',
            data: depenses,
            backgroundColor: 'rgba(216,90,48,0.25)',
            borderColor: '#D85A30',
            borderWidth: 1.5,
            borderRadius: 6,
            order: 2,
          },
          {
            type: 'line',
            label: 'Net',
            data: net,
            borderColor: '#378ADD',
            backgroundColor: 'rgba(55,138,221,0.08)',
            tension: 0.4,
            fill: true,
            borderWidth: 2.5,
            pointRadius: 4,
            order: 1,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          mode: 'index',
          intersect: false,
        },

        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              boxWidth: 8,
            },
          },
        },

        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'var(--fg-muted)' },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              color: 'var(--fg-muted)',
              callback: (v) => (v >= 1000 ? `${v / 1000}k` : v),
            },
          },
        },
      },
    });

    return () => chartInstance.current?.destroy();
  }, [chartLabels, recettes, depenses, net]);

  /* ================= PNG EXPORT ================= */
  const downloadPNG = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: '#fff',
      scale: 2,
      useCORS: true,
    });

    const url = canvas.toDataURL('image/png');

    const a = document.createElement('a');
    a.href = url;
    a.download = 'recette-depense.png';
    a.click();
  };

  /* ================= SVG EXPORT (FIXED SAFE) ================= */
  const downloadSVG = () => {
    const canvas = chartRef.current;
    if (!canvas) return;

    const img = canvas.toDataURL('image/png');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${canvas.width}"
           height="${canvas.height}">
        <image href="${img}" width="100%" height="100%" />
      </svg>
    `;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'recette-depense.svg';
    a.click();

    URL.revokeObjectURL(url);
  };

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
    <div ref={containerRef} className="w-full h-full flex flex-col relative group">

      {/* HEADER + BUTTONS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
            Recettes vs Dépenses
          </p>
          <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            Analyse mensuelle financière
          </p>
        </div>

        {/* BUTTONS */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={downloadPNG} style={btnStyle}>PNG</button>
          <button onClick={downloadSVG} style={btnStyle}>SVG</button>
        </div>
      </div>

      {/* CHART */}
      <div style={{ width: '100%', height: 240 }}>
        <canvas ref={chartRef} />
      </div>

    </div>
  );
};

export default RecetteDepense;
