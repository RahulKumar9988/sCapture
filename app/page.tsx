
import Link from 'next/link';
import { ArrowRight, Video } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <main className="relative z-10 text-center space-y-8 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-sm text-neutral-400 mb-4">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Ready to record
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">
          Capture your screen instantly.
        </h1>
        
        <p className="text-lg text-neutral-400 max-w-xl mx-auto">
          The simplest way to record, trim, and share screen recordings. No login required.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link 
            href="/record"
            className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 group"
          >
            Start Recording
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="https://github.com/RahulKumar9988/sCapture"
            target="_blank"
            rel="noopener noreferrer" 
            className="px-8 py-4 bg-neutral-900 text-white border border-neutral-800 rounded-full font-bold text-lg hover:bg-neutral-800 transition-all"
          >
            View on GitHub
          </a>
        </div>
      </main>

      <footer className="absolute bottom-8 text-neutral-600 text-sm">
        Developed By <a href="https://rj-beryl.vercel.app/">Rahul_Kumar</a>
      </footer>
    </div>
  );
}
