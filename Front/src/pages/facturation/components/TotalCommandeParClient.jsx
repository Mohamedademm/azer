import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';

const DEFAULT_DATA = [
  { name: 'Client Ahmed', total: 4500, count: 12 },
  { name: 'Société Alpha', total: 3200, count: 8 },
  { name: 'Client Moncef', total: 2800, count: 5 },
  { name: 'Magasin Central', total: 2100, count: 9 },
  { name: 'Client Sonia', total: 1500, count: 4 },
];

const COLORS = ['#60a5fa', '#34d399', '#a78bfa', '#f59e0b', '#f87171'];

const TotalCommandeParClient = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const containerRef = useRef(null);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const rowRefs = useRef([]);

  const clients = data || DEFAULT_DATA;

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');
    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: clients.map(c => c.name.split(' ')[1] || c.name.split(' ')[0]),
        datasets: [{
          data: clients.map(c => c.total),
          backgroundColor: COLORS.map(c => c + 'cc'),
          borderColor: COLORS,
          borderWidth: 1.5,
          borderRadius: 7,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        onClick: (event, elements) => {
          if (!elements.length) return;

          const index = elements[0].index;
          setSelectedIndex(index);

          rowRefs.current[index]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        },

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
              title: (items) => [clients[items[0].dataIndex].name],
              label: (item) => `  ${item.parsed.y.toLocaleString()} DT`,
            }
          }
        },

        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11 } },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148,163,184,0.07)', borderDash: [4, 4] },
            ticks: {
              color: '#64748b',
              font: { size: 11 },
              callback: v => v >= 1000 ? v / 1000 + 'k' : v,
            },
            border: { display: false },
          }
        },

        animation: { duration: 700, easing: 'easeOutQuart' }
      }
    });

    return () => chartInstance.current?.destroy();
  }, [data]);

  /* ================= EXPORT PNG ================= */
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
    link.download = 'chart-client.png';
    link.click();
  };

  /* ================= EXPORT SVG ================= */
  const downloadSVG = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');

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
    link.download = 'chart-client.svg';
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
      <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ color: 'var(--fg)' }}>Commandes par client</h3>

        {/* BUTTONS (only change here) */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={downloadPNG} style={btnStyle}>PNG</button>
          <button onClick={downloadSVG} style={btnStyle}>SVG</button>
        </div>
      </div>

      {/* CHART */}
      <div style={{ height: '200px', marginBottom: '18px' }}>
        <canvas ref={chartRef} />
      </div>

      {/* TABLE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <tbody>
          {clients.map((c, i) => {
            const isActive = selectedIndex === i;

            return (
              <tr
                key={i}
                ref={(el) => (rowRefs.current[i] = el)}
                style={{
                  transition: '0.2s',
                  background: isActive ? 'rgba(96,165,250,.08)' : 'transparent',
                  borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                }}
              >
                <td style={{ padding: '10px', color: 'var(--fg)' }}>{i + 1}</td>
                <td style={{ padding: '10px', color: 'var(--fg)' }}>{c.name}</td>
                <td style={{ padding: '10px', color: '#60a5fa', fontWeight: 600 }}>{c.count}</td>
                <td style={{ padding: '10px', color: '#34d399', fontWeight: 600 }}>
                  {c.total.toLocaleString()} DT
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

    </div>
  );
};

export default TotalCommandeParClient;