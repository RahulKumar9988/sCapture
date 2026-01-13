
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Video, Square, Play, Scissors, Upload, Share2, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import TrimSlider from './trim-slider';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

export default function RecordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'recording' | 'preview' | 'uploading'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      // 1. Get Screen Stream (Video + System Audio)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // 2. Get Mic Stream
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
            },
        });
      } catch (micErr) {
        console.warn("Microphone access denied or not available", micErr);
      }

      // 3. Set up Audio Mixing
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      
      // Add System Audio (if available)
      if (displayStream.getAudioTracks().length > 0) {
          const sysSource = audioContext.createMediaStreamSource(displayStream);
          const sysGain = audioContext.createGain();
          sysGain.gain.value = 1.0;
          sysSource.connect(sysGain).connect(destination);
      }

      // Add Mic Audio (if available)
      if (micStream && micStream.getAudioTracks().length > 0) {
          const micSource = audioContext.createMediaStreamSource(micStream);
          const micGain = audioContext.createGain();
          micGain.gain.value = 1.0; 
          micSource.connect(micGain).connect(destination);
      }

      // 4. Combine Video + Mixed Audio
      const mixedAudioTracks = destination.stream.getAudioTracks();
      
      const combinedStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...mixedAudioTracks 
      ]);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm; codecs=vp9'
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };

      recorder.onstop = () => {
        combinedStream.getTracks().forEach(track => track.stop());
        displayStream.getTracks().forEach(track => track.stop());
        if (micStream) micStream.getTracks().forEach(track => track.stop());
        
        audioContext.close();
        setStream(null);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.start();
      setStream(combinedStream);
      setMediaRecorder(recorder);
      setStatus('recording');
      
      // Timer Logic
      setElapsedTime(0);
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setElapsedTime(elapsed);
        if (elapsed >= 65) {
            recorder.stop();
            setStatus('preview');
            alert("Recording reached 65 second limit.");
        }
      }, 1000);

      // Stop recording if user stops sharing via browser UI
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setStatus('preview');
    }
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
  };

  useEffect(() => {
    if (status === 'preview' && recordedChunks.length > 0 && !videoBlob) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setVideoUrl(url);
    }
  }, [status, recordedChunks, videoBlob]);

  const handleLoadedMetadata = () => {
    if (videoPreviewRef.current) {
      const d = videoPreviewRef.current.duration;
      setDuration(d);
      setTrimStart(0);
      setTrimEnd(d);
    }
  };

  // Import FFmpeg types
  // Note: We'll import dynamically to avoid SSR issues
  const [isProcessing, setIsProcessing] = useState(false);
  const ffmpegRef = useRef<any>(null);



  const loadFfmpeg = async () => {
      if (ffmpegRef.current) return ffmpegRef.current;
      const ffmpeg = new FFmpeg();
      
      // Load ffmpeg.wasm from unpkg/CDN 
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      ffmpegRef.current = ffmpeg;
      return ffmpeg;
  };

  const handleUpload = async () => {
    if (!videoBlob) return;
    setStatus('uploading');
    
    let blobToUpload = videoBlob;

    // Client-side Trim using FFmpeg.wasm
    if (trimStart > 0 || trimEnd < duration) {
       setIsProcessing(true);
       try {
         const ffmpeg = await loadFfmpeg();
         await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob));
         
         // Calculate duration properly
         const durationToKeep = trimEnd - trimStart;
         
         await ffmpeg.exec([
             '-i', 'input.webm', 
             '-ss', trimStart.toString(), 
             '-t', durationToKeep.toString(), // Use -t (duration) instead of -to for safer cutting
             '-c:v', 'libx264',
             '-crf', '28',
             '-preset', 'ultrafast', // Switch to ultrafast for speed
             '-c:a', 'aac',
             'output.mp4'
         ]);
         
         const data = await ffmpeg.readFile('output.mp4');
         blobToUpload = new Blob([data], { type: 'video/mp4' });
         
         await ffmpeg.deleteFile('input.webm');
         await ffmpeg.deleteFile('output.mp4');
         
       } catch (error) {
           console.error("FFmpeg error:", error);
           alert("Local trim failed, uploading original.");
           // Fallback to original blob
           blobToUpload = videoBlob;
       } finally {
           setIsProcessing(false);
       }
    }

    // New Direct Upload Flow (Bypasses Server Limits)
    try {
        const ext = blobToUpload.type.includes('mp4') ? '.mp4' : '.webm';
        
        // 1. Get Presigned URL
        const presignRes = await fetch('/api/upload/presigned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                extension: ext,
                contentType: blobToUpload.type 
            })
        });
        
        if (!presignRes.ok) throw new Error('Failed to get upload URL');
        const { uploadUrl, fileId, filename } = await presignRes.json();
        
        // 2. Upload to Storage (Directly)
        console.log('Uploading directly to Storage...', uploadUrl);
        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: blobToUpload,
            headers: {
                'Content-Type': blobToUpload.type
            }
        });
        
        if (!uploadRes.ok) throw new Error('Direct upload failed');
        
        // 3. Save Metadata to DB
        const saveRes = await fetch('/api/video/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: fileId,
                title: `Screen Recording ${new Date().toLocaleString()}`,
                filename: filename
            })
        });
        
        if (!saveRes.ok) throw new Error('Failed to save video data');
        
        // Success!
        router.push(`/watch/${fileId}`);
        
    } catch (err) {
      console.error(err);
      setStatus('preview');
      alert('Upload failed: ' + (err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl mb-12 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          SRecorder
        </h1>
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center">
        
        {status === 'idle' && (
          <div className="text-center space-y-6">
            <div className="p-12 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl">
              <button
                onClick={startRecording}
                className="group relative px-8 py-4 bg-red-600 hover:bg-red-500 rounded-full font-semibold text-lg transition-all transform hover:scale-105"
              >
                <div className="flex items-center gap-3">
                   <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                   Start Recording
                </div>
              </button>
              <p className="mt-4 text-neutral-400">Records screen + system audio</p>
            </div>
          </div>
        )}

        {status === 'recording' && (
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
              <div className="relative z-10 p-8 bg-neutral-900 rounded-full border-4 border-red-500">
                <Video className="w-16 h-16 text-red-500" />
              </div>
            </div>
            <h2 className="text-2xl font-mono">Recording in progress...</h2>
            <div className="text-4xl font-mono font-bold text-red-500">
              {Math.floor(elapsedTime)}s <span className="text-neutral-500 text-lg">/ 65s</span>
            </div>
            <button
              onClick={stopRecording}
              className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <Square className="w-5 h-5 fill-current" />
              Stop Recording
            </button>
          </div>
        )}

        {status === 'preview' && videoUrl && (
          <div className="w-full bg-neutral-900 p-6 rounded-2xl border border-neutral-800 space-y-6">
            <h2 className="text-xl font-semibold">Preview & Edit</h2>
            
            <video 
              ref={videoPreviewRef}
              src={videoUrl} 
              controls 
              className="w-full rounded-lg bg-black aspect-video"
              onLoadedMetadata={handleLoadedMetadata}
            />

            <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
              <h3 className="text-sm font-medium text-neutral-400 mb-4">Trim Video</h3>
              <TrimSlider 
                duration={duration} 
                trimStart={trimStart} 
                trimEnd={trimEnd} 
                onChange={(s, e) => {
                  setTrimStart(s);
                  setTrimEnd(e);
                  if (videoPreviewRef.current) {
                      videoPreviewRef.current.currentTime = s;
                  }
                }} 
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleUpload}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
              >
                <Upload className="w-5 h-5" />
                Process & Upload Video
              </button>
            </div>
          </div>
        )}

        {(status === 'uploading' || isProcessing) && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-neutral-800 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-lg">{isProcessing ? 'Trimming Video...' : 'Uploading...'}</p>
            <p className="text-sm text-neutral-500">Larger videos may take a moment.</p>
          </div>
        )}

      </main>
    </div>
  );
}
