
import React, { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onReady: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

/**
 * Global cache to store audio graph components for each media element.
 */
const audioGraphCache = new Map<HTMLMediaElement, {
  context: AudioContext;
  analyzer: AnalyserNode;
}>();

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ audioUrl, isPlaying, onReady, audioRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const glowRef = useRef<number>(0); // Current glow intensity [0, 1]
  
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    const audio = audioRef.current;

    const initAudio = () => {
      let graph = audioGraphCache.get(audio);

      if (!graph) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const context = new AudioContextClass();
          const analyzer = context.createAnalyser();
          
          analyzer.fftSize = 512;
          analyzer.smoothingTimeConstant = 0.85;
          
          const source = context.createMediaElementSource(audio);
          source.connect(analyzer);
          analyzer.connect(context.destination);
          
          graph = { context, analyzer };
          audioGraphCache.set(audio, graph);
        } catch (e) {
          console.error("Audio initialization error:", e);
          onReady();
          return;
        }
      }

      contextRef.current = graph.context;
      analyzerRef.current = graph.analyzer;
      
      onReady();
    };

    if (audio.readyState >= 2) {
      initAudio();
    } else {
      audio.addEventListener('canplaythrough', initAudio, { once: true });
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioUrl, onReady, audioRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;

    const draw = () => {
      const analyzer = analyzerRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Smoothly transition glow state
      if (isPlaying) {
        glowRef.current = Math.min(glowRef.current + 0.012, 1);
      } else {
        glowRef.current = Math.max(glowRef.current - 0.025, 0);
      }

      const bufferLength = analyzer?.frequencyBinCount || 256;
      const dataArray = new Uint8Array(bufferLength);
      if (analyzer && isPlaying) {
        analyzer.getByteFrequencyData(dataArray);
      }

      // Parameters for a cleaner, more continuous wave
      const drawCount = Math.floor(bufferLength * 0.7);
      const startX = w * 0.1;
      const endX = w * 0.9;
      const totalWidth = endX - startX;
      const step = totalWidth / drawCount;

      // Green Gradient
      const fillGradient = ctx.createLinearGradient(0, centerY - (h * 0.2), 0, centerY + (h * 0.2));
      fillGradient.addColorStop(0, `rgba(22, 101, 52, ${0.05 * glowRef.current})`);
      fillGradient.addColorStop(0.5, `rgba(34, 197, 94, ${0.7 * glowRef.current})`);
      fillGradient.addColorStop(1, `rgba(22, 101, 52, ${0.05 * glowRef.current})`);

      // Glow effect settings
      ctx.shadowBlur = 40 * glowRef.current;
      ctx.shadowColor = `rgba(34, 197, 94, ${0.6 * glowRef.current})`;

      ctx.beginPath();
      
      const topPoints: [number, number][] = [];
      const bottomPoints: [number, number][] = [];

      for (let i = 0; i <= drawCount; i++) {
        const normalizedPosition = i / drawCount;
        // Spatial envelope for pointed ellipse shape
        const envelope = Math.sin(Math.PI * normalizedPosition);
        const pointedEnvelope = Math.pow(envelope, 2.5);
        
        const frequencyValue = isPlaying ? (dataArray[i] / 255) : 0;
        
        // REDUCED HEIGHT: multiplied by h * 0.4 instead of h * 0.85
        const barHeight = (frequencyValue * pointedEnvelope * h * 0.4) * glowRef.current;

        const x = startX + (i * step);
        const minHeight = 2.5; // Slightly thicker baseline for visibility
        
        topPoints.push([x, centerY - (barHeight / 2) - (minHeight / 2)]);
        bottomPoints.push([x, centerY + (barHeight / 2) + (minHeight / 2)]);
      }

      // Trace the continuous filled shape
      ctx.moveTo(topPoints[0][0], topPoints[0][1]);
      
      // Top path
      for (let i = 1; i < topPoints.length; i++) {
        // Simple smoothing could be added here, but lineTo is fine for high resolution paths
        ctx.lineTo(topPoints[i][0], topPoints[i][1]);
      }
      
      // Bottom path (reversed)
      for (let i = bottomPoints.length - 1; i >= 0; i--) {
        ctx.lineTo(bottomPoints[i][0], bottomPoints[i][1]);
      }
      
      ctx.closePath();
      
      if (glowRef.current > 0) {
        ctx.fillStyle = fillGradient;
        ctx.fill();
      } else {
        // Draw the static idle line with a soft glow hint
        ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(34, 197, 94, 0.1)';
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    if (contextRef.current?.state === 'suspended' && isPlaying) {
      contextRef.current.resume().then(draw);
    } else {
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [isPlaying]);

  return (
    <div className="w-full max-w-3xl glass p-12 rounded-[40px] overflow-hidden shadow-2xl shadow-green-900/10 mb-8 border border-white/5 flex items-center justify-center min-h-[400px]">
      <canvas 
        ref={canvasRef} 
        width={1000} 
        height={360} 
        className="w-full h-[360px]"
      />
    </div>
  );
};

export default WaveformVisualizer;
