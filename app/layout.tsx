import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const notoSansKr = Noto_Sans_KR({ variable: "--font-noto-sans-kr", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://weaco.co.kr"),
  title: "오늘의 날씨와 경제 — 최근 5개년도 날씨 비교",
  description: "오늘이 속한 달의 날씨를 시·도별 최근 5개년도와 비교하고, 올해 미래 날짜는 예보로 확인하세요.",
  icons: { icon: "/today-weather-logo.png", shortcut: "/today-weather-logo.png" },
  openGraph: {
    title: "오늘의 날씨와 경제 — 최근 5개년도 날씨 비교",
    description: "올해 예보를 포함한 최근 5개년도 한 달 날씨를 시·도별로 비교해 보세요.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og-today-weather.jpg", width: 1734, height: 907, alt: "오늘의 날씨와 경제 — 올해 예보를 포함한 최근 5개년도 날씨" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "오늘의 날씨와 경제 — 최근 5개년도 날씨 비교",
    description: "오늘이 속한 달, 올해 예보를 포함한 시·도별 최근 5개년도 날씨 비교",
    images: ["/og-today-weather.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable}`}>{children}</body></html>;
}
