import { useState, useEffect, useCallback, useRef } from 'react';
import './Level3EmotionMatch.css';

const EMOTIONS = [
  { name: 'Happy', emoji: '😊', hint: 'Speak in a happy, excited voice! 🎉', eyeStyle: 'happy', mouthStyle: 'smile', targetEnergy: [0.55, 1.0], targetPitch: [200, 500], color: '#FFD700' },
  { name: 'Sad', emoji: '😢', hint: 'Speak softly and slowly... 💧', eyeStyle: 'sad', mouthStyle: 'frown', targetEnergy: [0, 0.35], targetPitch: [80, 200], color: '#6B9FFF' },
  { name: 'Surprised', emoji: '😮', hint: 'Say "Woah!" or "Oh!" loudly! ⚡', eyeStyle: 'surprised', mouthStyle: 'open', targetEnergy: [0.6, 1.0], targetPitch: [250, 600], color: '#FF6B9D' },
  { name: 'Calm', emoji: '😌', hint: 'Speak gently and steadily... 🍃', eyeStyle: 'calm', mouthStyle: 'neutral', targetEnergy: [0.15, 0.45], targetPitch: [100, 250], color: '#4ADE80' },
];
const TOTAL_ROUNDS = 8;
const ROUND_DURATION = 6000;

export default function Level3EmotionMatch({ audioEngine, settings, onBack, onComplete }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(null);
  const [energy, setEnergy] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [started, setStarted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [timeBar, setTimeBar] = useState(100);
  const correctCount = useRef(0);
  const roundTimer = useRef(null);
  const sampleBuf = useRef([]);
  const rafRef = useRef(null);

  const pickTarget = useCallback(() => {
    const em = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
    setTarget(em);
    setFeedback(null);
    setTimeBar(100);
    sampleBuf.current = [];
  }, []);

  const startGame = useCallback(() => {
    setShowIntro(false);
    setStarted(true);
    audioEngine.resume();
    pickTarget();
  }, [audioEngine, pickTarget]);

  // Evaluate round
  const evaluateRound = useCallback(() => {
    if (!target || sampleBuf.current.length === 0) {
      // No voice detected
      setFeedback({ type: 'wrong', text: "I didn't hear your voice! Try speaking louder next time." });
    } else {
      const avgEnergy = sampleBuf.current.reduce((s, v) => s + v, 0) / sampleBuf.current.length;
      const [minE, maxE] = target.targetEnergy;
      const normalizedEnergy = avgEnergy / 100;
      const inRange = normalizedEnergy >= minE && normalizedEnergy <= maxE;
      // Be lenient — partial match also counts
      const closeness = Math.max(0, 1 - Math.abs(normalizedEnergy - (minE + maxE) / 2) / ((maxE - minE) / 2 + 0.3));
      if (inRange || closeness > 0.5) {
        correctCount.current++;
        const pts = Math.round(closeness * 20);
        setScore(s => s + pts);
        setFeedback({ type: 'correct', text: `🌟 Great ${target.name} voice! +${pts} points!` });
      } else {
        setFeedback({ type: 'wrong', text: `Not quite ${target.name}. ${normalizedEnergy > (minE + maxE) / 2 ? 'Try softer!' : 'Try louder!'}` });
      }
    }
    setTimeout(() => {
      setRound(r => {
        const next = r + 1;
        if (next >= TOTAL_ROUNDS) {
          onComplete({
            score: correctCount.current * 15 + score,
            level: 3,
            accuracy: Math.round((correctCount.current / TOTAL_ROUNDS) * 100),
            correct: correctCount.current,
            total: TOTAL_ROUNDS,
          });
        } else {
          pickTarget();
        }
        return next;
      });
    }, 2200);
  }, [target, pickTarget, onComplete, score]);

  // Game loop — sample audio and manage timer
  useEffect(() => {
    if (!started || !target) return;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / ROUND_DURATION) * 100);
      setTimeBar(remaining);
      // Sample volume
      const vol = audioEngine.getVolume(settings.micSensitivity || 5);
      setEnergy(vol);
      if (vol > 3) sampleBuf.current.push(vol);
      if (elapsed >= ROUND_DURATION) {
        evaluateRound();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [started, target, audioEngine, settings, evaluateRound]);

  // Get face style
  const getFaceMouth = () => {
    if (!target) return null;
    switch (target.mouthStyle) {
      case 'smile': return <path d="M 25 55 Q 40 75 55 55" stroke={target.color} strokeWidth="4" fill="none" strokeLinecap="round" />;
      case 'frown': return <path d="M 25 65 Q 40 50 55 65" stroke={target.color} strokeWidth="4" fill="none" strokeLinecap="round" />;
      case 'open': return <ellipse cx="40" cy="60" rx="10" ry="14" fill={target.color} opacity="0.3" stroke={target.color} strokeWidth="3" />;
      case 'neutral': return <line x1="28" y1="58" x2="52" y2="58" stroke={target.color} strokeWidth="4" strokeLinecap="round" />;
      default: return null;
    }
  };

  const getFaceEyes = () => {
    if (!target) return null;
    switch (target.eyeStyle) {
      case 'happy': return (<><path d="M 22 35 Q 28 28 34 35" stroke="white" strokeWidth="3" fill="none" /><path d="M 46 35 Q 52 28 58 35" stroke="white" strokeWidth="3" fill="none" /></>);
      case 'sad': return (<><ellipse cx="28" cy="33" rx="5" ry="6" fill="white" /><ellipse cx="52" cy="33" rx="5" ry="6" fill="white" /><path d="M 22 28 L 34 32" stroke="white" strokeWidth="2" /><path d="M 58 28 L 46 32" stroke="white" strokeWidth="2" /></>);
      case 'surprised': return (<><circle cx="28" cy="33" r="7" fill="white" /><circle cx="28" cy="33" r="4" fill="#1a1a2e" /><circle cx="52" cy="33" r="7" fill="white" /><circle cx="52" cy="33" r="4" fill="#1a1a2e" /></>);
      case 'calm': return (<><ellipse cx="28" cy="35" rx="6" ry="3" fill="white" /><ellipse cx="52" cy="35" rx="6" ry="3" fill="white" /></>);
      default: return null;
    }
  };

  return (
    <div className="level3-screen">
      <div className="game-hud">
        <button className="hud-btn back-btn" onClick={onBack}>← Back</button>
        <div className="hud-center">
          <span className="hud-level">Level 3</span>
          <span className="hud-title">Emotion Match 😊</span>
        </div>
        <div className="hud-right">
          <div className="score-display">⭐ {score}</div>
          <div className="round-display">Round {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
        </div>
      </div>

      {started && target && (
        <div className="emotion-game-area">
          <div className="emotion-face-container">
            <div className="emotion-face" style={{ '--face-color': target.color }}>
              <svg viewBox="0 0 80 80" className="face-svg">
                <circle cx="40" cy="40" r="38" fill="rgba(124,92,252,0.1)" stroke={target.color} strokeWidth="3" />
                {getFaceEyes()}
                {getFaceMouth()}
              </svg>
            </div>
            <div className="emotion-label" style={{ color: target.color }}>{target.name}</div>
            <div className="emotion-hint">{target.hint}</div>
          </div>

          <div className="emotion-meter-section">
            <div className="emotion-time-bar">
              <div className="time-bar-fill" style={{ width: `${timeBar}%` }} />
            </div>
            <div className="emotion-meter-label">Your Voice Energy</div>
            <div className="emotion-meter-track">
              <div className="emotion-meter-fill" style={{ width: `${Math.min(100, energy)}%`, background: target.color }} />
              <div className="emotion-meter-target"
                style={{ left: `${target.targetEnergy[0] * 100}%`, width: `${(target.targetEnergy[1] - target.targetEnergy[0]) * 100}%` }} />
            </div>
            <div className="emotion-meter-labels">
              <span>😴 Calm</span><span>😊 Normal</span><span>🤩 Excited</span>
            </div>
          </div>

          <div className="listening-indicator">
            <div className="listen-wave">
              {[...Array(5)].map((_, i) => <span key={i} style={{ animationDelay: `${i * 0.1}s`, background: target.color }} />)}
            </div>
            <p>Listening to your voice...</p>
          </div>

          {feedback && (
            <div className={`emotion-feedback ${feedback.type}`}>{feedback.text}</div>
          )}
        </div>
      )}

      {showIntro && (
        <div className="game-overlay-info">
          <div className="overlay-card">
            <h2>😊 Emotion Match</h2>
            <p>Match your voice tone to the emotion shown on screen!</p>
            <div className="emotion-examples">
              {EMOTIONS.map(em => (
                <div key={em.name} className="em-ex">
                  <span className="em-face">{em.emoji}</span>
                  <span>{em.name} = {em.hint}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary btn-start-game" onClick={startGame}>Start! 🚀</button>
          </div>
        </div>
      )}
    </div>
  );
}
