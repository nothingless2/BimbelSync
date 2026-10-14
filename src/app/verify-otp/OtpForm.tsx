"use client";

import { useActionState, useState, useTransition, useEffect } from "react";
import { verifyOtpAction, resendOtpAction } from "./actions";
import { useFormStatus } from "react-dom";

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

export default function OtpForm({ 
  email, 
  maskedEmail 
}: { 
  email: string; 
  maskedEmail: string;
}) {
  const [state, formAction] = useActionState(verifyOtpAction, null);
  const [otpCode, setOtpCode] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendError, setResendError] = useState("");
  const [isPendingResend, startTransition] = useTransition();

  // Hitung mundur 60 detik (1 menit)
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleResend = () => {
    setResendMsg("");
    setResendError("");

    startTransition(async () => {
      const res = await resendOtpAction(email);
      if (res.error) {
        setResendError(res.error);
      } else if (res.message) {
        setResendMsg(res.message);
        setCountdown(60); // Reset timer 60 detik
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Target Masked Email Banner (OWASP PII Protection) */}
      {maskedEmail && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
          <span className="text-xs text-slate-400 block mb-0.5">Kode verifikasi dikirimkan ke email:</span>
          <span className="text-sm font-bold text-slate-800 tracking-wide font-mono">{maskedEmail}</span>
        </div>
      )}

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
        {/* Anti-Bot Honeypot Field */}
        <input 
          type="text" 
          name="_hp_website" 
          style={{ display: "none" }} 
          tabIndex={-1} 
          autoComplete="off" 
        />

        {/* Hidden Email Field untuk fallback session */}
        <input type="hidden" name="email" value={email} />

        {/* 6 Digit OTP Input (No badge) */}
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
            inputMode="numeric"
            pattern="[0-9]{6}"
            autoFocus
            autoComplete="one-time-code"
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

      {/* Resend Action with Countdown */}
      <div className="text-center pt-2">
        <p className="text-sm text-slate-500">
          Tidak menerima kode?{" "}
          {countdown > 0 ? (
            <span className="font-semibold text-slate-400">
              Kirim ulang dalam <span className="font-mono text-blue-600 font-bold">{countdown}d</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isPendingResend}
              className="font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition cursor-pointer"
            >
              {isPendingResend ? "Mengirim Ulang..." : "Kirim Ulang Kode OTP"}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
