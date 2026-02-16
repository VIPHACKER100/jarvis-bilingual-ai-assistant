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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Background Grid/Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none"></div>

      {/* Header / Language Toggle */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
        <div>
          <h1 className="text-3xl font-bold tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
            JARVIS
          </h1>
          <p className="text-xs text-slate-500 tracking-widest mt-1">PERSONAL AI ASSISTANT // BILINGUAL PROTOCOL</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-2 bg-slate-900 border border-slate-700 px-3 py-1 rounded text-xs tracking-wider hover:border-cyan-500 transition-colors"
          >
            <span className={language === Language.ENGLISH ? "text-cyan-400 font-bold" : "text-slate-600"}>ENGLISH</span>
            <span className="text-slate-700">|</span>
            <span className={language === Language.HINDI ? "text-orange-400 font-bold" : "text-slate-600"}>हिंदी</span>
          </button>
          <div className="text-[10px] text-slate-500 uppercase">Input Mode: {language === Language.HINDI ? 'Hi-IN (Mixed)' : 'En-US'}</div>
        </div>
      </header>

      {/* Main UI Container */}
      <main className="relative z-10 flex flex-col items-center w-full max-w-4xl space-y-12">

        {/* Status Text */}
        <div className="h-8 flex items-center justify-center">
          {mode === AppMode.LISTENING && (
            <span className="text-cyan-400 tracking-widest animate-pulse font-mono">
              LISTENING / सुन रहा हूँ...
            </span>
          )}
          {mode === AppMode.PROCESSING && (
            <span className="text-orange-400 tracking-widest animate-pulse font-mono">
              PROCESSING / कार्य हो रहा है...
            </span>
          )}
          {mode === AppMode.SPEAKING && (
            <span className="text-cyan-400 tracking-widest font-mono">
              RESPONDING...
            </span>
          )}
          {mode === AppMode.IDLE && (
            <span className="text-slate-600 tracking-widest font-mono">
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
        <div className="w-full max-w-lg text-center min-h-[60px]">
          {transcript && (
            <div className="bg-slate-900/50 border-x border-cyan-500/30 p-4 relative backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>
              <p className="text-lg md:text-xl text-white font-light tracking-wide font-sans">
                "{transcript}"
              </p>
            </div>
          )}
        </div>

        {/* Bottom Modules */}
        <div className="flex flex-col md:flex-row gap-6 w-full items-start justify-center">
          <HistoryLog history={history} />
          <div className="hidden md:flex flex-col space-y-4 pt-4">
            <VolumeControl level={volume} />

            {/* Decorative Panel */}
            <div className="border border-slate-800 bg-slate-900/40 p-3 w-64 text-[10px] font-mono text-slate-500 space-y-1">
              <div className="flex justify-between"><span>CPU</span><span className="text-cyan-600">32%</span></div>
              <div className="flex justify-between"><span>MEM</span><span className="text-cyan-600">14%</span></div>
              <div className="flex justify-between"><span>NET</span><span className="text-green-600">ONLINE</span></div>
              <div className="flex justify-between"><span>MIC</span><span className={mode !== AppMode.IDLE ? "text-red-500 animate-pulse" : "text-slate-600"}>{mode !== AppMode.IDLE ? "ACTIVE" : "OFFLINE"}</span></div>
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

      {/* Footer */}
      <footer className="absolute bottom-4 text-slate-700 text-[10px] tracking-[0.3em] font-light">
        STARK INDUSTRIES SYSTEM OS V4.2.1 | DEVELOPED BY VIPHACKER100
      </footer>
    </div>
  );
};

export default App;