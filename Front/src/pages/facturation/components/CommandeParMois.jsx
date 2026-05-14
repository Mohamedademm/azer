import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';

const LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'];
const DEFAULT_DATA = [12, 19, 15, 25, 22, 30, 45];

const CommandeParMois = ({ labels, dataCommandes }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const containerRef = useRef(null);

  const chartLabels = Array.isArray(labels) && labels.length ? labels : LABELS;
  const values = Array.isArray(dataCommandes) && dataCommandes.length ? dataCommandes : DEFAULT_DATA;

  const total = values.reduce((a, b) => a + b, 0);
  const last = values[values.length - 1];
  const prev = values[values.length - 2] || 1;
  const trend = Math.round(((last - prev) / prev) * 100);

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) chartInstance.current.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(96,165,250,0.22)');
    gradient.addColorStop(1, 'rgba(96,165,250,0.01)');

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Commandes',
          data: values,
          fill: true,
          backgroundColor: gradient,
          borderColor: '#60a5fa',
          borderWidth: 2.5,
          tension: 0.4,
          pointBackgroundColor: '#60a5fa',
          pointBorderColor: '#0f172a',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11 } },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148,163,184,0.07)', borderDash: [4, 4] },
            ticks: { color: '#64748b', font: { size: 11 } },
            border: { display: false },
          }
        },
        animation: { duration: 700, easing: 'easeOutQuart' }
      }
    });

    return () => chartInstance.current?.destroy();
  }, [chartLabels, values]);

  // =========================
  // PNG EXPORT (html2canvas)
  // =========================
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
    link.download = 'commandes-mois.png';
    link.click();
  };

  // =========================
  // SVG EXPORT (FIXED + RELIABLE)
  // =========================
  const downloadSVG = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${canvas.width}"
           height="${canvas.height}">
        <rect width="100%" height="100%" fill="transparent"/>
        <image href="${imgData}" width="100%" height="100%"/>
      </svg>
    `;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'commandes-mois.svg';
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

      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '18px'
      }}>
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)', margin: 0 }}>
            Commandes par mois
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--fg-muted)', marginTop: '2px' }}>
            Janvier – Juillet
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--fg)' }}>
            {total}
          </div>

          <div style={{
            fontSize: '11px',
            color: trend >= 0 ? '#34d399' : '#f87171',
            marginTop: '3px'
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>

          {/* BUTTONS */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button onClick={downloadPNG} style={btnStyle}>PNG</button>
            <button onClick={downloadSVG} style={btnStyle}>SVG</button>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div style={{ height: '180px' }}>
        <canvas ref={chartRef} />
      </div>

    </div>
  );
};

export default CommandeParMois;
