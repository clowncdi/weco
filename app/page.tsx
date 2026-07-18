"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type MonsoonZone = "central" | "southern" | "jeju";
type Region = { name: string; short: string; referenceArea: string; lat: number; lon: number; monsoonZone: MonsoonZone };
type MonsoonPeriod = { start: string; end?: string; provisional?: boolean };
type Daily = {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  sunshine_duration: number[];
  wind_speed_10m_max: number[];
  weather_code: number[];
};
type ForecastProvider = "history" | "kma-short" | "kma-mid" | "open-meteo" | "unavailable";
type WeatherKind = "sunny" | "cloudy" | "fog" | "rain" | "snow" | "showers" | "thunder" | "unavailable";
type KmaWarning = { title: string; area: string; issuedAt?: string; effectiveAt?: string };
type KmaCurrentConditions = { temperature?: number; humidity?: number; precipitation?: number; precipitationType?: number; weatherCode?: number; wind?: number; observedAt: string };
type KmaAirQuality = {
  pm10?: number;
  pm25?: number;
  observedAt?: string;
  station?: string;
  pm10Source: "kma" | "open-meteo";
  pm25Source: "open-meteo";
};
type HourlyForecast = {
  date: string;
  time: string;
  temperature?: number;
  precipitationProbability?: number;
  precipitation?: number;
  weatherCode?: number;
  provider: "kma-short" | "open-meteo";
};
type OpenMeteoHourly = {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
};
type YearWeather = {
  year: number;
  daily: Daily;
  source: "archive" | "current";
  provenance?: ForecastProvider[];
  kmaConnected?: boolean;
  warnings?: KmaWarning[];
  warningsConnected?: boolean;
  currentConditions?: KmaCurrentConditions;
  airQuality?: KmaAirQuality;
  hourlyForecast?: HourlyForecast[];
};
type HistoricalWeatherCacheEntry = { key: string; savedAt: number; data: YearWeather[] };
const CURRENT_WEATHER_REQUESTS = new Map<string, Promise<YearWeather>>();
const HISTORICAL_WEATHER_REQUESTS = new Map<string, Promise<YearWeather[]>>();
const WEATHER_API_BASE_URL = (process.env.NEXT_PUBLIC_WEATHER_API_BASE_URL ?? "").replace(/\/$/, "");
const HISTORICAL_WEATHER_STORAGE_KEY = "today-weather:historical:v1";
const HISTORICAL_WEATHER_STORAGE_TTL = 30 * 24 * 60 * 60 * 1000;
const HISTORICAL_WEATHER_STORAGE_LIMIT = 24;
type KmaDay = {
  date: string;
  high?: number;
  low?: number;
  precipitation?: number;
  weatherCode?: number;
  wind?: number;
  provider: "kma-short" | "kma-mid";
};

const REGIONS: Region[] = [
  { name: "서울특별시", short: "서울", referenceArea: "서울특별시 중구", lat: 37.5665, lon: 126.978, monsoonZone: "central" },
  { name: "부산광역시", short: "부산", referenceArea: "부산광역시 연제구", lat: 35.1796, lon: 129.0756, monsoonZone: "southern" },
  { name: "대구광역시", short: "대구", referenceArea: "대구광역시 중구", lat: 35.8714, lon: 128.6014, monsoonZone: "southern" },
  { name: "인천광역시", short: "인천", referenceArea: "인천광역시 남동구", lat: 37.4563, lon: 126.7052, monsoonZone: "central" },
  { name: "광주광역시", short: "광주", referenceArea: "광주광역시 서구", lat: 35.1595, lon: 126.8526, monsoonZone: "southern" },
  { name: "대전광역시", short: "대전", referenceArea: "대전광역시 서구", lat: 36.3504, lon: 127.3845, monsoonZone: "central" },
  { name: "울산광역시", short: "울산", referenceArea: "울산광역시 남구", lat: 35.5384, lon: 129.3114, monsoonZone: "southern" },
  { name: "세종특별자치시", short: "세종", referenceArea: "세종특별자치시 보람동", lat: 36.48, lon: 127.289, monsoonZone: "central" },
  { name: "경기도", short: "경기", referenceArea: "경기도 수원시 팔달구", lat: 37.2636, lon: 127.0286, monsoonZone: "central" },
  { name: "강원특별자치도", short: "강원", referenceArea: "강원특별자치도 춘천시", lat: 37.8813, lon: 127.7298, monsoonZone: "central" },
  { name: "충청북도", short: "충북", referenceArea: "충청북도 청주시 상당구", lat: 36.6357, lon: 127.4917, monsoonZone: "central" },
  { name: "충청남도", short: "충남", referenceArea: "충청남도 홍성군", lat: 36.6588, lon: 126.6728, monsoonZone: "central" },
  { name: "전북특별자치도", short: "전북", referenceArea: "전북특별자치도 전주시 완산구", lat: 35.8242, lon: 127.148, monsoonZone: "southern" },
  { name: "전라남도", short: "전남", referenceArea: "전라남도 무안군", lat: 34.8161, lon: 126.4629, monsoonZone: "southern" },
  { name: "경상북도", short: "경북", referenceArea: "경상북도 안동시", lat: 36.576, lon: 128.5056, monsoonZone: "southern" },
  { name: "경상남도", short: "경남", referenceArea: "경상남도 창원시 의창구", lat: 35.2383, lon: 128.6924, monsoonZone: "southern" },
  { name: "제주특별자치도", short: "제주", referenceArea: "제주특별자치도 제주시", lat: 33.4996, lon: 126.5312, monsoonZone: "jeju" },
];

const REGION_WEATHER_SCENES: Record<string, string> = {
  서울: "/weather-scenes/seoul.jpg",
  부산: "/weather-scenes/busan.jpg",
  대구: "/weather-scenes/daegu.jpg",
  인천: "/weather-scenes/incheon.jpg",
  광주: "/weather-scenes/gwangju.jpg",
  대전: "/weather-scenes/daejeon.jpg",
  울산: "/weather-scenes/ulsan.jpg",
  세종: "/weather-scenes/sejong.jpg",
  경기: "/weather-scenes/gyeonggi.jpg",
  강원: "/weather-scenes/gangwon.jpg",
  충북: "/weather-scenes/chungbuk.jpg",
  충남: "/weather-scenes/chungnam.jpg",
  전북: "/weather-scenes/jeonbuk.jpg",
  전남: "/weather-scenes/jeonnam.jpg",
  경북: "/weather-scenes/gyeongbuk.jpg",
  경남: "/weather-scenes/gyeongnam.jpg",
  제주: "/weather-scenes/jeju.jpg",
};

function weatherSceneForRegion(region: Region) {
  return REGION_WEATHER_SCENES[region.short] ?? REGION_WEATHER_SCENES.서울;
}

const YEAR_COLORS = ["#8a7e13", "#3f78a8", "#3f8378", "#71698f", "#404050"];
const CHART_PLOT_HEIGHT = 300;
const CHART_AXIS_HEIGHT = 32;
const LINE_CHART_WIDTH = 1120;
const LINE_CHART_HEIGHT = 360;
const LINE_CHART_LEFT = 48;
const LINE_CHART_RIGHT = 20;
const LINE_CHART_TOP = 18;
const LINE_CHART_BOTTOM = 42;
const HOURLY_FORECAST_ITEM_WIDTH = 108;
const HOURLY_FORECAST_CHART_HEIGHT = 76;
const HOURLY_FORECAST_CHART_TOP = 22;
const HOURLY_FORECAST_CHART_BOTTOM = 10;
const SEOUL_TIME_ZONE = "Asia/Seoul";
const KOREAN_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONSOON_ZONE_LABELS: Record<MonsoonZone, string> = { central: "중부지방", southern: "남부지방", jeju: "제주도" };
const MONSOON_PERIODS: Record<number, Record<MonsoonZone, MonsoonPeriod>> = {
  2026: {
    central: { start: "2026-07-01", provisional: true },
    southern: { start: "2026-06-30", provisional: true },
    jeju: { start: "2026-06-30", provisional: true },
  },
  2025: {
    central: { start: "2025-06-19", end: "2025-07-20" },
    southern: { start: "2025-06-19", end: "2025-07-01" },
    jeju: { start: "2025-06-12", end: "2025-06-26" },
  },
  2024: {
    central: { start: "2024-06-29", end: "2024-07-27" },
    southern: { start: "2024-06-22", end: "2024-07-27" },
    jeju: { start: "2024-06-19", end: "2024-07-27" },
  },
  2023: {
    central: { start: "2023-06-26", end: "2023-07-26" },
    southern: { start: "2023-06-25", end: "2023-07-26" },
    jeju: { start: "2023-06-25", end: "2023-07-25" },
  },
  2022: {
    central: { start: "2022-06-23", end: "2022-07-25" },
    southern: { start: "2022-06-23", end: "2022-07-25" },
    jeju: { start: "2022-06-21", end: "2022-07-24" },
  },
};

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const num = (value: number, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : "–";
const average = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

function isHistoricalWeatherData(value: unknown): value is YearWeather[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const weather = item as Partial<YearWeather>;
    const daily = weather.daily;
    return typeof weather.year === "number"
      && weather.source === "archive"
      && Boolean(daily)
      && Array.isArray(daily?.time)
      && Array.isArray(daily?.temperature_2m_max)
      && Array.isArray(daily?.temperature_2m_min)
      && Array.isArray(daily?.precipitation_sum)
      && Array.isArray(daily?.sunshine_duration)
      && Array.isArray(daily?.wind_speed_10m_max)
      && Array.isArray(daily?.weather_code);
  });
}

function readHistoricalWeatherCacheEntries() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORICAL_WEATHER_STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is HistoricalWeatherCacheEntry => {
      if (!item || typeof item !== "object") return false;
      const entry = item as Partial<HistoricalWeatherCacheEntry>;
      return typeof entry.key === "string"
        && typeof entry.savedAt === "number"
        && isHistoricalWeatherData(entry.data);
    });
  } catch {
    return [];
  }
}

function readStoredHistoricalWeather(key: string) {
  const entry = readHistoricalWeatherCacheEntries().find((item) => item.key === key);
  if (!entry || Date.now() - entry.savedAt >= HISTORICAL_WEATHER_STORAGE_TTL) return undefined;
  return entry.data;
}

function storeHistoricalWeather(key: string, data: YearWeather[]) {
  if (typeof window === "undefined") return;
  try {
    const now = Date.now();
    const entries = readHistoricalWeatherCacheEntries()
      .filter((item) => item.key !== key && now - item.savedAt < HISTORICAL_WEATHER_STORAGE_TTL);
    window.localStorage.setItem(HISTORICAL_WEATHER_STORAGE_KEY, JSON.stringify([
      { key, savedAt: now, data },
      ...entries,
    ].slice(0, HISTORICAL_WEATHER_STORAGE_LIMIT)));
  } catch {
    // Storage can be unavailable or full; network and in-memory caching still work.
  }
}

async function fetchWithRateLimitRetry(url: string) {
  const delays = [0, 700, 1500];
  let response: Response | undefined;
  for (const delay of delays) {
    if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
    response = await fetch(url);
    if (response.status !== 429) return response;
  }
  return response as Response;
}

function seoulToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day"), 12));
}

function seoulCurrentHour() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SEOUL_TIME_ZONE,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  return Number(parts.find((item) => item.type === "hour")?.value ?? 0);
}

function shiftedDate(year: number, month: number, day: number, offset: number) {
  const base = new Date(Date.UTC(year, month, day, 12));
  base.setUTCDate(base.getUTCDate() + offset);
  return base;
}

function monthDates(year: number, month: number) {
  const days = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  return Array.from({ length: days }, (_, index) => iso(new Date(Date.UTC(year, month, index + 1, 12))));
}

function alignDailyToDates(daily: Daily, dates: string[]): Daily {
  const pick = (values: number[]) => dates.map((date) => {
    const index = daily.time.indexOf(date);
    return index >= 0 ? values[index] : Number.NaN;
  });
  return {
    time: dates,
    temperature_2m_max: pick(daily.temperature_2m_max),
    temperature_2m_min: pick(daily.temperature_2m_min),
    precipitation_sum: pick(daily.precipitation_sum),
    sunshine_duration: pick(daily.sunshine_duration),
    wind_speed_10m_max: pick(daily.wind_speed_10m_max),
    weather_code: pick(daily.weather_code),
  };
}

function lineChartX(index: number, pointCount: number) {
  const plotWidth = LINE_CHART_WIDTH - LINE_CHART_LEFT - LINE_CHART_RIGHT;
  return LINE_CHART_LEFT + (pointCount <= 1 ? 0 : index / (pointCount - 1)) * plotWidth;
}

function lineChartY(value: number, min: number, max: number) {
  const plotHeight = LINE_CHART_HEIGHT - LINE_CHART_TOP - LINE_CHART_BOTTOM;
  return LINE_CHART_TOP + ((max - value) / Math.max(1, max - min)) * plotHeight;
}

function temperatureLinePath(values: number[], min: number, max: number, pointCount: number) {
  let drawing = false;
  return values.map((value, index) => {
    if (!Number.isFinite(value)) {
      drawing = false;
      return "";
    }
    const command = drawing ? "L" : "M";
    drawing = true;
    return `${command}${lineChartX(index, pointCount).toFixed(2)},${lineChartY(value, min, max).toFixed(2)}`;
  }).filter(Boolean).join(" ");
}

function hourlyTemperatureY(value: number, min: number, max: number) {
  const plotHeight = HOURLY_FORECAST_CHART_HEIGHT - HOURLY_FORECAST_CHART_TOP - HOURLY_FORECAST_CHART_BOTTOM;
  return HOURLY_FORECAST_CHART_TOP + ((max - value) / Math.max(1, max - min)) * plotHeight;
}

function hourlyTemperaturePath(values: number[], min: number, max: number) {
  let previous: { x: number; y: number } | null = null;
  return values.map((value, index) => {
    if (!Number.isFinite(value)) {
      previous = null;
      return "";
    }
    const x = index * HOURLY_FORECAST_ITEM_WIDTH + HOURLY_FORECAST_ITEM_WIDTH / 2;
    const y = hourlyTemperatureY(value, min, max);
    if (!previous) {
      previous = { x, y };
      return `M${x},${y.toFixed(2)}`;
    }
    const controlOffset = (x - previous.x) * 0.42;
    const segment = `C${(previous.x + controlOffset).toFixed(2)},${previous.y.toFixed(2)} ${(x - controlOffset).toFixed(2)},${y.toFixed(2)} ${x},${y.toFixed(2)}`;
    previous = { x, y };
    return segment;
  }).filter(Boolean).join(" ");
}

function condition(code: number): { kind: WeatherKind; label: string } {
  if (!Number.isFinite(code)) return { kind: "unavailable", label: "예보 대기" };
  if (code === 0) return { kind: "sunny", label: "맑음" };
  if (code <= 3) return { kind: "cloudy", label: "구름" };
  if (code <= 48) return { kind: "fog", label: "안개" };
  if (code <= 67) return { kind: "rain", label: "비" };
  if (code <= 77) return { kind: "snow", label: "눈" };
  if (code <= 82) return { kind: "showers", label: "소나기" };
  return { kind: "thunder", label: "뇌우" };
}

function WeatherIcon({ kind }: { kind: WeatherKind }) {
  const cloud = <path d="M6.5 17.5h10.7a4 4 0 0 0 .5-8 5.8 5.8 0 0 0-11.1-1.1 4.6 4.6 0 0 0-.1 9.1Z" />;

  return (
    <svg className={`condition-icon condition-icon-${kind}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === "sunny" && <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></>}
      {kind === "cloudy" && cloud}
      {kind === "fog" && <><path d="M7 14h9.8a3.5 3.5 0 0 0 .4-7 5.1 5.1 0 0 0-9.7-.9A4 4 0 0 0 7 14Z" /><path d="M4 18h13M7 21h12" /></>}
      {kind === "rain" && <>{cloud}<path d="m8 20-1 2M12.5 20l-1 2M17 20l-1 2" /></>}
      {kind === "snow" && <>{cloud}<path d="M8 20v3M6.7 20.8l2.6 1.4M9.3 20.8l-2.6 1.4M16 20v3M14.7 20.8l2.6 1.4M17.3 20.8l-2.6 1.4" /></>}
      {kind === "showers" && <><circle cx="7" cy="7" r="2.5" /><path d="M7 2.5v1M2.5 7h1M3.8 3.8l.7.7" />{cloud}<path d="m10 20-1 2M15 20l-1 2" /></>}
      {kind === "thunder" && <>{cloud}<path d="m13.5 18.8-2.5 3.3h2.6l-1.1 2.4 4-4.6h-2.8l1.1-1.1" /></>}
      {kind === "unavailable" && <path d="M5 12h14" />}
    </svg>
  );
}

function formatKoreanDate(date: Date) {
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일 (${KOREAN_WEEKDAYS[date.getUTCDay()]})`;
}

function formatMonthDay(date: Date) {
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일`;
}

function weekdayFromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return KOREAN_WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

function formatIsoMonthDay(value: string) {
  const [, month, day] = value.split("-").map(Number);
  return `${month}월 ${day}일 (${weekdayFromIso(value)})`;
}

function formatChartDate(value: string) {
  const [, month, day] = value.split("-").map(Number);
  return `${month}.${day}(${weekdayFromIso(value)})`;
}

function formatMonsoonDate(value: string) {
  const [, month, day] = value.split("-").map(Number);
  return `${month}월 ${day}일`;
}

function inclusiveDays(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00+09:00`);
  const endDate = new Date(`${end}T00:00:00+09:00`);
  return Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
}

function temperatureDifferenceLabel(difference: number, date: Date) {
  if (Math.abs(difference) <= 0.4) return "어제와 비슷해요";
  const isSpringOrSummer = date.getUTCMonth() >= 2 && date.getUTCMonth() <= 7;
  const expression = difference > 0
    ? isSpringOrSummer ? "더워요" : "따뜻해요"
    : isSpringOrSummer ? "시원해요" : "추워요";
  return `어제보다 ${num(Math.abs(difference))}° ${expression}`;
}

function feelsLikeTemperature(temperature: number | undefined, humidity: number | undefined, windKmh: number | undefined, date: Date) {
  if (temperature === undefined || !Number.isFinite(temperature)) return Number.NaN;
  const month = date.getUTCMonth() + 1;

  if (month >= 5 && month <= 9) {
    if (humidity === undefined || !Number.isFinite(humidity)) return Number.NaN;
    const relativeHumidity = Math.min(100, Math.max(0, humidity));
    const wetBulb = temperature * Math.atan(0.151977 * Math.sqrt(relativeHumidity + 8.313659))
      + Math.atan(temperature + relativeHumidity)
      - Math.atan(relativeHumidity - 1.67633)
      + 0.00391838 * relativeHumidity ** 1.5 * Math.atan(0.023101 * relativeHumidity)
      - 4.686035;
    return -0.2442 + 0.55399 * wetBulb + 0.45535 * temperature - 0.0022 * wetBulb ** 2 + 0.00278 * wetBulb * temperature + 3;
  }

  if (temperature > 10 || windKmh === undefined || !Number.isFinite(windKmh) || windKmh < 4.68) return temperature;
  const windFactor = windKmh ** 0.16;
  return 13.12 + 0.6215 * temperature - 11.37 * windFactor + 0.3965 * windFactor * temperature;
}

function formatKmaTimestamp(value?: string) {
  const match = value?.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  return match ? `${Number(match[2])}월 ${Number(match[3])}일 ${match[4]}:${match[5]}` : "";
}

function formatObservationTime(value?: string) {
  const compact = value?.match(/^\d{8}(\d{2})(\d{2})$/);
  if (compact) return `${compact[1]}:${compact[2]}`;
  const isoTime = value?.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/);
  return isoTime ? `${isoTime[1]}:${isoTime[2]}` : "";
}

function formatHourlyTime(value: string) {
  return `${Number(value.slice(0, 2))}시`;
}

function dustGrade(value: number | undefined, kind: "pm10" | "pm25") {
  if (value === undefined || !Number.isFinite(value)) return { label: "자료 대기", className: "unavailable" };
  const thresholds = kind === "pm10" ? [30, 80, 150] : [15, 35, 75];
  if (value <= thresholds[0]) return { label: "좋음", className: "good" };
  if (value <= thresholds[1]) return { label: "보통", className: "normal" };
  if (value <= thresholds[2]) return { label: "나쁨", className: "bad" };
  return { label: "매우 나쁨", className: "very-bad" };
}

async function fetchArchiveYear(region: Region, year: number, month: number): Promise<YearWeather> {
  const dates = monthDates(year, month);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const shared = {
    latitude: String(region.lat),
    longitude: String(region.lon),
    start_date: start,
    end_date: end,
    timezone: "Asia/Seoul",
  };
  const landParams = new URLSearchParams({
    ...shared,
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunshine_duration,wind_speed_10m_max",
    models: "era5_land",
  });
  const rainParams = new URLSearchParams({
    ...shared,
    daily: "precipitation_sum",
    models: "era5",
  });
  const [landResponse, rainResponse] = await Promise.all([
    fetchWithRateLimitRetry(`https://archive-api.open-meteo.com/v1/archive?${landParams}`),
    fetchWithRateLimitRetry(`https://archive-api.open-meteo.com/v1/archive?${rainParams}`),
  ]);
  if (!landResponse.ok || !rainResponse.ok) throw new Error("과거 날씨 데이터를 불러오지 못했습니다.");
  const land = await landResponse.json() as { daily?: Omit<Daily, "precipitation_sum"> };
  const rain = await rainResponse.json() as { daily?: Pick<Daily, "time" | "precipitation_sum"> };
  if (!land.daily || !rain.daily) throw new Error("과거 날씨 데이터 형식이 올바르지 않습니다.");
  const precipitation = land.daily.time.map((date) => {
    const index = rain.daily?.time.indexOf(date) ?? -1;
    return index >= 0 ? rain.daily?.precipitation_sum[index] ?? Number.NaN : Number.NaN;
  });
  return { year, daily: { ...land.daily, precipitation_sum: precipitation }, source: "archive" };
}

async function fetchCurrentYear(region: Region, regionIndex: number, year: number, month: number): Promise<YearWeather> {
  const now = seoulToday();
  const dates = monthDates(year, month);
  const forecastDays = Math.min(16, dates.length - now.getUTCDate() + 1);
  const params = new URLSearchParams({
    latitude: String(region.lat),
    longitude: String(region.lon),
    past_days: String(Math.max(0, now.getUTCDate() - 1)),
    forecast_days: String(Math.max(1, forecastDays)),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration,wind_speed_10m_max",
    hourly: "temperature_2m,weather_code,precipitation_probability,precipitation",
    timezone: "Asia/Seoul",
  });
  const [response, kmaResponse] = await Promise.all([
    fetchWithRateLimitRetry(`https://api.open-meteo.com/v1/forecast?${params}`),
    fetch(`${WEATHER_API_BASE_URL}/api/kma?region=${regionIndex}`).catch(() => null),
  ]);
  if (!response.ok) throw new Error("현재 날씨와 예보를 불러오지 못했습니다.");
  const json = await response.json() as { daily?: Daily; hourly?: OpenMeteoHourly };
  if (!json.daily) throw new Error("예보 데이터 형식이 올바르지 않습니다.");
  const kma = kmaResponse?.ok ? await kmaResponse.json() as { days?: KmaDay[]; hourly?: HourlyForecast[]; warnings?: KmaWarning[]; warningsConnected?: boolean; currentConditions?: KmaCurrentConditions; airQuality?: KmaAirQuality } : null;
  const daily = alignDailyToDates(json.daily, dates);
  const today = iso(now);
  const tomorrow = iso(shiftedDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 1));
  const currentHour = seoulCurrentHour();
  const fallbackHourly = (json.hourly?.time ?? []).map((value, index) => ({
    date: value.slice(0, 10),
    time: value.slice(11, 16),
    temperature: json.hourly?.temperature_2m[index],
    precipitationProbability: json.hourly?.precipitation_probability[index],
    precipitation: json.hourly?.precipitation[index],
    weatherCode: json.hourly?.weather_code[index],
    provider: "open-meteo" as const,
  })).filter((item) => item.date === tomorrow || (item.date === today && Number(item.time.slice(0, 2)) >= currentHour));
  const kmaHourly = (kma?.hourly ?? []).filter((item) => item.date === tomorrow || (item.date === today && Number(item.time.slice(0, 2)) >= currentHour));
  const hourlyForecast = kmaHourly.length ? kmaHourly : fallbackHourly;
  const provenance: ForecastProvider[] = daily.time.map((date) => {
    if (date < today) return "history";
    return json.daily?.time.includes(date) ? "open-meteo" : "unavailable";
  });
  for (const day of kma?.days ?? []) {
    const index = daily.time.indexOf(day.date);
    if (index < 0 || day.date < today) continue;
    if (day.high !== undefined) daily.temperature_2m_max[index] = day.high;
    if (day.low !== undefined) daily.temperature_2m_min[index] = day.low;
    if (day.precipitation !== undefined) daily.precipitation_sum[index] = day.precipitation;
    if (day.weatherCode !== undefined) daily.weather_code[index] = day.weatherCode;
    if (day.wind !== undefined) daily.wind_speed_10m_max[index] = day.wind;
    provenance[index] = day.provider;
  }
  return {
    year,
    daily,
    source: "current",
    provenance,
    kmaConnected: Boolean(kma?.days?.length),
    warnings: kma?.warnings ?? [],
    warningsConnected: Boolean(kma?.warningsConnected),
    currentConditions: kma?.currentConditions,
    airQuality: kma?.airQuality,
    hourlyForecast,
  };
}

function fetchCurrentWeather(region: Region, regionIndex: number, today: Date) {
  const key = `${regionIndex}-${iso(today)}`;
  const cached = CURRENT_WEATHER_REQUESTS.get(key);
  if (cached) return cached;

  const request = fetchCurrentYear(region, regionIndex, today.getUTCFullYear(), today.getUTCMonth());
  CURRENT_WEATHER_REQUESTS.set(key, request);
  void request.catch(() => {
    if (CURRENT_WEATHER_REQUESTS.get(key) === request) CURRENT_WEATHER_REQUESTS.delete(key);
  });
  return request;
}

function fetchHistoricalWeather(region: Region, regionIndex: number, years: number[], today: Date) {
  const key = `${regionIndex}-${today.getUTCFullYear()}-${today.getUTCMonth()}`;
  const cached = HISTORICAL_WEATHER_REQUESTS.get(key);
  if (cached) return cached;

  const stored = readStoredHistoricalWeather(key);
  if (stored) {
    const request = Promise.resolve(stored);
    HISTORICAL_WEATHER_REQUESTS.set(key, request);
    return request;
  }

  const request = (async () => {
    const data: YearWeather[] = [];
    for (const year of years) {
      if (year !== today.getUTCFullYear()) data.push(await fetchArchiveYear(region, year, today.getUTCMonth()));
    }
    return data;
  })();
  HISTORICAL_WEATHER_REQUESTS.set(key, request);
  void request.then((data) => storeHistoricalWeather(key, data));
  void request.catch(() => {
    if (HISTORICAL_WEATHER_REQUESTS.get(key) === request) HISTORICAL_WEATHER_REQUESTS.delete(key);
  });
  return request;
}

function providerLabel(provider?: ForecastProvider, isToday = false) {
  if (provider === "kma-short") return isToday ? "오늘 · 기상청 단기" : "기상청 단기";
  if (provider === "kma-mid") return "기상청 중기";
  if (provider === "open-meteo") return "보조 예보";
  if (provider === "unavailable") return "예보 대기";
  return isToday ? "오늘" : "최근 기록";
}

function YearDot({ index }: { index: number }) {
  return <span className="year-dot" style={{ backgroundColor: YEAR_COLORS[index] }} aria-hidden="true" />;
}

export default function Home() {
  const [regionIndex, setRegionIndex] = useState(0);
  const [weather, setWeather] = useState<YearWeather[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyRequested, setHistoryRequested] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const dashboardRef = useRef<HTMLElement>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const referenceRowRef = useRef<HTMLTableRowElement>(null);

  const today = useMemo(() => seoulToday(), []);
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => today.getUTCFullYear() - i), [today]);
  const region = REGIONS[regionIndex];
  const rangeStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 12));
  const rangeEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 12));
  const monthDayCount = rangeEnd.getUTCDate();
  const monthStartOffset = 1 - today.getUTCDate();
  const monthEndOffset = monthDayCount - today.getUTCDate();
  const referenceIndex = today.getUTCDate() - 1;
  const comparisonIndex = referenceIndex + selectedDayOffset;
  const comparisonDate = shiftedDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), selectedDayOffset);
  const monthLabel = `${today.getUTCMonth() + 1}월`;
  const requestHistory = useCallback(() => {
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryRequested(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentWeather(region, regionIndex, today)
      .then((data) => {
        if (cancelled) return;
        setWeather((current) => [data, ...current.filter((item) => item.year !== data.year)].sort((a, b) => b.year - a.year));
        setSelectedYear((current) => current && years.includes(current) ? current : years[0]);
      })
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [region, regionIndex, today, years]);

  useEffect(() => {
    if (historyRequested) return;
    const dashboard = dashboardRef.current;
    if (!dashboard || !("IntersectionObserver" in window)) {
      const timeoutId = window.setTimeout(requestHistory, 0);
      return () => window.clearTimeout(timeoutId);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      requestHistory();
      observer.disconnect();
    }, { rootMargin: "1000px 0px" });
    observer.observe(dashboard);
    return () => observer.disconnect();
  }, [historyRequested, requestHistory]);

  useEffect(() => {
    if (historyRequested || loading || error) return;

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(requestHistory, { timeout: 1500 });
    } else {
      timeoutId = setTimeout(requestHistory, 800);
    }

    return () => {
      if (idleId !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [historyRequested, loading, error, requestHistory]);

  useEffect(() => {
    if (!historyRequested) return;
    let cancelled = false;
    fetchHistoricalWeather(region, regionIndex, years, today)
      .then((data) => {
        if (cancelled) return;
        setWeather((current) => [...current.filter((item) => item.year === today.getUTCFullYear()), ...data].sort((a, b) => b.year - a.year));
      })
      .catch((err: Error) => !cancelled && setHistoryError(err.message))
      .finally(() => !cancelled && setHistoryLoading(false));
    return () => { cancelled = true; };
  }, [historyRequested, region, regionIndex, today, years]);

  const summaries = weather.map(({ year, daily }) => {
    const highs = daily.temperature_2m_max.filter(Number.isFinite);
    const lows = daily.temperature_2m_min.filter(Number.isFinite);
    const rain = daily.precipitation_sum.filter(Number.isFinite);
    return {
      year,
      high: average(highs),
      low: average(lows),
      rain: rain.length ? sum(rain) : Number.NaN,
      wetDays: rain.length ? rain.filter((value) => value >= 1).length : Number.NaN,
      temperatureAvailableDays: Math.min(highs.length, lows.length),
      rainAvailableDays: rain.length,
      availableDays: Math.min(highs.length, lows.length, rain.length),
      totalDays: daily.time.length,
    };
  });

  const completeSummaries = summaries.filter((item) => item.availableDays === item.totalDays);
  const completeTemperatureSummaries = summaries.filter((item) => item.temperatureAvailableDays === item.totalDays);
  const completeRainSummaries = summaries.filter((item) => item.rainAvailableDays === item.totalDays);
  const temperatureRankable = completeTemperatureSummaries.length ? completeTemperatureSummaries : summaries.filter((item) => Number.isFinite(item.high));
  const rainRankable = completeRainSummaries.length ? completeRainSummaries : summaries.filter((item) => Number.isFinite(item.rain));
  const warmest = temperatureRankable.length ? temperatureRankable.reduce((a, b) => a.high > b.high ? a : b) : null;
  const wettest = rainRankable.length ? rainRankable.reduce((a, b) => a.rain > b.rain ? a : b) : null;
  const hasHistoricalRain = summaries.some((item) => item.year !== today.getUTCFullYear() && item.rainAvailableDays > 0);
  const comparisonRangeLabel = `${formatMonthDay(rangeStart)}–${formatMonthDay(rangeEnd)}`;
  const active = weather.find((item) => item.year === selectedYear) ?? weather[0];
  const lineChartDayCount = Math.max(monthDayCount, ...weather.map((item) => item.daily.time.length));
  const lineChartValues = weather.flatMap((item) => [...item.daily.temperature_2m_max, ...item.daily.temperature_2m_min]).filter(Number.isFinite);
  const lineChartMin = lineChartValues.length ? Math.floor((Math.min(...lineChartValues) - 2) / 5) * 5 : 0;
  const lineChartMax = lineChartValues.length ? Math.max(lineChartMin + 5, Math.ceil((Math.max(...lineChartValues) + 2) / 5) * 5) : 5;
  const lineChartTicks = Array.from({ length: Math.floor((lineChartMax - lineChartMin) / 5) + 1 }, (_, index) => lineChartMin + index * 5);
  const lineChartSeries = weather.map((item, index) => ({ item, index })).sort((a, b) => Number(a.item.year === active?.year) - Number(b.item.year === active?.year));
  const comparisonReady = years.every((year) => weather.some((item) => item.year === year));
  const currentWeather = weather.find((item) => item.year === today.getUTCFullYear());
  const currentWarnings = currentWeather?.warnings ?? [];
  const currentDayIndex = currentWeather?.daily.time.indexOf(iso(today)) ?? -1;
  const rawHourlyForecast = currentWeather?.hourlyForecast ?? [];
  const firstTodayForecast = rawHourlyForecast.find((hour) => hour.date === iso(today));
  const currentConditionCode = currentWeather?.currentConditions?.weatherCode
    ?? firstTodayForecast?.weatherCode
    ?? (currentWeather && currentDayIndex >= 0 ? currentWeather.daily.weather_code[currentDayIndex] : Number.NaN);
  const currentDayCondition = currentWeather && currentDayIndex >= 0 ? condition(currentConditionCode) : null;
  const currentTemperatureDifference = currentWeather && currentDayIndex > 0
    ? currentWeather.daily.temperature_2m_max[currentDayIndex] - currentWeather.daily.temperature_2m_max[currentDayIndex - 1]
    : Number.NaN;
  const currentTemperatureTrend = currentTemperatureDifference > 0.4 ? "warmer" : currentTemperatureDifference < -0.4 ? "cooler" : "similar";
  const currentFeelsLike = feelsLikeTemperature(
    currentWeather?.currentConditions?.temperature,
    currentWeather?.currentConditions?.humidity,
    currentWeather?.currentConditions?.wind,
    today,
  );
  const pm10Grade = dustGrade(currentWeather?.airQuality?.pm10, "pm10");
  const pm25Grade = dustGrade(currentWeather?.airQuality?.pm25, "pm25");
  const weatherObservedAt = formatObservationTime(currentWeather?.currentConditions?.observedAt);
  const airQualityObservedAt = formatObservationTime(currentWeather?.airQuality?.observedAt);
  const observationLabel = weatherObservedAt && airQualityObservedAt
    ? weatherObservedAt === airQualityObservedAt ? `관측 ${weatherObservedAt}` : `기상 ${weatherObservedAt} · 대기질 ${airQualityObservedAt}`
    : weatherObservedAt ? `기상 ${weatherObservedAt}` : airQualityObservedAt ? `대기질 ${airQualityObservedAt}` : "관측 시각 대기";
  const hourlyForecast = rawHourlyForecast.map((hour, index) => index === 0 && hour.date === iso(today) && currentWeather?.currentConditions?.weatherCode !== undefined
    ? { ...hour, weatherCode: currentWeather.currentConditions.weatherCode }
    : hour);
  const hourlyProvider = hourlyForecast[0]?.provider;
  const tomorrowDate = iso(shiftedDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 1));
  const hourlyForecastDays = [
    { date: iso(today), label: "오늘" },
    { date: tomorrowDate, label: "내일" },
  ];
  const hourlyTemperatures = hourlyForecast.map((hour) => hour.temperature ?? Number.NaN);
  const finiteHourlyTemperatures = hourlyTemperatures.filter(Number.isFinite);
  const hourlyTemperatureMin = finiteHourlyTemperatures.length ? Math.floor(Math.min(...finiteHourlyTemperatures) - 1) : 0;
  const hourlyTemperatureMax = finiteHourlyTemperatures.length ? Math.ceil(Math.max(...finiteHourlyTemperatures) + 1) : 1;
  const hourlyForecastChartWidth = Math.max(HOURLY_FORECAST_ITEM_WIDTH, hourlyForecast.length * HOURLY_FORECAST_ITEM_WIDTH);
  const weatherScene = weatherSceneForRegion(region);
  const heroWeatherKind = currentDayCondition?.kind ?? "cloudy";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const container = detailScrollRef.current;
      const row = referenceRowRef.current;
      if (!container || !row) return;
      const containerRect = container.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const rowTop = container.scrollTop + rowRect.top - containerRect.top;
      container.scrollTop = Math.max(0, rowTop - (container.clientHeight - rowRect.height) / 2);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active]);

  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/#top" aria-label="오늘의 날씨와 경제 홈">
          <img className="brand-logo" src="/today-weather-logo.png" alt="" />
          <span>오늘의 날씨와 경제</span>
        </Link>
        <div className="topbar-tools">
          <nav className="primary-nav" aria-label="주요 메뉴">
            <Link className="active" href="/" aria-current="page">날씨</Link>
            <Link href="/economy/">경제뉴스</Link>
          </nav>
          <div className="as-of"><span className="live-dot" /> 기준일 {iso(today)} ({KOREAN_WEEKDAYS[today.getUTCDay()]})</div>
        </div>
      </header>

      <section className="region-switcher" id="top" aria-labelledby="region-heading">
        <h2 id="region-heading">지역 선택</h2>
        <div className="region-chip-scroll">
          {REGIONS.map((item, index) => <button type="button" key={item.name} className={index === regionIndex ? "active" : ""} aria-label={item.name} aria-pressed={index === regionIndex} onClick={() => {
            if (index === regionIndex) return;
            setHistoryRequested(false);
            setHistoryLoading(false);
            setHistoryError("");
            setLoading(true);
            setError("");
            setWeather([]);
            setRegionIndex(index);
          }}>{item.short}</button>)}
        </div>
      </section>

      <section className={`weather-hero weather-${heroWeatherKind}`} style={{ backgroundImage: `url(${weatherScene})` }} aria-live="polite">
        <div className="weather-hero-content">
          <div className="weather-hero-meta">
            <div>
              <p className="weather-kicker">CURRENT WEATHER</p>
              <h1>{region.name}</h1>
              <p className="weather-location-basis">날씨 기준 · {region.referenceArea}<span>· {observationLabel}</span></p>
            </div>
            <div className="weather-date-pill"><strong>{formatKoreanDate(today)}</strong><span>{currentWeather?.kmaConnected ? "기상청 관측·예보" : "보조 예보"}</span></div>
          </div>

          {loading && <div className="weather-hero-loading"><span className="loader" /><strong>{region.short}의 현재 날씨를 불러오는 중입니다.</strong></div>}
          {!loading && currentWeather && currentDayIndex >= 0 && currentDayCondition && <>
            <div className="weather-now-layout">
              <div className="weather-now-primary">
                <div className="weather-now-condition"><WeatherIcon kind={currentDayCondition.kind} /><strong>{currentDayCondition.label}</strong></div>
                <div className="weather-now-reading">
                  <strong>{num(currentWeather.currentConditions?.temperature ?? Number.NaN)}°</strong>
                  <div className="weather-now-reading-meta">
                    <span>현재 기온</span>
                    <span className="weather-feels-like" title="기상청 산식으로 현재 관측 기온·습도·풍속을 이용해 계산한 값">체감 <b>{num(currentFeelsLike)}°</b></span>
                  </div>
                </div>
                <div className="weather-now-extremes"><span>최고 <b>{num(currentWeather.daily.temperature_2m_max[currentDayIndex])}°</b></span><span>최저 <b>{num(currentWeather.daily.temperature_2m_min[currentDayIndex])}°</b></span></div>
                {Number.isFinite(currentTemperatureDifference) && <p className={`weather-now-trend ${currentTemperatureTrend}`}>{temperatureDifferenceLabel(currentTemperatureDifference, today)} <small>· 낮 최고 기준</small></p>}
              </div>

              <div className="weather-metric-grid">
                <article><small>현재 습도</small><strong>{num(currentWeather.currentConditions?.humidity ?? Number.NaN, 0)}%</strong><span>공기 중 수분</span></article>
                <article><small>예상 강수량</small><strong>{num(currentWeather.daily.precipitation_sum[currentDayIndex])}<em>mm</em></strong><span>오늘 누적 예보</span></article>
                <article><small>최대 풍속</small><strong>{num(currentWeather.daily.wind_speed_10m_max[currentDayIndex])}<em>km/h</em></strong><span>오늘 예상 최대</span></article>
                <article className="weather-air-card" aria-label="현재 대기질">
                  <div className="air-quality-pair">
                    <div className="air-quality-item"><small>미세먼지 <em>PM10</em></small><div className="air-quality-reading"><strong className={pm10Grade.className}>{pm10Grade.label}</strong><span>{num(currentWeather.airQuality?.pm10 ?? Number.NaN, 0)} <em>㎍/㎥</em></span></div></div>
                    <div className="air-quality-item"><small>초미세먼지 <em>PM2.5</em></small><div className="air-quality-reading"><strong className={pm25Grade.className}>{pm25Grade.label}</strong><span>{num(currentWeather.airQuality?.pm25 ?? Number.NaN, 0)} <em>㎍/㎥</em></span></div></div>
                  </div>
                </article>
              </div>
            </div>

            <section className="hero-hourly" aria-labelledby="hourly-forecast-heading">
              <div className="hero-hourly-head"><div><small>TODAY &amp; TOMORROW</small><h2 id="hourly-forecast-heading">오늘부터 내일까지</h2></div><span>{hourlyProvider ? providerLabel(hourlyProvider) : "예보 준비 중"}</span></div>
              {hourlyForecast.length > 0 ? <div className="hourly-forecast-scroll">
                <div className="hourly-forecast-track" style={{ width: `${hourlyForecastChartWidth}px` }}>
                  <div className="hourly-day-markers">
                    {hourlyForecast.map((hour, index) => {
                      if (index > 0 && hourlyForecast[index - 1].date === hour.date) return null;
                      const day = hourlyForecastDays.find((item) => item.date === hour.date);
                      return <span key={hour.date} style={{ left: `${index * HOURLY_FORECAST_ITEM_WIDTH + 12}px` }}><strong>{day?.label ?? "예보"}</strong><small>{formatIsoMonthDay(hour.date)}</small></span>;
                    })}
                  </div>
                  <svg className="hourly-temperature-chart" width={hourlyForecastChartWidth} height={HOURLY_FORECAST_CHART_HEIGHT} viewBox={`0 0 ${hourlyForecastChartWidth} ${HOURLY_FORECAST_CHART_HEIGHT}`} role="img" aria-labelledby="hourly-temperature-title hourly-temperature-description">
                    <title id="hourly-temperature-title">오늘과 내일 시간별 기온 선그래프</title>
                    <desc id="hourly-temperature-description">각 시간의 기온 숫자 아래에 점과 연결선을 표시하고, 같은 열 아래에 날씨 아이콘과 시간을 배치합니다.</desc>
                    <path className="hourly-temperature-line" d={hourlyTemperaturePath(hourlyTemperatures, hourlyTemperatureMin, hourlyTemperatureMax)} />
                    {hourlyForecast.map((hour, index) => {
                      if (!Number.isFinite(hour.temperature)) return null;
                      const x = index * HOURLY_FORECAST_ITEM_WIDTH + HOURLY_FORECAST_ITEM_WIDTH / 2;
                      const y = hourlyTemperatureY(hour.temperature as number, hourlyTemperatureMin, hourlyTemperatureMax);
                      return <g key={`${hour.date}-${hour.time}`}><text className="hourly-temperature-label" x={x} y={y - 9} textAnchor="middle">{num(hour.temperature as number, 0)}°</text><circle className="hourly-temperature-point" cx={x} cy={y} r="3"><title>{formatHourlyTime(hour.time)} {num(hour.temperature as number, 0)}도</title></circle></g>;
                    })}
                  </svg>
                  <ol className="hourly-forecast-list">
                    {hourlyForecast.map((hour) => {
                      const state = condition(hour.weatherCode ?? Number.NaN);
                      const day = hourlyForecastDays.find((item) => item.date === hour.date);
                      return <li key={`${hour.date}-${hour.time}`} aria-label={`${day?.label ?? ""} ${formatHourlyTime(hour.time)} ${num(hour.temperature ?? Number.NaN, 0)}도 ${state.label}`}><WeatherIcon kind={state.kind} /><time dateTime={`${hour.date}T${hour.time}`}>{formatHourlyTime(hour.time)}</time></li>;
                    })}
                  </ol>
                </div>
              </div> : <div className="hourly-forecast-status empty">오늘·내일 시간대별 예보를 준비하지 못했어요.</div>}
            </section>
          </>}
          {!loading && (!currentWeather || currentDayIndex < 0) && <div className="weather-hero-loading error"><strong>현재 날씨를 준비하지 못했어요.</strong><span>지역을 다시 선택해 주세요.</span></div>}
        </div>
      </section>

      <section className="dashboard" id="comparison-dashboard" ref={dashboardRef} aria-live="polite">
        <div className="dashboard-head">
          <div><span className="section-num">02</span><p>{region.name} · 최근 5개년도</p></div>
          <h2>같은 때, 다른 날씨</h2>
          <div className={`forecast-note ${currentWeather?.kmaConnected ? "connected" : "fallback"}`}>
            <span aria-hidden="true" />
            <div><strong>{currentWeather?.kmaConnected ? "기상청 예보 연결" : "보조 예보 사용 중"}</strong><small>{currentWeather?.kmaConnected ? "현재 기상청 우선" : "현재 Open-Meteo 보조"} · 과거 기온 ERA5-Land / 강수 ERA5</small></div>
          </div>
        </div>

        {!historyRequested && !error && <div className="status-card deferred"><strong>비교 자료를 미리 준비하고 있습니다.</strong><span>현재 날씨를 먼저 불러온 뒤 과거 자료를 이어서 준비해요.</span></div>}
        {historyRequested && (loading || historyLoading) && !error && !historyError && <div className="status-card"><span className="loader" /> 최근 5개년도 날씨를 불러오는 중입니다.</div>}
        {(error || historyError) && <div className="status-card error"><strong>데이터를 불러오지 못했어요.</strong><span>{error || historyError} 잠시 후 지역을 다시 선택해 주세요.</span></div>}

        {comparisonReady && !error && !historyError && (
          <>
            <section className="date-comparison" id="today-comparison" aria-labelledby="date-comparison-heading">
              <div className="date-comparison-head">
                <div>
                  <small>{selectedDayOffset === 0 ? "오늘을 기준으로" : selectedDayOffset < 0 ? `${Math.abs(selectedDayOffset)}일 전` : `${selectedDayOffset}일 후`}</small>
                  <h3 id="date-comparison-heading">{formatKoreanDate(comparisonDate)} 연도별 비교</h3>
                </div>
                <div className="date-controls" aria-label="비교 날짜 이동">
                  <button type="button" onClick={() => setSelectedDayOffset((offset) => Math.max(monthStartOffset, offset - 1))} disabled={selectedDayOffset === monthStartOffset} aria-label="이전 날짜">← 이전</button>
                  <button type="button" className={selectedDayOffset === 0 ? "active" : ""} onClick={() => setSelectedDayOffset(0)}>오늘</button>
                  <button type="button" onClick={() => setSelectedDayOffset((offset) => Math.min(monthEndOffset, offset + 1))} disabled={selectedDayOffset === monthEndOffset} aria-label="다음 날짜">다음 →</button>
                </div>
              </div>
              <div className="date-comparison-grid">
                {weather.map((item, index) => {
                  const isCurrentYear = item.year === today.getUTCFullYear();
                  return (
                    <button type="button" className={selectedYear === item.year ? "selected" : ""} key={item.year} onClick={() => setSelectedYear(item.year)}>
                      <div className="comparison-year"><span><YearDot index={index} />{item.year}</span>{isCurrentYear && <small>{providerLabel(item.provenance?.[comparisonIndex], selectedDayOffset === 0)}</small>}</div>
                      <div className={`comparison-temperature ${hasHistoricalRain ? "" : "temperature-only"}`}>
                        <div className="high"><small>최고</small><b>{num(item.daily.temperature_2m_max[comparisonIndex])}°</b></div>
                        <div className="low"><small>최저</small><b>{num(item.daily.temperature_2m_min[comparisonIndex])}°</b></div>
                        {hasHistoricalRain && <div className="rain"><small>강수</small><b>{num(item.daily.precipitation_sum[comparisonIndex])}<em>mm</em></b></div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {currentWeather?.warningsConnected && <section className={`weather-alerts ${currentWarnings.length ? "active" : "clear"}`} aria-label="기상특보 현황">
              <div className="weather-alerts-heading">
                <span className="alert-status-dot" aria-hidden="true" />
                <div><small>KMA WEATHER ALERT</small><strong>{currentWarnings.length ? `${region.short} 지역 기상특보 ${currentWarnings.length}건` : `${region.short} 지역 발효 특보 없음`}</strong></div>
              </div>
              {currentWarnings.length ? <div className="weather-alert-list">
                {currentWarnings.map((warning) => {
                  const effectiveAt = formatKmaTimestamp(warning.effectiveAt ?? warning.issuedAt);
                  return <article key={`${warning.title}-${warning.area}`}><strong>{warning.title}</strong><span>{warning.area}</span><small>{effectiveAt ? `${effectiveAt} 발효` : "현재 발효 중"}</small></article>;
                })}
              </div> : <p>현재 선택 지역에 발효 중인 기상특보가 없습니다.</p>}
            </section>}

            <div className={`insight-row ${hasHistoricalRain ? "" : "no-rain"}`}>
              {hasHistoricalRain && warmest && wettest && <><article className="insight-card coral">
                <small>{monthLabel} 월평균 최고기온이 가장 높은 해</small>
                <strong>{num(warmest.high)}<em>°C</em></strong>
                <span>{warmest.year}년 · 월 전체 자료</span>
                <p>{comparisonRangeLabel}의 일 최고기온 평균</p>
              </article>
              <article className="insight-card blue">
                <small>{monthLabel} 누적 강수량이 가장 많은 해</small>
                <strong>{num(wettest.rain)}<em>mm</em></strong>
                <span>{wettest.year}년 · 월 전체 자료</span>
                <p>{comparisonRangeLabel}에 내린 강수량의 합</p>
              </article></>}
              <article className="insight-note">
                <div><small>날짜 기준</small><strong>{comparisonRangeLabel} · 총 {monthDayCount}일</strong></div>
                <ul>
                  <li>평균 최고·최저: {monthLabel} 일별 기온의 평균</li>
                  {hasHistoricalRain && <li>누적 강수: {monthLabel} ERA5 강수량의 합</li>}
                  {hasHistoricalRain && <li>비 온 날: 하루 1 mm 이상인 날 수</li>}
                  {completeSummaries.length < summaries.length && <li>월말 예보 대기일이 있는 올해는 순위에서 제외</li>}
                </ul>
              </article>
            </div>

            <div className="year-cards">
              {summaries.map((item, index) => (
                <button key={item.year} onClick={() => setSelectedYear(item.year)} className={selectedYear === item.year ? "selected" : ""}>
                  <div className="year-card-top"><span><YearDot index={index} />{item.year}{item.year === today.getUTCFullYear() && <em className="forecast-badge">자료 {item.availableDays}/{item.totalDays}일</em>}</span></div>
                  <div className="year-card-highlight"><small>{monthLabel} 평균 최고</small><b>{num(item.high)}°C</b></div>
                  <div className="temp-range"><i style={{ left: `${Math.max(3, Math.min(75, (item.low + 15) * 2.2))}%`, width: `${Math.max(18, (item.high - item.low) * 2.2)}%`, backgroundColor: YEAR_COLORS[index] }} /></div>
                  <dl><div><dt>{monthLabel} 평균 최저</dt><dd>{num(item.low)}°</dd></div>{hasHistoricalRain && <div><dt>{monthLabel} 누적 강수</dt><dd>{num(item.rain)} <small>mm</small></dd></div>}{hasHistoricalRain && <div><dt>1 mm 이상 강수일</dt><dd>{Number.isFinite(item.wetDays) ? item.wetDays : "–"} <small>일</small></dd></div>}</dl>
                </button>
              ))}
            </div>

            <section className="monsoon-section" aria-labelledby="monsoon-heading">
              <div className="monsoon-head">
                <div><small>KMA RAINY SEASON</small><h3 id="monsoon-heading">연도별 장마 시작·종료</h3></div>
                <div className="monsoon-zone"><strong>{region.short} · {MONSOON_ZONE_LABELS[region.monsoonZone]} 기준</strong><span>기상청 공식 3개 장마 권역 중 선택 지역이 속한 권역</span></div>
              </div>
              <div className="monsoon-grid">
                {years.map((year, index) => {
                  const period = MONSOON_PERIODS[year]?.[region.monsoonZone];
                  if (!period) return null;
                  const elapsedEnd = period.end ?? iso(today);
                  const days = inclusiveDays(period.start, elapsedEnd);
                  return <article key={year} className={period.provisional ? "ongoing" : ""}>
                    <div className="monsoon-year"><span><YearDot index={index} />{year}</span><small>{period.provisional ? `${days}일째` : `총 ${days}일`}</small></div>
                    <div className="monsoon-dates">
                      <div><small>시작</small><strong>{formatMonsoonDate(period.start)}</strong></div>
                      <i aria-hidden="true" />
                      <div><small>종료</small><strong>{period.end ? formatMonsoonDate(period.end) : "미확정"}</strong></div>
                    </div>
                  </article>;
                })}
              </div>
              <p className="monsoon-note">장마 시작·종료일은 개별 시·도의 비가 온 첫날·마지막 날이 아니라 기상청이 사후 분석한 권역 대표값입니다. {today.getUTCFullYear()}년은 종료일이 발표되지 않아 진행 일수만 함께 표시하며, 9월 초 최종 분석에서 달라질 수 있습니다.</p>
            </section>

            <div className="range-chart">
              <div className="chart-title"><div><small>일별 기온 범위</small><h3>낮 최고와 아침 최저, 그리고 일교차</h3></div><div className="legend"><span><i className="max-dot" />최고</span><span><i className="min-dot" />최저</span><span className="gap-legend">숫자 = 일교차</span></div></div>
              <div className="chart-scroll">
                <div className="chart-grid" style={{ gridTemplateColumns: `repeat(${active?.daily.time.length ?? monthDayCount}, 1fr)` }}>
                  {[30, 20, 10, 0].map((tick) => <span key={tick} className="tick" style={{ bottom: `${CHART_AXIS_HEIGHT + ((tick + 10) / 50) * CHART_PLOT_HEIGHT}px` }}>{tick}°</span>)}
                  {active?.daily.time.map((date, index) => {
                    const high = active.daily.temperature_2m_max[index];
                    const low = active.daily.temperature_2m_min[index];
                    const isForecast = active.year === today.getUTCFullYear() && date >= iso(today);
                    if (!Number.isFinite(high) || !Number.isFinite(low)) return <div className={`day-range unavailable-day ${isForecast ? "forecast-day" : ""} ${index === comparisonIndex ? "comparison-day" : ""}`} key={date}><small>{index % 4 === 0 || index === comparisonIndex ? formatChartDate(date) : ""}</small></div>;
                    const bottom = ((low + 10) / 50) * 100;
                    const height = ((high - low) / 50) * 100;
                    return <div className={`day-range ${isForecast ? "forecast-day" : ""} ${index === comparisonIndex ? "comparison-day" : ""}`} key={date}><i style={{ bottom: `${bottom}%`, height: `${Math.max(height, 2)}%` }}><span className="temperature-gap">{num(high - low)}°</span><b /><em /></i><small>{index % 4 === 0 || index === comparisonIndex ? formatChartDate(date) : ""}</small></div>;
                  })}
                </div>
              </div>
            </div>

            <section className="five-year-line-chart" aria-labelledby="five-year-line-heading">
              <div className="line-chart-head">
                <div><small>일별 상세 데이터 · 올해 예보 포함</small><h3 id="five-year-line-heading">5개년도 최고·최저 기온 흐름</h3></div>
                <div className="line-chart-metric-legend" aria-label="기온 선 구분"><span><i className="high" />진한 실선 최고</span><span><i className="low" />연한 점선 최저</span></div>
              </div>
              <div className="line-chart-year-legend" aria-label="강조할 연도 선택">
                {weather.map((item, index) => <button type="button" key={item.year} className={item.year === active?.year ? "active" : ""} aria-pressed={item.year === active?.year} onClick={() => setSelectedYear(item.year)}><i style={{ backgroundColor: YEAR_COLORS[index] }} aria-hidden="true" />{item.year}</button>)}
              </div>
              <div className="line-chart-scroll">
                <svg className="temperature-line-chart" viewBox={`0 0 ${LINE_CHART_WIDTH} ${LINE_CHART_HEIGHT}`} role="img" aria-labelledby="five-year-line-svg-title five-year-line-svg-desc">
                  <title id="five-year-line-svg-title">최근 5개년도 일별 최고·최저 기온 선그래프</title>
                  <desc id="five-year-line-svg-desc">연도별로 서로 다른 색을 사용하며 같은 연도의 최고기온은 진한 실선, 최저기온은 연한 점선으로 표시합니다. 선택한 연도의 두 선은 더 굵고 진하게 강조됩니다.</desc>
                  <g className="line-chart-grid">
                    {lineChartTicks.map((tick) => {
                      const y = lineChartY(tick, lineChartMin, lineChartMax);
                      return <g key={tick}><line x1={LINE_CHART_LEFT} y1={y} x2={LINE_CHART_WIDTH - LINE_CHART_RIGHT} y2={y} /><text x={LINE_CHART_LEFT - 9} y={y + 4} textAnchor="end">{tick}°</text></g>;
                    })}
                    <line className="line-chart-axis" x1={LINE_CHART_LEFT} y1={LINE_CHART_HEIGHT - LINE_CHART_BOTTOM} x2={LINE_CHART_WIDTH - LINE_CHART_RIGHT} y2={LINE_CHART_HEIGHT - LINE_CHART_BOTTOM} />
                    {Array.from({ length: lineChartDayCount }, (_, index) => {
                      if (index % 5 !== 0 && index !== lineChartDayCount - 1) return null;
                      const x = lineChartX(index, lineChartDayCount);
                      return <g key={index}><line className="line-chart-date-tick" x1={x} y1={LINE_CHART_HEIGHT - LINE_CHART_BOTTOM} x2={x} y2={LINE_CHART_HEIGHT - LINE_CHART_BOTTOM + 5} /><text x={x} y={LINE_CHART_HEIGHT - 14} textAnchor="middle">{today.getUTCMonth() + 1}.{index + 1}</text></g>;
                    })}
                  </g>
                  {lineChartSeries.map(({ item, index }) => {
                    const activeLine = item.year === active?.year ? "active" : "";
                    return <g key={item.year}>
                      <path className={`temperature-line high ${activeLine}`} d={temperatureLinePath(item.daily.temperature_2m_max, lineChartMin, lineChartMax, lineChartDayCount)} style={{ stroke: YEAR_COLORS[index] }} vectorEffect="non-scaling-stroke" />
                      <path className={`temperature-line low ${activeLine}`} d={temperatureLinePath(item.daily.temperature_2m_min, lineChartMin, lineChartMax, lineChartDayCount)} style={{ stroke: YEAR_COLORS[index] }} vectorEffect="non-scaling-stroke" />
                    </g>;
                  })}
                </svg>
              </div>
            </section>

            <div className="detail-panel">
              <div className="detail-head"><div><span className="section-num">03</span><p>날짜별 상세 {active?.year === today.getUTCFullYear() && <em className="forecast-key">빗금 영역은 예보</em>}</p></div><div className="year-tabs" role="tablist" aria-label="상세 연도 선택">{years.map((year, index) => <button key={year} role="tab" aria-selected={selectedYear === year} onClick={() => setSelectedYear(year)}><YearDot index={index} />{year}{year === today.getUTCFullYear() && <em>기상청 우선</em>}</button>)}</div></div>
              <div className="table-wrap" ref={detailScrollRef}>
                <table>
                  <thead><tr><th>날짜</th><th>날씨</th><th>최고 / 최저</th><th>강수량</th><th>일조</th><th>최대 풍속</th></tr></thead>
                  <tbody>{active?.daily.time.map((date, index) => {
                    const state = condition(active.daily.weather_code[index]);
                    const isCurrentYear = active.year === today.getUTCFullYear();
                    const isToday = isCurrentYear && date === iso(today);
                    const isReferenceDay = index === referenceIndex;
                    const isForecast = isCurrentYear && date >= iso(today);
                    const provider = active.provenance?.[index];
                    return <tr ref={isReferenceDay ? referenceRowRef : undefined} key={date} className={`${isReferenceDay ? "center-day" : ""} ${isForecast ? "forecast-row" : ""} ${index === comparisonIndex ? "selected-date-row" : ""}`}>
                      <td><strong>{formatIsoMonthDay(date)}</strong>{isCurrentYear ? <small className={provider === "open-meteo" ? "forecast-label fallback-label" : provider === "unavailable" ? "forecast-label pending-label" : isForecast ? "forecast-label" : "history-label"}>{providerLabel(provider, isToday)}</small> : isReferenceDay ? <small>기준일</small> : index === comparisonIndex ? <small>비교일</small> : null}</td>
                      <td><span className="condition-cell"><WeatherIcon kind={state.kind} /><span>{state.label}</span></span></td>
                      <td><b>{num(active.daily.temperature_2m_max[index])}°</b> <span>/ {num(active.daily.temperature_2m_min[index])}°</span></td>
                      <td>{num(active.daily.precipitation_sum[index])} mm</td>
                      <td>{num(active.daily.sunshine_duration[index] / 3600)} h</td>
                      <td>{num(active.daily.wind_speed_10m_max[index])} km/h</td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      <footer><div className="brand"><img className="brand-logo" src="/today-weather-logo.png" alt="" /><span>오늘의 날씨와 경제</span></div><p>데이터: 기상청 API허브·기후특성 분석 · Open-Meteo Weather & Air Quality API(CAMS)<br />배경 사진: Wikimedia Commons 공개 라이선스 이미지<br />재분석 자료와 예보·보조 대기질은 관측값과 차이가 있을 수 있습니다.</p><div className="footer-links"><a href="/weather-scenes/credits.txt" target="_blank" rel="noreferrer">사진 출처</a><a href="#top">맨 위로 ↑</a></div></footer>
    </main>
  );
}
