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
  title: "BimbelSync - Manajemen Bimbel Modern",
  description: "Platform orkestrasi penjadwalan dan keuangan bimbel.",
  // Tambahkan baris di bawah ini:
  openGraph: {
    title: "BimbelSync - Manajemen Bimbel Modern",
    description: "Tinggalkan cara manual. Bergabunglah dengan ratusan pemilik bimbel yang telah menghemat waktu dan meningkatkan omzet.",
    url: "https://bimbelsync.com",
    siteName: "BimbelSync",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/login-bg.png", // Menggunakan gambar yang ada sebagai thumbnail sementara
        width: 1200,
        height: 630,
        alt: "BimbelSync Preview",
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
