
import React, { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onReady: () => void;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ audioUrl, isPlaying, onReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize Audio Context and Analyzer only once per audioUrl
  useEffect(() => {
    if (!audioUrl) return;

    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (!audio) return;

    const initAudio = () => {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256;
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContextRef.current.destination);
      }
      onReady();
    };

    if (audio.readyState >= 2) {
      initAudio();
    } else {
      audio.oncanplaythrough = initAudio;
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
        analyzerRef.current = null;
        sourceRef.current = null;
      }
    };
  }, [audioUrl]); // Only depends on the URL changing

  // Handle Play/Pause and Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const analyzer = analyzerRef.current;
    
    if (!canvas || !ctx || !analyzer) return;

    const drawIdle = () => {
      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();
    };

    const draw = () => {
      if (!isPlaying) return; // Guard clause to stop animation loop

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzer.getByteFrequencyData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, '#a855f7');
      gradient.addColorStop(0.5, '#3b82f6');
      gradient.addColorStop(1, '#a855f7');

      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      const barWidth = (w / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * h * 0.8;
        if (barHeight > 2) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(139, 92, 246, 0.5)`;
            ctx.moveTo(x, centerY - barHeight / 2);
            ctx.lineTo(x, centerY + barHeight / 2);
        }
        x += barWidth + 2;
      }
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      draw();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      if (audioContextRef.current?.state === 'running') {
        audioContextRef.current.suspend();
      }
      drawIdle();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [isPlaying]);

  return (
    <div className="w-full max-w-3xl glass p-8 rounded-[32px] overflow-hidden shadow-2xl shadow-purple-900/10 mb-8 border border-white/5">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={300} 
        className="w-full h-[300px]"
      />
    </div>
  );
};

export default WaveformVisualizer;
