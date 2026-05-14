import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';

const MovementLineChart = ({ labels, dataEntree, dataSortie }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const containerRef = useRef(null);

  const chartLabels = Array.isArray(labels) && labels.length ? labels : ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin'];
  const dataE = Array.isArray(dataEntree) && dataEntree.length ? dataEntree : [30, 45, 35, 60, 50, 70];
  const dataS = Array.isArray(dataSortie) && dataSortie.length ? dataSortie : [20, 35, 40, 30, 45, 55];

  // ─── INIT CHART ─────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Entrées',
            data: dataE,
            backgroundColor: 'rgba(52, 211, 153, 0.75)',
            borderColor: '#34d399',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Sorties',
            data: dataS,
            backgroundColor: 'rgba(248, 113, 113, 0.75)',
            borderColor: '#f87171',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#94a3b8',
            bodyColor: '#f1f5f9',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(148,163,184,0.07)', drawBorder: false },
            ticks: { color: '#64748b', font: { size: 11 } },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148,163,184,0.07)', drawBorder: false },
            ticks: { color: '#64748b', font: { size: 11 }, padding: 6 },
            border: { display: false },
          }
        },
        animation: { duration: 700, easing: 'easeOutQuart' }
      }
    });

    return () => {
      chartInstance.current?.destroy();
    };
  }, [chartLabels, dataE, dataS]);

  // ─── EXPORT PNG (html2canvas FULL CARD) ─────────────────────────────
  const downloadPNG = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });

    const url = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = url;
    link.download = 'mouvements-stock.png';
    link.click();
  };

  // ─── EXPORT SVG (image wrapper) ─────────────────────────────
  const downloadSVG = () => {
    const canvas = chartRef.current;
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
    link.download = 'mouvements-stock.svg';
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative group">

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Mouvements de stock
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--fg-muted)' }}>
            Analyse Entrées vs Sorties
          </p>
        </div>

        {/* BUTTONS */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={downloadPNG} style={btnStyle('#22c55e')}>
            PNG
          </button>
          <button onClick={downloadSVG} style={btnStyle('#3b82f6')}>
            SVG
          </button>
        </div>
      </div>

      {/* LEGEND */}
      <div style={{ display: 'flex', gap: '14px', marginTop: '12px' }}>
        {[
          ['#34d399', 'Entrées'],
          ['#f87171', 'Sorties']
        ].map(([color, label]) => (
          <span key={label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--fg-muted)'
          }}>
            <span style={{
              width: '10px',
              height: '10px',
              background: color,
              borderRadius: '3px'
            }} />
            {label}
          </span>
        ))}
      </div>

      {/* CHART */}
      <div style={{ position: 'relative', height: '220px', marginTop: '12px' }}>
        <canvas ref={chartRef} />
      </div>

    </div>
  );
};

const btnStyle = (color) => ({
  background: color,
  border: 'none',
  padding: '6px 12px',
  borderRadius: '8px',
  color: 'var(--fg)',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
});

export default MovementLineChart;
