
import React, { useState } from 'react';

interface AudioUploaderProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ onUpload, isUploading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/mp3')) {
      onUpload(file);
    } else {
      alert("Please upload an MP3 file.");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full max-w-xl p-1 rounded-3xl transition-all duration-500
        ${isDragging ? 'scale-105' : 'scale-100'}
        bg-gradient-to-br from-white/10 via-white/5 to-transparent
      `}
    >
      <div className={`
        relative overflow-hidden group w-full aspect-[16/10] glass rounded-[22px] flex flex-col items-center justify-center gap-6 cursor-pointer border-2 border-dashed transition-all duration-300
        ${isDragging ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-white/20'}
      `}>
        {isUploading ? (
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-full border-4 border-t-green-500 border-white/5 animate-spin"></div>
            <p className="text-sm font-medium text-white/60 tracking-widest uppercase">Uploading</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <i className={`fas fa-cloud-upload-alt text-3xl transition-colors duration-300 ${isDragging ? 'text-green-400' : 'text-white/40 group-hover:text-white/80'}`}></i>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                {isDragging ? 'Drop to start' : 'Choose an MP3 file'}
              </h3>
              <p className="text-sm text-white/40">or drag and drop your music here</p>
            </div>
            <input 
              type="file" 
              accept="audio/mpeg,audio/mp3" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileInput}
            />
          </>
        )}

        {/* Decorative corner accents */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/20"></div>
        <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/20"></div>
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/20"></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/20"></div>
      </div>
    </div>
  );
};

export default AudioUploader;
