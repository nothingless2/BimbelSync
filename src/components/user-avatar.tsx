"use client";

import { useState } from "react";
import Image from "next/image";

interface UserAvatarProps {
  id?: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

// 8 palet warna yang profesional, modern, dan harmonis (light & dark mode)
const AVATAR_PALETTES = [
  { bg: "bg-blue-100 dark:bg-blue-950/70", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  { bg: "bg-indigo-100 dark:bg-indigo-950/70", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
  { bg: "bg-purple-100 dark:bg-purple-950/70", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/70", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  { bg: "bg-amber-100 dark:bg-amber-950/70", text: "text-amber-800 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  { bg: "bg-rose-100 dark:bg-rose-950/70", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  { bg: "bg-cyan-100 dark:bg-cyan-950/70", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800" },
  { bg: "bg-teal-100 dark:bg-teal-950/70", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
];

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    const localPart = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    if (localPart.length >= 2) {
      return localPart.slice(0, 2).toUpperCase();
    }
    return (localPart[0] || "U").toUpperCase();
  }
  return "U";
}

function getPalette(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export function UserAvatar({
  id = "",
  name,
  email,
  avatarUrl,
  size = 32,
  className = "",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = getInitials(name, email);
  const palette = getPalette(id || email || name || "seed");

  // Jika avatarUrl ada, valid, dan belum pernah error
  const hasValidAvatar = Boolean(avatarUrl && !imgError && avatarUrl.trim() !== "");

  if (hasValidAvatar && avatarUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 relative ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={avatarUrl}
          alt={name || email || "User Avatar"}
          width={size}
          height={size}
          unoptimized
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: Inisial nama / email deterministik tanpa ketergantungan API pihak ketiga
  const fontSize = Math.max(10, Math.floor(size * 0.38));

  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-bold tracking-tight select-none border transition-colors ${palette.bg} ${palette.text} ${palette.border} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: `${fontSize}px`,
      }}
      title={name || email || "User"}
      aria-label={name || email || "User"}
    >
      {initials}
    </div>
  );
}
