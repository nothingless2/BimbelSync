"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { Search } from "lucide-react";

export function SuperadminSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Determine context
  const isAcademies = pathname === "/superadmin/academies";
  const isUsers = pathname === "/superadmin/users";
  const isAuditLogs = pathname === "/superadmin/audit-logs";
  
  const isSearchable = isAcademies || isUsers || isAuditLogs;

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const isTyping = useRef(false);

  // Update local state if URL changes externally, tapi JANGAN timpa jika user sedang mengetik
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
      
      // If the URL actually changes, push the new state
      const currentQuery = searchParams.get("q") || "";
      const newQuery = params.get("q") || "";
      
      if (currentQuery !== newQuery) {
        // Reset to page 1 if search changes
        if (params.has("page")) params.set("page", "1");
        router.replace(`${pathname}?${params.toString()}`);
      }
      
      // Setelah routing selesai diproses (kira-kira), izinkan sinkronisasi URL lagi
      setTimeout(() => { isTyping.current = false; }, 100);
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [query, isSearchable, pathname, router, searchParams]);

  let placeholder = "Pencarian tidak tersedia di halaman ini";
  if (isAcademies) placeholder = "Cari nama atau URL akademi...";
  else if (isUsers) placeholder = "Cari email superadmin...";
  else if (isAuditLogs) placeholder = "Cari aksi atau email...";

  return (
    <div className="relative">
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
            ? "w-64 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700" 
            : "w-64 bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed border border-transparent"
        }`}
      />
      <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isSearchable ? "text-slate-400" : "text-slate-300 dark:text-slate-600"}`} />
    </div>
  );
}
