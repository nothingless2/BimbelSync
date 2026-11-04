"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "./actions";
import { useFormStatus } from "react-dom";
import Link from "next/link";

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
          Mengirim Kode Verifikasi...
        </span>
      ) : (
        <span>Kirim Kode Verifikasi</span>
      )}
    </button>
  );
}

export default function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, null);

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl border border-red-100 text-sm font-medium flex items-start animate-fade-in shadow-xs">
          <svg className="w-5 h-5 mr-2.5 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{state.error}</span>
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

        {/* Input Email */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Email Akun Anda
          </label>
          <input 
            type="email" 
            name="email" 
            required 
            autoFocus
            className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none text-sm"
            placeholder="Masukkan email yang terdaftar (contoh: budi@email.com)"
          />
          <p className="mt-1 text-xs text-slate-400">
            Kami akan mengirimkan 6 digit kode OTP untuk mengatur ulang kata sandi Anda.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <SubmitButton />
        </div>
      </form>

      {/* Footer Back Link */}
      <div className="pt-4 border-t border-slate-100 text-center space-y-2">
        <p className="text-sm text-slate-500">
          Sudah ingat kata sandi Anda?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

