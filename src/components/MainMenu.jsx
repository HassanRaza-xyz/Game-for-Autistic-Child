import './MainMenu.css';

const levels = [
  { id: 1, icon: '🐦', title: 'Bird Flight', desc: 'Control a bird with your voice volume! Speak louder to fly higher!', diff: 1, color: '#B8784E' },
  { id: 2, icon: '🔤', title: 'Vowel Finder', desc: 'Say the right vowel sound to unlock the magical path!', diff: 2, color: '#7A8F6E' },
  { id: 3, icon: '😊', title: 'Emotion Match', desc: 'Match the face emotion by speaking in the right tone!', diff: 3, color: '#C8A45A' },
];

export default function MainMenu({ onSelectLevel, onProgress, onSettings, onHelp, childName }) {
  return (
    <div className="main-menu">
      <div className="floating-shapes">
        {[...Array(8)].map((_, i) => <div key={i} className={`shape shape-${i + 1}`} />)}
      </div>
      <div className="menu-content">
        <div className="logo-section">
          <div className="logo-icon-wrap">
            <span className="logo-mic">🎙️</span>
            <div className="logo-pulse" />
          </div>
          <h1 className="game-title">SpeakQuest</h1>
          <p className="game-tagline">
            {childName ? `Welcome back, ${childName}! ` : ''}Your Voice is Your Superpower! ✨
          </p>
        </div>

        <div className="level-cards">
          {levels.map((lv, idx) => (
            <div key={lv.id} className={`level-card level-card-${lv.id}`}
              style={{ animationDelay: `${idx * 0.15}s`, '--card-color': lv.color }}
              onClick={() => onSelectLevel(lv.id)}>
              <div className="card-glow" />
              <div className="card-icon">{lv.icon}</div>
              <div className="card-badge">Level {lv.id}</div>
              <h3 className="card-title">{lv.title}</h3>
              <p className="card-desc">{lv.desc}</p>
              <div className="card-difficulty">
                {[1, 2, 3].map(d => <span key={d} className={`diff-dot ${d <= lv.diff ? 'active' : ''}`} />)}
              </div>
              <button className="play-btn" onClick={(e) => { e.stopPropagation(); onSelectLevel(lv.id); }}>
                Play Now ▶
              </button>
            </div>
          ))}
        </div>

        <div className="menu-footer">
          <button className="footer-btn" onClick={onProgress}>📊 Progress</button>
          <button className="footer-btn" onClick={() => window.open('/presentation.html', '_blank')}>📑 Presentation</button>
          <button className="footer-btn" onClick={onSettings}>⚙️ Settings</button>
          <button className="footer-btn" onClick={onHelp}>❓ How to Play</button>
        </div>
      </div>
    </div>
  );
}
