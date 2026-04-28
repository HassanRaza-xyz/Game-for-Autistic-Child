import { useEffect, useState } from 'react';
import './LoadingScreen.css';

export default function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(timer); setTimeout(onDone, 400); return 100; }
        return p + Math.random() * 8 + 2;
      });
    }, 80);
    return () => clearInterval(timer);
  }, [onDone]);

  return (
    <div className="loading-screen">
      <div className="loader-content">
        <div className="loader-icon">
          <div className="loader-ring r1" />
          <div className="loader-ring r2" />
          <div className="loader-ring r3" />
          <span className="loader-emoji">🎤</span>
        </div>
        <h1 className="loader-title">SpeakQuest</h1>
        <p className="loader-subtitle">Loading your adventure...</p>
        <div className="loader-bar-container">
          <div className="loader-bar" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      </div>
    </div>
  );
}
