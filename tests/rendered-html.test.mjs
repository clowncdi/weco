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

test("builds a rolling 30-day weather view with vertical desktop columns and mobile scrolling", async () => {
  const [weatherSource, styles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(weatherSource, /Array[.]from[(]\{ length: 30 \}/);
  assert.match(weatherSource, /rollingComparisonDates[(]today, year[)]/);
  assert.match(weatherSource, /rolling-30-/);
  assert.match(weatherSource, /past_days: "14"/);
  assert.match(weatherSource, /forecast_days: "16"/);
  assert.match(weatherSource, /comparisonStartOffset = -14/);
  assert.match(weatherSource, /comparisonEndOffset = 15/);
  assert.match(weatherSource, /comparisonDayCount = 30/);
  assert.match(weatherSource, /referenceIndex = 14/);
  assert.match(weatherSource, /rollingDaily/);
  assert.match(weatherSource, />30일 날씨</);
  assert.match(weatherSource, /data-today=/);
  assert.match(weatherSource, /grid[.]scrollTop = todayRow[.]offsetTop/);
  assert.match(weatherSource, /aria-label="오늘과 내일 시간별 예보"/);
  assert.doesNotMatch(weatherSource, /TODAY &amp; TOMORROW|오늘부터 내일까지|hero-hourly-head/);
  assert.match(styles, /grid-template-rows:repeat[(]10,minmax[(]59px,auto[)][)]/);
  assert.match(styles, /grid-auto-flow:column/);
  assert.match(styles, /max-height:560px/);
  assert.match(styles, /overflow-y:auto/);
  assert.match(styles, /[.]date-comparison-grid \{ grid-template-columns:minmax[(]0,1fr[)]; \}/);
  assert.match(styles, /[.]date-comparison-grid>button:last-child \{ border-bottom:0; \}/);
  assert.match(styles, /[.]monthly-detail-date>small \{ display:none; \}/);
  assert.match(styles, /[.]monthly-detail-date strong,\s*[.]monthly-detail-date time \{ line-height:1[.]1; \}/);
  assert.match(styles, /min-height:850px/);
  assert.match(styles, /min-height:860px/);
  assert.doesNotMatch(weatherSource, /monthly-detail-focus/);
  assert.match(weatherSource, /className="weather-location-detail"/);
  assert.match(weatherSource, /className="weather-observation-label"/);
  assert.match(weatherSource, /className="monthly-detail-weekday"/);
  assert.match(weatherSource, /30일 평균 최고기온이 가장 높은 해/);
  assert.match(weatherSource, /30일 누적 강수량이 가장 많은 해/);
  assert.match(weatherSource, /completeHistoricalRainSummaries/);
  assert.match(weatherSource, /item[.]year !== currentYear/);
  assert.match(weatherSource, /올해 관측 \+ 예보 강수량/);
  assert.match(weatherSource, /완료된 과거 연도끼리 비교/);
  assert.match(weatherSource, /과거 14일 기록 \+ 오늘·향후 15일 예보/);
  assert.match(weatherSource, /관측\+예보 강수/);
  assert.doesNotMatch(weatherSource, /월 전체 자료|월말 예보/);
  assert.match(styles, /[.]weather-location-detail,\s*[.]weather-location-separator \{ display:none; \}/);
  assert.match(styles, /[.]weather-date-pill>span \{ display:none; \}/);
  assert.match(styles, /flex:0 0 auto/);
  assert.match(styles, /min-width:max-content/);
  assert.doesNotMatch(styles, /inset 3px 0 0 var[(]--teal[)]/);
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
