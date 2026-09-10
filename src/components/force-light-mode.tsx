"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";

/**
 * Komponen ini memaksa halaman menjadi light mode dengan aman 
 * menggunakan ThemeProvider context, menghindari konflik dengan tailwind.
 */
export function ForceLightMode() {
  const { theme, setTheme } = useTheme();
  const originalTheme = useRef<string>("system");

  useEffect(() => {
    // Simpan tema awal dari local storage / system
    const saved = localStorage.getItem("theme") || "system";
    originalTheme.current = saved;

    // Paksa light mode jika saat ini bukan light
    if (saved !== "light") {
      setTheme("light");
    }

    // Kembalikan ke tema awal saat unmount (misal user logout)
    return () => {
      if (originalTheme.current !== "light") {
        setTheme(originalTheme.current as any);
      }
    };
  }, [setTheme]);

  return null;
}
