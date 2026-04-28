/* ===== PROGRESS STORE =====
   Manages game progress data in localStorage
   Provides reports for parents/doctors
*/

const STORAGE_KEY = 'speakquest_progress';
const TOKEN_KEY = 'speakquest_token';
const REFRESH_KEY = 'speakquest_refresh_token';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const DEFAULT_SETTINGS = {
  micSensitivity: 5,
  gameDuration: 60,
  soundEffects: true,
};

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setAuthToken(token, refreshToken) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (!options.skipAuth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

async function syncProfile() {
  if (!getAuthToken()) return;
  const data = getProgress();
  try {
    await apiRequest('/api/profile/', {
      method: 'PUT',
      body: JSON.stringify({
        child_name: data.childName,
        settings: data.settings,
      }),
    });
  } catch (e) {
    console.warn('Failed to sync profile:', e);
  }
}

async function syncSession(session) {
  if (!getAuthToken()) return;
  try {
    await apiRequest('/api/sessions/', {
      method: 'POST',
      body: JSON.stringify({
        level: session.level,
        score: session.score || 0,
        accuracy: session.accuracy || 0,
        correct: session.correct,
        total: session.total,
        duration: session.duration,
      }),
    });
  } catch (e) {
    console.warn('Failed to sync session:', e);
  }
}

function getProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        childName: parsed.childName || '',
        sessions: parsed.sessions || [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      };
    }
  } catch (e) {
    console.warn('Failed to load progress:', e);
  }
  return {
    childName: '',
    sessions: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save progress:', e);
  }
}

export function getSettings() {
  return getProgress().settings;
}

export function saveSettings(settings) {
  const data = getProgress();
  data.settings = { ...data.settings, ...settings };
  saveProgress(data);
  void syncProfile();
}

export function getChildName() {
  return getProgress().childName || '';
}

export function saveChildName(name) {
  const data = getProgress();
  data.childName = name;
  saveProgress(data);
  void syncProfile();
}

export function addSession(session) {
  const data = getProgress();
  data.sessions.push({
    ...session,
    timestamp: Date.now(),
  });
  saveProgress(data);
  void syncSession(session);
}

export function getSessions() {
  return getProgress().sessions;
}

export function getProgressStats() {
  const sessions = getSessions();
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalScore: 0,
      bestScore: 0,
      averageAccuracy: 0,
      levelBreakdown: {
        1: { played: 0, bestScore: 0, totalScore: 0, avgAccuracy: 0 },
        2: { played: 0, bestScore: 0, totalScore: 0, avgAccuracy: 0 },
        3: { played: 0, bestScore: 0, totalScore: 0, avgAccuracy: 0 },
      },
      recentSessions: [],
    };
  }

  const totalScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0);
  const bestScore = Math.max(...sessions.map(s => s.score || 0));
  const avgAccuracy = sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessions.length;

  const levelBreakdown = {};
  for (let l = 1; l <= 3; l++) {
    const lvlSessions = sessions.filter(s => s.level === l);
    levelBreakdown[l] = {
      played: lvlSessions.length,
      bestScore: lvlSessions.length > 0 ? Math.max(...lvlSessions.map(s => s.score || 0)) : 0,
      totalScore: lvlSessions.reduce((sum, s) => sum + (s.score || 0), 0),
      avgAccuracy: lvlSessions.length > 0
        ? lvlSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / lvlSessions.length
        : 0,
    };
  }

  return {
    totalSessions: sessions.length,
    totalScore,
    bestScore,
    averageAccuracy: Math.round(avgAccuracy),
    levelBreakdown,
    recentSessions: sessions.slice(-20).reverse(),
  };
}

export function exportReport() {
  const stats = getProgressStats();
  const name = getChildName() || 'Child';
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  let report = `SPEAKQUEST - SPEECH THERAPY PROGRESS REPORT\n`;
  report += `=============================================\n\n`;
  report += `Child's Name: ${name}\n`;
  report += `Report Date: ${date}\n`;
  report += `Total Sessions Played: ${stats.totalSessions}\n`;
  report += `Total Score: ${stats.totalScore}\n`;
  report += `Best Score: ${stats.bestScore}\n`;
  report += `Average Accuracy: ${stats.averageAccuracy}%\n\n`;

  report += `LEVEL BREAKDOWN:\n`;
  report += `-----------------\n`;
  const levelNames = { 1: 'Bird Flight (Volume)', 2: 'Vowel Finder', 3: 'Emotion Match' };
  for (let l = 1; l <= 3; l++) {
    const lb = stats.levelBreakdown[l];
    report += `\nLevel ${l}: ${levelNames[l]}\n`;
    report += `  Times Played: ${lb.played}\n`;
    report += `  Best Score: ${lb.bestScore}\n`;
    report += `  Average Accuracy: ${Math.round(lb.avgAccuracy)}%\n`;
  }

  report += `\n\nSESSION HISTORY (Last 20):\n`;
  report += `--------------------------\n`;
  stats.recentSessions.forEach((s, i) => {
    const d = new Date(s.timestamp).toLocaleDateString();
    report += `${i + 1}. ${d} | Level ${s.level} (${levelNames[s.level]}) | Score: ${s.score} | Accuracy: ${s.accuracy || 0}%\n`;
  });

  report += `\n\n--- Generated by SpeakQuest Speech Therapy Game ---\n`;

  // Download as text file
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SpeakQuest_Report_${name}_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function isAuthenticated() {
  return !!getAuthToken();
}

export async function registerUser({ email, password, childName }) {
  const data = await apiRequest('/api/auth/register/', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({
      email,
      password,
      child_name: childName || '',
    }),
  });
  setAuthToken(data.access, data.refresh);
  if (data.profile) {
    const local = getProgress();
    local.childName = data.profile.child_name || '';
    local.settings = { ...DEFAULT_SETTINGS, ...(data.profile.settings || {}) };
    saveProgress(local);
  }
  return data;
}

export async function loginUser({ email, password }) {
  const data = await apiRequest('/api/auth/login/', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.access, data.refresh);
  return data;
}

export function logoutUser() {
  clearAuthToken();
}

export async function initRemoteSync() {
  if (!getAuthToken()) return false;
  try {
    const profile = await apiRequest('/api/profile/');
    const sessions = await apiRequest('/api/sessions/');
    const data = getProgress();
    data.childName = profile.child_name || data.childName;
    data.settings = { ...DEFAULT_SETTINGS, ...(profile.settings || {}) };
    if (Array.isArray(sessions)) {
      const normalized = sessions.map(s => ({
        level: s.level,
        score: s.score,
        accuracy: s.accuracy,
        correct: s.correct,
        total: s.total,
        duration: s.duration,
        timestamp: s.timestamp || Date.now(),
      }));
      data.sessions = normalized.slice().reverse();
    }
    saveProgress(data);
    return true;
  } catch (e) {
    console.warn('Failed to pull remote data:', e);
    return false;
  }
}
