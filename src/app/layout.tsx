// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 引入 Providers
import { AuthModalProvider } from '@/context/AuthModalContext';
import { SourceProvider } from '@/context/SourceContext'; // 新增引入

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
        {/* 最外层包裹 SourceProvider */}
        <SourceProvider>
          {/* 内层包裹 AuthModalProvider */}
          <AuthModalProvider>
            {children}
          </AuthModalProvider>
        </SourceProvider>
      </body>
    </html>
  );
}