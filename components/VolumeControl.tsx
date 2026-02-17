import React, { useLayoutEffect, useRef } from 'react';

interface VolumeControlProps {
  level: number;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({ level }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${level}%`;
    }
  }, [level]);

  return (
    <div className="flex flex-col items-center space-y-2 w-full md:w-64">
      <div className="flex justify-between w-full text-xs text-cyan-500 font-mono tracking-widest uppercase">
        <span>Vol.Control</span>
        <span>{level}%</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
        <div
          ref={barRef}
          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
        />
        {/* Markers */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-slate-900/50"></div>
        <div className="absolute top-0 left-2/4 w-px h-full bg-slate-900/50"></div>
        <div className="absolute top-0 left-3/4 w-px h-full bg-slate-900/50"></div>
      </div>
    </div>
  );
};