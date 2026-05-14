import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';

const CategoryBarChart = ({ categoriesData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels =
      categoriesData?.map(item => item.name) || ['Électronique', 'Vêtements', 'Maison', 'Sport', 'Autres'];

    const dataValues =
      categoriesData?.map(item => item.count) || [120, 85, 45, 30, 20];

    const colors = ['#60a5fa', '#34d399', '#a78bfa', '#f59e0b', '#f87171'];

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Produits',
            data: dataValues,
            backgroundColor: colors.map(c => c + 'cc'),
            borderColor: colors,
            borderWidth: 1.5,
            borderRadius: 6,
            borderSkipped: false,
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#94a3b8',
            bodyColor: '#f1f5f9',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: ctx => ` ${ctx.parsed.x} produits`,
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: 'rgba(148,163,184,0.1)', drawBorder: false },
            ticks: { color: 'var(--fg-muted)', font: { size: 11 } },
            border: { display: false },
          },
          y: {
            grid: { display: false },
            ticks: {
              color: 'var(--fg-muted)',
              font: { size: 12, weight: '500' },
              padding: 8,
            },
            border: { display: false },
          }
        },
        animation: { duration: 600, easing: 'easeOutQuart' },
      }
    });

    return () => chartInstance.current?.destroy();
  }, [categoriesData]);

  /* ================= EXPORT PNG (FULL CARD) ================= */
  const downloadPNG = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });

    const url = canvas.toDataURL('image/png');

    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories.png';
    a.click();
  };

  /* ================= EXPORT SVG ================= */
  const downloadSVG = () => {
    const canvas = chartRef.current;
    if (!canvas) return;

    const img = canvas.toDataURL("image/png");

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${canvas.width}"
           height="${canvas.height}">
        <image href="${img}" width="100%" height="100%" />
      </svg>
    `;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories.svg';
    a.click();

    URL.revokeObjectURL(url);
  };

  const total = (categoriesData?.map(i => i.count) || [120, 85, 45, 30, 20])
    .reduce((a, b) => a + b, 0);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative group">

      {/* HEADER */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            color: 'var(--fg)',
            fontSize: '15px',
            fontWeight: '600',
          }}>
            Produits par catégorie
          </h3>
          <p style={{
            margin: '4px 0 0',
            color: '#64748b',
            fontSize: '12px',
          }}>
            {total} produits au total
          </p>
        </div>

        {/* BUTTONS */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={downloadPNG} style={btn}>
            PNG
          </button>
          <button onClick={downloadSVG} style={btn}>
            SVG
          </button>
        </div>
      </div>

      {/* CHART */}
      <div style={{ position: 'relative', height: '220px' }}>
        <canvas ref={chartRef} />
      </div>

    </div>
  );
};

/* ================= STYLE BTN ================= */
const btn = {
  background: '#1e293b',
  color: 'var(--fg)',
  border: '1px solid rgba(148,163,184,.2)',
  padding: '6px 10px',
  borderRadius: '6px',
  fontSize: '11px',
  cursor: 'pointer'
};

export default CategoryBarChart;