"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  /** Daftar path (atau substring path) yang membuat search bar aktif */
  searchablePaths: string[];
  /** Map dari substring path ke placeholder teks */
  placeholderMap: Record<string, string>;
  /** Placeholder default jika tidak ada path yang cocok */
  defaultPlaceholder?: string;
  /** Lebar tambahan Tailwind class (opsional) */
  className?: string;
}

export function SearchBar({
  searchablePaths,
  placeholderMap,
  defaultPlaceholder = "Pencarian tidak tersedia...",
  className = "",
}: SearchBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isSearchable = searchablePaths.some((p) => pathname.includes(p));

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const isTyping = useRef(false);

  // Sinkronisasi dengan URL hanya jika user tidak sedang mengetik
  useEffect(() => {
    if (!isTyping.current) {
      setQuery(searchParams.get("q") || "");
    }
  }, [searchParams]);

  // Debounced router update
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!isSearchable) return;

      const params = new URLSearchParams(searchParams.toString());
      const trimmedQuery = query.trim();

      if (trimmedQuery.length >= 2) {
        params.set("q", trimmedQuery);
      } else {
        params.delete("q");
      }

      const currentQuery = searchParams.get("q") || "";
      const newQuery = params.get("q") || "";

      if (currentQuery !== newQuery) {
        if (params.has("page")) params.set("page", "1");
        router.replace(`${pathname}?${params.toString()}`);
      }

      setTimeout(() => {
        isTyping.current = false;
      }, 100);
    }, 300);

    return () => clearTimeout(handler);
  }, [query, isSearchable, pathname, router, searchParams]);

  // Cari placeholder yang cocok berdasarkan urutan prioritas (paling spesifik dulu)
  const placeholder =
    Object.entries(placeholderMap)
      .sort((a, b) => b[0].length - a[0].length) // paling panjang = paling spesifik
      .find(([key]) => pathname.includes(key))?.[1] ?? defaultPlaceholder;

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={isSearchable ? placeholder : defaultPlaceholder}
        value={isSearchable ? query : ""}
        onChange={(e) => {
          isTyping.current = true;
          setQuery(e.target.value);
        }}
        disabled={!isSearchable}
        maxLength={100}
        className={`pl-9 pr-4 py-1.5 rounded-lg text-sm outline-none transition-all ${
          isSearchable
            ? "bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700"
            : "bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed border border-transparent"
        } w-64 lg:w-80`}
      />
      <Search
        className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
          isSearchable ? "text-slate-400" : "text-slate-300 dark:text-slate-600"
        }`}
      />
    </div>
  );
}
