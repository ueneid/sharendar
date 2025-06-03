import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({ 
  subsets: ["latin"],
  variable: '--font-noto-sans',
  weight: ['400', '500', '700']
});

export const metadata: Metadata = {
  title: "Sharendar - 家族の予定をスマートに共有",
  description: "家族やグループで予定・タスク・持ち物をスムーズに共有できるWebアプリ",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${notoSansJP.variable} font-sans h-full`}>
        {children}
      </body>
    </html>
  );
}