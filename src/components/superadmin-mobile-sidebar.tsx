"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { SuperadminNav } from "./superadmin-nav";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

export function SuperadminMobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        aria-label="Open Menu"
      >
        <Menu size={24} />
      </button>

      {mounted && createPortal(
        <>
          {/* Backdrop */}
          {isOpen && (
            <div 
              className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm md:hidden"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* Drawer */}
          <div 
            className={`fixed top-0 left-0 z-[110] w-72 h-full bg-white dark:bg-slate-900 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
              isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="BimbelSync Logo" width={28} height={28} className="object-contain rounded-md" />
                <span className="text-xl font-bold text-slate-800 dark:text-white capitalize tracking-tight">
                  BimbelSync
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <SuperadminNav />
          </div>
        </>,
        document.body
      )}
    </>
  );
}
