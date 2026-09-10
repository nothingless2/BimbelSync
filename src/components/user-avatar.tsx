"use client";

import { useState } from "react";
import Image from "next/image";

interface UserAvatarProps {
  id: string;
  email: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

export function UserAvatar({ id, email, avatarUrl, size = 32, className = "" }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Jika avatarUrl tidak ada atau gagal dimuat, gunakan dicebear deterministic dengan id sebagai seed
  const fallbackUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${id}`;
  const displayUrl = avatarUrl && !imgError ? avatarUrl : fallbackUrl;

  return (
    <div
      className={`rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600 shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={displayUrl}
        alt={email}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
        unoptimized={displayUrl.startsWith("https://api.dicebear.com")}
      />
    </div>
  );
}
