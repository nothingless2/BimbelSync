"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  name?: string;
  options: SearchableSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function SearchableSelect({
  name,
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = "Pilih opsi...",
  searchPlaceholder = "Cari...",
  required = false,
  disabled = false,
  className = "",
  id,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(defaultValue || "");
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const lowerQuery = searchQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lowerQuery));
  }, [options, searchQuery]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      // Focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery(""); // Reset search on close
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
          className={`text-slate-400 transition-transform duration-300 shrink-0 ml-2 ${isOpen ? "rotate-180 text-blue-500" : ""}`}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 min-w-full w-max mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/40 overflow-hidden flex flex-col"
          >
            {/* Search Box */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 dark:text-slate-200"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <ul className="max-h-60 overflow-y-auto custom-scrollbar p-1">
              {filteredOptions.length === 0 ? (
                <li className="px-4 py-3 text-sm text-slate-500 text-center">Pencarian tidak ditemukan</li>
              ) : (
                filteredOptions.map((opt) => (
                  <li
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                      value === opt.value
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="whitespace-nowrap pr-4">{opt.label}</span>
                    {value === opt.value && <Check size={16} className="text-blue-600 dark:text-blue-400" />}
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
