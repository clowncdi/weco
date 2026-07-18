import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "경제 뉴스 — 국내 우선 글로벌 경제 브리핑",
  description: "한국 경제 뉴스를 먼저 보고 금융시장, 산업, 부동산과 세계 경제 흐름까지 한 번에 확인하세요.",
  openGraph: {
    title: "경제 뉴스 — 국내 우선 글로벌 경제 브리핑",
    description: "국내 경제를 중심으로 세계 시장의 흐름까지 정리한 실시간 경제 뉴스 브리핑",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "경제 뉴스 — 국내 우선 글로벌 경제 브리핑",
    description: "국내 경제를 중심으로 세계 시장의 흐름까지 정리한 실시간 경제 뉴스 브리핑",
  },
};

export default function EconomyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
