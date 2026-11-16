"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface CustomSelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

export interface CustomSelectProps {
  name?: string;
  options: CustomSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  placement?: "auto" | "bottom" | "top";
}

export function CustomSelect({
  name,
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = "Pilih opsi...",
  required = false,
  disabled = false,
  className = "",
  id,
  placement = "auto",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(defaultValue || "");
  const [openUpwards, setOpenUpwards] = useState(placement === "top");
  const containerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const selectedOption = options.find((opt) => opt.value === value);

  // Auto calculate placement when opening
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (placement === "top") {
        setOpenUpwards(true);
      } else if (placement === "bottom") {
        setOpenUpwards(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        // Hanya buka ke atas jika ruang di bawah sempit (< 220px) DAN ruang di atas benar-benar cukup (>= 220px)
        if (spaceBelow < 220 && spaceAbove >= 220) {
          setOpenUpwards(true);
        } else {
          setOpenUpwards(false);
        }
      }
    }
  }, [isOpen, placement]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    if (!isControlled) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden input for form submission and HTML5 required validation */}
      {name && (
        <input
          type="text"
          id={id}
          name={name}
          value={value || ""}
          required={required}
          readOnly
          tabIndex={-1}
          className="absolute opacity-0 w-1 h-1 overflow-hidden pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      )}

      <div
        className={`w-full px-4 py-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
          disabled
            ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            : isOpen
            ? "bg-white dark:bg-slate-950 border-blue-500 ring-2 ring-blue-500/20 text-slate-900 dark:text-white"
            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={`block truncate ${!selectedOption ? "text-slate-500 dark:text-slate-400 font-normal" : "font-medium"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-500" : ""}`}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpwards ? 10 : -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpwards ? 10 : -10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`absolute z-50 w-full min-w-[200px] left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-slate-900/10 dark:shadow-black/50 overflow-hidden ${
              openUpwards ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
          >
            <ul className="max-h-56 overflow-y-auto custom-scrollbar p-1">
              {options.length === 0 ? (
                <li className="px-4 py-3 text-xs sm:text-sm text-slate-500 text-center">Tidak ada opsi</li>
              ) : (
                options.map((opt) => (
                  <li
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs sm:text-sm ${
                      value === opt.value
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.badge && (
                        <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {value === opt.value && <Check size={15} className="text-blue-600 dark:text-blue-400 shrink-0 ml-1" />}
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
