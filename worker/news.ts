type NewsCategory = "all" | "macro" | "finance" | "industry" | "realestate" | "global";
type NewsRegion = "domestic" | "global";

type NaverNewsItem = {
  title?: unknown;
  originallink?: unknown;
  link?: unknown;
  description?: unknown;
  pubDate?: unknown;
};

type NormalizedNewsItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt?: string;
  region: NewsRegion;
};

const CATEGORY_QUERIES: Record<NewsCategory, { domestic: string; global: string }> = {
  all: { domestic: "한국 경제", global: "세계 경제" },
  macro: { domestic: "한국 경제 물가 금리", global: "세계 경제 성장 물가" },
  finance: { domestic: "국내 증시 금융", global: "글로벌 증시 금융" },
  industry: { domestic: "한국 산업 기업", global: "글로벌 산업 기업" },
  realestate: { domestic: "한국 부동산 경제", global: "세계 부동산 시장" },
  global: { domestic: "한국 경제", global: "세계 경제" },
};

const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  all: [],
  macro: ["기준금리", "금리", "물가", "소비자물가", "생산자물가", "환율", "원화", "달러", "gdp", "성장률", "고용", "실업", "재정", "세금", "국채", "한국은행", "경기침체", "경기회복", "경기둔화", "무역수지", "경상수지"],
  finance: ["코스피", "코스닥", "증시", "주식", "채권", "은행", "금융", "대출", "펀드", "보험", "가상자산", "비트코인", "상장", "공모주", "금감원", "금융위"],
  industry: ["반도체", "자동차", "배터리", "조선", "철강", "수출", "공급망", "실적", "매출", "영업이익", "설비투자", "공장", "통상", "관세"],
  realestate: ["부동산", "주택", "아파트", "전세", "월세", "분양", "청약", "재건축", "재개발", "주담대", "주택담보", "토지", "상가"],
  global: ["미국", "중국", "유럽", "일본", "연준", "fed", "fomc", "ecb", "관세", "무역", "유가", "달러"],
};

const RESPONSE_CACHE = new Map<string, { expiresAt: number; payload: string }>();

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function safeArticleUrl(item: NaverNewsItem) {
  for (const candidate of [item.originallink, item.link]) {
    if (typeof candidate !== "string") continue;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed;
    } catch {
      continue;
    }
  }
  return null;
}

function normalizeItem(item: NaverNewsItem, region: NewsRegion): NormalizedNewsItem | null {
  const title = cleanText(item.title);
  const articleUrl = safeArticleUrl(item);
  if (!title || !articleUrl) return null;
  const published = typeof item.pubDate === "string" ? new Date(item.pubDate) : null;
  return {
    id: `${region}:${articleUrl.href}`,
    title,
    description: cleanText(item.description),
    url: articleUrl.href,
    source: articleUrl.hostname.replace(/^www\./, ""),
    publishedAt: published && Number.isFinite(published.getTime()) ? published.toISOString() : undefined,
    region,
  };
}

function uniqueItems(items: NormalizedNewsItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.url}|${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => Date.parse(b.publishedAt ?? "") - Date.parse(a.publishedAt ?? ""));
}

function isRecent(item: NormalizedNewsItem) {
  const publishedAt = Date.parse(item.publishedAt ?? "");
  if (!Number.isFinite(publishedAt)) return false;
  const age = Date.now() - publishedAt;
  return age >= -60 * 60_000 && age <= 72 * 60 * 60_000;
}

function matchesCategory(item: NormalizedNewsItem, category: NewsCategory) {
  if (category === "all") return true;
  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const titleMatches = CATEGORY_KEYWORDS[category].filter((keyword) => title.includes(keyword)).length;
  const descriptionMatches = CATEGORY_KEYWORDS[category].filter((keyword) => description.includes(keyword)).length;
  return titleMatches >= 1 || descriptionMatches >= 2;
}

async function fetchNaverNews(query: string, region: NewsRegion, category: NewsCategory, clientId: string, clientSecret: string) {
  const endpoint = new URL("https://openapi.naver.com/v1/search/news.json");
  endpoint.searchParams.set("query", query);
  endpoint.searchParams.set("display", region === "domestic" ? "50" : "30");
  endpoint.searchParams.set("start", "1");
  endpoint.searchParams.set("sort", "date");
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });
  if (!response.ok) throw new Error("Naver news request failed");
  const payload = await response.json() as { items?: NaverNewsItem[] };
  return uniqueItems((payload.items ?? []).map((item) => normalizeItem(item, region)).filter((item): item is NormalizedNewsItem => Boolean(item))).filter((item) => isRecent(item) && matchesCategory(item, category));
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

export async function handleNaverNewsRequest(request: Request, clientId?: string, clientSecret?: string) {
  if (!clientId || !clientSecret) return jsonResponse({ error: "news_provider_not_configured" }, 503);
  const requestUrl = new URL(request.url);
  const requestedCategory = requestUrl.searchParams.get("category") ?? "all";
  if (!(requestedCategory in CATEGORY_QUERIES)) return jsonResponse({ error: "invalid_category" }, 400);
  const category = requestedCategory as NewsCategory;
  const cached = RESPONSE_CACHE.get(category);
  if (cached && cached.expiresAt > Date.now()) {
    return new Response(cached.payload, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300, stale-while-revalidate=300" } });
  }

  try {
    const queries = CATEGORY_QUERIES[category];
    const [domestic, global] = await Promise.all([
      category === "global" ? Promise.resolve([]) : fetchNaverNews(queries.domestic, "domestic", category, clientId, clientSecret),
      fetchNaverNews(queries.global, "global", category, clientId, clientSecret),
    ]);
    const payload = JSON.stringify({ provider: "naver", category, domestic, global, fetchedAt: new Date().toISOString() });
    RESPONSE_CACHE.set(category, { expiresAt: Date.now() + 5 * 60_000, payload });
    return new Response(payload, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300, stale-while-revalidate=300" } });
  } catch {
    return jsonResponse({ error: "news_provider_unavailable" }, 502);
  }
}
