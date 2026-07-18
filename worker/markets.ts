type MarketKey = "sp500" | "nasdaq" | "dow" | "kospi" | "kosdaq" | "usdkrw" | "wti" | "gold" | "silver" | "copper" | "bitcoin";

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
  indicators?: {
    quote?: Array<{ close?: unknown[] }>;
  };
};

const MARKET_DEFINITIONS: MarketDefinition[] = [
  { key: "sp500", label: "S&P 500", symbol: "^GSPC" },
  { key: "nasdaq", label: "나스닥", symbol: "^IXIC" },
  { key: "dow", label: "다우산업", symbol: "^DJI" },
  { key: "kospi", label: "코스피", symbol: "^KS11" },
  { key: "kosdaq", label: "코스닥", symbol: "^KQ11" },
  { key: "usdkrw", label: "달러/원", symbol: "KRW=X" },
  { key: "wti", label: "WTI", symbol: "CL=F" },
  { key: "gold", label: "금", symbol: "GC=F" },
  { key: "silver", label: "은", symbol: "SI=F" },
  { key: "copper", label: "구리", symbol: "HG=F" },
  { key: "bitcoin", label: "비트코인", symbol: "BTC-USD" },
];

let responseCache: { expiresAt: number; payload: string } | null = null;

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

async function fetchMarket(definition: MarketDefinition) {
  const endpoint = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(definition.symbol)}`);
  endpoint.searchParams.set("range", "5d");
  endpoint.searchParams.set("interval", "1d");
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Market data request failed");

  const body = await response.json() as { chart?: { result?: YahooChartResult[] } };
  const result = body.chart?.result?.[0];
  const meta = result?.meta;
  const closes = (result?.indicators?.quote?.[0]?.close ?? []).map(finiteNumber).filter((value): value is number => value !== undefined);
  const value = finiteNumber(meta?.regularMarketPrice) ?? closes.at(-1);
  const previousClose = finiteNumber(meta?.chartPreviousClose) ?? finiteNumber(meta?.previousClose) ?? closes.at(-2);
  if (value === undefined || previousClose === undefined) throw new Error("Market data is incomplete");

  const change = value - previousClose;
  return {
    key: definition.key,
    label: definition.label,
    value,
    change,
    changePercent: previousClose === 0 ? 0 : change / previousClose * 100,
    currency: typeof meta?.currency === "string" ? meta.currency : undefined,
    marketTime: finiteNumber(meta?.regularMarketTime),
  };
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

  const results = await Promise.allSettled(MARKET_DEFINITIONS.map(fetchMarket));
  const markets = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
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
