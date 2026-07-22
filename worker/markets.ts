type MarketKey = "sp500" | "nasdaq" | "dow" | "vix" | "kospi" | "kosdaq" | "usdkrw" | "wti" | "gold" | "silver" | "copper" | "bitcoin";

type MarketDefinition = {
  key: MarketKey;
  label: string;
  symbol: string;
};

type YahooChartResult = {
  meta?: {
    regularMarketPrice?: unknown;
    chartPreviousClose?: unknown;
    previousClose?: unknown;
    regularMarketTime?: unknown;
    currency?: unknown;
  };
  timestamp?: unknown[];
  indicators?: {
    quote?: Array<{
      open?: unknown[];
      high?: unknown[];
      low?: unknown[];
      close?: unknown[];
    }>;
  };
};

type MarketCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type MarketHistoryResult = {
  market: { key: MarketKey; label: string; currency?: string };
  candles: MarketCandle[];
};

type YahooSparkResult = {
  symbol?: unknown;
  response?: YahooChartResult[];
};

const MARKET_DEFINITIONS: MarketDefinition[] = [
  { key: "sp500", label: "S&P 500", symbol: "^GSPC" },
  { key: "nasdaq", label: "나스닥", symbol: "^IXIC" },
  { key: "dow", label: "다우산업", symbol: "^DJI" },
  { key: "vix", label: "VIX", symbol: "^VIX" },
  { key: "kospi", label: "코스피", symbol: "^KS11" },
  { key: "kosdaq", label: "코스닥", symbol: "^KQ11" },
  { key: "usdkrw", label: "달러/원", symbol: "KRW=X" },
  { key: "wti", label: "WTI", symbol: "CL=F" },
  { key: "gold", label: "금", symbol: "GC=F" },
  { key: "silver", label: "은", symbol: "SI=F" },
  { key: "copper", label: "구리", symbol: "HG=F" },
  { key: "bitcoin", label: "비트코인", symbol: "BTC-USD" },
];
const MARKET_SPARKLINE_DAYS = 7;
const MARKET_ACTIVE_CANDLE_CACHE_TTL = 10 * 60_000;
const MARKET_HISTORY_CACHE_CONTROL = "public, max-age=600, stale-while-revalidate=600";

let responseCache: { expiresAt: number; payload: string } | null = null;
const closedHistoryCache = new Map<MarketKey, { expiresAt: number; history: MarketHistoryResult }>();
const activeCandleCache = new Map<MarketKey, { expiresAt: number; candle: MarketCandle }>();

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeMarket(definition: MarketDefinition, result?: YahooChartResult) {
  const meta = result?.meta;
  const closes = (result?.indicators?.quote?.[0]?.close ?? []).map(finiteNumber).filter((value): value is number => value !== undefined);
  const value = finiteNumber(meta?.regularMarketPrice) ?? closes.at(-1);
  // chartPreviousClose is the close immediately before the requested chart range,
  // while previousClose is the prior trading session used for the daily change.
  const previousClose = finiteNumber(meta?.previousClose) ?? closes.at(-2) ?? finiteNumber(meta?.chartPreviousClose);
  if (value === undefined || previousClose === undefined) return null;

  const change = value - previousClose;
  return {
    key: definition.key,
    label: definition.label,
    value,
    change,
    changePercent: previousClose === 0 ? 0 : change / previousClose * 100,
    currency: typeof meta?.currency === "string" ? meta.currency : undefined,
    marketTime: finiteNumber(meta?.regularMarketTime),
    sparkline: closes.slice(-MARKET_SPARKLINE_DAYS),
  };
}

async function fetchMarkets() {
  const origins = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];
  for (const origin of origins) {
    const endpoint = new URL("/v7/finance/spark", origin);
    endpoint.searchParams.set("symbols", MARKET_DEFINITIONS.map((definition) => definition.symbol).join(","));
    endpoint.searchParams.set("range", "1mo");
    endpoint.searchParams.set("interval", "1d");
    const response = await fetch(endpoint, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "application/json,text/plain,*/*",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) continue;

    const body = await response.json() as { spark?: { result?: YahooSparkResult[] } };
    const chartBySymbol = new Map((body.spark?.result ?? []).flatMap((item) => typeof item.symbol === "string" ? [[item.symbol, item.response?.[0]] as const] : []));
    const markets = MARKET_DEFINITIONS.flatMap((definition) => {
      const market = normalizeMarket(definition, chartBySymbol.get(definition.symbol));
      return market ? [market] : [];
    });
    if (markets.length > 0) return markets;
  }
  throw new Error("Market data request failed");
}

async function fetchMarketHistory(definition: MarketDefinition, range: "5d" | "1y") {
  const origins = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];
  for (const origin of origins) {
    const endpoint = new URL(`/v8/finance/chart/${encodeURIComponent(definition.symbol)}`, origin);
    endpoint.searchParams.set("range", range);
    endpoint.searchParams.set("interval", "1d");
    endpoint.searchParams.set("events", "history");
    const response = await fetch(endpoint, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "application/json,text/plain,*/*",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) continue;

    const body = await response.json() as { chart?: { result?: YahooChartResult[] } };
    const result = body.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const quote = result?.indicators?.quote?.[0];
    const candles = timestamps.flatMap((rawTime, index): MarketCandle[] => {
      const time = finiteNumber(rawTime);
      const open = finiteNumber(quote?.open?.[index]);
      const high = finiteNumber(quote?.high?.[index]);
      const low = finiteNumber(quote?.low?.[index]);
      const close = finiteNumber(quote?.close?.[index]);
      if (time === undefined || open === undefined || high === undefined || low === undefined || close === undefined) return [];
      return [{ time, open, high, low, close }];
    });
    if (candles.length > 0) {
      return {
        market: {
          key: definition.key,
          label: definition.label,
          currency: typeof result?.meta?.currency === "string" ? result.meta.currency : undefined,
        },
        candles,
      };
    }
  }
  throw new Error("Market history request failed");
}

function nextDailyHistoryRefresh(now = Date.now()) {
  const refreshAt = new Date(now);
  refreshAt.setUTCHours(0, 5, 0, 0);
  if (refreshAt.getTime() <= now) refreshAt.setUTCDate(refreshAt.getUTCDate() + 1);
  return refreshAt.getTime();
}

function jsonResponse(payload: unknown, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}

export async function handleMarketsRequest() {
  if (responseCache && responseCache.expiresAt > Date.now()) {
    return new Response(responseCache.payload, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
      },
    });
  }

  const markets = await fetchMarkets();
  if (markets.length === 0) return jsonResponse({ error: "market_provider_unavailable" }, 502);

  const payload = JSON.stringify({ provider: "yahoo-finance", markets, fetchedAt: new Date().toISOString() });
  responseCache = { expiresAt: Date.now() + 5 * 60_000, payload };
  return new Response(payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
    },
  });
}

export async function handleMarketHistoryRequest(request: Request) {
  const url = new URL(request.url);
  const requestedKey = url.searchParams.get("market");
  const definition = MARKET_DEFINITIONS.find(({ key }) => key === requestedKey);
  if (!definition) return jsonResponse({ error: "invalid_market" }, 400);

  try {
    const now = Date.now();
    let closedHistory = closedHistoryCache.get(definition.key);
    let activeCandle = activeCandleCache.get(definition.key);

    if (!closedHistory || closedHistory.expiresAt <= now) {
      const fullHistory = await fetchMarketHistory(definition, "1y");
      const latestCandle = fullHistory.candles.at(-1);
      closedHistory = {
        expiresAt: nextDailyHistoryRefresh(now),
        history: { ...fullHistory, candles: latestCandle ? fullHistory.candles.slice(0, -1) : fullHistory.candles },
      };
      closedHistoryCache.set(definition.key, closedHistory);
      if (latestCandle) {
        activeCandle = { expiresAt: now + MARKET_ACTIVE_CANDLE_CACHE_TTL, candle: latestCandle };
        activeCandleCache.set(definition.key, activeCandle);
      }
    } else if (!activeCandle || activeCandle.expiresAt <= now) {
      const staleCandle = activeCandle?.candle;
      try {
        const recentHistory = await fetchMarketHistory(definition, "5d");
        const latestCandle = recentHistory.candles.at(-1);
        if (latestCandle) {
          activeCandle = { expiresAt: now + MARKET_ACTIVE_CANDLE_CACHE_TTL, candle: latestCandle };
          activeCandleCache.set(definition.key, activeCandle);
        }
      } catch {
        if (staleCandle) activeCandle = { expiresAt: now + MARKET_ACTIVE_CANDLE_CACHE_TTL, candle: staleCandle };
      }
    }

    const candles = [...closedHistory.history.candles];
    if (activeCandle && candles.at(-1)?.time !== activeCandle.candle.time) candles.push(activeCandle.candle);
    const payload = JSON.stringify({
      provider: "yahoo-finance",
      market: closedHistory.history.market,
      candles,
      fetchedAt: new Date().toISOString(),
    });
    return new Response(payload, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": MARKET_HISTORY_CACHE_CONTROL,
      },
    });
  } catch {
    return jsonResponse({ error: "market_history_provider_unavailable" }, 502);
  }
}
