"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";

export function TenantSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Determine if the current route is searchable
  const isSearchable = pathname.includes("/master-data/") || 
                       pathname.includes("/schedules") || 
                       pathname.includes("/finance") ||
                       pathname.includes("/audit-logs");

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const isTyping = useRef(false);

  // Update local state if URL changes externally (misal back/forward)
  useEffect(() => {
    if (!isTyping.current) {
      setQuery(searchParams.get("q") || "");
    }
  }, [searchParams]);

  // Debounced search effect
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
      
      // Selesai ngetik dan routing
      setTimeout(() => { isTyping.current = false; }, 100);
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [query, isSearchable, pathname, router, searchParams]);

  let placeholder = "Pencarian tidak tersedia...";
  if (pathname.includes("/master-data/students")) placeholder = "Cari nama atau username siswa...";
  else if (pathname.includes("/master-data/rooms")) placeholder = "Cari nama ruangan...";
  else if (pathname.includes("/master-data/programs")) placeholder = "Cari nama program...";
  else if (pathname.includes("/master-data/staff")) placeholder = "Cari nama atau email staf...";
  else if (pathname.includes("/schedules")) placeholder = "Cari program, ruangan, atau tutor...";
  else if (pathname.includes("/finance")) placeholder = "Cari nama siswa di tagihan...";
  else if (pathname.includes("/audit-logs")) placeholder = "Cari entitas atau aksi...";

  return (
    <div className="relative hidden md:block">
      <input 
        type="text" 
        placeholder={placeholder}
        value={isSearchable ? query : ""}
        onChange={(e) => {
          isTyping.current = true;
          setQuery(e.target.value);
        }}
        disabled={!isSearchable}
        maxLength={100}
        className={`pl-9 pr-4 py-1.5 border-none rounded-lg text-sm outline-none transition-all ${
          isSearchable 
            ? "w-64 lg:w-80 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700" 
            : "w-64 bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed border border-transparent"
        }`}
      />
      <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isSearchable ? "text-slate-400" : "text-slate-300 dark:text-slate-600"}`} />
    </div>
  );
}
