import { useState, useCallback, useEffect } from 'react';
import { useAudioEngine, useSpeechRecognition } from './hooks/useAudioEngine';
import { addSession, getSettings, getChildName, initRemoteSync } from './utils/progressStore';
import LoadingScreen from './components/LoadingScreen';
import MainMenu from './components/MainMenu';
import Level1BirdFlight from './components/Level1BirdFlight';
import Level2VowelFinder from './components/Level2VowelFinder';
import Level3EmotionMatch from './components/Level3EmotionMatch';
import ResultsScreen from './components/ResultsScreen';
import ProgressReport from './components/ProgressReport';
import { SettingsModal, HelpModal, MicPermissionScreen } from './components/Modals';

// Screens: loading, menu, mic-permission, level-1, level-2, level-3, results, progress
function App() {
  const [screen, setScreen] = useState('loading');
  const [pendingLevel, setPendingLevel] = useState(null);
  const [results, setResults] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [lastLevel, setLastLevel] = useState(1);

  const audioEngine = useAudioEngine();
  const speechRec = useSpeechRecognition();
  const settings = getSettings();
  const childName = getChildName();

  const handleLoadDone = useCallback(() => setScreen('menu'), []);

  const handleSelectLevel = useCallback((level) => {
    setLastLevel(level);
    if (!audioEngine.hasPermission) {
      setPendingLevel(level);
      setScreen('mic-permission');
    } else {
      setScreen(`level-${level}`);
    }
  }, [audioEngine.hasPermission]);

  const handleAllowMic = useCallback(async () => {
    const ok = await audioEngine.requestMic();
    if (ok && pendingLevel) {
      setScreen(`level-${pendingLevel}`);
      setPendingLevel(null);
    } else if (!ok) {
      alert('Microphone permission denied. Please allow microphone access in your browser settings.');
    }
  }, [audioEngine, pendingLevel]);

  const handleLevelComplete = useCallback((result) => {
    setResults(result);
    addSession(result);
    speechRec.stopListening();
    setScreen('results');
  }, [speechRec]);

  const handleBack = useCallback(() => {
    speechRec.stopListening();
    setScreen('menu');
  }, [speechRec]);

  const handleReplay = useCallback(() => {
    setResults(null);
    setScreen(`level-${lastLevel}`);
  }, [lastLevel]);

  const handleMenu = useCallback(() => {
    setResults(null);
    setScreen('menu');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioEngine.stop();
      speechRec.stopListening();
    };
  }, []);

  useEffect(() => {
    void initRemoteSync();
  }, []);

  return (
    <div className="app-root" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {screen === 'loading' && <LoadingScreen onDone={handleLoadDone} />}
      {screen === 'menu' && (
        <MainMenu
          onSelectLevel={handleSelectLevel}
          onProgress={() => setScreen('progress')}
          onSettings={() => setShowSettings(true)}
          onHelp={() => setShowHelp(true)}
          childName={childName}
        />
      )}
      {screen === 'mic-permission' && <MicPermissionScreen onAllow={handleAllowMic} />}
      {screen === 'level-1' && (
        <Level1BirdFlight
          audioEngine={audioEngine}
          settings={settings}
          onBack={handleBack}
          onComplete={handleLevelComplete}
        />
      )}
      {screen === 'level-2' && (
        <Level2VowelFinder
          audioEngine={audioEngine}
          speechRec={speechRec}
          settings={settings}
          onBack={handleBack}
          onComplete={handleLevelComplete}
        />
      )}
      {screen === 'level-3' && (
        <Level3EmotionMatch
          audioEngine={audioEngine}
          settings={settings}
          onBack={handleBack}
          onComplete={handleLevelComplete}
        />
      )}
      {screen === 'results' && results && (
        <ResultsScreen
          results={results}
          onReplay={handleReplay}
          onMenu={handleMenu}
        />
      )}
      {screen === 'progress' && <ProgressReport onBack={handleMenu} />}

      {/* Modals */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
