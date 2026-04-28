import { useState, useEffect } from 'react';
import { getSettings, saveSettings, getChildName, saveChildName } from '../utils/progressStore';
import './Modals.css';

export function SettingsModal({ onClose }) {
  const [s, setS] = useState(() => ({ ...getSettings(), childName: getChildName() }));

  const handleSave = () => {
    saveSettings({ micSensitivity: s.micSensitivity, gameDuration: s.gameDuration, soundEffects: s.soundEffects });
    saveChildName(s.childName);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card">
        <h2>⚙️ Settings</h2>
        <div className="setting-row">
          <label htmlFor="child-name">Child's Name</label>
          <input type="text" id="child-name" placeholder="Enter name..."
            value={s.childName} onChange={e => setS({ ...s, childName: e.target.value })} />
        </div>
        <div className="setting-row">
          <label htmlFor="mic-sensitivity">Mic Sensitivity: {s.micSensitivity}</label>
          <input type="range" id="mic-sensitivity" min="1" max="10"
            value={s.micSensitivity} onChange={e => setS({ ...s, micSensitivity: +e.target.value })} />
        </div>
        <div className="setting-row">
          <label htmlFor="game-duration">Game Duration (Level 1)</label>
          <select id="game-duration" value={s.gameDuration}
            onChange={e => setS({ ...s, gameDuration: +e.target.value })}>
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
            <option value={90}>90 seconds</option>
            <option value={120}>120 seconds</option>
          </select>
        </div>
        <div className="setting-row toggle-row">
          <label>Sound Effects</label>
          <label className="toggle-switch">
            <input type="checkbox" checked={s.soundEffects}
              onChange={e => setS({ ...s, soundEffects: e.target.checked })} />
            <span className="toggle-slider" />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={handleSave}>Save ✓</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function HelpModal({ onClose }) {
  const steps = [
    { num: 1, title: 'Allow Microphone', desc: 'The game needs to hear your voice. Click "Allow" when asked.' },
    { num: 2, title: 'Choose a Level', desc: 'Start with Level 1 (Bird Flight) — it\'s easiest! Work your way up.' },
    { num: 3, title: 'Use Your Voice', desc: 'Each level uses your voice differently — volume, vowel sounds, or tone.' },
    { num: 4, title: 'Earn Rewards', desc: 'Collect stars, see confetti, and track your progress over time! 🌟' },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card modal-wide">
        <h2>❓ How to Play</h2>
        <div className="help-content">
          {steps.map(st => (
            <div key={st.num} className="help-step">
              <div className="help-num">{st.num}</div>
              <div><h4>{st.title}</h4><p>{st.desc}</p></div>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={onClose}>Got it! 👍</button>
      </div>
    </div>
  );
}

export function MicPermissionScreen({ onAllow }) {
  return (
    <div className="mic-permission-screen">
      <div className="permission-card">
        <div className="permission-icon">🎤</div>
        <h2>We Need Your Microphone!</h2>
        <p>This game uses your voice to play. Please allow microphone access to continue your adventure!</p>
        <button className="btn-primary" onClick={onAllow}>Allow Microphone 🎙️</button>
        <p className="permission-note">🔒 Your voice data stays on your device. We never record or store anything.</p>
      </div>
    </div>
  );
}
