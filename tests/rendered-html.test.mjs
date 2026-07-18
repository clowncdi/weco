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
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
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
