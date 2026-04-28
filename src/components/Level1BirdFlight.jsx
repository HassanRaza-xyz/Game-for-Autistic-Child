import { useEffect, useRef, useState, useCallback } from 'react';
import './Level1BirdFlight.css';

// Constants
const STAR_INTERVAL = 2000;
const CLOUD_INTERVAL = 3000;

export default function Level1BirdFlight({ audioEngine, settings, onBack, onComplete }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.gameDuration || 60);
  const [started, setStarted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  const startGame = useCallback(() => {
    setShowIntro(false);
    setStarted(true);
    audioEngine.resume();
  }, [audioEngine]);

  // Game Loop
  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const game = {
      bird: { x: 150, y: canvas.height / 2, targetY: canvas.height / 2, vy: 0, frame: 0, flapTimer: 0 },
      stars: [],
      clouds: [],
      particles: [],
      mountains: [],
      score: 0,
      lastStar: 0,
      lastCloud: 0,
      scrollX: 0,
    };

    // Generate initial clouds
    for (let i = 0; i < 5; i++) {
      game.clouds.push({
        x: Math.random() * canvas.width * 2,
        y: Math.random() * canvas.height * 0.5 + 30,
        w: Math.random() * 120 + 60,
        speed: Math.random() * 0.5 + 0.3,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    // Generate mountains
    for (let i = 0; i < 8; i++) {
      game.mountains.push({ x: i * 250, h: Math.random() * 120 + 60 });
    }

    gameRef.current = game;

    const drawBird = (ctx, x, y, frame) => {
      ctx.save();
      ctx.translate(x, y);
      // Body
      const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 22);
      grad.addColorStop(0, '#FFD700');
      grad.addColorStop(1, '#FFA500');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wing
      const wingY = Math.sin(frame * 0.3) * 12;
      ctx.fillStyle = '#FF8C00';
      ctx.beginPath();
      ctx.ellipse(-5, wingY - 5, 16, 8, -0.3 + Math.sin(frame * 0.3) * 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Eye
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.arc(12, -5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(13, -6, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.moveTo(22, -2);
      ctx.lineTo(32, 0);
      ctx.lineTo(22, 4);
      ctx.closePath();
      ctx.fill();
      // Tail
      ctx.fillStyle = '#FF8C00';
      ctx.beginPath();
      ctx.moveTo(-20, -3);
      ctx.lineTo(-35, -10);
      ctx.lineTo(-30, 0);
      ctx.lineTo(-35, 10);
      ctx.lineTo(-20, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawStar = (ctx, x, y, r, glow) => {
      if (glow) {
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
      }
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const fn = i === 0 ? 'moveTo' : 'lineTo';
        ctx[fn](x + Math.cos(a) * r, y + Math.sin(a) * r);
        const b = a + (2 * Math.PI) / 5;
        ctx.lineTo(x + Math.cos(b) * (r * 0.4), y + Math.sin(b) * (r * 0.4));
      }
      ctx.closePath();
      ctx.fill();
      if (glow) ctx.restore();
    };

    let animFrame = 0;
    const update = (timestamp) => {
      const g = gameRef.current;
      if (!g) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animFrame++;

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#D4E4ED');
      skyGrad.addColorStop(0.4, '#E8DDD0');
      skyGrad.addColorStop(0.7, '#F0E6D8');
      skyGrad.addColorStop(1, '#F5EFE7');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars background
      if (animFrame === 1) {
        g._bgStars = [];
        for (let i = 0; i < 60; i++) {
          g._bgStars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height * 0.7, r: Math.random() * 2 + 0.5, tw: Math.random() * Math.PI * 2 });
        }
      }
      g._bgStars?.forEach(s => {
        const tw = Math.sin(animFrame * 0.02 + s.tw) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(184,120,78,${tw * 0.15 + 0.05})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * tw + 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Mountains
      g.mountains.forEach((m, i) => {
        const mx = ((m.x - g.scrollX * 0.2) % (8 * 250)) + (i === 0 ? 0 : 0);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(122,143,110,0.25)' : 'rgba(150,120,90,0.15)';
        ctx.beginPath();
        ctx.moveTo(mx - 150, canvas.height);
        ctx.lineTo(mx, canvas.height - m.h - 60);
        ctx.lineTo(mx + 150, canvas.height);
        ctx.closePath();
        ctx.fill();
      });

      // Ground
      const groundGrad = ctx.createLinearGradient(0, canvas.height - 60, 0, canvas.height);
      groundGrad.addColorStop(0, '#A8C490');
      groundGrad.addColorStop(1, '#8BAF70');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
      // Grass line
      ctx.strokeStyle = '#6B9E6B';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 60);
      for (let x = 0; x < canvas.width; x += 5) {
        ctx.lineTo(x, canvas.height - 60 + Math.sin((x + g.scrollX) * 0.05) * 3);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Clouds
      g.clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x + c.w < 0) { c.x = canvas.width + 50; c.y = Math.random() * canvas.height * 0.4 + 30; }
        ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity + 0.2})`;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.w / 2, c.w / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c.x - c.w * 0.25, c.y + 5, c.w / 3, c.w / 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c.x + c.w * 0.25, c.y + 8, c.w / 3.5, c.w / 6, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Volume and bird
      const vol = audioEngine.getVolume(settings.micSensitivity || 5);
      setVolume(vol);
      g.bird.targetY = canvas.height - 80 - (vol / 100) * (canvas.height - 160);
      g.bird.y += (g.bird.targetY - g.bird.y) * 0.08;
      g.bird.y = Math.max(30, Math.min(canvas.height - 80, g.bird.y));
      g.bird.frame = animFrame;
      g.scrollX += 2;

      // Spawn stars
      if (timestamp - g.lastStar > STAR_INTERVAL) {
        g.stars.push({
          x: canvas.width + 30,
          y: Math.random() * (canvas.height - 160) + 80,
          r: 14,
          collected: false,
          glow: Math.random() > 0.5,
        });
        g.lastStar = timestamp;
      }

      // Update stars
      g.stars = g.stars.filter(s => {
        s.x -= 3;
        if (s.x < -30) return false;
        // Collision with bird
        if (!s.collected) {
          const dx = s.x - g.bird.x;
          const dy = s.y - g.bird.y;
          if (Math.sqrt(dx * dx + dy * dy) < 35) {
            s.collected = true;
            g.score += 10;
            setScore(g.score);
            // Particles
            for (let i = 0; i < 8; i++) {
              g.particles.push({
                x: s.x, y: s.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                color: ['#C8A45A', '#B8784E', '#D4976A', '#7A8F6E'][Math.floor(Math.random() * 4)],
              });
            }
          }
        }
        return true;
      });

      // Draw stars
      g.stars.forEach(s => {
        if (!s.collected) {
          const bob = Math.sin(animFrame * 0.05 + s.x) * 5;
          drawStar(ctx, s.x, s.y + bob, s.r, s.glow);
        }
      });

      // Particles
      g.particles = g.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        if (p.life <= 0) return false;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });

      // Draw bird
      drawBird(ctx, g.bird.x, g.bird.y, g.bird.frame);

      // Volume trail
      ctx.strokeStyle = `rgba(184, 120, 78, ${vol / 200})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(g.bird.x - 30, g.bird.y);
      ctx.quadraticCurveTo(g.bird.x - 60, g.bird.y + Math.sin(animFrame * 0.1) * 10, g.bird.x - 90, g.bird.y);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [started, audioEngine, settings]);

  // Timer
  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          const g = gameRef.current;
          onComplete({ score: g?.score || score, level: 1, accuracy: Math.min(100, Math.round((g?.score || score) / ((settings.gameDuration || 60) * 0.15))) });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, onComplete, score, settings.gameDuration]);

  return (
    <div className="level1-screen">
      <div className="game-hud">
        <button className="hud-btn back-btn" onClick={onBack}>← Back</button>
        <div className="hud-center">
          <span className="hud-level">Level 1</span>
          <span className="hud-title">Bird Flight 🐦</span>
        </div>
        <div className="hud-right">
          <div className="score-display">⭐ {score}</div>
          <div className="timer-display">⏱ {timeLeft}s</div>
        </div>
      </div>
      <canvas ref={canvasRef} className="game-canvas" />
      <div className="voice-meter">
        <div className="meter-label">Your Voice</div>
        <div className="meter-bar-wrap">
          <div className="meter-bar-fill" style={{ height: `${volume}%`, background: volume > 60 ? 'var(--grad-warm)' : 'var(--grad-primary)' }} />
        </div>
        <div className="meter-value">{Math.round(volume)}%</div>
      </div>

      {showIntro && (
        <div className="game-overlay-info">
          <div className="overlay-card">
            <h2>🐦 Bird Flight</h2>
            <p>Speak louder to make the bird fly higher!<br />Collect the golden stars ⭐ for points!</p>
            <div className="volume-guide">
              <div className="guide-row"><span className="guide-label">🤫 Quiet</span><div className="guide-bar"><div className="guide-fill low" /></div><span className="guide-text">Bird flies low</span></div>
              <div className="guide-row"><span className="guide-label">🗣️ Medium</span><div className="guide-bar"><div className="guide-fill mid" /></div><span className="guide-text">Bird flies middle</span></div>
              <div className="guide-row"><span className="guide-label">📢 Loud</span><div className="guide-bar"><div className="guide-fill high" /></div><span className="guide-text">Bird flies high!</span></div>
            </div>
            <button className="btn-primary btn-start-game" onClick={startGame}>Start! 🚀</button>
          </div>
        </div>
      )}
    </div>
  );
}
