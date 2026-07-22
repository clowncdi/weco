type NewsletterKey = "daily-byte" | "moneyletter" | "spendingletter" | "soonsal" | "newneek";

type NewsletterItem = {
  key: NewsletterKey;
  publisher: string;
  newsletter: string;
  title: string;
  summary: string;
  url: string;
  publishedAt?: string;
};

type NewsletterPayload = {
  provider: "official-newsletter-archives";
  items: NewsletterItem[];
  refreshedAt: string;
  refreshBucket: string;
};

const KST_OFFSET = 9 * 60 * 60_000;
const NEWSLETTER_CACHE_ORIGIN = "https://newsletter-cache.internal";

let responseCache: { bucket: string; payload: string } | null = null;

const FALLBACK_ITEMS: Record<NewsletterKey, NewsletterItem> = {
  "daily-byte": {
    key: "daily-byte",
    publisher: "데일리바이트",
    newsletter: "한눈에 보는 오늘의 뉴스",
    title: "한눈에 보는 오늘의 뉴스",
    summary: "경제와 비즈니스 주요 뉴스를 한눈에 확인하세요.",
    url: "https://www.mydailybyte.com/daily-byte/news",
  },
  moneyletter: {
    key: "moneyletter",
    publisher: "어피티",
    newsletter: "머니레터",
    title: "머니레터 최신호",
    summary: "매일 아침 만나는 경제와 재테크 뉴스레터입니다.",
    url: "https://uppity.co.kr/category/newsletter/moneyletter/",
  },
  spendingletter: {
    key: "spendingletter",
    publisher: "어피티",
    newsletter: "잘쓸레터",
    title: "잘쓸레터 최신호",
    summary: "잘 쓰고 잘 사는 생활과 소비 이야기를 전합니다.",
    url: "https://uppity.co.kr/category/newsletter/spendingletter/",
  },
  soonsal: {
    key: "soonsal",
    publisher: "순살",
    newsletter: "순살브리핑",
    title: "순살브리핑 최신호",
    summary: "글로벌 금융·경제·크립토 뉴스를 뼈만 발라 전합니다.",
    url: "https://soonsal.com/",
  },
  newneek: {
    key: "newneek",
    publisher: "뉴닉",
    newsletter: "데일리 뉴스",
    title: "뉴닉 데일리 뉴스 최신호",
    summary: "꼭 필요한 세상 이야기를 쉽고 재밌게 전합니다.",
    url: "https://page.stibee.com/archives/26847",
  },
};

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#(?:39|x27);|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function kstRefreshBucket(now = Date.now()) {
  const kst = new Date(now + KST_OFFSET);
  if (kst.getUTCHours() < 8) kst.setUTCDate(kst.getUTCDate() - 1);
  while (kst.getUTCDay() === 0 || kst.getUTCDay() === 6) kst.setUTCDate(kst.getUTCDate() - 1);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}-${String(kst.getUTCDate()).padStart(2, "0")}`;
}

function secondsUntilNextWeekdayRefresh(now = Date.now()) {
  const kst = new Date(now + KST_OFFSET);
  const next = new Date(kst);
  next.setUTCHours(8, 0, 0, 0);
  if (next.getTime() <= kst.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  while (next.getUTCDay() === 0 || next.getUTCDay() === 6) next.setUTCDate(next.getUTCDate() + 1);
  return Math.max(60, Math.floor((next.getTime() - KST_OFFSET - now) / 1000));
}

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json,text/plain,*/*",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.7",
      "User-Agent": "TodayWeatherEconomy/1.0",
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error("Newsletter source unavailable");
  return response.json() as Promise<T>;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.7",
      "User-Agent": "TodayWeatherEconomy/1.0",
    },
  });
  if (!response.ok) throw new Error("Newsletter source unavailable");
  return response.text();
}

async function fetchUppity(key: "moneyletter" | "spendingletter", categoryId: number) {
  const endpoint = new URL("https://uppity.co.kr/wp-json/wp/v2/posts");
  endpoint.searchParams.set("categories", String(categoryId));
  endpoint.searchParams.set("per_page", "1");
  endpoint.searchParams.set("orderby", "date");
  endpoint.searchParams.set("order", "desc");
  endpoint.searchParams.set("_fields", "date,link,title,excerpt");
  const posts = await fetchJson<Array<{
    date?: unknown;
    link?: unknown;
    title?: { rendered?: unknown };
    excerpt?: { rendered?: unknown };
  }>>(endpoint.toString());
  const post = posts[0];
  if (!post || typeof post.link !== "string") throw new Error("Uppity issue unavailable");
  return {
    ...FALLBACK_ITEMS[key],
    title: cleanText(post.title?.rendered) || FALLBACK_ITEMS[key].title,
    summary: cleanText(post.excerpt?.rendered) || FALLBACK_ITEMS[key].summary,
    url: post.link,
    publishedAt: typeof post.date === "string" ? new Date(`${post.date}+09:00`).toISOString() : undefined,
  };
}

async function fetchSoonsal() {
  const home = await fetchHtml("https://soonsal.com/");
  const issuePath = home.match(/<iframe\s+src=["']([^"']+)["'][^>]*title=["']순살브리핑 최신호["']/i)?.[1];
  if (!issuePath) throw new Error("Soonsal issue unavailable");
  const issueUrl = new URL(issuePath, "https://soonsal.com/").toString();
  const issue = await fetchHtml(issueUrl);
  const title = cleanText(issue.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)/i)?.[1]
    ?? issue.match(/<title>([^<]+)/i)?.[1]);
  const summary = cleanText(issue.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)/i)?.[1]);
  const publishedAt = issue.match(/["']datePublished["']\s*:\s*["']([^"']+)/i)?.[1];
  return {
    ...FALLBACK_ITEMS.soonsal,
    title: title.replace(/\s*[—-]\s*순살브리핑\s*\d{4}[.]\d{2}[.]\d{2}\s*$/u, "") || FALLBACK_ITEMS.soonsal.title,
    summary: summary || FALLBACK_ITEMS.soonsal.summary,
    url: issueUrl,
    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
  };
}

async function fetchNewneek() {
  const emails = await fetchJson<Array<{
    subject?: unknown;
    previewText?: unknown;
    permanentLink?: unknown;
    sentTime?: unknown;
  }>>("https://page.stibee.com/archives/26847/emails");
  const email = emails[0];
  if (!email || typeof email.permanentLink !== "string") throw new Error("Newneek issue unavailable");
  return {
    ...FALLBACK_ITEMS.newneek,
    title: cleanText(email.subject).replace(/^\(광고\)\s*/u, "") || FALLBACK_ITEMS.newneek.title,
    summary: cleanText(email.previewText).replace(/#/g, " · ").replace(/^\s*·\s*|\s*·\s*$/g, "") || FALLBACK_ITEMS.newneek.summary,
    url: email.permanentLink,
    publishedAt: typeof email.sentTime === "string" ? new Date(email.sentTime).toISOString() : undefined,
  };
}

function compactDateToIso(value: string) {
  const year = Number(`20${value.slice(0, 2)}`);
  const month = Number(value.slice(2, 4));
  const day = Number(value.slice(4, 6));
  const date = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T08:00:00+09:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

async function fetchDailyByte(clientId?: string, clientSecret?: string) {
  if (!clientId || !clientSecret) return FALLBACK_ITEMS["daily-byte"];
  const endpoint = new URL("https://openapi.naver.com/v1/search/webkr.json");
  endpoint.searchParams.set("query", "site:mydailybyte.com/post/realtimenews 한눈에 보는 오늘의 뉴스");
  endpoint.searchParams.set("display", "100");
  const body = await fetchJson<{ items?: Array<{ title?: unknown; link?: unknown; description?: unknown }> }>(endpoint.toString(), {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });
  const candidates = (body.items ?? []).flatMap((item) => {
    if (typeof item.link !== "string") return [];
    const match = item.link.match(/^https:\/\/(?:www[.])?mydailybyte[.]com\/post\/realtimenews(\d{6})[a-z]?/i);
    return match ? [{ item, dateCode: match[1] }] : [];
  }).sort((a, b) => b.dateCode.localeCompare(a.dateCode));
  const latest = candidates[0];
  if (!latest || typeof latest.item.link !== "string") return FALLBACK_ITEMS["daily-byte"];
  return {
    ...FALLBACK_ITEMS["daily-byte"],
    title: cleanText(latest.item.title).replace(/\s*[/|]\s*데일리바이트.*$/u, "") || FALLBACK_ITEMS["daily-byte"].title,
    summary: cleanText(latest.item.description) || FALLBACK_ITEMS["daily-byte"].summary,
    url: latest.item.link,
    publishedAt: compactDateToIso(latest.dateCode),
  };
}

async function fetchNewsletterItems(clientId?: string, clientSecret?: string) {
  const results = await Promise.all([
    fetchDailyByte(clientId, clientSecret).catch(() => FALLBACK_ITEMS["daily-byte"]),
    fetchUppity("moneyletter", 137).catch(() => FALLBACK_ITEMS.moneyletter),
    fetchUppity("spendingletter", 140).catch(() => FALLBACK_ITEMS.spendingletter),
    fetchSoonsal().catch(() => FALLBACK_ITEMS.soonsal),
    fetchNewneek().catch(() => FALLBACK_ITEMS.newneek),
  ]);
  return results;
}

function isNewsletterPayload(value: unknown): value is NewsletterPayload {
  return Boolean(value && typeof value === "object" && (value as NewsletterPayload).provider === "official-newsletter-archives" && Array.isArray((value as NewsletterPayload).items));
}

export async function refreshNewsletterCache(clientId?: string, clientSecret?: string, force = false) {
  const bucket = kstRefreshBucket();
  if (!force && responseCache?.bucket === bucket) return responseCache.payload;

  const cacheKey = new Request(`${NEWSLETTER_CACHE_ORIGIN}/${bucket}`);
  if (!force) {
    try {
      const cached = await caches.default.match(cacheKey);
      if (cached) {
        const cachedPayload = await cached.json();
        if (isNewsletterPayload(cachedPayload)) {
          const payload = JSON.stringify(cachedPayload);
          responseCache = { bucket, payload };
          return payload;
        }
      }
    } catch {
      // Local preview environments may not expose the Workers Cache API.
    }
  }

  const items = await fetchNewsletterItems(clientId, clientSecret);
  const payload = JSON.stringify({
    provider: "official-newsletter-archives",
    items,
    refreshedAt: new Date().toISOString(),
    refreshBucket: bucket,
  } satisfies NewsletterPayload);
  responseCache = { bucket, payload };

  try {
    await caches.default.put(cacheKey, new Response(payload, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": `public, max-age=${secondsUntilNextWeekdayRefresh()}`,
      },
    }));
  } catch {
    // In-memory and HTTP caches still avoid repeated upstream requests locally.
  }
  return payload;
}

export async function handleNewslettersRequest(clientId?: string, clientSecret?: string) {
  const payload = await refreshNewsletterCache(clientId, clientSecret);
  return new Response(payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${secondsUntilNextWeekdayRefresh()}, stale-while-revalidate=3600`,
    },
  });
}
