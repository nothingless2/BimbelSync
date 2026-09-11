"use client";

import { useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";

export function GenerateInvoicesButton({ academyId }: { academyId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setIsLoading(true);
    toast.info("Menganalisis data siswa dan program...", { id: "generate-cron" } as any);
    
    try {
      const res = await fetch("/api/cron/generate-invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ academy_id: academyId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses");
      }
      
      toast.success(data.message || "Berhasil memproses automasi", { id: "generate-cron" });
      router.refresh();
      
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan sistem", { id: "generate-cron" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleGenerate}
      disabled={isLoading}
      className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-amber-500 text-white hover:bg-amber-600 h-10 py-2 px-4 shadow-sm"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Zap className="mr-2 h-4 w-4 fill-white" />
      )}
      Generate Tagihan Bulan Ini
    </button>
  );
}
