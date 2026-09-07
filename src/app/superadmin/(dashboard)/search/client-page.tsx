"use client";

import { useState } from "react";
import { Search, Loader2, Building2, Users, ArrowRight } from "lucide-react";
import { searchTenantsAction } from "./actions";
import Link from "next/link";
import { toast } from "@/components/ui/sonner";

export default function SearchClientPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    const res = await searchTenantsAction(query);
    if (res.error) {
      toast.error(res.error);
    } else {
      setResults(res.data || []);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Pencarian Global</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Cari Tenant/Akademi berdasarkan nama atau email admin.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto mb-8">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <Search size={24} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama bimbel atau email admin..."
            className="w-full pl-14 pr-32 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-lg outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
          />
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            className="absolute right-3 top-3 bottom-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Cari"}
          </button>
        </form>

        {hasSearched && !loading && results.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <Search className="mx-auto mb-4 opacity-50" size={48} />
            <p className="text-lg">Tidak ada hasil ditemukan untuk "{query}".</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 px-2">
              Ditemukan {results.length} hasil pencarian
            </h3>
            
            {results.map((academy) => (
              <div key={academy.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{academy.name}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1.5"><Users size={14}/> {academy._count.staff} Staff</span>
                      <span>•</span>
                      <span>Paket: <span className="font-medium text-slate-700 dark:text-slate-300">{academy.plan.name}</span></span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                        academy.subscription_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        academy.subscription_status === 'TRIAL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {academy.subscription_status}
                      </span>
                    </div>
                  </div>
                </div>

                <Link 
                  href={`/superadmin/academies/${academy.id}`}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 rounded-xl font-semibold transition flex items-center justify-center gap-2 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400"
                >
                  Detail <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
