import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../out/", import.meta.url);

test("exports the weather page as static HTML", async () => {
  const html = await readFile(new URL("index.html", outputRoot), "utf8");

  assert.match(html, /<html lang="ko">/i);
  assert.match(html, /<title>오늘의 날씨 — 최근 5개년도 날씨 비교<\/title>/i);
  assert.match(html, /id="comparison-dashboard"/i);
  assert.match(html, /\/today-weather-logo\.png/i);
  assert.match(html, /href="\/economy\/"/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("exports the economy news page with its primary sections", async () => {
  const html = await readFile(new URL("economy/index.html", outputRoot), "utf8");

  assert.match(html, /<title>경제 뉴스 — 국내 우선 글로벌 경제 브리핑<\/title>/i);
  assert.match(html, /id="market-heading"/i);
  assert.match(html, /주요 시장지표/i);
  assert.match(html, /S&amp;P 500/i);
  assert.match(html, /코스피/i);
  assert.match(html, /WTI/i);
  assert.match(html, /비트코인/i);
  assert.match(html, /id="topnews-heading"/i);
  assert.match(html, /경제 뉴스 탑뉴스/i);
  assert.match(html, /카테고리별 경제 뉴스/i);
  assert.match(html, /국내경제/i);
  assert.match(html, /증권·금융/i);
  assert.match(html, /산업·기업/i);
  assert.match(html, /부동산/i);
  assert.match(html, /글로벌/i);
  assert.match(html, /네이버 검색 뉴스 API/i);
  assert.match(html, /href="\/"/i);
  assert.doesNotMatch(html, /경제의 흐름을|다섯 가지 핵심 축|뉴스의 양보다 흐름/i);
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
