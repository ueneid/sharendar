import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { DIProvider } from "@/components/providers/DIProvider";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import { GlobalActivityForm } from "@/components/activity/GlobalActivityForm";

const notoSansJP = Noto_Sans_JP({ 
  subsets: ["latin"],
  variable: '--font-noto-sans',
  weight: ['400', '500', '700']
});

export const metadata: Metadata = {
  title: "Sharendar - 家族の予定をスマートに共有",
  description: "家族やグループで予定・タスク・持ち物をスムーズに共有できるWebアプリ",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
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
        <DIProvider>
          <div className="h-full flex flex-col">
            {/* ネットワーク状態表示 */}
            <NetworkStatus />
            
            {/* PWAインストールプロンプト */}
            <InstallPrompt position="top" />
            
            <main className="flex-1 overflow-y-auto pb-16">
              {children}
            </main>
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe">
              <MobileNavigation />
            </nav>
            
            {/* グローバルアクティビティ編集フォーム */}
            <GlobalActivityForm />
          </div>
        </DIProvider>
      </body>
    </html>
  );
}