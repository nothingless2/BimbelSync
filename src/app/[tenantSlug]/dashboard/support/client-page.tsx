"use client";

import { useState } from "react";
import { Mail, MessageCircle, Phone, FileText, Send, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import { submitSupportTicketAction } from "./actions";

const faqs = [
  {
    question: "Bagaimana cara menambah staf baru?",
    answer: "Anda dapat menuju menu 'Master Data > Staff' dan mengklik tombol 'Tambah Staf'. Pastikan paket langganan Anda masih memiliki kuota untuk menambah staf."
  },
  {
    question: "Mengapa tagihan siswa tidak bisa dihapus?",
    answer: "Tagihan yang sudah berstatus LUNAS tidak dapat dihapus atau dimodifikasi untuk menjaga integritas data keuangan. Anda hanya bisa menghapus tagihan yang masih berstatus BELUM DIBAYAR."
  },
  {
    question: "Bagaimana jika siswa lupa password?",
    answer: "Admin dapat mereset password siswa melalui menu 'Master Data > Students'. Edit data siswa tersebut dan masukkan password baru. Siswa akan diminta mengubah password saat login berikutnya."
  },
  {
    question: "Apakah saya bisa mengubah harga tagihan yang sudah dicetak?",
    answer: "Tidak bisa. Jika ada kesalahan nominal, Anda harus menghapus tagihan lama (jika belum dibayar) dan membuat tagihan baru dengan nominal yang benar."
  }
];

export default function SupportClientPage({ tenantSlug, staffEmail }: { tenantSlug: string, staffEmail: string }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("billing");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    if (!formData.get("category")) {
      formData.set("category", selectedCategory);
    }

    try {
      const result = await submitSupportTicketAction(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Pesan terkirim ke tim support!");
        form.reset();
        setSelectedCategory("billing");
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengirimkan pesan bantuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Kolom Kiri: Form & Kontak */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-white/10">
            <MessageCircle size={120} />
          </div>
          <h3 className="text-xl font-bold mb-2 relative z-10">Hubungi Kami</h3>
          <p className="text-blue-100 text-sm mb-6 relative z-10">
            Tim Support BimbelSync siap membantu kendala operasional Anda 24/7.
          </p>
          
          <div className="space-y-4 relative z-10">
            <a 
              href="https://wa.me/6285173392350?text=Halo%20Tim%20Support%20BimbelSync,%20saya%20butuh%20bantuan." 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition rounded-xl p-3 backdrop-blur-sm border border-white/20 group cursor-pointer"
            >
              <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform"><Phone size={18} /></div>
              <div>
                <p className="text-xs text-blue-200">WhatsApp Support</p>
                <p className="font-semibold">+62 851-7339-2350</p>
              </div>
            </a>
            <a 
              href="mailto:admin@bimbelsync.web.id"
              className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition rounded-xl p-3 backdrop-blur-sm border border-white/20 group cursor-pointer"
            >
              <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform"><Mail size={18} /></div>
              <div>
                <p className="text-xs text-blue-200">Email Support</p>
                <p className="font-semibold">admin@bimbelsync.web.id</p>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Kirim Pesan Bantuan</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Ceritakan kendala Anda secara detail.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Balasan</label>
              <input 
                type="email" 
                disabled
                defaultValue={staffEmail}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 text-sm cursor-not-allowed" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori Masalah</label>
              <CustomSelect
                name="category"
                required
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                placeholder="Pilih Kategori..."
                options={[
                  { value: "billing", label: "Kendala Tagihan & Pembayaran" },
                  { value: "account", label: "Akun & Akses" },
                  { value: "feature", label: "Cara Penggunaan Fitur" },
                  { value: "bug", label: "Laporan Bug / Error" },
                  { value: "other", label: "Lainnya" }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pesan / Kendala</label>
              <textarea 
                name="message"
                required
                rows={4}
                placeholder="Jelaskan kendala Anda..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={16} /> Kirim Pesan
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Kolom Kanan: FAQ */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pertanyaan Sering Ditanyakan (FAQ)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Temukan solusi cepat dari kendala umum.</p>
            </div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                  openFaq === index 
                    ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left focus:outline-none"
                >
                  <span className={`font-semibold text-sm ${openFaq === index ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-200'}`}>
                    {faq.question}
                  </span>
                  <div className={`p-1 rounded-full transition-colors shrink-0 ${openFaq === index ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    {openFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === index ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>

    </div>
  );
}
