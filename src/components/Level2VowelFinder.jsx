import { useState, useEffect, useCallback, useRef } from 'react';
import './Level2VowelFinder.css';

const VOWELS = [
  { letter: 'A', phonetic: '"Aah" like in Apple 🍎', keywords: ['a', 'ah', 'aah', 'aaa'] },
  { letter: 'E', phonetic: '"Eh" like in Egg 🥚', keywords: ['e', 'eh', 'ay', 'hey'] },
  { letter: 'I', phonetic: '"Ee" like in Ice cream 🍦', keywords: ['i', 'ee', 'eee', 'eye'] },
  { letter: 'O', phonetic: '"Oh" like in Orange 🍊', keywords: ['o', 'oh', 'ooh', 'ooo'] },
  { letter: 'U', phonetic: '"Oo" like in Unicorn 🦄', keywords: ['u', 'oo', 'ooo', 'you', 'who'] },
];
const TOTAL_ROUNDS = 10;

export default function Level2VowelFinder({ audioEngine, speechRec, settings, onBack, onComplete }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [doorStates, setDoorStates] = useState({});
  const [started, setStarted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [listening, setListening] = useState(false);
  const correctCount = useRef(0);
  const roundActive = useRef(false);
  const feedbackTimer = useRef(null);

  const pickTarget = useCallback(() => {
    const v = VOWELS[Math.floor(Math.random() * VOWELS.length)];
    setTarget(v);
    setDoorStates({});
    setFeedback(null);
    roundActive.current = true;
  }, []);

  const startGame = useCallback(() => {
    setShowIntro(false);
    setStarted(true);
    audioEngine.resume();
    pickTarget();
  }, [audioEngine, pickTarget]);

  // Handle speech recognition results
  const handleSpeechResult = useCallback((text, isFinal) => {
    if (!roundActive.current || !target) return;
    const lower = text.trim().toLowerCase();
    // Check if speech contains the target vowel sound
    let matched = null;
    for (const v of VOWELS) {
      const isMatch = v.keywords.some(k => lower.includes(k)) || lower.includes(v.letter.toLowerCase());
      if (isMatch) { matched = v.letter; break; }
    }
    if (!matched) return;
    roundActive.current = false;
    if (matched === target.letter) {
      correctCount.current++;
      setScore(s => s + 15);
      setDoorStates(prev => ({ ...prev, [matched]: 'correct' }));
      setFeedback({ type: 'correct', text: '🌟 Amazing! You said it perfectly!' });
    } else {
      setDoorStates(prev => ({ ...prev, [matched]: 'wrong', [target.letter]: 'hint' }));
      setFeedback({ type: 'wrong', text: `Almost! That was "${matched}". Try "${target.letter}" next time!` });
    }
    // Next round after delay
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setRound(r => {
        const next = r + 1;
        if (next >= TOTAL_ROUNDS) {
          onComplete({
            score: correctCount.current * 15,
            level: 2,
            accuracy: Math.round((correctCount.current / TOTAL_ROUNDS) * 100),
            correct: correctCount.current,
            total: TOTAL_ROUNDS,
          });
        } else {
          pickTarget();
        }
        return next;
      });
    }, 2000);
  }, [target, pickTarget, onComplete]);

  // Start/stop speech recognition
  useEffect(() => {
    if (!started || !speechRec) return;
    speechRec.startListening(handleSpeechResult);
    setListening(true);
    return () => { speechRec.stopListening(); setListening(false); };
  }, [started, speechRec, handleSpeechResult]);

  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);

  return (
    <div className="level2-screen">
      <div className="game-hud">
        <button className="hud-btn back-btn" onClick={onBack}>← Back</button>
        <div className="hud-center">
          <span className="hud-level">Level 2</span>
          <span className="hud-title">Vowel Finder 🔤</span>
        </div>
        <div className="hud-right">
          <div className="score-display">⭐ {score}</div>
          <div className="round-display">Round {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
        </div>
      </div>

      {started && target && (
        <div className="vowel-game-area">
          <div className="vowel-prompt-section">
            <p className="vowel-instruction">Say this vowel sound:</p>
            <div className="vowel-target">{target.letter}</div>
            <div className="vowel-phonetic">{target.phonetic}</div>
          </div>
          <div className="vowel-grid">
            {VOWELS.map(v => (
              <div key={v.letter} className={`vowel-door ${doorStates[v.letter] || ''} ${v.letter === target.letter ? 'is-target' : ''}`}>
                <span className="door-letter">{v.letter}</span>
                <div className="door-status">
                  {doorStates[v.letter] === 'correct' && '✅'}
                  {doorStates[v.letter] === 'wrong' && '❌'}
                  {doorStates[v.letter] === 'hint' && '👈'}
                </div>
              </div>
            ))}
          </div>
          {listening && !feedback && (
            <div className="listening-indicator">
              <div className="listen-wave">
                {[...Array(5)].map((_, i) => <span key={i} style={{ animationDelay: `${i * 0.1}s` }} />)}
              </div>
              <p>Listening... Say "{target.letter}"!</p>
            </div>
          )}
          {feedback && (
            <div className={`vowel-feedback ${feedback.type}`}>
              {feedback.text}
            </div>
          )}
        </div>
      )}

      {showIntro && (
        <div className="game-overlay-info">
          <div className="overlay-card">
            <h2>🔤 Vowel Finder</h2>
            <p>Say the correct vowel sound to unlock the magical door!<br/>There are 5 vowels: <strong>A, E, I, O, U</strong></p>
            <div className="vowel-examples">
              {VOWELS.map(v => <span key={v.letter} className="vowel-ex">{v.letter} - {v.phonetic}</span>)}
            </div>
            <button className="btn-primary btn-start-game" onClick={startGame}>Start! 🚀</button>
          </div>
        </div>
      )}
    </div>
  );
}
