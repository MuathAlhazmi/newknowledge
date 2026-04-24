import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { AppToaster } from "@/components/app-toaster";
import { SiteHeader } from "@/components/site-header";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "منصة العلم الجديد",
  description: "بيئة تدريب متكاملة لإدارة المحتوى، الاختبارات، والتواصل الرسمي.",
  icons: {
    icon: [{ url: "/brand/newknowledge.svg", type: "image/svg+xml" }],
    apple: "/brand/newknowledge.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userPromise = getCurrentUser();

  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-[var(--foreground)]">
        <SiteHeader userPromise={userPromise} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-10 lg:py-12">{children}</main>
        <AppToaster />
        {/* Script is only served on Vercel; omit locally / self-hosted to avoid 404 on /_vercel/speed-insights/script.js */}
        {process.env.VERCEL ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
