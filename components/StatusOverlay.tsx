
import React from 'react';
import { AppState, AudioMetadata } from '../types.ts';

interface StatusOverlayProps {
  state: AppState;
  metadata: AudioMetadata | null;
  onPlay: () => void;
  onPause: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const StatusOverlay: React.FC<StatusOverlayProps> = ({ state, metadata, onPlay, onPause, currentTime, duration, onSeek }) => {
  if (state === AppState.ANALYZING) {
    return (
      <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-500">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-green-500/20 flex items-center justify-center">
             <div className="w-full h-full rounded-full border-t-4 border-green-500 animate-spin absolute top-0 left-0"></div>
             <i className="fas fa-search text-green-400 animate-pulse"></i>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-white tracking-tight">Analyzing Frequencies</h3>
          <p className="text-white/40 text-sm mt-1">Generating high-fidelity waveform...</p>
        </div>
      </div>
    );
  }

  if (state === AppState.READY || state === AppState.PLAYING) {
    return (
      <div className="w-full flex flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Success Tick */}
        {state === AppState.READY && currentTime === 0 && (
           <div className="flex items-center gap-3 py-2 px-4 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold tracking-widest uppercase mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
             <i className="fas fa-check-circle"></i>
             Ready to Visualize
           </div>
        )}

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2 line-clamp-1 max-w-xl mx-auto">
            {metadata?.name}
          </h2>
          <p className="text-white/40 font-medium tracking-widest uppercase text-[10px]">
            {state === AppState.PLAYING ? 'Playing now' : 'Paused'}
          </p>
        </div>

        <div className="flex items-center gap-8">
          <button 
            onClick={state === AppState.PLAYING ? onPause : onPlay}
            className={`
              w-24 h-24 rounded-full flex items-center justify-center text-3xl transition-all duration-500 shadow-xl
              ${state === AppState.PLAYING 
                ? 'bg-white text-black scale-110 shadow-white/10' 
                : 'bg-gradient-to-br from-green-500 to-green-700 text-white shadow-green-500/30 hover:scale-105'}
            `}
          >
            <i className={`fas ${state === AppState.PLAYING ? 'fa-pause' : 'fa-play ml-1'}`}></i>
          </button>
        </div>

        {/* Playback progress controllable bar */}
        <div className="w-full max-w-xl flex flex-col gap-3">
           <div className="relative group flex items-center h-4 w-full">
              <input 
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer outline-none transition-all group-hover:h-2"
                style={{
                  background: `linear-gradient(to right, #22c55e ${((currentTime / (duration || 1)) * 100)}%, rgba(255,255,255,0.1) ${((currentTime / (duration || 1)) * 100)}%)`
                }}
              />
              <style>{`
                input[type=range]::-webkit-slider-thumb {
                  appearance: none;
                  width: 12px;
                  height: 12px;
                  background: white;
                  border-radius: 50%;
                  opacity: 0;
                  transition: opacity 0.2s;
                  box-shadow: 0 0 10px rgba(0,0,0,0.5);
                }
                .group:hover input[type=range]::-webkit-slider-thumb {
                  opacity: 1;
                }
              `}</style>
           </div>
           <div className="flex justify-between text-[10px] font-bold text-white/40 tracking-widest uppercase">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
           </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StatusOverlay;
