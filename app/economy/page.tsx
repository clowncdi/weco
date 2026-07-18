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
type MarketKey = "sp500" | "nasdaq" | "dow" | "kospi" | "kosdaq" | "usdkrw" | "wti" | "gold" | "silver" | "copper" | "bitcoin";
type MarketDefinition = { key: MarketKey; label: string; decimals: number; prefix?: string; suffix?: string };
type ApiMarketSnapshot = {
  key?: unknown;
  label?: unknown;
  value?: unknown;
  change?: unknown;
  changePercent?: unknown;
  currency?: unknown;
  marketTime?: unknown;
};
type MarketSnapshot = {
  key: MarketKey;
  label: string;
  value: number;
  change: number;
  changePercent: number;
  currency?: string;
  marketTime?: number;
};

const NEWS_CATEGORIES: NewsCategory[] = [
  { key: "all", label: "전체" },
  { key: "macro", label: "국내경제" },
  { key: "finance", label: "증권·금융" },
  { key: "industry", label: "산업·기업" },
  { key: "realestate", label: "부동산" },
  { key: "global", label: "글로벌" },
];

const MARKET_DEFINITIONS: MarketDefinition[] = [
  { key: "sp500", label: "S&P 500", decimals: 2 },
  { key: "nasdaq", label: "나스닥", decimals: 2 },
  { key: "dow", label: "다우산업", decimals: 2 },
  { key: "kospi", label: "코스피", decimals: 2 },
  { key: "kosdaq", label: "코스닥", decimals: 2 },
  { key: "usdkrw", label: "달러/원", decimals: 2, suffix: "원" },
  { key: "wti", label: "WTI", decimals: 2, prefix: "$" },
  { key: "gold", label: "금", decimals: 2, prefix: "$" },
  { key: "silver", label: "은", decimals: 2, prefix: "$" },
  { key: "copper", label: "구리", decimals: 4, prefix: "$" },
  { key: "bitcoin", label: "비트코인", decimals: 0, prefix: "$" },
];

const RELATED_STOPWORDS = new Set(["경제", "뉴스", "시장", "한국", "국내", "세계", "글로벌", "올해", "대한", "관련", "최근", "이날", "통해", "위해", "기자", "가운데", "것으로", "있다", "했다"]);

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

function normalizeMarket(snapshot: ApiMarketSnapshot): MarketSnapshot | null {
  const definition = MARKET_DEFINITIONS.find((item) => item.key === snapshot.key);
  if (!definition || typeof snapshot.value !== "number" || !Number.isFinite(snapshot.value) || typeof snapshot.change !== "number" || !Number.isFinite(snapshot.change) || typeof snapshot.changePercent !== "number" || !Number.isFinite(snapshot.changePercent)) return null;
  return {
    key: definition.key,
    label: definition.label,
    value: snapshot.value,
    change: snapshot.change,
    changePercent: snapshot.changePercent,
    currency: typeof snapshot.currency === "string" ? snapshot.currency : undefined,
    marketTime: typeof snapshot.marketTime === "number" && Number.isFinite(snapshot.marketTime) ? snapshot.marketTime : undefined,
  };
}

async function fetchMarkets(signal: AbortSignal) {
  const apiBaseUrl = (process.env.NEXT_PUBLIC_WEATHER_API_BASE_URL ?? "").replace(/\/$/, "");
  if (!apiBaseUrl) throw new Error("market-api-not-configured");
  const response = await fetch(`${apiBaseUrl}/api/markets`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("market-api-unavailable");
  const body = await response.json() as { provider?: unknown; markets?: ApiMarketSnapshot[] };
  if (body.provider !== "yahoo-finance") throw new Error("market-api-unavailable");
  return (body.markets ?? []).map(normalizeMarket).filter((market): market is MarketSnapshot => Boolean(market));
}

function selectTopNews(feed: NewsFeed) {
  const ordered = [...feed.domestic.slice(0, 7), ...feed.global.slice(0, 3), ...feed.domestic.slice(7), ...feed.global.slice(3)];
  const seen = new Set<string>();
  return ordered.filter((article) => {
    if (seen.has(article.id)) return false;
    seen.add(article.id);
    return true;
  }).slice(0, 10);
}

function newsKeywords(text: string) {
  return new Set((text.toLowerCase().match(/[0-9a-z가-힣]{2,}/g) ?? []).map((word) => word.length > 2 ? word.replace(/(으로|에서|에게|보다|까지|부터|은|는|이|가|을|를|의|에|와|과|로)$/u, "") : word).filter((word) => word.length > 1 && !RELATED_STOPWORDS.has(word)));
}

function findRelatedNews(article: NewsArticle, candidates: NewsArticle[], excludedIds: Set<string>) {
  const titleKeywords = newsKeywords(article.title);
  const articleKeywords = newsKeywords(`${article.title} ${article.description}`);
  const ranked = candidates
    .filter((candidate) => candidate.id !== article.id && !excludedIds.has(candidate.id))
    .map((candidate) => {
      const candidateTitleKeywords = newsKeywords(candidate.title);
      const candidateKeywords = newsKeywords(`${candidate.title} ${candidate.description}`);
      let score = 0;
      for (const keyword of titleKeywords) if (candidateTitleKeywords.has(keyword)) score += 3;
      for (const keyword of articleKeywords) if (candidateKeywords.has(keyword)) score += 1;
      return { article: candidate, score };
    })
    .sort((a, b) => b.score - a.score || (b.article.publishedAt ?? 0) - (a.article.publishedAt ?? 0));

  const related = ranked.filter((candidate) => candidate.score > 0).slice(0, 2).map((candidate) => candidate.article);
  if (related.length === 2) return related;
  for (const candidate of ranked) {
    if (candidate.article.region !== article.region || related.some((item) => item.id === candidate.article.id)) continue;
    related.push(candidate.article);
    if (related.length === 2) break;
  }
  return related;
}

function formatMarketValue(market: MarketSnapshot, definition: MarketDefinition) {
  const value = new Intl.NumberFormat("ko-KR", { minimumFractionDigits: definition.decimals, maximumFractionDigits: definition.decimals }).format(market.value);
  return `${definition.prefix ?? ""}${value}${definition.suffix ?? ""}`;
}

function formatMarketTime(value?: number) {
  if (!value) return "최근 기준";
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(value * 1000);
}

function formatMarketPercent(value: number) {
  return new Intl.NumberFormat("ko-KR", { signDisplay: "always", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + "%";
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
  const [topNews, setTopNews] = useState<NewsArticle[]>([]);
  const [topNewsPool, setTopNewsPool] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [markets, setMarkets] = useState<MarketSnapshot[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState("");
  const [marketRefreshToken, setMarketRefreshToken] = useState(0);
  const activeCategory = NEWS_CATEGORIES.find((category) => category.key === categoryKey) ?? NEWS_CATEGORIES[0];

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      const nextFeed = await fetchNaverNews(activeCategory.key, controller.signal);
      if (controller.signal.aborted) return;
      setFeed(nextFeed);
      setError("");
      if (activeCategory.key === "all") {
        setTopNews(selectTopNews(nextFeed));
        setTopNewsPool([...nextFeed.domestic, ...nextFeed.global]);
      }
    };

    load().catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error && reason.message === "news-api-not-configured" ? "네이버 뉴스 연결을 위한 Worker 비밀값 등록이 필요합니다." : "경제 뉴스를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [activeCategory, refreshToken]);

  useEffect(() => {
    const controller = new AbortController();
    fetchMarkets(controller.signal).then((nextMarkets) => {
      if (!controller.signal.aborted) setMarkets(nextMarkets);
    }).catch(() => {
      if (!controller.signal.aborted) setMarketError("시장지표를 불러오지 못했습니다.");
    }).finally(() => {
      if (!controller.signal.aborted) setMarketLoading(false);
    });
    return () => controller.abort();
  }, [marketRefreshToken]);

  const articles = useMemo(() => {
    const categoryArticles = activeCategory.key === "global" ? feed.global : [...feed.domestic, ...feed.global];
    if (activeCategory.key !== "all" || topNews.length === 0) return categoryArticles;
    const topNewsIds = new Set(topNews.map((article) => article.id));
    return categoryArticles.filter((article) => !topNewsIds.has(article.id));
  }, [activeCategory.key, feed, topNews]);
  const marketByKey = useMemo(() => new Map(markets.map((market) => [market.key, market])), [markets]);
  const relatedNewsById = useMemo(() => {
    const topNewsIds = new Set(topNews.map((article) => article.id));
    return new Map(topNews.map((article) => [article.id, findRelatedNews(article, topNewsPool, topNewsIds)]));
  }, [topNews, topNewsPool]);
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
        <div className="economy-live-overview">
          <section className="economy-market-panel" aria-labelledby="market-heading" aria-busy={marketLoading}>
            <div className="economy-live-heading">
              <div><small>MARKET NOW</small><h1 id="market-heading">주요 시장지표</h1></div>
              {marketError && <button type="button" onClick={() => {
                setMarketLoading(true);
                setMarketError("");
                setMarketRefreshToken((value) => value + 1);
              }}>다시 불러오기</button>}
            </div>
            <div className="economy-market-grid">
              {MARKET_DEFINITIONS.map((definition) => {
                const market = marketByKey.get(definition.key);
                const trend = !market || market.change === 0 ? "flat" : market.change > 0 ? "up" : "down";
                return <article className={`economy-market-card ${trend}`} key={definition.key}>
                  <span>{definition.label}</span>
                  <strong>{market ? formatMarketValue(market, definition) : "—"}</strong>
                  <div><b>{market ? formatMarketPercent(market.changePercent) : marketLoading ? "조회 중" : "정보 없음"}</b><time>{market ? formatMarketTime(market.marketTime) : ""}</time></div>
                </article>;
              })}
            </div>
          </section>

          <section className="economy-topnews-panel" aria-labelledby="topnews-heading" aria-busy={loading && topNews.length === 0}>
            <div className="economy-live-heading light">
              <div><small>ECONOMY TOP 10</small><h2 id="topnews-heading">경제 뉴스 탑뉴스</h2></div>
              <span>{topNews.length}/10</span>
            </div>
            {loading && topNews.length === 0 && <div className="economy-topnews-loading" aria-label="탑뉴스 불러오는 중">{Array.from({ length: 10 }, (_, index) => <div key={index} />)}</div>}
            {!loading && error && topNews.length === 0 && <div className="economy-panel-state"><strong>탑뉴스를 불러오지 못했습니다.</strong><button type="button" onClick={() => {
              setLoading(true);
              setError("");
              setRefreshToken((value) => value + 1);
            }}>다시 불러오기</button></div>}
            {topNews.length > 0 && <div className="economy-topnews-columns">
              {[topNews.slice(0, 5), topNews.slice(5, 10)].map((column, columnIndex) => column.length > 0 && <ol start={columnIndex * 5 + 1} key={columnIndex}>
                {column.map((article, index) => {
                  const relatedNews = relatedNewsById.get(article.id) ?? [];
                  return <li key={article.id}><article className="economy-topnews-item"><span>{String(columnIndex * 5 + index + 1).padStart(2, "0")}</span><div>
                    <a className="economy-topnews-main" href={article.url} target="_blank" rel="noopener noreferrer"><ArticleMeta article={article} /><h3>{article.title}</h3><div className="economy-topnews-summary"><span>핵심 요약</span><p>{article.description || "요약 정보가 제공되지 않은 기사입니다."}</p></div></a>
                    {relatedNews.length > 0 && <div className="economy-related-news"><span>관련 뉴스</span><div>{relatedNews.map((related) => <a href={related.url} target="_blank" rel="noopener noreferrer" key={related.id}>{related.title}</a>)}</div></div>}
                  </div></article></li>;
                })}
              </ol>)}
            </div>}
          </section>
        </div>

        <section className="economy-news-section" aria-labelledby="latest-news-heading" aria-busy={loading}>
          <div className="economy-section-head">
            <div><small>NEWS BY CATEGORY</small><h2 id="latest-news-heading">카테고리별 경제 뉴스</h2></div>
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

      </div>

      <footer className="economy-footer"><div className="brand"><Image className="brand-logo" src="/today-weather-logo.png" width={34} height={34} alt="" /><span>오늘의 날씨</span></div><p>시장 데이터: Yahoo Finance · 뉴스 데이터: 네이버 검색 뉴스 API<br />기사 제목과 원문 저작권은 각 언론사에 있습니다. 제공 지연이나 분류 오차가 발생할 수 있습니다.</p><div className="footer-links"><a href="https://developers.naver.com/docs/serviceapi/search/news/news.md" target="_blank" rel="noreferrer">뉴스 데이터 안내</a><a href="#economy-top">맨 위로 ↑</a></div></footer>
    </main>
  );
}
