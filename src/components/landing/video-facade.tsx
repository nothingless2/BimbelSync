'use client';

import { useState } from 'react';

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
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay"
          allowFullScreen
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsPlaying(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsPlaying(true);
        }
      }}
      aria-label={`Putar video: ${title}`}
      className="relative max-w-4xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden aspect-video bg-black shadow-2xl shadow-blue-500/10 border border-slate-200 group cursor-pointer select-none"
    >
      {/* Real YouTube Thumbnail */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
        width={1280}
        height={720}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
      />

      {/* Subtle YouTube Ambient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

      {/* Top Header YouTube Title Bar */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-5 flex items-center justify-between pointer-events-none z-10">
        <span className="text-white text-sm sm:text-base font-medium truncate drop-shadow-md">
          {title}
        </span>
      </div>

      {/* Iconic Official YouTube Play Button */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <svg
          className="w-16 h-11 sm:w-20 sm:h-14 transition-transform duration-300 group-hover:scale-110 drop-shadow-xl"
          viewBox="0 0 68 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="transition-colors duration-300 fill-[#212121]/80 group-hover:fill-[#FF0000]"
            d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"
          />
          <path d="M 45,24 27,14 27,34" fill="#FFFFFF" />
        </svg>
      </div>
    </div>
  );
}
