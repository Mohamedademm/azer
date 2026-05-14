import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';

const DEFAULT_VALUES = [12000, 19000, 15000, 25000, 22000, 30000, 45000, 42000];
const LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août'];

const RecetteEvolution = ({ labels, dataRecette }) => {

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const containerRef = useRef(null);

  const chartLabels = Array.isArray(labels) && labels.length ? labels : LABELS;
  const values = Array.isArray(dataRecette) && dataRecette.length ? dataRecette : DEFAULT_VALUES;

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const green = '#10b981';

    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(16,185,129,0.25)');
    gradient.addColorStop(1, 'rgba(16,185,129,0)');

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Recettes',
            data: values,
            borderColor: green,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
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
          legend: { display: false },

          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#111',
            bodyColor: '#111',
            borderColor: 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (ctx) =>
                `${ctx.parsed.y.toLocaleString('fr-TN')} DT`,
            },
          },
        },

        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: 'var(--fg-muted)' },
          },

          y: {
            beginAtZero: false,
            grid: { color: 'rgba(0,0,0,0.06)' },
            border: { display: false },
            ticks: {
              color: 'var(--fg-muted)',
              callback: (v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v,
            },
          },
        },
      },
    });

    return () => chartInstance.current?.destroy();
  }, [chartLabels, values]);

  // =========================
  // PNG EXPORT (html2canvas)
  // =========================
  const downloadPNG = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });

    const url = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = url;
    link.download = 'recette-evolution.png';
    link.click();
  };

  // =========================
  // SVG EXPORT (FIXED 100%)
  // =========================
  const downloadSVG = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');

    const width = canvas.width;
    const height = canvas.height;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${width}"
           height="${height}"
           viewBox="0 0 ${width} ${height}">
        <image 
          href="${imgData}" 
          x="0" 
          y="0" 
          width="${width}" 
          height="${height}" 
        />
      </svg>
    `;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'recette-evolution.svg';
    link.click();

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
            Évolution des recettes
          </p>
          <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            Analyse mensuelle
          </p>
        </div>

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

export default RecetteEvolution;
