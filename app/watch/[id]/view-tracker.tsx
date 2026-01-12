
'use client';

import { useEffect } from 'react';

export default function ViewTracker({ videoId }: { videoId: string }) {
  useEffect(() => {
    // Simple incremental view count, ignore strict once-per-user logic for MVP
    fetch(`/api/video/${videoId}/view`, { method: 'POST' }).catch(console.error);
  }, [videoId]);

  return null;
}
