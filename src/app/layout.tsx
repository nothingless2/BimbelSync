import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2563EB",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bimbel-sync.vercel.app"),
  title: "BimbelSync - Manajemen Bimbel Modern",
  description: "Platform orkestrasi penjadwalan dan keuangan bimbel.",
  openGraph: {
    title: "BimbelSync - Manajemen Bimbel Modern",
    description: "Tinggalkan cara manual. Bergabunglah dengan ratusan pemilik bimbel yang telah menghemat waktu dan meningkatkan omzet.",
    url: "https://bimbel-sync.vercel.app",
    siteName: "BimbelSync",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/logo.png", // Menggunakan logo karena ukurannya kecil (di bawah 300KB) agar tampil di WA
        width: 800,
        height: 800,
        alt: "BimbelSync Logo",
      }
    ],
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
