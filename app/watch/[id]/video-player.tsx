
'use client';

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoId: string;
  src: string;
  poster?: string;
  trimStart?: number;
  trimEnd?: number;
}

export default function VideoPlayer({ videoId, src, poster, trimStart = 0, trimEnd }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxProgress = useRef(0);
  const sentView = useRef(false);

  useEffect(() => {
    if (!sentView.current) {
      fetch(`/api/video/${videoId}/view`, { method: 'POST' }).catch(console.error);
      sentView.current = true;
    }
  }, [videoId]);

  // Handle trim points
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      // Seek to trim start point
      if (trimStart > 0) {
        video.currentTime = trimStart;
      }
    };

    const handleTimeUpdate = () => {
      // Stop at trim end point
      if (trimEnd && video.currentTime >= trimEnd) {
        video.pause();
        video.currentTime = trimEnd;
      }

      // Track progress
      const pct = (video.currentTime / video.duration) * 100;
      if (pct > maxProgress.current) {
        maxProgress.current = pct;
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [trimStart, trimEnd]);

  const reportProgress = (pct: number) => {
    if (pct >= maxProgress.current) {
        maxProgress.current = pct;

      console.log('Reporting progress:', pct);
      fetch(`/api/video/${videoId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage: pct })
      }).catch(console.error);
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
        onPause={handlePause}
        onEnded={handleEnded}
      />
    </div>
  );
}
