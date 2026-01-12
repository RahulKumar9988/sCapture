
'use client';

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoId: string;
  src: string;
  poster?: string;
}

export default function VideoPlayer({ videoId, src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxProgress = useRef(0);
  const sentView = useRef(false);

  useEffect(() => {
    if (!sentView.current) {
      fetch(`/api/video/${videoId}/view`, { method: 'POST' }).catch(console.error);
      sentView.current = true;
    }
  }, [videoId]);

  const reportProgress = (pct: number) => {
    // Allow sending if it's the current max
    if (pct >= maxProgress.current) {
        maxProgress.current = pct; // Ensure it's set

      // Only report if significantly higher or 100%
      // For MVP, reporting only on pause/end to avoid spam
      console.log('Reporting progress:', pct);
      fetch(`/api/video/${videoId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage: pct })
      }).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      if (pct > maxProgress.current) {
        // Just track locally, report on pause/end
        maxProgress.current = pct;
      }
    }
  };

  const handlePause = () => {
    if (maxProgress.current > 0) reportProgress(maxProgress.current);
  };

  const handleEnded = () => {
    reportProgress(100);
  };

  return (
    <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-neutral-800">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePause}
        onEnded={handleEnded}
      />
    </div>
  );
}
