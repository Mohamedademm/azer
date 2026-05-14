import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';

const LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
const DEFAULT_PAYE   = [20, 35, 25, 45, 40, 55];
const DEFAULT_IMPAYE = [10, 15, 20, 10, 25, 15];

const FactureStatus = ({ labels, dataPaye, dataImpaye }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const containerRef = useRef(null);

  const chartLabels = Array.isArray(labels) && labels.length ? labels : LABELS;
  const paye = Array.isArray(dataPaye) && dataPaye.length ? dataPaye : DEFAULT_PAYE;
  const impaye = Array.isArray(dataImpaye) && dataImpaye.length ? dataImpaye : DEFAULT_IMPAYE;

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');
    if (chartInstance.current) chartInstance.current.destroy();

    const mkGradient = (color) => {
      const g = ctx.createLinearGradient(0, 0, 0, 180);
      g.addColorStop(0, color + '26');
      g.addColorStop(1, color + '02');
      return g;
    };

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Payées',
            data: paye,
            borderColor: '#34d399',
            backgroundColor: mkGradient('#34d399'),
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#34d399',
            pointBorderColor: '#0f172a',
            pointBorderWidth: 2,
            pointRadius: 4,
          },
          {
            label: 'Impayées',
            data: impaye,
            borderColor: '#f87171',
            backgroundColor: mkGradient('#f87171'),
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#f87171',
            pointBorderColor: '#0f172a',
            pointBorderWidth: 2,
            pointRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      }
    });

    return () => chartInstance.current?.destroy();
  }, [chartLabels, paye, impaye]);

  /* ================= PNG EXPORT ================= */
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
    link.download = 'factures.png';
    link.click();
  };

  /* ================= SVG (FIX STABLE) ================= */
  const downloadSVG = () => {
    const canvas = chartRef.current;
    if (!canvas) return;

    const imgData = canvas.toDataURL('image/png');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${canvas.width}"
           height="${canvas.height}"
           viewBox="0 0 ${canvas.width} ${canvas.height}">
        <image href="${imgData}"
               x="0"
               y="0"
               width="${canvas.width}"
               height="${canvas.height}" />
      </svg>
    `;

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'factures.svg';
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
        marginBottom: '14px'
      }}>
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)', margin: 0 }}>
            Statut des factures
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--fg-muted)', marginTop: '2px' }}>
            Janvier – Juin
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={downloadPNG} style={btnStyle}>PNG</button>
          <button onClick={downloadSVG} style={btnStyle}>SVG</button>
        </div>
      </div>

      {/* CHART */}
      <div style={{ height: '180px', position: 'relative' }}>
        <canvas ref={chartRef} />
      </div>

    </div>
  );
};

export default FactureStatus;
