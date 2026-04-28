import { useRef, useCallback, useState } from 'react';

export function useAudioEngine() {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const bufRef = useRef(null);
  const freqRef = useRef(null);
  const jitBuf = useRef([]);

  const requestMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false }
      });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      ctx.createMediaStreamSource(stream).connect(analyser);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      streamRef.current = stream;
      bufRef.current = new Float32Array(analyser.fftSize);
      freqRef.current = new Uint8Array(analyser.frequencyBinCount);
      setHasPermission(true);
      setIsActive(true);
      return true;
    } catch (e) {
      console.error('Mic denied:', e);
      setHasPermission(false);
      return false;
    }
  }, []);

  const getVolume = useCallback((sensitivity = 5) => {
    if (!analyserRef.current || !bufRef.current) return 0;
    analyserRef.current.getFloatTimeDomainData(bufRef.current);
    let sum = 0;
    for (let i = 0; i < bufRef.current.length; i++) sum += bufRef.current[i] ** 2;
    const rms = Math.sqrt(sum / bufRef.current.length);
    return Math.min(100, rms * (0.5 + (sensitivity / 10) * 3.5) * 500);
  }, []);

  const getPitch = useCallback(() => {
    if (!analyserRef.current || !bufRef.current || !ctxRef.current) return 0;
    analyserRef.current.getFloatTimeDomainData(bufRef.current);
    const buf = bufRef.current, sr = ctxRef.current.sampleRate;
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] ** 2;
    if (Math.sqrt(rms / buf.length) < 0.01) return 0;
    let bestOff = -1, bestCorr = 0, found = false, last = 1;
    for (let off = 0; off < buf.length / 2; off++) {
      let c = 0;
      for (let i = 0; i < buf.length / 2; i++) c += Math.abs(buf[i] - buf[i + off]);
      c = 1 - c / (buf.length / 2);
      if (c > 0.9 && c > last) {
        found = true;
        if (c > bestCorr) { bestCorr = c; bestOff = off; }
      } else if (found) break;
      last = c;
    }
    return bestCorr > 0.01 && bestOff > 0 ? sr / bestOff : 0;
  }, []);

  const getEnergyBands = useCallback(() => {
    if (!analyserRef.current || !freqRef.current || !ctxRef.current) return { low: 0, mid: 0, high: 0, total: 0 };
    analyserRef.current.getByteFrequencyData(freqRef.current);
    const d = freqRef.current, bs = ctxRef.current.sampleRate / analyserRef.current.fftSize;
    let l = 0, m = 0, h = 0, lc = 0, mc = 0, hc = 0;
    for (let i = 0; i < d.length; i++) {
      const f = i * bs;
      if (f < 300) { l += d[i]; lc++; }
      else if (f < 2000) { m += d[i]; mc++; }
      else if (f < 6000) { h += d[i]; hc++; }
    }
    return {
      low: lc ? l / lc / 255 : 0, mid: mc ? m / mc / 255 : 0,
      high: hc ? h / hc / 255 : 0, total: (l + m + h) / ((lc + mc + hc) * 255 || 1)
    };
  }, []);

  const getJitter = useCallback(() => {
    const pitch = getPitch();
    if (pitch > 0) { jitBuf.current.push(pitch); if (jitBuf.current.length > 20) jitBuf.current.shift(); }
    const b = jitBuf.current;
    if (b.length < 3) return 0;
    let td = 0;
    for (let i = 1; i < b.length; i++) td += Math.abs(b[i] - b[i - 1]);
    const avg = b.reduce((s, v) => s + v, 0) / b.length;
    return avg > 0 ? (td / (b.length - 1) / avg) * 100 : 0;
  }, [getPitch]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (ctxRef.current?.state !== 'closed') ctxRef.current?.close();
    setIsActive(false);
  }, []);

  const resume = useCallback(async () => {
    if (ctxRef.current?.state === 'suspended') await ctxRef.current.resume();
  }, []);

  return { requestMic, getVolume, getPitch, getEnergyBands, getJitter, stop, resume, isActive, hasPermission };
}

export function useSpeechRecognition() {
  const recRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const cbRef = useRef(null);

  const startListening = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    if (recRef.current) try { recRef.current.abort(); } catch (e) {}
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US'; rec.maxAlternatives = 3;
    cbRef.current = onResult;
    rec.onresult = (e) => {
      let fin = '', inter = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t; else inter += t;
      }
      const combined = (fin || inter).trim().toLowerCase();
      setTranscript(combined);
      cbRef.current?.(combined, !!fin);
    };
    rec.onerror = (e) => { if (e.error !== 'no-speech' && e.error !== 'aborted') console.warn('SR error:', e.error); };
    rec.onend = () => { if (recRef.current) try { recRef.current.start(); } catch (e) {} };
    recRef.current = rec;
    try { rec.start(); setIsListening(true); return true; } catch (e) { return false; }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    try { recRef.current?.abort(); } catch (e) {}
    recRef.current = null;
  }, []);

  return { startListening, stopListening, isListening, transcript };
}
 