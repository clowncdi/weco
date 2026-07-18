"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
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
type MarketKey = "sp500" | "nasdaq" | "dow" | "vix" | "kospi" | "kosdaq" | "usdkrw" | "wti" | "gold" | "silver" | "copper" | "bitcoin";
type MarketDefinition = { key: MarketKey; label: string; decimals: number; prefix?: string; suffix?: string };
type ApiMarketSnapshot = {
  key?: unknown;
  label?: unknown;
  value?: unknown;
  change?: unknown;
  changePercent?: unknown;
  currency?: unknown;
  marketTime?: unknown;
  sparkline?: unknown;
};
type MarketSnapshot = {
  key: MarketKey;
  label: string;
  value: number;
  change: number;
  changePercent: number;
  currency?: string;
  marketTime?: number;
  sparkline: number[];
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
  { key: "vix", label: "VIX", decimals: 2 },
  { key: "kospi", label: "코스피", decimals: 2 },
  { key: "kosdaq", label: "코스닥", decimals: 2 },
  { key: "usdkrw", label: "달러/원", decimals: 2, suffix: "원" },
  { key: "wti", label: "WTI", decimals: 2, prefix: "$" },
  { key: "gold", label: "금", decimals: 2, prefix: "$" },
  { key: "silver", label: "은", decimals: 2, prefix: "$" },
  { key: "copper", label: "구리", decimals: 4, prefix: "$" },
  { key: "bitcoin", label: "비트코인", decimals: 0, prefix: "$" },
];

const RELATED_STOPWORDS = new Set(["경제", "뉴스", "시장", "한국", "국내", "세계", "글로벌", "올해", "대한", "관련", "최근", "이날", "통해", "위해", "기자", "가운데", "것으로", "있다", "했다", "한다", "지난", "이번", "전망", "발표", "정부"]);
const IMPACT_KEYWORDS: Array<[string, number]> = [
  ["기준금리", 6], ["한국은행", 5], ["연준", 5], ["fomc", 5], ["소비자물가", 5], ["생산자물가", 4], ["성장률", 5], ["gdp", 5],
  ["환율", 4], ["원·달러", 4], ["관세", 5], ["무역", 3], ["수출", 3], ["반도체", 4], ["코스피", 4], ["코스닥", 3],
  ["유가", 4], ["실업", 4], ["고용", 3], ["국채", 3], ["가계부채", 4], ["부동산", 3], ["비트코인", 3], ["실적", 3],
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

function createApiEndpoint(path: string, missingConfigError: string) {
  const configuredBaseUrl = (process.env.NEXT_PUBLIC_WEATHER_API_BASE_URL ?? "").replace(/\/$/, "");
  if (configuredBaseUrl) return new URL(path, `${configuredBaseUrl}/`);
  if (typeof window !== "undefined") return new URL(path, window.location.origin);
  throw new Error(missingConfigError);
}

async function fetchNaverNews(category: CategoryKey, signal: AbortSignal) {
  const endpoint = createApiEndpoint("/api/news", "news-api-not-configured");
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
    sparkline: Array.isArray(snapshot.sparkline) ? snapshot.sparkline.filter((value): value is number => typeof value === "number" && Number.isFinite(value)).slice(-20) : [],
  };
}

async function fetchMarkets(signal: AbortSignal) {
  const endpoint = createApiEndpoint("/api/markets", "market-api-not-configured");
  const response = await fetch(endpoint, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("market-api-unavailable");
  const body = await response.json() as { provider?: unknown; markets?: ApiMarketSnapshot[] };
  if (body.provider !== "yahoo-finance") throw new Error("market-api-unavailable");
  return (body.markets ?? []).map(normalizeMarket).filter((market): market is MarketSnapshot => Boolean(market));
}

function newsKeywords(text: string) {
  return new Set((text.toLowerCase().match(/[0-9a-z가-힣]{2,}/g) ?? [])
    .map((word) => word.length > 2 ? word.replace(/(으로|에서|에게|보다|까지|부터|은|는|이|가|을|를|의|에|와|과|로)$/u, "") : word)
    .filter((word) => word.length > 1 && !RELATED_STOPWORDS.has(word) && !/^20\d{2}$/.test(word)));
}

function relationScore(first: NewsArticle, second: NewsArticle) {
  const firstTitle = newsKeywords(first.title);
  const secondTitle = newsKeywords(second.title);
  const firstAll = newsKeywords(`${first.title} ${first.description}`);
  const secondAll = newsKeywords(`${second.title} ${second.description}`);
  let titleOverlap = 0;
  let totalOverlap = 0;
  for (const keyword of firstTitle) if (secondTitle.has(keyword)) titleOverlap += 1;
  for (const keyword of firstAll) if (secondAll.has(keyword)) totalOverlap += 1;
  return { score: titleOverlap * 4 + Math.max(0, totalOverlap - titleOverlap), titleOverlap, totalOverlap };
}

function isStrongRelation(first: NewsArticle, second: NewsArticle) {
  const relation = relationScore(first, second);
  return relation.titleOverlap >= 2 || (relation.titleOverlap >= 1 && relation.totalOverlap >= 3) || relation.totalOverlap >= 5;
}

function rankingScore(article: NewsArticle, pool: NewsArticle[]) {
  const title = article.title.toLowerCase();
  const description = article.description.toLowerCase();
  let impact = 0;
  for (const [keyword, weight] of IMPACT_KEYWORDS) {
    if (title.includes(keyword)) impact += weight * 2;
    else if (description.includes(keyword)) impact += weight;
  }
  const ageHours = article.publishedAt ? Math.max(0, (Date.now() - article.publishedAt) / 3_600_000) : 72;
  const freshness = Math.max(0, 12 - ageHours / 6);
  const coverage = Math.min(5, pool.filter((candidate) => candidate.id !== article.id && isStrongRelation(article, candidate)).length) * 3;
  return impact + freshness + coverage;
}

function selectDiverseNews(items: NewsArticle[], pool: NewsArticle[], count: number) {
  const scores = new Map(items.map((article) => [article.id, rankingScore(article, pool)]));
  const ranked = [...items].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) || (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  const selected: NewsArticle[] = [];
  const sources = new Set<string>();
  const addCandidates = (allowSameSource: boolean, allowSameTopic: boolean) => {
    for (const article of ranked) {
      if (selected.some((item) => item.id === article.id)) continue;
      if (!allowSameSource && sources.has(article.source)) continue;
      if (!allowSameTopic && selected.some((item) => isStrongRelation(item, article))) continue;
      selected.push(article);
      sources.add(article.source);
      if (selected.length === count) return;
    }
  };
  addCandidates(false, false);
  if (selected.length < count) addCandidates(true, false);
  if (selected.length < count) addCandidates(true, true);
  return selected;
}

function selectMajorNews(feed: NewsFeed): NewsFeed {
  const pool = uniqueLatest([...feed.domestic, ...feed.global]);
  return {
    domestic: selectDiverseNews(feed.domestic, pool, 10),
    global: selectDiverseNews(feed.global, pool, 10),
  };
}

function findRelatedNews(article: NewsArticle, candidates: NewsArticle[], excludedIds: Set<string>) {
  return candidates
    .filter((candidate) => candidate.id !== article.id && !excludedIds.has(candidate.id))
    .map((candidate) => ({ article: candidate, relation: relationScore(article, candidate) }))
    .filter(({ relation }) => relation.titleOverlap >= 2 || (relation.titleOverlap >= 1 && relation.totalOverlap >= 3) || relation.totalOverlap >= 5)
    .sort((a, b) => b.relation.score - a.relation.score || (b.article.publishedAt ?? 0) - (a.article.publishedAt ?? 0))
    .slice(0, 2)
    .map(({ article: related }) => related);
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

function MarketSparkline({ label, values, trend }: { label: string; values: number[]; trend: "up" | "down" | "flat" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || values.length < 2) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, width, height);

      const minimum = Math.min(...values);
      const maximum = Math.max(...values);
      const range = maximum - minimum || 1;
      const padding = 2;
      const points = values.map((value, index) => ({
        x: padding + index / (values.length - 1) * (width - padding * 2),
        y: padding + (maximum - value) / range * (height - padding * 2),
      }));
      const color = trend === "up" ? "#ff9d81" : trend === "down" ? "#82c9ff" : "#73d5d9";

      context.beginPath();
      points.forEach((point, index) => index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y));
      context.lineTo(points.at(-1)?.x ?? width, height);
      context.lineTo(points[0].x, height);
      context.closePath();
      const fill = context.createLinearGradient(0, 0, 0, height);
      fill.addColorStop(0, `${color}55`);
      fill.addColorStop(1, `${color}00`);
      context.fillStyle = fill;
      context.fill();

      context.beginPath();
      points.forEach((point, index) => index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y));
      context.strokeStyle = color;
      context.lineWidth = 1.6;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [trend, values]);

  return <div className="economy-market-sparkline" role="img" aria-label={`${label} 5일간 변화 그래프`}>
    {values.length > 1 ? <canvas ref={canvasRef} aria-hidden="true" /> : <span aria-hidden="true" />}
  </div>;
}

function NewsCriteriaDetails({ type }: { type: "major" | "category" }) {
  const isMajor = type === "major";
  return <details className="economy-criteria-details">
    <summary aria-label={isMajor ? "주요 뉴스와 관련 뉴스 선정 기준 보기" : "카테고리별 뉴스 선정 기준 보기"} title="선정 기준 보기"><span aria-hidden="true">i</span></summary>
    <div>
      <strong>{isMajor ? "주요 뉴스 선정 기준" : "뉴스 구성 기준"}</strong>
      {isMajor ? <ul>
        <li>최근 72시간 네이버 뉴스 중 국내와 세계를 각각 10건 선정합니다.</li>
        <li>경제 영향 핵심어, 발행 시각, 동일 이슈 보도량을 점수에 반영합니다.</li>
        <li>같은 출처와 비슷한 주제의 반복 노출을 우선 제한합니다.</li>
        <li>관련 뉴스는 같은 지역 기사 중 제목·요약 핵심어가 충분히 겹칠 때만 표시합니다.</li>
      </ul> : <ul>
        <li>카테고리는 기사 제목과 요약의 분야별 핵심어로 분류합니다.</li>
        <li>상단 기사는 경제 영향도, 최신성, 동일 이슈 보도량을 반영하고 출처·주제 중복을 줄입니다.</li>
        <li>최신 뉴스는 기사 발행 시각 내림차순으로 표시합니다.</li>
        <li>모든 목록은 최근 72시간 내 기사만 사용합니다.</li>
      </ul>}
    </div>
  </details>;
}

export default function EconomyPage() {
  const [categoryKey, setCategoryKey] = useState<CategoryKey>("all");
  const [feed, setFeed] = useState<NewsFeed>({ domestic: [], global: [] });
  const [majorNews, setMajorNews] = useState<NewsFeed>({ domestic: [], global: [] });
  const [majorNewsRegion, setMajorNewsRegion] = useState<NewsRegion>("domestic");
  const [majorNewsPool, setMajorNewsPool] = useState<NewsArticle[]>([]);
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
        setMajorNews(selectMajorNews(nextFeed));
        setMajorNewsPool(uniqueLatest([...nextFeed.domestic, ...nextFeed.global]));
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

  const chronologicalArticles = useMemo(() => activeCategory.key === "global" ? feed.global : uniqueLatest([...feed.domestic, ...feed.global]), [activeCategory.key, feed]);
  const highlightCandidates = useMemo(() => {
    const selectedMajorNews = [...majorNews.domestic, ...majorNews.global];
    if (activeCategory.key !== "all" || selectedMajorNews.length === 0) return chronologicalArticles;
    const majorNewsIds = new Set(selectedMajorNews.map((article) => article.id));
    return chronologicalArticles.filter((article) => !majorNewsIds.has(article.id));
  }, [activeCategory.key, chronologicalArticles, majorNews]);
  const categoryHighlights = useMemo(() => selectDiverseNews(highlightCandidates, chronologicalArticles, 5), [chronologicalArticles, highlightCandidates]);
  const marketByKey = useMemo(() => new Map(markets.map((market) => [market.key, market])), [markets]);
  const activeMajorNews = majorNews[majorNewsRegion];
  const relatedNewsById = useMemo(() => {
    const majorNewsIds = new Set([...majorNews.domestic, ...majorNews.global].map((article) => article.id));
    const regionPool = majorNewsPool.filter((article) => article.region === majorNewsRegion);
    return new Map(activeMajorNews.map((article) => [article.id, findRelatedNews(article, regionPool, majorNewsIds)]));
  }, [activeMajorNews, majorNews, majorNewsPool, majorNewsRegion]);
  const leadArticle = categoryHighlights[0];
  const headlineRail = categoryHighlights.slice(1, 5);
  const latestArticles = chronologicalArticles.slice(0, 12);

  return (
    <main className="economy-page">
      <header className="topbar">
        <Link className="brand" href="/#top" aria-label="오늘의 날씨와 경제 홈">
          <img className="brand-logo" src="/today-weather-logo.png" width="34" height="34" alt="" />
          <span>오늘의 날씨와 경제</span>
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
              <div><small>MARKET NOW · 최근 5일 추이</small><h1 id="market-heading">주요 시장지표</h1></div>
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
                  <div className="economy-market-value-row">
                    <strong>{market ? formatMarketValue(market, definition) : "—"}</strong>
                    <MarketSparkline label={definition.label} values={market?.sparkline ?? []} trend={trend} />
                  </div>
                  <div className="economy-market-meta"><b>{market ? formatMarketPercent(market.changePercent) : marketLoading ? "조회 중" : "정보 없음"}</b><time>{market ? formatMarketTime(market.marketTime) : ""}</time></div>
                </article>;
              })}
            </div>
          </section>

          <section className="economy-topnews-panel" aria-labelledby="topnews-heading" aria-busy={loading && activeMajorNews.length === 0}>
            <div className="economy-live-heading light">
              <div><small>MAJOR ECONOMY NEWS</small><h2 id="topnews-heading">주요 뉴스</h2></div>
              <div className="economy-major-controls">
                <div className="economy-major-tabs" role="tablist" aria-label="주요 뉴스 지역">
                  {(["domestic", "global"] as NewsRegion[]).map((region) => <button type="button" role="tab" aria-selected={majorNewsRegion === region} aria-controls="major-news-list" id={`major-${region}-tab`} className={majorNewsRegion === region ? "active" : ""} key={region} onClick={() => setMajorNewsRegion(region)}>{region === "domestic" ? "국내" : "세계"}</button>)}
                </div>
                <span>{activeMajorNews.length}/10</span>
                <NewsCriteriaDetails type="major" />
              </div>
            </div>
            {loading && activeMajorNews.length === 0 && <div className="economy-topnews-loading" aria-label="주요 뉴스 불러오는 중">{Array.from({ length: 10 }, (_, index) => <div key={index} />)}</div>}
            {!loading && error && activeMajorNews.length === 0 && <div className="economy-panel-state"><strong>주요 뉴스를 불러오지 못했습니다.</strong><button type="button" onClick={() => {
              setLoading(true);
              setError("");
              setRefreshToken((value) => value + 1);
            }}>다시 불러오기</button></div>}
            {activeMajorNews.length > 0 && <div className="economy-topnews-columns" id="major-news-list" role="tabpanel" aria-labelledby={`major-${majorNewsRegion}-tab`}>
              {[activeMajorNews.slice(0, 5), activeMajorNews.slice(5, 10)].map((column, columnIndex) => column.length > 0 && <ol start={columnIndex * 5 + 1} key={columnIndex}>
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
            <NewsCriteriaDetails type="category" />
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

          {loading && chronologicalArticles.length === 0 && <div className="economy-loading" aria-label="경제 뉴스 불러오는 중"><div /><div /><div /><div /></div>}
          {!loading && error && <div className="economy-empty"><strong>뉴스 연결이 원활하지 않습니다.</strong><p>{error}</p><button type="button" onClick={() => {
            setLoading(true);
            setError("");
            setRefreshToken((value) => value + 1);
          }}>다시 불러오기</button></div>}
          {!loading && !error && chronologicalArticles.length === 0 && <div className="economy-empty"><strong>최근 72시간 내 기사가 없습니다.</strong><p>선택한 카테고리의 새 기사가 들어오면 이곳에 표시됩니다.</p></div>}

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
            <div className="economy-list-heading"><h3>최신 뉴스</h3><span>{activeCategory.label} · 최신순</span></div>
            <div className="economy-news-grid">
              {latestArticles.map((article) => <a className="economy-news-card" href={article.url} target="_blank" rel="noopener noreferrer" key={article.id}><ArticleMeta article={article} /><h3>{article.title}</h3><span>원문 보기 ↗</span></a>)}
            </div>
          </div>}
        </section>

      </div>

      <footer className="economy-footer"><div className="brand"><img className="brand-logo" src="/today-weather-logo.png" width="34" height="34" alt="" /><span>오늘의 날씨와 경제</span></div><p>시장 데이터: Yahoo Finance · 뉴스 데이터: 네이버 검색 뉴스 API<br />기사 제목과 원문 저작권은 각 언론사에 있습니다. 제공 지연이나 분류 오차가 발생할 수 있습니다.</p><div className="footer-links"><a href="https://developers.naver.com/docs/serviceapi/search/news/news.md" target="_blank" rel="noreferrer">뉴스 데이터 안내</a><a href="#economy-top">맨 위로 ↑</a></div></footer>
    </main>
  );
}
