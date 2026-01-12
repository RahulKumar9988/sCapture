
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TrimSliderProps {
  duration: number;
  trimStart: number;
  trimEnd: number;
  onChange: (start: number, end: number) => void;
}

export default function TrimSlider({ duration, trimStart, trimEnd, onChange }: TrimSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  // Helper to format time
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const getPercentage = (time: number) => {
    return (time / duration) * 100;
  };

  const handlePointerDown = (e: React.PointerEvent, type: 'start' | 'end') => {
    e.preventDefault();
    setIsDragging(type);
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      const time = Math.max(0, Math.min(percentage * duration, duration));

      if (isDragging === 'start') {
        const newStart = Math.min(time, trimEnd - 0.5); // Min 0.5s gap
        onChange(Math.max(0, newStart), trimEnd);
      } else {
        const newEnd = Math.max(time, trimStart + 0.5);
        onChange(trimStart, Math.min(duration, newEnd));
      }
    };

    const handlePointerUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, duration, trimStart, trimEnd, onChange]);

  return (
    <div className="w-full select-none py-6">
      <div 
        ref={containerRef}
        className="relative h-12 bg-neutral-800 rounded-lg overflow-hidden cursor-pointer touch-none"
      >
        {/* Background Track */}
        <div className="absolute inset-0 bg-neutral-900/50" />

        {/* Selected Range */}
        <div 
          className="absolute top-0 h-full bg-red-500/20 border-x-2 border-red-500"
          style={{
            left: `${getPercentage(trimStart)}%`,
            width: `${getPercentage(trimEnd - trimStart)}%`
          }}
        />

        {/* Start Handle */}
        <div 
          className="absolute top-0 h-full w-4 -ml-2 bg-red-600 hover:bg-red-500 cursor-ew-resize z-10 flex items-center justify-center group"
          style={{ left: `${getPercentage(trimStart)}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'start')}
        >
          <div className="w-1 h-4 bg-white/50 rounded-full" />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded border border-neutral-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {formatTime(trimStart)}
          </div>
        </div>

        {/* End Handle */}
        <div 
          className="absolute top-0 h-full w-4 -ml-2 bg-red-600 hover:bg-red-500 cursor-ew-resize z-10 flex items-center justify-center group"
          style={{ left: `${getPercentage(trimEnd)}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'end')}
        >
          <div className="w-1 h-4 bg-white/50 rounded-full" />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded border border-neutral-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {formatTime(trimEnd)}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-neutral-500 mt-2 font-mono">
        <span>{formatTime(trimStart)}</span>
        <span>Duration: {formatTime(trimEnd - trimStart)}</span>
        <span>{formatTime(trimEnd)}</span>
      </div>
    </div>
  );
}
