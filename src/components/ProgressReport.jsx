import { useMemo, useEffect, useRef } from 'react';
import { getProgressStats, exportReport } from '../utils/progressStore';
import './ProgressReport.css';

const LEVEL_NAMES = { 1: '🐦 Bird Flight', 2: '🔤 Vowel Finder', 3: '😊 Emotion Match' };

export default function ProgressReport({ onBack }) {
  const stats = useMemo(() => getProgressStats(), []);
  const chartRef = useRef(null);

  // Draw simple bar chart
  useEffect(() => {
    const canvas = chartRef.current;
    if (!canvas || stats.recentSessions.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const sessions = stats.recentSessions.slice(0, 15).reverse();
    const maxScore = Math.max(...sessions.map(s => s.score), 10);
    const barW = Math.min(40, (w - 60) / sessions.length - 6);
    const startX = 40;
    const colors = { 1: '#B8784E', 2: '#7A8F6E', 3: '#C8A45A' };

    // Grid lines
    ctx.strokeStyle = 'rgba(44,36,23,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 20 + (h - 50) * (i / 4);
      ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(w - 10, y); ctx.stroke();
      ctx.fillStyle = 'rgba(107,93,79,0.5)';
      ctx.font = '10px DM Sans';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxScore * (1 - i / 4)), startX - 6, y + 4);
    }

    // Bars
    sessions.forEach((s, i) => {
      const bh = (s.score / maxScore) * (h - 60);
      const x = startX + i * (barW + 6) + 10;
      const y = h - 30 - bh;
      const grad = ctx.createLinearGradient(x, y, x, h - 30);
      grad.addColorStop(0, colors[s.level] || '#7C5CFC');
      grad.addColorStop(1, 'rgba(184,120,78,0.15)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, bh, [4, 4, 0, 0]);
      ctx.fill();
    });
  }, [stats]);

  return (
    <div className="progress-screen">
      <div className="progress-container">
        <button className="hud-btn back-btn prog-back" onClick={onBack}>← Back</button>
        <h2 className="progress-title">📊 Progress Report</h2>
        <p className="progress-subtitle">Track your speech therapy journey!</p>

        <div className="progress-grid">
          <div className="progress-card"><div className="prog-icon">🎯</div><div className="prog-value">{stats.totalSessions}</div><div className="prog-label">Total Sessions</div></div>
          <div className="progress-card"><div className="prog-icon">⭐</div><div className="prog-value">{stats.totalScore}</div><div className="prog-label">Total Score</div></div>
          <div className="progress-card"><div className="prog-icon">🏆</div><div className="prog-value">{stats.bestScore}</div><div className="prog-label">Best Score</div></div>
          <div className="progress-card"><div className="prog-icon">📈</div><div className="prog-value">{stats.averageAccuracy}%</div><div className="prog-label">Avg Accuracy</div></div>
        </div>

        {stats.totalSessions > 0 && (
          <div className="progress-chart-section">
            <h3>Recent Sessions</h3>
            <div className="chart-wrap">
              <canvas ref={chartRef} className="progress-chart" />
            </div>
          </div>
        )}

        <div className="level-breakdown">
          <h3>Level Breakdown</h3>
          <div className="breakdown-grid">
            {[1, 2, 3].map(l => {
              const lb = stats.levelBreakdown[l];
              return (
                <div key={l} className="breakdown-card">
                  <div className="bd-header">{LEVEL_NAMES[l]}</div>
                  <div className="bd-stats">
                    <span>Played: <strong>{lb.played}</strong></span>
                    <span>Best: <strong>{lb.bestScore}</strong></span>
                    <span>Accuracy: <strong>{Math.round(lb.avgAccuracy)}%</strong></span>
                  </div>
                  <div className="bd-bar-track">
                    <div className="bd-bar-fill" style={{ width: `${Math.min(100, lb.avgAccuracy)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {stats.totalSessions > 0 && (
          <button className="btn-primary export-btn" onClick={exportReport}>📥 Export Report for Doctor/Parent</button>
        )}
        {stats.totalSessions === 0 && (
          <div className="no-data"><p>No sessions played yet! Start playing to see your progress. 🎮</p></div>
        )}
      </div>
    </div>
  );
}
