// app/layout.tsx
import type { Metadata } from "next";
import { Montserrat } from "next/font/google"; // 引入 Next.js 字体优化
import "./globals.css";

// 配置字体
const montserrat = Montserrat({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 将字体类名应用到 body */}
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}