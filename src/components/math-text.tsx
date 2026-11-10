"use client";

import { useEffect, useState, useMemo } from "react";

// Singleton loader untuk script KaTeX dari CDN
let katexLoadingPromise: Promise<any> | null = null;

function loadKaTeX(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if ((window as any).katex) return Promise.resolve((window as any).katex);

  if (!katexLoadingPromise) {
    katexLoadingPromise = new Promise((resolve, reject) => {
      // 1. Inject KaTeX CSS jika belum ada
      if (!document.getElementById("katex-css")) {
        const link = document.createElement("link");
        link.id = "katex-css";
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }

      // 2. Inject KaTeX JS
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
      script.async = true;
      script.onload = () => {
        resolve((window as any).katex);
      };
      script.onerror = (err) => {
        console.error("Gagal memuat KaTeX:", err);
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  return katexLoadingPromise;
}

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Komponen MathText:
 * 1. Mendukung KaTeX Math:
 *    - Display Math (blok tengah): $$...$$
 *    - Inline Math: $...$
 * 2. Mendukung format bacaan/bahasa (Markdown sederhana):
 *    - **Tebal** -> <strong>
 *    - *Miring* -> <em>
 *    - > Kutipan/Wacana -> <blockquote>
 *    - ![alt](url) -> <img>
 *    - Baris baru (\n) -> <br />
 */
export function MathText({ text, className = "" }: MathTextProps) {
  const [isKaTeXReady, setIsKaTeXReady] = useState(false);

  useEffect(() => {
    loadKaTeX().then((katex) => {
      if (katex) setIsKaTeXReady(true);
    });
  }, []);

  const renderedHtml = useMemo(() => {
    if (!text) return "";

    const katex = typeof window !== "undefined" ? (window as any).katex : null;

    // Helper untuk render formula KaTeX dengan aman
    const renderMath = (mathCode: string, displayMode: boolean): string => {
      if (katex) {
        try {
          return katex.renderToString(mathCode.trim(), {
            displayMode,
            throwOnError: false,
          });
        } catch (e) {
          return displayMode ? `\n$$${mathCode}$$\n` : `$${mathCode}$`;
        }
      }
      return displayMode
        ? `<div class="katex-fallback py-1 font-mono text-xs overflow-x-auto bg-slate-100 dark:bg-slate-800 p-2 rounded">$$${escapeHtml(
            mathCode
          )}$$</div>`
        : `<span class="katex-fallback font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">$${escapeHtml(
            mathCode
          )}$</span>`;
    };

    // 1. Ekstrak blok math $$...$$
    const blockMathPlaceholders: string[] = [];
    let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      const rendered = renderMath(math, true);
      const idx = blockMathPlaceholders.length;
      blockMathPlaceholders.push(
        `<div class="my-2.5 overflow-x-auto text-center flex justify-center py-1">${rendered}</div>`
      );
      return `@@BLOCK_MATH_${idx}@@`;
    });

    // 2. Ekstrak inline math $...$ (hindari double $)
    const inlineMathPlaceholders: string[] = [];
    processed = processed.replace(/(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)/g, (_, math) => {
      // Abaikan jika string kosong
      if (!math.trim()) return "$$";
      const rendered = renderMath(math, false);
      const idx = inlineMathPlaceholders.length;
      inlineMathPlaceholders.push(
        `<span class="inline-math inline-block align-middle">${rendered}</span>`
      );
      return `@@INLINE_MATH_${idx}@@`;
    });

    // 3. Escape HTML pada teks sisa
    processed = escapeHtml(processed);

    // 4. Parse Markdown Gambar: ![alt](url)
    processed = processed.replace(/!\[(.*?)\]\((https?:\/\/.*?)\)/g, (_, alt, url) => {
      return `<img src="${url}" alt="${alt}" class="max-h-72 my-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mx-auto object-contain bg-white" />`;
    });

    // 5. Parse Markdown Formatting:
    // **Tebal**
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    // *Miring*
    processed = processed.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // 6. Parse Wacana / Kutipan Bacaan: baris yang diawali "> "
    const lines = processed.split("\n");
    const formattedLines: string[] = [];
    let inQuote = false;
    let quoteBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("&gt; ") || line.startsWith("&gt;")) {
        inQuote = true;
        quoteBuffer.push(line.replace(/^&gt;\s?/, ""));
      } else {
        if (inQuote) {
          formattedLines.push(
            `<blockquote class="border-l-4 border-blue-500 pl-3.5 py-1.5 my-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-r-xl text-slate-700 dark:text-slate-300 font-normal leading-relaxed text-xs sm:text-sm">${quoteBuffer.join(
              "<br />"
            )}</blockquote>`
          );
          quoteBuffer = [];
          inQuote = false;
        }
        formattedLines.push(line);
      }
    }
    if (inQuote) {
      formattedLines.push(
        `<blockquote class="border-l-4 border-blue-500 pl-3.5 py-1.5 my-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-r-xl text-slate-700 dark:text-slate-300 font-normal leading-relaxed text-xs sm:text-sm">${quoteBuffer.join(
          "<br />"
        )}</blockquote>`
      );
    }

    processed = formattedLines.join("<br />");

    // 7. Kembalikan blok dan inline math
    for (let i = 0; i < blockMathPlaceholders.length; i++) {
      processed = processed.replace(`@@BLOCK_MATH_${i}@@`, blockMathPlaceholders[i]);
    }
    for (let i = 0; i < inlineMathPlaceholders.length; i++) {
      processed = processed.replace(`@@INLINE_MATH_${i}@@`, inlineMathPlaceholders[i]);
    }

    return processed;
  }, [text, isKaTeXReady]);

  return (
    <div
      className={`math-rendered-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

