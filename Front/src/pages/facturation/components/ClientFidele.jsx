import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';

const DEFAULT_DATA = [
  { name: 'Client Ahmed', total: 4500, commandes: 12, retour: 1, mois: [300, 450, 380, 500, 420, 550, 480, 600, 520, 580, 610, 650] },
  { name: 'Société Alpha', total: 3200, commandes: 8, retour: 0, mois: [200, 280, 310, 260, 340, 300, 380, 320, 290, 350, 370, 400] },
  { name: 'Client Moncef', total: 2800, commandes: 5, retour: 2, mois: [180, 220, 200, 250, 230, 270, 240, 290, 260, 310, 280, 320] },
  { name: 'Magasin Central', total: 2100, commandes: 9, retour: 1, mois: [150, 180, 160, 200, 190, 210, 180, 230, 200, 220, 240, 260] },
  { name: 'Client Sonia', total: 1500, commandes: 4, retour: 0, mois: [100, 120, 110, 140, 130, 150, 140, 160, 150, 170, 160, 180] },
];

const LABELS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
const COLORS = ['#60a5fa','#34d399','#a78bfa','#f59e0b','#f87171'];

const score = (c) =>
  Math.round((c.commandes * 10) - (c.retour * 8) + (c.total / 500));

/* ================= LINE CHART ================= */
const FideliteLineChart = ({ clients, selected, chartRefExport }) => {
  const ref = useRef(null);
  const instance = useRef(null);

  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    if (instance.current) instance.current.destroy();

    const mkGradient = (color) => {
      const g = ctx.createLinearGradient(0, 0, 0, 260);
      g.addColorStop(0, color + '40');
      g.addColorStop(1, color + '05');
      return g;
    };

    const datasets = clients.map((c, i) => ({
      label: c.name,
      data: c.mois,
      borderColor: COLORS[i],
      backgroundColor: selected === i ? mkGradient(COLORS[i]) : 'transparent',
      fill: selected === i,
      tension: 0.45,
      borderWidth: selected === i ? 3 : 1.2,
      borderDash: selected === i ? [] : [6, 6],
      pointBackgroundColor: COLORS[i],
      pointBorderColor: '#0f172a',
      pointBorderWidth: 2,
      pointRadius: selected === i ? 5 : 3,
    }));

    instance.current = new Chart(ctx, {
      type: 'line',
      data: { labels: LABELS, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} DT`,
            }
          }
        },
        scales: {
          x: { ticks: { color: 'var(--fg-muted)' } },
          y: { ticks: { color: 'var(--fg-muted)' } }
        }
      }
    });

    if (chartRefExport) chartRefExport.current = instance.current;

    return () => instance.current?.destroy();
  }, [clients, selected]);

  return <div style={{ height: 240 }}><canvas ref={ref} /></div>;
};

/* ================= MAIN ================= */
const ClientFidele = ({ data }) => {
  const clients = data || DEFAULT_DATA;
  const [selected, setSelected] = useState(0);

  const chartRef = useRef(null);
  const containerRef = useRef(null);

  const sorted = [...clients].sort((a,b)=>score(b)-score(a));

  /* ================= EXPORT PNG ================= */
  const downloadPNG = async () => {
    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: null,
      scale: 2
    });

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients-fideles.png';
    a.click();
  };

  /* ================= EXPORT SVG ================= */
  const downloadSVG = () => {
    const canvas = chartRef.current.canvas;
    const img = canvas.toDataURL();

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
        <image href="${img}" width="100%" height="100%"/>
      </svg>
    `;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart.svg';
    a.click();

    URL.revokeObjectURL(url);
  };

  /* ================= UI ================= */
  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative group">

      {/* HEADER */}
      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom:12
      }}>
        <h3 style={{ margin:0 }}>Clients fidèles</h3>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={downloadPNG} style={btn}>PNG</button>
          <button onClick={downloadSVG} style={btn}>SVG</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ display:'flex', gap:20 }}>

        {/* CHART */}
        <div style={{ flex:2 }}>
          <FideliteLineChart
            clients={sorted}
            selected={selected}
            chartRefExport={chartRef}
          />
        </div>

        {/* SIDEBAR CLIENTS */}
        <div style={{
          flex:1,
          background:'rgba(15,23,42,0.6)',
          border:'1px solid rgba(148,163,184,.1)',
          borderRadius:12,
          padding:12,
          maxHeight:260,
          overflowY:'auto'
        }}>
          <h4 style={{ marginBottom:10 }}>Top Clients</h4>

          {sorted.map((c, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              style={{
                padding:10,
                marginBottom:8,
                borderRadius:8,
                cursor:'pointer',
                background: selected === i ? COLORS[i] + '33' : 'transparent',
                border: selected === i ? `1px solid ${COLORS[i]}` : '1px solid transparent'
              }}
            >
              <div style={{ fontWeight:600 }}>{c.name}</div>
              <div style={{ fontSize:12, opacity:0.8 }}>
                💰 {c.total} DT
              </div>
              <div style={{ fontSize:11, opacity:0.6 }}>
                📦 {c.commandes} commandes | 🔁 {c.retour} retours
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

/* ================= STYLE ================= */
const btn = {
  background:'#1e293b',
  border:'1px solid rgba(148,163,184,.2)',
  color: 'var(--fg)',
  padding:'6px 10px',
  borderRadius:8,
  fontSize:11,
  cursor:'pointer'
};

export default ClientFidele;