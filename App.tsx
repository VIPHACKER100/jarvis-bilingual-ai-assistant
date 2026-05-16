import { useState, useEffect, useRef, FC } from 'react';
import { ArcReactor } from './components/ArcReactor';
import { HistoryLog } from './components/HistoryLog';
import { VolumeControl } from './components/VolumeControl';
import { PermissionModal } from './components/PermissionModal';
import { CommandResult, AppMode, Language } from './types';
import { voiceService } from './services/voiceService';
import { processTranscript } from './services/commandProcessor';
import { INITIAL_VOLUME } from './constants';
import { sfx } from './utils/audioUtils';

const App: FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.IDLE);
  const [transcript, setTranscript] = useState<string>("");
  const [history, setHistory] = useState<CommandResult[]>([]);
  const [volume, setVolume] = useState<number>(INITIAL_VOLUME);


  // Default to Hindi-India to support bilingual/mixed usage better
  const [language, setLanguage] = useState<Language>(Language.HINDI);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // References to manage state in async callbacks
  const processingRef = useRef(false);
  // Ref to track if the app is effectively "ON" to handle the loop logic
  const isActiveRef = useRef(false);

  useEffect(() => {
    // Proactive Permission Check
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'denied') {
            setShowPermissionModal(true);
            addToHistory({
              transcript: "",
              response: "SYSTEM ALERT: Microphone access denied / माइक्रोफ़ोन एक्सेस अस्वीकार।",
              actionType: "ERROR",
              language: 'en',
              timestamp: Date.now(),
              isSystemMessage: true
            });
          }
        })
        .catch(() => {
          // Ignore if permission API is not supported or fails
        });
    }

    // Initial System Check Log
    addToHistory({
      transcript: "System Init...",
      response: "JARVIS Online. Waiting for activation.",
      actionType: "SYSTEM",
      language: 'en',
      timestamp: Date.now(),
      isSystemMessage: true
    });

    // Set initial voice service language
    voiceService.setLanguage(language);

    return () => {
      // Cleanup on unmount
      isActiveRef.current = false;
      voiceService.stopListening();
    }
  }, []);

  // Update voice service when user toggles language
  useEffect(() => {
    voiceService.setLanguage(language);
  }, [language]);

  const addToHistory = (entry: CommandResult) => {
    setHistory(prev => [...prev, entry]);
  };

  const handleCommandResult = async (text: string, isFinal: boolean) => {
    setTranscript(text);

    if (isFinal && !processingRef.current) {
      processingRef.current = true;
      setMode(AppMode.PROCESSING);

      // Process Logic
      const result = await processTranscript(text);

      // Execute Actions
      if (result.actionType === 'VOLUME_UP') {
        setVolume(v => Math.min(v + 10, 100));
        sfx.playBlip();
      } else if (result.actionType === 'VOLUME_DOWN') {
        setVolume(v => Math.max(v - 10, 0));
        sfx.playBlip();
      } else if (result.externalUrl) {
        window.open(result.externalUrl, '_blank');
      }

      // Add to History
      addToHistory({
        transcript: text,
        response: result.response,
        actionType: result.actionType,
        language: result.language,
        timestamp: Date.now()
      });

      // Speak Response
      setMode(AppMode.SPEAKING);
      // Prioritize spokenResponse for TTS if it exists (e.g. for long help lists)
      voiceService.speak(result.spokenResponse || result.response, result.language);

      // Reset after speaking delay (simulated) or just restart listening
      setTimeout(() => {
        processingRef.current = false;
        // Only restart listening if we are still active (user hasn't deactivated)
        if (isActiveRef.current) {
          startListening();
        } else {
          setMode(AppMode.IDLE);
        }
      }, 2000);
    }
  };

  const handleError = (error: string) => {
    // Only log unexpected errors to console to reduce noise
    if (error !== 'not-allowed' && error !== 'no-speech') {
      console.error("Speech Error:", error);
    }

    let userMessage = "";
    let isCritical = false;

    // Bilingual Error Mapping
    const errorMessages: Record<string, { en: string, hi: string }> = {
      'not-allowed': {
        en: "ACCESS DENIED. Microphone permissions required.",
        hi: "एक्सेस अस्वीकार। माइक्रोफ़ोन अनुमति की आवश्यकता है।"
      },
      'not-supported': {
        en: "Browser not supported. Use Chrome or Edge.",
        hi: "ब्राउज़र समर्थित नहीं है। कृपया क्रोम या एज का उपयोग करें।"
      },
      'network': {
        en: "Network error. Checking connectivity...",
        hi: "नेटवर्क त्रुटि। कनेक्टिविटी की जांच कर रहा हूँ..."
      },
      'audio-capture': {
        en: "Audio capture failed. Check microphone.",
        hi: "ऑडियो कैप्चर विफल। माइक्रोफ़ोन की जांच करें।"
      },
      'start-failed': {
        en: "Initialization failed. Please refresh page.",
        hi: "आरंभ करने में विफल। कृपया पेज रिफ्रेश करें।"
      }
    };

    if (error === 'no-speech') {
      // Silence timeout - not critical, just stop the visual loop until restart or manual
      if (isActiveRef.current) {
        // Restart immediately without error logging for seamless feel
        startListening();
        return;
      }
    } else if (errorMessages[error]) {
      const isHindi = language === Language.HINDI;
      userMessage = isHindi ? errorMessages[error].hi : errorMessages[error].en;
      isCritical = true;

      if (error === 'not-allowed') {
        setShowPermissionModal(true);
      }
    } else {
      // Generic fallback
      userMessage = language === Language.HINDI
        ? `सिस्टम त्रुटि: ${error}`
        : `System Error: ${error}`;
      isCritical = true;
    }

    if (isCritical) {
      setMode(AppMode.IDLE);
      isActiveRef.current = false; // Stop the loop
      setTranscript(userMessage);

      // Speak the critical error so the user knows why it stopped
      voiceService.speak(userMessage, language === Language.HINDI ? 'hi' : 'en');

      addToHistory({
        transcript: "",
        response: userMessage,
        actionType: "ERROR",
        language: language === Language.HINDI ? 'hi' : 'en',
        timestamp: Date.now(),
        isSystemMessage: true
      });
    }

    processingRef.current = false;
  };

  const startListening = () => {
    // If not active, don't start (safety check for async calls)
    if (!isActiveRef.current) return;

    setMode(AppMode.LISTENING);
    setTranscript(""); // Clear previous transcript for new command

    voiceService.startListening(
      handleCommandResult,
      () => {
        // onEnd: The service stopped.
        if (isActiveRef.current && !processingRef.current) {
          // Small delay to prevent tight loops
          setTimeout(() => startListening(), 100);
        }
      },
      handleError
    );
  };

  const stopListening = () => {
    isActiveRef.current = false;
    setMode(AppMode.IDLE);
    voiceService.stopListening();
    processingRef.current = false;
  };

  const toggleActivation = () => {
    if (isActiveRef.current) {
      stopListening();
    } else {
      isActiveRef.current = true;
      startListening();
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === Language.ENGLISH ? Language.HINDI : Language.ENGLISH);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-black relative overflow-x-hidden">

      {/* Background Grid/Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none"></div>

      {/* Header / Language Toggle */}
      <header className="relative w-full max-w-6xl p-4 md:p-8 flex flex-col md:flex-row justify-between items-center z-20 gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-[0.3em] text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
            JARVIS
          </h1>
          <p className="text-[10px] md:text-xs text-slate-500 tracking-[0.4em] uppercase mt-2">Personal AI Assistant // Bilingual Protocol</p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-3 bg-slate-900/60 border border-slate-700/50 px-5 py-2 md:px-4 md:py-1.5 rounded-sm text-xs tracking-widest hover:border-cyan-500 transition-all duration-300 backdrop-blur-md shadow-lg"
          >
            <span className={language === Language.ENGLISH ? "text-cyan-400 font-bold" : "text-slate-600"}>ENGLISH</span>
            <span className="text-slate-800">|</span>
            <span className={language === Language.HINDI ? "text-orange-400 font-bold" : "text-slate-600"}>हिंदी</span>
          </button>
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
            Mode: {language === Language.HINDI ? 'Hi-IN (Mixed)' : 'En-US'}
          </div>
        </div>
      </header>

      {/* Main UI Container */}
      <main className="relative z-10 flex flex-col items-center w-full max-w-4xl space-y-10 md:space-y-16 px-4 py-6">

        <div className="h-8 flex items-center justify-center">
          {mode === AppMode.LISTENING && (
            <span className="text-cyan-400 tracking-widest animate-pulse font-mono text-sm md:text-base">
              LISTENING / सुन रहा हूँ...
            </span>
          )}
          {mode === AppMode.PROCESSING && (
            <span className="text-orange-400 tracking-widest animate-pulse font-mono text-sm md:text-base">
              PROCESSING / कार्य हो रहा है...
            </span>
          )}
          {mode === AppMode.SPEAKING && (
            <span className="text-cyan-400 tracking-widest font-mono text-sm md:text-base">
              RESPONDING...
            </span>
          )}
          {mode === AppMode.IDLE && (
            <span className="text-slate-600 tracking-widest font-mono text-xs md:text-sm">
              STANDBY
            </span>
          )}
        </div>

        {/* Central Reactor */}
        <ArcReactor
          isActive={mode !== AppMode.IDLE}
          onClick={toggleActivation}
          language={language === Language.HINDI ? 'hi' : 'en'}
        />

        {/* Transcript Display */}
        <div className="w-full max-w-lg text-center min-h-[60px] px-2 md:px-0">
          {transcript && (
            <div className="bg-slate-900/50 border-x border-cyan-500/30 p-3 md:p-4 relative backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>
              <p className="text-base md:text-xl text-white font-light tracking-wide font-sans">
                "{transcript}"
              </p>
            </div>
          )}
        </div>

        {/* Bottom Modules */}
        <div className="flex flex-col md:flex-row gap-8 w-full items-center md:items-start justify-center">
          <HistoryLog history={history} />
          <div className="flex flex-col space-y-6 w-full md:w-auto items-center md:items-start">
            <VolumeControl level={volume} />

            {/* Decorative Panel - Fixed overlapping grid */}
            <div className="border border-slate-800 bg-slate-900/40 p-4 w-full md:w-64 text-[10px] font-mono text-slate-500 grid grid-cols-2 gap-x-4 gap-y-2 rounded-sm backdrop-blur-sm">
              <div className="flex justify-between border-b border-slate-800/50 pb-1"><span>CPU</span><span className="text-cyan-600">32%</span></div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1"><span>MEM</span><span className="text-cyan-600">14%</span></div>
              <div className="flex justify-between"><span>NET</span><span className="text-green-600 uppercase">Online</span></div>
              <div className="flex justify-between"><span>MIC</span><span className={mode !== AppMode.IDLE ? "text-red-500 animate-pulse font-bold" : "text-slate-600"}>{mode !== AppMode.IDLE ? "ACTIVE" : "OFFLINE"}</span></div>
            </div>
          </div>
        </div>

      </main>

      {/* Permission Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        language={language === Language.HINDI ? 'hi' : 'en'}
      />

      {/* Footer / Branding */}
      <footer className="relative w-full flex flex-col items-center space-y-5 z-20 mt-auto pt-10 pb-8 bg-black/60 backdrop-blur-sm border-t border-slate-900">

        {/* Creator Card */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="text-cyan-500 text-[11px] md:text-xs font-mono tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
            ⚡ Built by
          </div>
          <div className="text-white text-sm md:text-base font-bold tracking-widest uppercase">
            Aryan Ahirwar
          </div>
          <div className="text-slate-400 text-[9px] md:text-[10px] tracking-widest font-mono uppercase">
            Alias: VIPHACKER100
          </div>
          <div className="text-slate-500 text-[8px] md:text-[9px] tracking-[0.2em] text-center max-w-sm leading-relaxed px-4">
            Cybersecurity Expert · Ethical Hacker · Penetration Tester · Bug Bounty Hunter
          </div>
          <div className="text-orange-500/70 text-[8px] md:text-[9px] tracking-[0.3em] uppercase font-mono">
            Founder &amp; CEO — VIPHACKER.100
          </div>
        </div>

        {/* Divider */}
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-cyan-700/50 to-transparent" />

        {/* Social Links */}
        <div className="flex flex-wrap justify-center gap-5 text-[9px] md:text-[10px] font-mono tracking-widest">
          <a href="https://viphacker100.com" target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-400 transition-all duration-200 uppercase border-b border-transparent hover:border-cyan-500 pb-0.5">
            🌐 Website
          </a>
          <a href="https://github.com/viphacker100" target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-400 transition-all duration-200 uppercase border-b border-transparent hover:border-cyan-500 pb-0.5">
            ⌨️ GitHub
          </a>
          <a href="https://linkedin.com/in/viphacker100" target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-400 transition-all duration-200 uppercase border-b border-transparent hover:border-cyan-500 pb-0.5">
            💼 LinkedIn
          </a>
          <a href="https://instagram.com/viphacker.100" target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-400 transition-all duration-200 uppercase border-b border-transparent hover:border-cyan-500 pb-0.5">
            📸 Instagram
          </a>
        </div>

        {/* Version tag */}
        <div className="text-slate-700 text-[8px] md:text-[9px] tracking-[0.4em] font-light uppercase text-center px-4 leading-loose">
          JARVIS v3.9.0 | VIPHACKER100 OS V4.2.1
        </div>
      </footer>
    </div>
  );
};

export default App;