"use client";

import { useActionState, useState, useTransition, Suspense } from "react";
import { verifyOtpAction, resendOtpAction } from "./actions";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_20px_rgb(37,99,235,0.25)] hover:shadow-[0_6px_25px_rgb(37,99,235,0.35)] flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
    >
      {pending ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Memverifikasi Kode OTP...
        </span>
      ) : (
        <>
          <span>Verifikasi Akun</span>
        </>
      )}
    </button>
  );
}

function OtpForm() {
  const [state, formAction] = useActionState(verifyOtpAction, null);
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendError, setResendError] = useState("");
  const [isPendingResend, startTransition] = useTransition();

  const handleResend = () => {
    if (!email) {
      setResendError("Alamat email tidak boleh kosong.");
      return;
    }
    setResendMsg("");
    setResendError("");

    startTransition(async () => {
      const res = await resendOtpAction(email);
      if (res.error) {
        setResendError(res.error);
      } else if (res.message) {
        setResendMsg(res.message);
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Error Alert */}
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl border border-red-100 text-sm font-medium flex items-start animate-fade-in shadow-xs">
          <svg className="w-5 h-5 mr-2.5 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      {/* Resend Status Alerts */}
      {resendMsg && (
        <div className="bg-emerald-50 text-emerald-700 p-3.5 rounded-xl border border-emerald-100 text-sm font-medium flex items-start animate-fade-in shadow-xs">
          <svg className="w-5 h-5 mr-2.5 shrink-0 mt-0.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{resendMsg}</span>
        </div>
      )}
      {resendError && (
        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl border border-red-100 text-sm font-medium flex items-start animate-fade-in shadow-xs">
          <svg className="w-5 h-5 mr-2.5 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{resendError}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* 6 Digit OTP Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Kode OTP (6 Digit)
          </label>
          <input
            type="text"
            name="otpCode"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            maxLength={6}
            autoFocus
            className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none text-center font-mono text-2xl tracking-[0.5em] font-bold"
            placeholder="······"
          />
          <p className="mt-1.5 text-xs text-slate-400 text-center">
            Periksa kotak masuk (Inbox) atau folder Spam email Anda.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <SubmitButton />
        </div>
      </form>

      {/* Resend Action */}
      <div className="text-center pt-2">
        <p className="text-sm text-slate-500">
          Tidak menerima kode?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={isPendingResend}
            className="font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition cursor-pointer"
          >
            {isPendingResend ? "Mengirim Ulang..." : "Kirim Ulang Kode OTP"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-blue-600 selection:text-white">
      {/* KIRI - Visual Foto Asli & Keterangan Ringkas (Sembunyi di Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden flex-col justify-between p-10 xl:p-14 border-r border-slate-200/80">
        {/* Background Photo Nyata */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/photo-1.avif"
            alt="Suasana Belajar Bimbingan Belajar"
            fill
            className="object-cover opacity-65 filter brightness-105 contrast-100"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-slate-900/30 z-10" />
        </div>

        {/* Top Header / Branding */}
        <div className="relative z-20 flex items-center gap-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-sm">
            <Image
              src="/logo.png"
              alt="BimbelSync Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
          </div>
          <div>
            <span className="text-2xl font-bold text-white tracking-tight">BimbelSync</span>
            <p className="text-xs text-blue-200/80 font-medium">Sistem Manajemen Bimbingan Belajar Terpadu</p>
          </div>
        </div>

        {/* Middle / Security Message */}
        <div className="relative z-20 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wide mb-6">
            Verifikasi Keamanan Akun
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight drop-shadow-sm">
            Lindungi Data & Akses Operasional Bimbel Anda.
          </h2>

          <p className="text-slate-200 text-base xl:text-lg leading-relaxed font-normal drop-shadow-xs max-w-md">
            Verifikasi email memastikan akun Anda aman dan hanya dapat diakses oleh pihak yang sah.
          </p>
        </div>

        {/* Bottom footer credit */}
        <div className="relative z-20 text-xs text-slate-300/80">
          © {new Date().getFullYear()} BimbelSync. Platform manajemen bimbingan belajar profesional.
        </div>
      </div>

      {/* KANAN - Form Verifikasi OTP (Ditengahkan Secara Sempurna) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 py-8 relative z-10 overflow-y-auto min-h-screen">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile Header Brand */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="BimbelSync Logo"
                width={34}
                height={34}
                className="rounded-lg shadow-sm"
              />
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                BimbelSync
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">
              Verifikasi Email Anda
            </h1>
            <p className="text-slate-500 text-sm">
              Kami telah mengirimkan 6 digit kode OTP ke email pendaftaran Anda.
            </p>
          </div>

          <Suspense fallback={<div className="py-8 text-center text-slate-400 text-sm">Memuat form verifikasi...</div>}>
            <OtpForm />
          </Suspense>

          <p className="text-center text-sm text-slate-500 mt-6 pt-3 border-t border-slate-100">
            Salah memasukkan email?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition">
              Daftar ulang di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
