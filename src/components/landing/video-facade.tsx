'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import Image from 'next/image';

interface VideoFacadeProps {
  videoId?: string;
  title?: string;
}

export function VideoFacade({
  videoId = 'dQw4w9WgXcQ',
  title = 'BimbelSync Demo Video',
}: VideoFacadeProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return (
      <div className="relative max-w-4xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden aspect-video bg-black shadow-2xl shadow-blue-500/10 border border-slate-200">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden aspect-video bg-slate-900 shadow-2xl shadow-blue-500/10 border border-slate-200 group cursor-pointer">
      {/* Background Poster Image */}
      <img
        src={`https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop`}
        alt={title}
        width={1200}
        height={675}
        loading="lazy"
        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-slate-950/20" />

      {/* Center Play Button Button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <button
          onClick={() => setIsPlaying(true)}
          type="button"
          aria-label="Putar video demo BimbelSync"
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 group-hover:scale-110 transition-all duration-300 backdrop-blur-sm border-2 border-white/20"
        >
          <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-0.5" />
        </button>

        <span className="text-white text-xs sm:text-sm font-semibold tracking-wide bg-slate-950/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
          Tonton Demo Singkat (1 Menit)
        </span>
      </div>
    </div>
  );
}

