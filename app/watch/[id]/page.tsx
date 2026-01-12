import React from 'react';
import { supabase } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Eye, Clock, Calendar } from 'lucide-react';
import VideoPlayer from './video-player';
import CopyLink from './copy-link';

async function getVideo(id: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error || !data) return null;
  return data;
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);

  if (!video) {
    notFound();
  }

  // Use internal proxy to bypass COOP/COEP restrictions
  const videoUrl = `/api/video/${id}/stream`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 mb-5">
      <div className="max-w-4xl mx-auto space-y-8">
        <VideoPlayer 
          videoId={id}
          src={videoUrl}
          poster="https://via.placeholder.com/1280x720/000000/FFFFFF?text=Loading+Video"
        />

        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold">{video.title}</h1>
          </div>

          <div className="flex gap-6 text-neutral-400 text-sm border-b border-neutral-800 pb-6">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{video.views} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{Math.round(video.completion_rate || 0)}% avg. completion</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(video.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
             <h3 className="font-semibold mb-2">Share this video</h3>
             <CopyLink url={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/watch/${id}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
