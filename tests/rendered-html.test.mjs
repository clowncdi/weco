import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { toKmaGrid } from "../worker/kma-grid.js";

const outputRoot = new URL("../out/", import.meta.url);

test("converts current coordinates to the KMA village forecast grid", () => {
  assert.deepEqual(toKmaGrid(37.5665, 126.978), { nx: 60, ny: 127 });
  assert.deepEqual(toKmaGrid(35.1796, 129.0756), { nx: 98, ny: 76 });
  assert.throws(() => toKmaGrid(Number.NaN, 126.978), /finite numbers/);
});

test("exports the weather page as static HTML", async () => {
  const html = await readFile(new URL("index.html", outputRoot), "utf8");

  assert.match(html, /<html lang="ko">/i);
  assert.match(html, /<title>오늘의 날씨와 경제 — 최근 5개년도 날씨 비교<\/title>/i);
  assert.match(html, /오늘의 날씨와 경제/i);
  assert.match(html, /현재 위치 확인 중/i);
  assert.match(html, /id="comparison-dashboard"/i);
  assert.match(html, /\/today-weather-logo\.png/i);
  assert.match(html, /href="\/economy\/"/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("exports the economy news page with its primary sections", async () => {
  const html = await readFile(new URL("economy/index.html", outputRoot), "utf8");

  assert.match(html, /<title>경제 뉴스 — 오늘의 날씨와 경제<\/title>/i);
  assert.match(html, /id="market-heading"/i);
  assert.match(html, /주요 시장지표/i);
  assert.match(html, /S&amp;P 500/i);
  assert.match(html, /코스피/i);
  assert.match(html, /VIX/i);
  assert.match(html, /WTI/i);
  assert.match(html, /비트코인/i);
  assert.match(html, /economy-market-sparkline/i);
  assert.match(html, /economy-market-period/i);
  assert.match(html, /S&amp;P 500 최근 1년 봉차트 보기/i);
  assert.match(html, /economy-market-card-button/i);
  assert.match(html, /지수 그래프 · 최근 7일 추이/i);
  assert.equal((html.match(/지수 그래프 · 최근 7일 추이/g) ?? []).length, 1);
  assert.match(html, /id="newsletter-heading"/i);
  assert.match(html, /추천 뉴스레터/i);
  assert.match(html, /경제 흐름을 이해하는 데 도움이 되는 뉴스레터의 가장 최근 발행호를 추천합니다/i);
  assert.match(html, /평일 오전 8시 갱신/i);
  assert.match(html, /id="topnews-heading"/i);
  assert.match(html, /주요 뉴스/i);
  assert.match(html, /aria-label="주요 뉴스 지역"/i);
  assert.match(html, /주요 뉴스와 관련 뉴스 선정 기준 보기/i);
  assert.match(html, /기사 미리보기/i);
  assert.match(html, /카테고리별 경제 뉴스/i);
  assert.match(html, /최신 뉴스는 비슷한 이슈의 반복을 건너뛴 뒤 발행 시각 내림차순/i);
  assert.match(html, /같은 출처와 비슷한 주제의 반복 노출/i);
  assert.match(html, /이미 사용한 기사는 다음 영역에서 제외/i);
  assert.match(html, /국내경제/i);
  assert.match(html, /증권·금융/i);
  assert.match(html, /산업·기업/i);
  assert.match(html, /부동산/i);
  assert.match(html, /글로벌/i);
  assert.match(html, /네이버 검색 뉴스 API/i);
  assert.match(html, /href="\/"/i);
  assert.doesNotMatch(html, /경제의 흐름을|다섯 가지 핵심 축|뉴스의 양보다 흐름/i);
});

test("routes and refreshes the latest newsletter issues on weekday mornings", async () => {
  const [apiSource, workerSource, newsletterSource, workerConfig] = await Promise.all([
    readFile(new URL("../worker/api.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/newsletters.ts", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.api.jsonc", import.meta.url), "utf8"),
  ]);

  assert.match(apiSource, /\/api\/newsletters/);
  assert.match(workerSource, /\/api\/newsletters/);
  assert.match(apiSource, /refreshNewsletterCache/);
  assert.match(workerSource, /scheduled\(controller, env, ctx\)/);
  assert.match(workerConfig, /"0 23 \* \* SUN-THU"/);
  assert.match(newsletterSource, /mydailybyte[.]com/);
  assert.match(newsletterSource, /uppity[.]co[.]kr/);
  assert.match(newsletterSource, /soonsal[.]com/);
  assert.match(newsletterSource, /page[.]stibee[.]com/);
  for (const newsletter of ["daily-byte", "moneyletter", "spendingletter", "soonsal", "newneek"]) {
    assert.match(newsletterSource, new RegExp(newsletter));
  }
});

test("routes and caches one-year market candle history in the Worker", async () => {
  const [apiSource, workerSource, marketSource, economySource] = await Promise.all([
    readFile(new URL("../worker/api.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/markets.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/economy/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(apiSource, /\/api\/market-history/);
  assert.match(workerSource, /\/api\/market-history/);
  assert.match(marketSource, /fetchMarketHistory\(definition, "1y"\)/);
  assert.match(marketSource, /fetchMarketHistory\(definition, "5d"\)/);
  assert.match(marketSource, /nextDailyHistoryRefresh/);
  assert.match(marketSource, /MARKET_ACTIVE_CANDLE_CACHE_TTL/);
  assert.match(economySource, /economy-candlestick-tooltip/);
  assert.match(economySource, /onPointerMove/);
  assert.match(economySource, /ArrowLeft/);
});

test("includes the GitHub Pages root files and primary assets", async () => {
  await Promise.all([
    access(new URL(".nojekyll", outputRoot)),
    access(new URL("CNAME", outputRoot)),
    access(new URL("today-weather-logo.png", outputRoot)),
    access(new URL("og-today-weather.jpg", outputRoot)),
    access(new URL("weather-scenes/seoul.jpg", outputRoot)),
  ]);
});
