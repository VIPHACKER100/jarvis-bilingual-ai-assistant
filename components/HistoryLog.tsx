import React, { useEffect, useRef } from 'react';
import { CommandResult } from '../types';

interface HistoryLogProps {
  history: CommandResult[];
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ history }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className="w-full md:max-w-md h-40 md:h-48 bg-black/40 border border-slate-700 rounded-lg p-3 md:p-4 overflow-y-auto backdrop-blur-sm shadow-inner relative">
      <div className="absolute top-0 right-0 p-1 px-2 bg-slate-800 text-[10px] text-cyan-500 uppercase tracking-widest rounded-bl-lg">
        Sys.Log
      </div>
      <div className="space-y-3 mt-2">
        {history.length === 0 && (
          <div className="text-slate-600 text-sm text-center italic mt-10">
            Awaiting input protocols...
          </div>
        )}
        {history.map((entry, index) => (
          <div key={index} className="flex flex-col space-y-1 text-xs sm:text-sm border-l-2 border-slate-700 pl-2 py-1">
            <div className="flex justify-between text-slate-500 text-[10px] uppercase">
              <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
              <span>{entry.actionType}</span>
            </div>

            {/* User Command */}
            {!entry.isSystemMessage && (
              <div className="text-cyan-200/80 font-mono">
                <span className="text-cyan-600 mr-2">{'>'}</span>
                {entry.transcript}
              </div>
            )}

            {/* System Response */}
            <div className={`italic whitespace-pre-wrap leading-relaxed ${entry.language === 'hi' ? 'font-serif text-orange-300/80' : 'text-cyan-400/80'}`}>
              <span className="text-slate-600 mr-2">{'jarvis:'}</span>
              {entry.response}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};