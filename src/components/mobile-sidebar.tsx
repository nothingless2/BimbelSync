"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { TenantNav } from "./tenant-nav";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

export function MobileSidebar({ 
  tenantSlug, 
  userRole,
  allowsAutomatedEmail,
  academyName,
  academyLogoUrl,
}: { 
  tenantSlug: string; 
  userRole?: string;
  allowsAutomatedEmail?: boolean;
  academyName?: string;
  academyLogoUrl?: string | null;
}) {
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
      {/* Mobile Header Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        aria-label="Open Menu"
      >
        <Menu size={24} />
      </button>

      {/* Portal untuk Backdrop & Drawer (Agar terlepas dari CSS containing block / backdrop-filter Header) */}
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
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {academyLogoUrl ? (
                    <img
                      src={academyLogoUrl}
                      alt={academyName || "Logo"}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <Image src="/logo.png" alt="BimbelSync Logo" width={28} height={28} className="object-contain rounded-md" />
                  )}
                </div>
                <span className="text-base font-bold text-slate-800 dark:text-white tracking-tight truncate">
                  {academyName || "BimbelSync"}
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Content */}
            <TenantNav tenantSlug={tenantSlug} userRole={userRole} allowsAutomatedEmail={allowsAutomatedEmail} />
          </div>
        </>,
        document.body
      )}
    </>
  );
}
