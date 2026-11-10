"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface FeatureVideoProps {
  videoSrc: string;
  posterSrc: string;
  alt: string;
  className?: string;
}

export function FeatureVideo({
  videoSrc,
  posterSrc,
  alt,
  className = "",
}: FeatureVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Lazy loading video menggunakan IntersectionObserver agar hemat bandwidth & PageSpeed optimal
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (videoRef.current) {
              videoRef.current.play().catch(() => {
                // Autoplay dicegah browser, poster gambar tetap tampil
              });
            }
          } else {
            // Pause video saat elemen berada di luar layar untuk menghemat CPU & daya baterai
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
            }
          }
        });
      },
      {
        rootMargin: "200px 0px", // Mulai preload video 200px sebelum masuk viewport
        threshold: 0.15,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Pastikan properti muted aktif pada level DOM node (kritis untuk browser iOS/Safari/Chrome)
  const handleVideoRef = (node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node) {
      node.muted = true;
      node.defaultMuted = true;
      if (isInView) {
        node.play().catch(() => {});
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-100 group-hover:shadow-2xl transition-all duration-500 ${className}`}
    >
      {/* 1. Poster Gambar Teroptimasi (Next.js Image) - Tampil instan, LCP cepat & CLS = 0 */}
      <Image
        src={posterSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 520px"
        loading="lazy"
        priority={false}
        className="object-cover pointer-events-none"
      />

      {/* 2. Video Player HTML5 (Hanya dimuat saat elemen mendekati viewport) */}
      {isInView && (
        <video
          ref={handleVideoRef}
          poster={posterSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setIsVideoPlaying(true)}
          onPlaying={() => setIsVideoPlaying(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            isVideoPlaying ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src={videoSrc} type="video/mp4" />
          Browser Anda tidak mendukung pemutaran video.
        </video>
      )}

      {/* Subtle glass gloss highlight overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-black/5" />
    </div>
  );
}

