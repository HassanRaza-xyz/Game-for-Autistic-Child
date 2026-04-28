import { useEffect, useRef } from 'react';
import Confetti from './Confetti';
import './ResultsScreen.css';

const titles = {
  high: ['🏆 Superstar!', '🌟 Incredible!', '🎉 Amazing Job!', '✨ Brilliant!'],
  mid: ['👏 Great Work!', '💪 Well Done!', '🎯 Nice Try!', '😊 Good Job!'],
  low: ['🌱 Keep Trying!', '💫 You Can Do It!', '🎈 Good Start!', '🌈 Keep Going!'],
};

export default function ResultsScreen({ results, onReplay, onMenu }) {
  const scoreRef = useRef(null);
  const accuracy = results.accuracy || 0;
  const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : accuracy > 0 ? 1 : 0;
  const tier = accuracy >= 70 ? 'high' : accuracy >= 40 ? 'mid' : 'low';
  const title = titles[tier][Math.floor(Math.random() * titles[tier].length)];

  // Animate score counter
  useEffect(() => {
    let current = 0;
    const target = results.score;
    const step = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      if (scoreRef.current) scoreRef.current.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [results.score]);

  return (
    <div className="results-screen">
      <Confetti active={stars >= 2} />
      <div className="results-card">
        <div className="results-stars">
          {[1, 2, 3].map(i => (
            <span key={i} className={`result-star ${i <= stars ? 'active' : ''}`}
              style={{ animationDelay: `${i * 0.2}s` }}>⭐</span>
          ))}
        </div>
        <h2 className="results-title">{title}</h2>
        <div className="results-score-big" ref={scoreRef}>0</div>
        <p className="results-label">Points Earned!</p>
        <div className="results-stats">
          <div className="stat-item">
            <span className="stat-icon">🎯</span>
            <span className="stat-val">{accuracy}%</span>
            <span className="stat-lbl">Accuracy</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🎮</span>
            <span className="stat-val">Level {results.level}</span>
            <span className="stat-lbl">Completed</span>
          </div>
          {results.correct !== undefined && (
            <div className="stat-item">
              <span className="stat-icon">✅</span>
              <span className="stat-val">{results.correct}/{results.total}</span>
              <span className="stat-lbl">Correct</span>
            </div>
          )}
        </div>
        <div className="results-buttons">
          <button className="btn-primary" onClick={onReplay}>Play Again 🔄</button>
          <button className="btn-secondary" onClick={onMenu}>Main Menu 🏠</button>
        </div>
      </div>
    </div>
  );
}
