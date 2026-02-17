import { useEffect, useState, FC } from 'react';
import { sfx } from '../utils/audioUtils';

interface ArcReactorProps {
  isActive: boolean;
  onClick: () => void;
  language: 'en' | 'hi';
}

export const ArcReactor: FC<ArcReactorProps> = ({ isActive, onClick, language }) => {
  const [rotation, setRotation] = useState(0);

  // Simple rotation effect for interaction
  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        setRotation(r => (r + 1) % 360);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleClick = () => {
    if (!isActive) {
      sfx.playActivation(); // Play cool sound
    } else {
      sfx.playDeactivation();
    }
    onClick();
  };

  return (
    <div className="relative flex items-center justify-center p-4 md:p-10 cursor-pointer group" onClick={handleClick}>

      {/* --- Ambient Glow (Far Field) --- */}
      <div className={`absolute rounded-full transition-all duration-1000 ${isActive
        ? 'w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-cyan-500/5 blur-3xl animate-pulse-core'
        : 'w-48 h-48 md:w-64 md:h-64 bg-slate-800/20 blur-xl opacity-50'
        }`} />

      {/* --- Outer Mechanical Ring (Slow Rotate) --- */}
      <div className={`absolute w-64 h-64 md:w-80 md:h-80 rounded-full border border-slate-700/50 border-dashed ${isActive ? 'animate-spin-slow' : 'opacity-30'}`}></div>

      {/* --- Middle Reactor Ring (Fast Rotate) --- */}
      <div className={`absolute w-56 h-56 md:w-72 md:h-72 rounded-full border-2 border-cyan-900/40 ${isActive ? 'animate-spin-reverse-slow' : ''}`}>
        <div className="absolute top-0 left-1/2 w-1.5 h-3 md:w-2 md:h-4 bg-cyan-500/50 transform -translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-1.5 h-3 md:w-2 md:h-4 bg-cyan-500/50 transform -translate-x-1/2"></div>
        <div className="absolute left-0 top-1/2 h-1.5 w-3 md:h-2 md:w-4 bg-cyan-500/50 transform -translate-y-1/2"></div>
        <div className="absolute right-0 top-1/2 h-1.5 w-3 md:h-2 md:w-4 bg-cyan-500/50 transform -translate-y-1/2"></div>
      </div>

      {/* --- Inner Energy Ring (Pulsing) --- */}
      <div className={`absolute w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-slate-800 flex items-center justify-center transition-all duration-500 shadow-2xl ${isActive ? 'shadow-[0_0_30px_rgba(6,182,212,0.6)] md:shadow-[0_0_50px_rgba(6,182,212,0.6)] scale-100' : 'scale-95 opacity-80'
        }`}>
        <div className={`absolute inset-0 rounded-full border-2 border-cyan-400/30 ${isActive ? 'animate-spin-fast reactor-ring-1' : ''}`}></div>
        <div className={`absolute inset-2 rounded-full border-2 border-cyan-300/20 ${isActive ? 'animate-spin-reverse-slow reactor-ring-2' : ''}`}></div>
      </div>

      {/* --- Core Button Interface --- */}
      <button
        className={`
          relative z-10 w-36 h-36 md:w-48 md:h-48 rounded-full 
          flex flex-col items-center justify-center
          transition-all duration-300 transform group-hover:scale-105 group-active:scale-95
          overflow-hidden
          ${isActive
            ? 'bg-slate-900 border-4 border-cyan-400 shadow-[inset_0_0_40px_rgba(6,182,212,0.5)] md:shadow-[inset_0_0_60px_rgba(6,182,212,0.5)]'
            : 'bg-slate-900/90 border-4 border-slate-700 shadow-none'
          }
        `}
      >
        {/* Holographic Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

        {/* Central Triangle (Stark Tech) */}
        <svg
          viewBox="0 0 24 24"
          className={`relative z-20 w-14 h-14 md:w-20 md:h-20 mb-1 md:mb-2 transition-all duration-500 ${isActive
            ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,1)]'
            : 'text-slate-600'
            }`}
          fill="currentColor"
        >
          <path d="M12 2L2 22h20L12 2zm0 4L18 20H6L12 6z" />
        </svg>

        {/* Status Text */}
        <div className="relative z-20 flex flex-col items-center">
          <span className={`text-xs md:text-base font-bold tracking-[0.2em] transition-colors duration-300 ${isActive ? 'text-cyan-100' : 'text-slate-500'}`}>
            {isActive
              ? (language === 'hi' ? 'ON' : 'ONLINE')
              : (language === 'hi' ? 'OFF' : 'OFFLINE')
            }
          </span>
          <div className={`h-0.5 md:h-1 w-12 md:w-16 mt-0.5 md:mt-1 rounded-full transition-all duration-300 ${isActive ? 'bg-cyan-400 shadow-[0_0_10px_cyan]' : 'bg-slate-700'}`}></div>
        </div>

        {/* Scanline Effect inside button */}
        {isActive && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent w-full h-full animate-[scanline_2s_linear_infinite] opacity-30 pointer-events-none"></div>}
      </button>

    </div>
  );
};