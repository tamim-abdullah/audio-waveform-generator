
import React, { useState, useRef, useCallback } from 'react';
import { AppState, AudioMetadata } from './types.ts';
import AudioUploader from './components/AudioUploader.tsx';
import WaveformVisualizer from './components/WaveformVisualizer.tsx';
import StatusOverlay from './components/StatusOverlay.tsx';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = (file: File) => {
    setState(AppState.UPLOADING);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    // Simulate analysis delay
    setTimeout(() => {
      setState(AppState.ANALYZING);
      setTimeout(() => {
        setMetadata({
          name: file.name,
          duration: 0
        });
        setState(AppState.READY);
      }, 1500);
    }, 1000);
  };

  const handlePlay = async () => {
    if (audioRef.current) {
      try {
        if (audioRef.current.paused) {
          await audioRef.current.play();
          setState(AppState.PLAYING);
        }
      } catch (err) {
        console.error("Playback failed:", err);
      }
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(AppState.READY);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Stable callback prevents WaveformVisualizer effect from re-running on every App render
  const handleVisualizerReady = useCallback(() => {
    if (metadata) {
      setState(AppState.READY);
    }
  }, [metadata]);

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (audioRef.current) audioRef.current.pause();
    setAudioUrl(null);
    setMetadata(null);
    setCurrentTime(0);
    setDuration(0);
    setState(AppState.IDLE);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-900/20 blur-[120px] rounded-full"></div>
      </div>

      <header className="absolute top-0 left-0 w-full p-8 z-20 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
            <i className="fas fa-wave-square text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white/90">AURAWAVE</h1>
        </div>
        {state !== AppState.IDLE && (
           <button 
             onClick={reset}
             className="pointer-events-auto px-4 py-2 text-xs font-semibold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full border border-white/10"
           >
             <i className="fas fa-redo-alt mr-2"></i> RESET
           </button>
        )}
      </header>

      <main className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center">
        {state === AppState.IDLE && (
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
              Transform Your Audio.
            </h2>
            <p className="text-lg text-white/40 max-w-lg mx-auto leading-relaxed">
              Upload an MP3 to experience a high-fidelity visual journey synced perfectly to your sound.
            </p>
          </div>
        )}

        {(state === AppState.IDLE || state === AppState.UPLOADING) && (
          <AudioUploader onUpload={handleFileUpload} isUploading={state === AppState.UPLOADING} />
        )}

        {(state === AppState.ANALYZING || state === AppState.READY || state === AppState.PLAYING) && (
          <div className="w-full flex flex-col items-center">
             <WaveformVisualizer 
              audioUrl={audioUrl} 
              isPlaying={state === AppState.PLAYING} 
              onReady={handleVisualizerReady}
              audioRef={audioRef}
            />
            
            <StatusOverlay 
              state={state} 
              metadata={metadata} 
              onPlay={handlePlay} 
              onPause={handlePause}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
            />
          </div>
        )}
      </main>

      <footer className="absolute bottom-8 left-0 w-full text-center z-20 opacity-30 text-[10px] tracking-[0.2em] font-medium pointer-events-none">
        DESIGNED FOR AUDIOPHILES & CREATIVES
      </footer>

      {audioUrl && (
        <audio 
          key={audioUrl} 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={() => setState(AppState.READY)}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          className="hidden"
        />
      )}
    </div>
  );
};

export default App;
