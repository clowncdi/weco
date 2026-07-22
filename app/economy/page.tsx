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
type NewsletterKey = "daily-byte" | "moneyletter" | "spendingletter" | "soonsal" | "newneek";
type ApiNewsletterItem = {
  key?: unknown;
  publisher?: unknown;
  newsletter?: unknown;
  title?: unknown;
  summary?: unknown;
  url?: unknown;
  publishedAt?: unknown;
};
type NewsletterItem = {
  key: NewsletterKey;
  publisher: string;
  newsletter: string;
  title: string;
  summary: string;
  url: string;
  publishedAt?: number;
};
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
type ApiMarketCandle = {
  time?: unknown;
  open?: unknown;
  high?: unknown;
  low?: unknown;
  close?: unknown;
};
type MarketCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};
type MarketHistory = {
  key: MarketKey;
  label: string;
  currency?: string;
  candles: MarketCandle[];
  expiresAt: number;
};
const MARKET_SPARKLINE_DAYS = 7;
const MARKET_HISTORY_BROWSER_CACHE_TTL = 10 * 60_000;
const MARKET_HISTORY_REQUESTS = new Map<MarketKey, { expiresAt: number; request: Promise<MarketHistory> }>();

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

function normalizedArticleTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/\[(속보|단독|종합|영상|포토)\]/gu, "")
    .replace(/^(속보|단독|종합|영상|포토)\s*[:·-]?\s*/u, "")
    .replace(/[^0-9a-z가-힣]/gu, "");
}

function articleIdentityKeys(article: NewsArticle) {
  return [`id:${article.id}`, `url:${article.url}`, `title:${normalizedArticleTitle(article.title)}`];
}

function articleIdentitySet(items: NewsArticle[]) {
  return new Set(items.flatMap(articleIdentityKeys));
}

function hasArticleIdentity(article: NewsArticle, identities: Set<string>) {
  return articleIdentityKeys(article).some((key) => identities.has(key));
}

function uniqueLatest(items: NewsArticle[]) {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      const keys = articleIdentityKeys(item);
      if (keys.some((key) => seen.has(key))) return false;
      keys.forEach((key) => seen.add(key));
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

function normalizeNewsletter(item: ApiNewsletterItem): NewsletterItem | null {
  const keys: NewsletterKey[] = ["daily-byte", "moneyletter", "spendingletter", "soonsal", "newneek"];
  if (!keys.includes(item.key as NewsletterKey) || typeof item.url !== "string") return null;
  try {
    const url = new URL(item.url);
    if (url.protocol !== "https:") return null;
    const publishedAt = typeof item.publishedAt === "string" ? Date.parse(item.publishedAt) : Number.NaN;
    return {
      key: item.key as NewsletterKey,
      publisher: cleanText(item.publisher),
      newsletter: cleanText(item.newsletter),
      title: cleanText(item.title),
      summary: cleanText(item.summary),
      url: url.href,
      publishedAt: Number.isFinite(publishedAt) ? publishedAt : undefined,
    };
  } catch {
    return null;
  }
}

async function fetchNewsletters(signal: AbortSignal) {
  const endpoint = createApiEndpoint("/api/newsletters", "newsletter-api-not-configured");
  const response = await fetch(endpoint, { signal });
  if (!response.ok) throw new Error("newsletter-api-unavailable");
  const body = await response.json() as { provider?: unknown; items?: ApiNewsletterItem[] };
  if (body.provider !== "official-newsletter-archives") throw new Error("newsletter-api-unavailable");
  return (body.items ?? []).map(normalizeNewsletter).filter((item): item is NewsletterItem => Boolean(item));
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
    sparkline: Array.isArray(snapshot.sparkline) ? snapshot.sparkline.filter((value): value is number => typeof value === "number" && Number.isFinite(value)).slice(-MARKET_SPARKLINE_DAYS) : [],
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

function normalizeMarketCandle(candle: ApiMarketCandle): MarketCandle | null {
  if (typeof candle.time !== "number" || !Number.isFinite(candle.time)
    || typeof candle.open !== "number" || !Number.isFinite(candle.open)
    || typeof candle.high !== "number" || !Number.isFinite(candle.high)
    || typeof candle.low !== "number" || !Number.isFinite(candle.low)
    || typeof candle.close !== "number" || !Number.isFinite(candle.close)) return null;
  return { time: candle.time, open: candle.open, high: candle.high, low: candle.low, close: candle.close };
}

function fetchMarketHistory(key: MarketKey) {
  const cachedRequest = MARKET_HISTORY_REQUESTS.get(key);
  if (cachedRequest && cachedRequest.expiresAt > Date.now()) return cachedRequest.request;
  if (cachedRequest) MARKET_HISTORY_REQUESTS.delete(key);

  const request = (async () => {
    const endpoint = createApiEndpoint("/api/market-history", "market-api-not-configured");
    endpoint.searchParams.set("market", key);
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("market-history-api-unavailable");
    const body = await response.json() as {
      provider?: unknown;
      market?: { key?: unknown; label?: unknown; currency?: unknown };
      candles?: ApiMarketCandle[];
    };
    if (body.provider !== "yahoo-finance" || body.market?.key !== key) throw new Error("market-history-api-unavailable");
    const candles = (body.candles ?? []).map(normalizeMarketCandle).filter((candle): candle is MarketCandle => Boolean(candle));
    if (candles.length === 0) throw new Error("market-history-api-unavailable");
    return {
      key,
      label: typeof body.market.label === "string" ? body.market.label : MARKET_DEFINITIONS.find((item) => item.key === key)?.label ?? key,
      currency: typeof body.market.currency === "string" ? body.market.currency : undefined,
      candles,
      expiresAt: Date.now() + MARKET_HISTORY_BROWSER_CACHE_TTL,
    };
  })();
  MARKET_HISTORY_REQUESTS.set(key, { expiresAt: Date.now() + MARKET_HISTORY_BROWSER_CACHE_TTL, request });
  request.catch(() => {
    if (MARKET_HISTORY_REQUESTS.get(key)?.request === request) MARKET_HISTORY_REQUESTS.delete(key);
  });
  return request;
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

function selectChronologicalDiverseNews(items: NewsArticle[], count: number) {
  const selected: NewsArticle[] = [];
  for (const article of uniqueLatest(items)) {
    if (selected.some((candidate) => isStrongRelation(candidate, article))) continue;
    selected.push(article);
    if (selected.length === count) break;
  }
  return selected;
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

function formatCandleValue(value: number, definition: MarketDefinition) {
  const formatted = new Intl.NumberFormat("ko-KR", { minimumFractionDigits: definition.decimals, maximumFractionDigits: definition.decimals }).format(value);
  return `${definition.prefix ?? ""}${formatted}${definition.suffix ?? ""}`;
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

function formatNewsletterDate(value?: number) {
  if (!value) return "최신호 바로가기";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(value);
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

  return <div className="economy-market-sparkline" role="img" aria-label={`${label} ${MARKET_SPARKLINE_DAYS}일간 변화 그래프`}>
    {values.length > 1 ? <canvas ref={canvasRef} aria-hidden="true" /> : <span aria-hidden="true" />}
  </div>;
}

function MarketCandlestickChart({ label, candles, months, definition }: { label: string; candles: MarketCandle[]; months: number; definition: MarketDefinition }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeCandleIndex, setActiveCandleIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 50, arrow: 50 });
  const visibleCandles = useMemo(() => {
    const latest = candles.at(-1);
    if (!latest) return [];
    const cutoff = new Date(latest.time * 1000);
    cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
    return candles.filter((candle) => candle.time >= cutoff.getTime() / 1000);
  }, [candles, months]);
  const latestCandle = visibleCandles.at(-1);
  const resolvedActiveIndex = activeCandleIndex !== null && activeCandleIndex < visibleCandles.length ? activeCandleIndex : null;
  const activeCandle = resolvedActiveIndex === null ? undefined : visibleCandles[resolvedActiveIndex];
  const activeCandleChangePercent = activeCandle && activeCandle.open !== 0 ? (activeCandle.close - activeCandle.open) / activeCandle.open * 100 : 0;

  const selectCandle = (index: number, bounds: DOMRect) => {
    const safeIndex = Math.max(0, Math.min(visibleCandles.length - 1, index));
    const leftPadding = bounds.width < 520 ? 58 : 76;
    const rightPadding = 14;
    const plotWidth = Math.max(1, bounds.width - leftPadding - rightPadding);
    const candleX = leftPadding + plotWidth / visibleCandles.length * (safeIndex + .5);
    const tooltipHalfWidth = Math.min(103, bounds.width / 2);
    const tooltipCenter = Math.max(tooltipHalfWidth, Math.min(bounds.width - tooltipHalfWidth, candleX));
    const tooltipLeft = bounds.width === 0 ? 50 : tooltipCenter / bounds.width * 100;
    const arrowLeft = Math.max(8, Math.min(92, (candleX - tooltipCenter + tooltipHalfWidth) / (tooltipHalfWidth * 2) * 100));
    setActiveCandleIndex(safeIndex);
    setTooltipPosition({ left: tooltipLeft, arrow: arrowLeft });
  };

  const selectCandleAtPosition = (clientX: number, bounds: DOMRect) => {
    if (visibleCandles.length === 0) return;
    const leftPadding = bounds.width < 520 ? 58 : 76;
    const rightPadding = 14;
    const plotWidth = Math.max(1, bounds.width - leftPadding - rightPadding);
    const relativeX = Math.max(0, Math.min(plotWidth, clientX - bounds.left - leftPadding));
    selectCandle(Math.min(visibleCandles.length - 1, Math.floor(relativeX / plotWidth * visibleCandles.length)), bounds);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || visibleCandles.length === 0) return;
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

      const padding = { top: 18, right: 14, bottom: 34, left: width < 520 ? 58 : 76 };
      const plotWidth = Math.max(1, width - padding.left - padding.right);
      const plotHeight = Math.max(1, height - padding.top - padding.bottom);
      const lowest = Math.min(...visibleCandles.map((candle) => candle.low));
      const highest = Math.max(...visibleCandles.map((candle) => candle.high));
      const pricePadding = (highest - lowest || Math.abs(highest) * .01 || 1) * .05;
      const minimum = lowest - pricePadding;
      const maximum = highest + pricePadding;
      const priceRange = maximum - minimum || 1;
      const yFor = (value: number) => padding.top + (maximum - value) / priceRange * plotHeight;

      context.font = `${width < 520 ? 11 : 12}px sans-serif`;
      context.textAlign = "right";
      context.textBaseline = "middle";
      for (let index = 0; index <= 4; index += 1) {
        const ratio = index / 4;
        const y = padding.top + plotHeight * ratio;
        const value = maximum - priceRange * ratio;
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.strokeStyle = "rgba(255,255,255,.1)";
        context.lineWidth = 1;
        context.stroke();
        context.fillStyle = "rgba(255,255,255,.56)";
        context.fillText(new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 2 }).format(value), padding.left - 6, y);
      }

      const slotWidth = plotWidth / visibleCandles.length;
      const bodyWidth = Math.max(1, Math.min(8, slotWidth * .64));
      visibleCandles.forEach((candle, index) => {
        const x = padding.left + slotWidth * (index + .5);
        const openY = yFor(candle.open);
        const closeY = yFor(candle.close);
        const rising = candle.close > candle.open;
        const falling = candle.close < candle.open;
        const color = rising ? "#ff9d81" : falling ? "#82c9ff" : "#73d5d9";
        context.beginPath();
        context.moveTo(x, yFor(candle.high));
        context.lineTo(x, yFor(candle.low));
        context.strokeStyle = color;
        context.lineWidth = Math.max(1, Math.min(1.5, bodyWidth * .35));
        context.stroke();
        context.fillStyle = color;
        context.fillRect(x - bodyWidth / 2, Math.min(openY, closeY), bodyWidth, Math.max(1.25, Math.abs(closeY - openY)));
      });

      if (resolvedActiveIndex !== null) {
        const x = padding.left + slotWidth * (resolvedActiveIndex + .5);
        context.beginPath();
        context.moveTo(x, padding.top);
        context.lineTo(x, padding.top + plotHeight);
        context.strokeStyle = "rgba(255,255,255,.42)";
        context.lineWidth = 1;
        context.setLineDash([3, 4]);
        context.stroke();
        context.setLineDash([]);
      }

      const dateFormatter = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" });
      const tickCount = Math.min(5, visibleCandles.length);
      context.font = `${width < 520 ? 11 : 12}px sans-serif`;
      context.fillStyle = "rgba(255,255,255,.52)";
      context.textBaseline = "top";
      for (let index = 0; index < tickCount; index += 1) {
        const candleIndex = tickCount === 1 ? 0 : Math.round(index / (tickCount - 1) * (visibleCandles.length - 1));
        const x = padding.left + slotWidth * (candleIndex + .5);
        context.textAlign = index === 0 ? "left" : index === tickCount - 1 ? "right" : "center";
        context.fillText(dateFormatter.format(visibleCandles[candleIndex].time * 1000), x, padding.top + plotHeight + 9);
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [resolvedActiveIndex, visibleCandles]);

  return <div className="economy-candlestick-wrap">
    {latestCandle && <div className="economy-candlestick-summary" aria-label={`${label} 최근 일봉 시가 고가 저가 종가`}>
      <span>시가 <b>{formatCandleValue(latestCandle.open, definition)}</b></span>
      <span>고가 <b>{formatCandleValue(latestCandle.high, definition)}</b></span>
      <span>저가 <b>{formatCandleValue(latestCandle.low, definition)}</b></span>
      <span>종가 <b>{formatCandleValue(latestCandle.close, definition)}</b></span>
    </div>}
    <div className="economy-candlestick-stage">
      {activeCandle && resolvedActiveIndex !== null && <div className={`economy-candlestick-tooltip ${activeCandle.close > activeCandle.open ? "up" : activeCandle.close < activeCandle.open ? "down" : "flat"}`} id="market-candle-tooltip" role="tooltip" style={{ left: `${tooltipPosition.left}%` }}>
        <span className="economy-candlestick-tooltip-arrow" aria-hidden="true" style={{ left: `${tooltipPosition.arrow}%` }} />
        <time>{new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(activeCandle.time * 1000)}</time>
        <div><strong>{formatCandleValue(activeCandle.close, definition)}</strong><b>{formatMarketPercent(activeCandleChangePercent)}</b></div>
        <dl><div><dt>시가</dt><dd>{formatCandleValue(activeCandle.open, definition)}</dd></div><div><dt>고가</dt><dd>{formatCandleValue(activeCandle.high, definition)}</dd></div><div><dt>저가</dt><dd>{formatCandleValue(activeCandle.low, definition)}</dd></div><div><dt>종가</dt><dd>{formatCandleValue(activeCandle.close, definition)}</dd></div></dl>
      </div>}
      <div className="economy-candlestick-chart" role="group" tabIndex={0} aria-label={`${label} 최근 ${months === 12 ? "1년" : `${months}개월`} 일봉 차트. 마우스나 터치 또는 방향키로 봉의 지수를 확인할 수 있습니다.`} aria-describedby={activeCandle ? "market-candle-tooltip" : undefined}
        onPointerMove={(event) => selectCandleAtPosition(event.clientX, event.currentTarget.getBoundingClientRect())}
        onPointerDown={(event) => selectCandleAtPosition(event.clientX, event.currentTarget.getBoundingClientRect())}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setActiveCandleIndex(null);
        }}
        onFocus={(event) => {
          if (activeCandleIndex === null) selectCandle(Math.max(0, visibleCandles.length - 1), event.currentTarget.getBoundingClientRect());
        }}
        onBlur={() => setActiveCandleIndex(null)}
        onKeyDown={(event) => {
          if (visibleCandles.length === 0) return;
          if (event.key === "Escape") {
            setActiveCandleIndex(null);
            return;
          }
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const start = activeCandleIndex ?? visibleCandles.length - 1;
          const nextIndex = event.key === "Home" ? 0
            : event.key === "End" ? visibleCandles.length - 1
              : event.key === "ArrowLeft" ? Math.max(0, start - 1)
                : Math.min(visibleCandles.length - 1, start + 1);
          selectCandle(nextIndex, event.currentTarget.getBoundingClientRect());
        }}>
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>
    </div>
    <div className="economy-candlestick-legend" aria-hidden="true"><span className="up">상승</span><span className="down">하락</span><span>일봉</span></div>
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
        <li>동일 URL·같은 제목은 하나로 합치고, 같은 출처와 비슷한 주제의 반복 노출을 우선 제한합니다.</li>
        <li>관련 뉴스는 같은 지역 기사 중 제목·요약 핵심어가 충분히 겹칠 때만 표시합니다.</li>
        <li>기사 미리보기는 네이버 검색 결과에 제공된 설명문입니다.</li>
      </ul> : <ul>
        <li>카테고리는 기사 제목과 요약의 분야별 핵심어로 분류합니다.</li>
        <li>주요·관련·카테고리 대표 영역에서 이미 사용한 기사는 다음 영역에서 제외합니다.</li>
        <li>최신 뉴스는 비슷한 이슈의 반복을 건너뛴 뒤 발행 시각 내림차순으로 표시합니다.</li>
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
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState(true);
  const [newsletterError, setNewsletterError] = useState("");
  const [newsletterRefreshToken, setNewsletterRefreshToken] = useState(0);
  const [selectedMarketKey, setSelectedMarketKey] = useState<MarketKey | null>(null);
  const [marketHistoryByKey, setMarketHistoryByKey] = useState<Partial<Record<MarketKey, MarketHistory>>>({});
  const [marketHistoryLoading, setMarketHistoryLoading] = useState(false);
  const [marketHistoryError, setMarketHistoryError] = useState("");
  const [marketHistoryMonths, setMarketHistoryMonths] = useState(3);
  const [marketHistoryRefreshToken, setMarketHistoryRefreshToken] = useState(0);
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

  useEffect(() => {
    const controller = new AbortController();
    fetchNewsletters(controller.signal).then((nextNewsletters) => {
      if (controller.signal.aborted) return;
      setNewsletters(nextNewsletters);
      setNewsletterError("");
    }).catch(() => {
      if (!controller.signal.aborted) setNewsletterError("뉴스레터 최신호를 불러오지 못했습니다.");
    }).finally(() => {
      if (!controller.signal.aborted) setNewsletterLoading(false);
    });
    return () => controller.abort();
  }, [newsletterRefreshToken]);

  useEffect(() => {
    const cachedHistory = selectedMarketKey ? marketHistoryByKey[selectedMarketKey] : undefined;
    if (!selectedMarketKey || (cachedHistory && cachedHistory.expiresAt > Date.now())) return;

    let active = true;
    fetchMarketHistory(selectedMarketKey).then((history) => {
      if (!active) return;
      setMarketHistoryByKey((previous) => ({ ...previous, [history.key]: history }));
    }).catch(() => {
      if (active) setMarketHistoryError("최근 1년 봉차트를 불러오지 못했습니다.");
    }).finally(() => {
      if (active) setMarketHistoryLoading(false);
    });
    return () => {
      active = false;
    };
  }, [marketHistoryByKey, marketHistoryRefreshToken, selectedMarketKey]);

  const allMajorNews = useMemo(() => [...majorNews.domestic, ...majorNews.global], [majorNews]);
  const activeMajorNews = majorNews[majorNewsRegion];
  const relatedNewsById = useMemo(() => {
    const usedIds = new Set(allMajorNews.map((article) => article.id));
    const relatedById = new Map<string, NewsArticle[]>();
    for (const article of allMajorNews) {
      const regionPool = majorNewsPool.filter((candidate) => candidate.region === article.region);
      const related = findRelatedNews(article, regionPool, usedIds);
      related.forEach((candidate) => usedIds.add(candidate.id));
      relatedById.set(article.id, related);
    }
    return relatedById;
  }, [allMajorNews, majorNewsPool]);
  const reservedNews = useMemo(() => [
    ...activeMajorNews,
    ...activeMajorNews.flatMap((article) => relatedNewsById.get(article.id) ?? []),
  ], [activeMajorNews, relatedNewsById]);
  const chronologicalArticles = useMemo(() => activeCategory.key === "global" ? feed.global : uniqueLatest([...feed.domestic, ...feed.global]), [activeCategory.key, feed]);
  const highlightCandidates = useMemo(() => {
    const reservedIdentities = articleIdentitySet(reservedNews);
    return chronologicalArticles.filter((article) => !hasArticleIdentity(article, reservedIdentities));
  }, [chronologicalArticles, reservedNews]);
  const categoryHighlights = useMemo(() => selectDiverseNews(highlightCandidates, chronologicalArticles, 5), [chronologicalArticles, highlightCandidates]);
  const marketByKey = useMemo(() => new Map(markets.map((market) => [market.key, market])), [markets]);
  const selectedMarketDefinition = MARKET_DEFINITIONS.find((definition) => definition.key === selectedMarketKey);
  const selectedMarketHistory = selectedMarketKey ? marketHistoryByKey[selectedMarketKey] : undefined;
  const leadArticle = categoryHighlights[0];
  const headlineRail = categoryHighlights.slice(1, 5);
  const latestArticles = useMemo(() => {
    const usedIdentities = articleIdentitySet([...reservedNews, ...categoryHighlights]);
    const candidates = chronologicalArticles.filter((article) => !hasArticleIdentity(article, usedIdentities));
    return selectChronologicalDiverseNews(candidates, 12);
  }, [categoryHighlights, chronologicalArticles, reservedNews]);
  const handleMarketCardClick = (key: MarketKey) => {
    if (selectedMarketKey === key) {
      setSelectedMarketKey(null);
      return;
    }
    const cachedHistory = marketHistoryByKey[key];
    setSelectedMarketKey(key);
    setMarketHistoryError("");
    setMarketHistoryLoading(!cachedHistory);
  };

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
              <div><small>MARKET NOW</small><h1 id="market-heading">주요 시장지표</h1></div>
              <div className="economy-market-heading-aside">
                <span className="economy-market-period">지수 그래프 · 최근 7일 추이</span>
                {marketError && <button type="button" onClick={() => {
                  setMarketLoading(true);
                  setMarketError("");
                  setMarketRefreshToken((value) => value + 1);
                }}>다시 불러오기</button>}
              </div>
            </div>
            <div className="economy-market-grid">
              {MARKET_DEFINITIONS.map((definition) => {
                const market = marketByKey.get(definition.key);
                const trend = !market || market.change === 0 ? "flat" : market.change > 0 ? "up" : "down";
                const selected = selectedMarketKey === definition.key;
                return <article className={`economy-market-card ${trend}${selected ? " selected" : ""}`} key={definition.key}>
                  <button type="button" className="economy-market-card-button" disabled={!market} aria-expanded={selected} aria-controls="market-history-panel" aria-label={`${definition.label} 최근 1년 봉차트 보기`} onClick={() => handleMarketCardClick(definition.key)}>
                    <span>{definition.label}</span>
                    <div className="economy-market-value-row">
                      <strong>{market ? formatMarketValue(market, definition) : "—"}</strong>
                      <MarketSparkline label={definition.label} values={market?.sparkline ?? []} trend={trend} />
                    </div>
                    <div className="economy-market-meta"><b>{market ? formatMarketPercent(market.changePercent) : marketLoading ? "조회 중" : "정보 없음"}</b><time>{market ? formatMarketTime(market.marketTime) : ""}</time></div>
                  </button>
                </article>;
              })}
            </div>
            {selectedMarketKey && selectedMarketDefinition && <section className="economy-market-history-panel" id="market-history-panel" aria-labelledby="market-history-heading" aria-busy={marketHistoryLoading}>
              <div className="economy-market-history-heading">
                <div><small>DAILY CANDLE</small><h2 id="market-history-heading">{selectedMarketDefinition.label} 봉차트</h2><p>최근 1년 일봉 데이터에서 조회 기간을 조절할 수 있습니다.</p></div>
                <button type="button" aria-label="봉차트 닫기" onClick={() => setSelectedMarketKey(null)}>닫기</button>
              </div>
              <div className="economy-market-history-controls">
                <label htmlFor="market-history-range">조회 기간 <output htmlFor="market-history-range">{marketHistoryMonths === 12 ? "1년" : `${marketHistoryMonths}개월`}</output></label>
                <input id="market-history-range" type="range" min="1" max="12" step="1" value={marketHistoryMonths} onChange={(event) => setMarketHistoryMonths(Number(event.target.value))} />
                <div aria-hidden="true"><span>1개월</span><span>6개월</span><span>1년</span></div>
              </div>
              {marketHistoryLoading && !selectedMarketHistory && <div className="economy-market-history-state" aria-live="polite"><span />최근 1년 일봉을 불러오는 중입니다.</div>}
              {!marketHistoryLoading && marketHistoryError && <div className="economy-market-history-state error"><p>{marketHistoryError}</p><button type="button" onClick={() => {
                MARKET_HISTORY_REQUESTS.delete(selectedMarketKey);
                setMarketHistoryError("");
                setMarketHistoryLoading(true);
                setMarketHistoryRefreshToken((value) => value + 1);
              }}>다시 불러오기</button></div>}
              {selectedMarketHistory && <MarketCandlestickChart key={`${selectedMarketKey}-${marketHistoryMonths}`} label={selectedMarketDefinition.label} candles={selectedMarketHistory.candles} months={marketHistoryMonths} definition={selectedMarketDefinition} />}
              <p className="economy-market-history-note">상승은 주황색, 하락은 파란색으로 표시됩니다. 데이터는 지표별로 캐시되어 같은 지표를 다시 열 때 재요청하지 않습니다.</p>
            </section>}
          </section>

          <section className="economy-newsletter-panel" aria-labelledby="newsletter-heading" aria-busy={newsletterLoading}>
            <div className="economy-newsletter-heading">
              <div><small>RECOMMENDED NEWSLETTER</small><h2 id="newsletter-heading">추천 뉴스레터</h2><p>경제 흐름을 이해하는 데 도움이 되는 뉴스레터의 가장 최근 발행호를 추천합니다.</p></div>
              <span>평일 오전 8시 갱신</span>
            </div>
            {newsletterLoading && newsletters.length === 0 && <div className="economy-newsletter-loading" aria-label="뉴스레터 최신호 불러오는 중">{Array.from({ length: 5 }, (_, index) => <div key={index} />)}</div>}
            {!newsletterLoading && newsletterError && newsletters.length === 0 && <div className="economy-newsletter-state"><strong>뉴스레터 최신호를 불러오지 못했습니다.</strong><button type="button" onClick={() => {
              setNewsletterLoading(true);
              setNewsletterError("");
              setNewsletterRefreshToken((value) => value + 1);
            }}>다시 불러오기</button></div>}
            {newsletters.length > 0 && <div className="economy-newsletter-grid">
              {newsletters.map((item) => <a className={`economy-newsletter-card ${item.key}`} href={item.url} target="_blank" rel="noopener noreferrer" key={item.key}>
                <div className="economy-newsletter-meta"><span>{item.publisher}</span>{item.publishedAt && <time dateTime={new Date(item.publishedAt).toISOString()}>{formatNewsletterDate(item.publishedAt)}</time>}</div>
                <small>{item.newsletter}</small>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <b>최신호 읽기 <span aria-hidden="true">↗</span></b>
              </a>)}
            </div>}
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
                    <a className="economy-topnews-main" href={article.url} target="_blank" rel="noopener noreferrer"><ArticleMeta article={article} /><h3>{article.title}</h3><div className="economy-topnews-summary"><span>기사 미리보기</span><p>{article.description || "미리보기 정보가 제공되지 않은 기사입니다."}</p></div></a>
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
