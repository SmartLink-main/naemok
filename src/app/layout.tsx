import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "내몫 - 내 조건에 맞는 정부 지원금 찾기",
  description: "업종, 지역, 사업 단계 3가지만 입력하면 받을 수 있는 정부 지원금을 바로 알려드려요.",
  openGraph: {
    title: "내몫 - 정부 지원금 매칭",
    description: "조건 3개 입력하면 받을 수 있는 지원금 바로 확인",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
