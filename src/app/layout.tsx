import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 引入 Provider
import { AuthModalProvider } from '@/context/AuthModalContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KaliRes - 综合资源站",
  description: "影视、软件、游戏、音乐聚合平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 包裹 Provider */}
        <AuthModalProvider>
          {children}
        </AuthModalProvider>
      </body>
    </html>
  );
}