
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface Application {
  dateApplied: string;
}

interface GraphProps {
  apps: Application[];
}

const Graph: React.FC<GraphProps> = ({ apps }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const dateCounts: Record<string, number> = {};
    apps.forEach(app => {
      dateCounts[app.dateApplied] = (dateCounts[app.dateApplied] || 0) + 1;
    });

    const sortedDates = Object.keys(dateCounts).sort();
    const counts = sortedDates.map(date => dateCounts[date]);

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: sortedDates,
          datasets: [{
            label: 'Applications',
            data: counts,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.2)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#6366f1',
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: '#374151' } },
            y: { beginAtZero: true, grid: { color: '#374151' } }
          }
        }
      });
    }
  }, [apps]);

  return (
    <div className="graph" role="region" aria-label="Applications graph">
      <canvas ref={canvasRef} id="applicationsChart" />
      <div className="graph-label">Date</div>
    </div>
  );
};

export default Graph;

