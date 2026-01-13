
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Video, Square, Play, Scissors, Upload, Share2, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import TrimSlider from './trim-slider';
import { Toaster, toast } from 'sonner';



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
        mimeType: 'video/webm; codecs=vp9',
        videoBitsPerSecond: 8000000, // 8 Mbps for high quality (was default ~2.5 Mbps)
        audioBitsPerSecond: 128000   // 128 kbps for audio
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
            toast.warning('Recording limit reached', { description: '65 second maximum recording time' });
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
  const [isProcessing, setIsProcessing] = useState(false);
  const ffmpegRef = useRef<any>(null);

  const loadFfmpeg = async () => {
      if (ffmpegRef.current) return ffmpegRef.current;
      
      const { FFmpeg, toBlobURL } = await import('@/lib/ffmpeg-loader');
      
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
    
    let blobToUpload = videoBlob;

    // Optimized Canvas trimming (if needed)
    if (trimStart > 0 || trimEnd < duration) {
       setIsProcessing(true);
       setStatus('uploading');
       
       try {
         // Create video element
         const video = document.createElement('video');
         video.src = URL.createObjectURL(videoBlob);
         video.muted = true;
         
         await new Promise((resolve) => {
           video.onloadedmetadata = resolve;
         });
         
         // Create canvas with lower resolution for faster processing
         const canvas = document.createElement('canvas');
         const scale = 0.75; // 75% resolution for speed
         canvas.width = video.videoWidth * scale;
         canvas.height = video.videoHeight * scale;
         const ctx = canvas.getContext('2d', { alpha: false })!;
         
         // Capture stream at lower FPS
         const stream = canvas.captureStream(15); // 15 FPS instead of 30
         
         // Set up MediaRecorder with optimized settings
         const recorder = new MediaRecorder(stream, {
           mimeType: 'video/webm;codecs=vp8', // VP8 is faster than VP9
           videoBitsPerSecond: 5000000, // 5 Mbps - balance of quality/speed
         });
         
         const chunks: Blob[] = [];
         recorder.ondataavailable = (e) => {
           if (e.data.size > 0) chunks.push(e.data);
         };
         
         // Start recording
         recorder.start();
         video.currentTime = trimStart;
         await video.play();
         
         let frameCount = 0;
         const totalFrames = Math.ceil((trimEnd - trimStart) * 15); // 15 FPS
         
         // Optimized frame drawing with progress
         const drawFrame = () => {
           if (video.currentTime >= trimEnd || video.paused) {
             recorder.stop();
             video.pause();
             URL.revokeObjectURL(video.src);
             return;
           }
           
           // Draw frame
           ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
           
           // Update progress
           frameCount++;
           const progress = Math.min((frameCount / totalFrames) * 100, 99);
           setUploadProgress(progress);
           
           // Use requestAnimationFrame for smooth rendering
           requestAnimationFrame(drawFrame);
         };
         
         drawFrame();
         
         // Wait for recording to finish
         blobToUpload = await new Promise<Blob>((resolve) => {
           recorder.onstop = () => {
             setUploadProgress(100);
             resolve(new Blob(chunks, { type: 'video/webm' }));
           };
         });
         
       } catch (error) {
           console.error("Trimming error:", error);
           toast.error('Trimming failed', { description: 'Uploading original video' });
           blobToUpload = videoBlob;
       }
    }

    setStatus('uploading');
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
        
        // 3. Save Metadata to DB (including trim points)
        const saveRes = await fetch('/api/video/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: fileId,
                title: `Screen Recording ${new Date().toLocaleString()}`,
                filename: filename,
                trim_start: trimStart,
                trim_end: trimEnd
            })
        });
        
        if (!saveRes.ok) throw new Error('Failed to save video data');
        
        // Success!
        router.push(`/watch/${fileId}`);
        
    } catch (err) {
      console.error(err);
      setStatus('preview');
      toast.error('Upload failed', { description: (err as Error).message });
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
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
                className="group relative px-8 py-4 bg-red-600 hover:bg-red-500 rounded-full font-semibold text-lg transition-all transform hover:scale-105 cursor-pointer"
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
              className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <Square className="w-5 h-5 fill-current" />
              Stop Recording
            </button>
          </div>
        )}

        {status === 'preview' && videoUrl && (
          <div className="w-full bg-neutral-900 p-6 rounded-2xl border border-neutral-800 space-y-6">
            <h2 className="text-xl font-semibold">Preview & Edit</h2>
            
            <div className="relative">
              <video 
                ref={videoPreviewRef}
                src={videoUrl} 
                controls 
                className="w-full rounded-lg bg-black aspect-video"
                onLoadedMetadata={handleLoadedMetadata}
              />
              
              {/* Trim markers overlay on video controls */}
              {duration > 0 && (trimStart > 0 || trimEnd < duration) && (
                <div className="absolute bottom-12 left-0 right-0 px-4 pointer-events-none">
                  <div className="relative h-1 bg-transparent">
                    {/* Start marker */}
                    <div 
                      className="absolute top-0 w-1 h-4 -mt-1.5 bg-green-500 rounded-full shadow-lg"
                      style={{ left: `${(trimStart / duration) * 100}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                        Start
                      </div>
                    </div>
                    
                    {/* End marker */}
                    <div 
                      className="absolute top-0 w-1 h-4 -mt-1.5 bg-red-500 rounded-full shadow-lg"
                      style={{ left: `${(trimEnd / duration) * 100}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                        End
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
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
            
            {/* Progress bar */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="max-w-md mx-auto">
                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-neutral-500 mt-2">{Math.round(uploadProgress)}% complete</p>
              </div>
            )}
            
            <p className="text-sm text-neutral-500">
              {isProcessing ? 'Processing video in browser Do not close the tab...' : 'Larger videos may take a moment.'}
            </p>
          </div>
        )}

      </main>
    </div>
    </>
  );
}
