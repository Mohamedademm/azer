import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';

const COLORS = ['#60a5fa', '#34d399', '#a78bfa', '#f59e0b', '#f87171', '#22d3ee', '#fb7185', '#84cc16'];
const LABELS = ['Produit A', 'Produit B', 'Produit C', 'Autres'];

const TopProduitsChart = ({ labels, dataVentes }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const containerRef = useRef(null);

  const [selectedIndex, setSelectedIndex] = useState(null);

  const chartLabels = Array.isArray(labels) && labels.length ? labels : LABELS;
  const data = Array.isArray(dataVentes) && dataVentes.length ? dataVentes : [300, 50, 100, 80];
  const total = data.reduce((a, b) => a + b, 0);

  // ─── EXPORT PNG ─────────────────────────────
  const downloadPNG = async () => {
    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: '#0b1220',
      scale: 2
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'top-produits.png';
    link.click();
  };

  // ─── EXPORT SVG ─────────────────────────────
  const downloadSVG = async () => {
    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: '#0b1220',
      scale: 2
    });

    const imgData = canvas.toDataURL('image/png');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
        <image href="${imgData}" width="100%" height="100%"/>
      </svg>
    `;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'top-produits.svg';
    link.click();
  };

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [
          {
            data,
            backgroundColor: chartLabels.map((_, index) => COLORS[index % COLORS.length]),
            borderColor: '#0b1220',
            borderWidth: 3,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        onClick: (e, elements) => {
          if (elements.length > 0) {
            setSelectedIndex(elements[0].index);
          }
        },
        plugins: {
          legend: { display: false },
        },
      },
    });

    return () => chartInstance.current?.destroy();
  }, [chartLabels, data]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative group">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Top produits
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--fg-muted)' }}>
            Répartition des ventes
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

      {/* CHART */}
      <div style={{ height: '220px', marginTop: '15px' }}>
        <canvas ref={chartRef} />
      </div>

      {/* LEGEND */}
      <div style={{ marginTop: '20px' }}>
        {chartLabels.map((label, i) => {
          const percent = total ? Math.round(((data[i] || 0) / total) * 100) : 0;

          return (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                background:
                  selectedIndex === i ? 'rgba(255,255,255,0.06)' : 'transparent',
              }}
              onClick={() => setSelectedIndex(i)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: COLORS[i],
                    display: 'inline-block',
                  }}
                />
                {label}
              </span>

              <span style={{ color: 'var(--fg-muted)' }}>
                {data[i] || 0} ({percent}%)
              </span>
            </div>
          );
        })}
      </div>

      {/* DETAIL CARD */}
      {selectedIndex !== null && (
        <div
          style={{
            marginTop: 18,
            padding: 12,
            borderRadius: 12,
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
          }}
        >
          <h4 style={{ margin: '0 0 10px 0' }}>Détail produit</h4>

          <table style={{ width: '100%', fontSize: 13 }}>
            <tbody>
              <tr>
                <td style={{ color: 'var(--fg-muted)' }}>Produit</td>
                <td>{chartLabels[selectedIndex]}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--fg-muted)' }}>Quantité</td>
                <td>{data[selectedIndex]}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--fg-muted)' }}>%</td>
                <td>{total ? Math.round(((data[selectedIndex] || 0) / total) * 100) : 0}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── BUTTON STYLE HELPER ─────────────────────────────
const btnStyle = (color) => ({
  background: color,
  border: 'none',
  padding: '6px 12px',
  borderRadius: '8px',
  color: 'var(--fg)',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
  transition: '0.2s',
});

export default TopProduitsChart;
