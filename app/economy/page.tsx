"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type CategoryKey = "all" | "macro" | "finance" | "industry" | "realestate" | "global";
type NewsRegion = "domestic" | "global";
type NewsCategory = { key: CategoryKey; label: string };
type ApiNewsArticle = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  url?: unknown;
  source?: unknown;
  publishedAt?: unknown;
  region?: unknown;
};
type NewsArticle = {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt?: number;
  region: NewsRegion;
};
type NewsFeed = { domestic: NewsArticle[]; global: NewsArticle[] };

const NEWS_CATEGORIES: NewsCategory[] = [
  { key: "all", label: "전체" },
  { key: "macro", label: "국내경제" },
  { key: "finance", label: "증권·금융" },
  { key: "industry", label: "산업·기업" },
  { key: "realestate", label: "부동산" },
  { key: "global", label: "글로벌" },
];

const ECONOMY_CHECKPOINTS = [
  { number: "01", title: "금리·물가", description: "통화정책과 생활물가의 방향" },
  { number: "02", title: "환율·채권", description: "자금 이동과 원화 가치의 변화" },
  { number: "03", title: "기업실적·증시", description: "기업의 체력과 투자심리" },
  { number: "04", title: "산업정책·공급망", description: "반도체·에너지·통상의 변화" },
  { number: "05", title: "부동산·가계부채", description: "주거시장과 금융 건전성" },
];

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").trim();
}

function normalizeArticle(article: ApiNewsArticle): NewsArticle | null {
  const title = cleanText(article.title);
  if (!title || typeof article.url !== "string" || (article.region !== "domestic" && article.region !== "global")) return null;
  try {
    const articleUrl = new URL(article.url);
    if (articleUrl.protocol !== "https:" && articleUrl.protocol !== "http:") return null;
    const publishedAt = typeof article.publishedAt === "string" ? Date.parse(article.publishedAt) : Number.NaN;
    return {
      id: typeof article.id === "string" ? article.id : `${article.region}:${articleUrl.href}`,
      title,
      description: cleanText(article.description),
      url: articleUrl.href,
      source: cleanText(article.source) || articleUrl.hostname.replace(/^www\./, ""),
      publishedAt: Number.isFinite(publishedAt) ? publishedAt : undefined,
      region: article.region,
    };
  } catch {
    return null;
  }
}

function uniqueLatest(items: NewsArticle[]) {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      const key = `${item.url}|${item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
}

async function fetchNaverNews(category: CategoryKey, signal: AbortSignal) {
  const apiBaseUrl = (process.env.NEXT_PUBLIC_WEATHER_API_BASE_URL ?? "").replace(/\/$/, "");
  if (!apiBaseUrl) throw new Error("news-api-not-configured");
  const endpoint = new URL(`${apiBaseUrl}/api/news`);
  endpoint.searchParams.set("category", category);
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (response.status === 503) throw new Error("news-api-not-configured");
  if (!response.ok) throw new Error("news-api-unavailable");
  const body = await response.json() as { provider?: unknown; domestic?: ApiNewsArticle[]; global?: ApiNewsArticle[] };
  if (body.provider !== "naver") throw new Error("news-api-unavailable");
  return {
    domestic: uniqueLatest((body.domestic ?? []).map(normalizeArticle).filter((article): article is NewsArticle => Boolean(article))),
    global: uniqueLatest((body.global ?? []).map(normalizeArticle).filter((article): article is NewsArticle => Boolean(article))),
  };
}

function formatPublishedTime(value?: number) {
  if (!value) return "최근 기사";
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - value) / 60000));
  if (elapsedMinutes < 1) return "방금 전";
  if (elapsedMinutes < 60) return `${elapsedMinutes}분 전`;
  if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)}시간 전`;
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(value);
}

function ArticleMeta({ article }: { article: NewsArticle }) {
  return <div className="economy-article-meta"><span className={article.region}>{article.region === "domestic" ? "국내" : "글로벌"}</span><b>{article.source}</b><time>{formatPublishedTime(article.publishedAt)}</time></div>;
}

export default function EconomyPage() {
  const [categoryKey, setCategoryKey] = useState<CategoryKey>("all");
  const [feed, setFeed] = useState<NewsFeed>({ domestic: [], global: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const activeCategory = NEWS_CATEGORIES.find((category) => category.key === categoryKey) ?? NEWS_CATEGORIES[0];

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      const nextFeed = await fetchNaverNews(activeCategory.key, controller.signal);
      if (controller.signal.aborted) return;
      setFeed(nextFeed);
    };

    load().catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error && reason.message === "news-api-not-configured" ? "네이버 뉴스 연결을 위한 Worker 비밀값 등록이 필요합니다." : "경제 뉴스를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [activeCategory, refreshToken]);

  const articles = useMemo(() => {
    if (activeCategory.key === "global") return feed.global;
    return [...feed.domestic, ...feed.global];
  }, [activeCategory.key, feed]);
  const leadArticle = articles[0];
  const headlineRail = articles.slice(1, 5);
  const latestArticles = articles.slice(5, 17);

  return (
    <main className="economy-page">
      <header className="topbar">
        <Link className="brand" href="/#top" aria-label="오늘의 날씨 홈">
          <Image className="brand-logo" src="/today-weather-logo.png" width={34} height={34} alt="" />
          <span>오늘의 날씨</span>
        </Link>
        <div className="topbar-tools">
          <nav className="primary-nav" aria-label="주요 메뉴">
            <Link href="/">날씨</Link>
            <Link className="active" href="/economy/" aria-current="page">경제뉴스</Link>
          </nav>
          <div className="as-of"><span className="live-dot economy-dot" /> 국내 우선 · 글로벌 포함</div>
        </div>
      </header>

      <div className="economy-shell" id="economy-top">
        <section className="economy-hero" aria-labelledby="economy-heading">
          <div className="economy-hero-copy">
            <p className="economy-kicker">DAILY ECONOMY BRIEF</p>
            <h1 id="economy-heading">경제의 흐름을<br />한눈에.</h1>
            <p>한국 경제 뉴스를 먼저 읽고, 금융시장과 산업의 움직임부터 세계 경제의 변화까지 이어서 살펴보세요.</p>
            <div className="economy-priority-tags" aria-label="뉴스 구성 원칙"><span>한국 뉴스 우선</span><span>최신순 업데이트</span><span>세계 경제 포함</span></div>
          </div>
          <aside className="economy-checkpoints" aria-labelledby="checkpoint-heading">
            <div><small>ESSENTIAL VIEW</small><h2 id="checkpoint-heading">경제 뉴스의 다섯 가지 핵심 축</h2></div>
            <ol>{ECONOMY_CHECKPOINTS.map((item) => <li key={item.number}><span>{item.number}</span><div><strong>{item.title}</strong><small>{item.description}</small></div></li>)}</ol>
          </aside>
        </section>

        <section className="economy-news-section" aria-labelledby="latest-news-heading" aria-busy={loading}>
          <div className="economy-section-head">
            <div><small>LIVE NEWSROOM</small><h2 id="latest-news-heading">지금 읽어야 할 경제 뉴스</h2></div>
            <p>한국 기사를 앞에 배치하고 같은 주제의 글로벌 흐름을 함께 제공합니다.</p>
          </div>

          <div className="economy-category-tabs" role="tablist" aria-label="경제 뉴스 카테고리">
            {NEWS_CATEGORIES.map((category) => <button type="button" role="tab" aria-selected={category.key === activeCategory.key} className={category.key === activeCategory.key ? "active" : ""} key={category.key} onClick={() => {
              if (category.key === activeCategory.key) return;
              setLoading(true);
              setError("");
              setFeed({ domestic: [], global: [] });
              setCategoryKey(category.key);
            }}>{category.label}</button>)}
          </div>

          {loading && articles.length === 0 && <div className="economy-loading" aria-label="경제 뉴스 불러오는 중"><div /><div /><div /><div /></div>}
          {!loading && error && <div className="economy-empty"><strong>뉴스 연결이 원활하지 않습니다.</strong><p>{error}</p><button type="button" onClick={() => {
            setLoading(true);
            setError("");
            setRefreshToken((value) => value + 1);
          }}>다시 불러오기</button></div>}
          {!loading && !error && articles.length === 0 && <div className="economy-empty"><strong>최근 기사가 없습니다.</strong><p>선택한 카테고리의 새 기사가 들어오면 이곳에 표시됩니다.</p></div>}

          {leadArticle && <div className="economy-lead-grid">
            <a className="economy-lead-story" href={leadArticle.url} target="_blank" rel="noopener noreferrer">
              <ArticleMeta article={leadArticle} />
              <h3>{leadArticle.title}</h3>
              <p>{leadArticle.description || "기사 원문에서 자세한 내용과 최신 업데이트를 확인하세요."}</p>
              <span className="economy-read-more">기사 읽기 <b aria-hidden="true">↗</b></span>
            </a>
            <div className="economy-headline-rail">
              {headlineRail.map((article, index) => <a href={article.url} target="_blank" rel="noopener noreferrer" key={article.id}><span>{String(index + 1).padStart(2, "0")}</span><div><ArticleMeta article={article} /><h3>{article.title}</h3></div></a>)}
            </div>
          </div>}

          {latestArticles.length > 0 && <div className="economy-latest-block">
            <div className="economy-list-heading"><h3>최신 뉴스</h3><span>{activeCategory.label}</span></div>
            <div className="economy-news-grid">
              {latestArticles.map((article) => <a className="economy-news-card" href={article.url} target="_blank" rel="noopener noreferrer" key={article.id}><ArticleMeta article={article} /><h3>{article.title}</h3><span>원문 보기 ↗</span></a>)}
            </div>
          </div>}
        </section>

        <section className="economy-method" aria-labelledby="economy-method-heading">
          <span>EDITOR&apos;S NOTE</span>
          <div><h2 id="economy-method-heading">뉴스의 양보다 흐름을 봅니다.</h2><p>국내 거시경제에서 금융시장, 산업과 기업, 부동산을 거쳐 글로벌 이슈로 이어지는 순서로 구성했습니다. 투자 권유가 아닌 경제 흐름을 읽기 위한 뉴스 큐레이션입니다.</p></div>
        </section>
      </div>

      <footer className="economy-footer"><div className="brand"><Image className="brand-logo" src="/today-weather-logo.png" width={34} height={34} alt="" /><span>오늘의 날씨</span></div><p>뉴스 데이터: 네이버 검색 뉴스 API<br />기사 제목과 원문 저작권은 각 언론사에 있습니다. 제공 지연이나 분류 오차가 발생할 수 있습니다.</p><div className="footer-links"><a href="https://developers.naver.com/docs/serviceapi/search/news/news.md" target="_blank" rel="noreferrer">데이터 안내</a><a href="#economy-top">맨 위로 ↑</a></div></footer>
    </main>
  );
}
