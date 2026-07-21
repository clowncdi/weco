import { toKmaGrid } from "./kma-grid.js";

type RegionConfig = {
  nx: number;
  ny: number;
  lat: number;
  lon: number;
  temperatureRegion: string;
  landRegion: string;
};

type KmaItem = {
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
};

type KmaObservationItem = {
  baseDate: string;
  baseTime: string;
  category: string;
  obsrValue: string;
};

type ForecastDay = {
  date: string;
  high?: number;
  low?: number;
  precipitation?: number;
  weatherCode?: number;
  wind?: number;
  provider: "kma-short" | "kma-mid";
};

type HourlyForecast = {
  date: string;
  time: string;
  temperature?: number;
  precipitationProbability?: number;
  precipitation?: number;
  weatherCode?: number;
  sky?: string;
  precipitationType?: string;
  provider: "kma-short";
};

type WarningStatus = {
  title: string;
  area: string;
  issuedAt?: string;
  effectiveAt?: string;
};

type CurrentConditions = {
  temperature?: number;
  humidity?: number;
  precipitation?: number;
  precipitationType?: number;
  weatherCode?: number;
  wind?: number;
  observedAt: string;
};

type AirQuality = {
  pm10?: number;
  pm25?: number;
  observedAt?: string;
  station?: string;
  pm10Source: "kma" | "open-meteo";
  pm25Source: "open-meteo";
};

const REGIONS: RegionConfig[] = [
  { nx: 60, ny: 127, lat: 37.5665, lon: 126.978, temperatureRegion: "11B10101", landRegion: "11B00000" },
  { nx: 98, ny: 76, lat: 35.1796, lon: 129.0756, temperatureRegion: "11H20201", landRegion: "11H20000" },
  { nx: 89, ny: 90, lat: 35.8714, lon: 128.6014, temperatureRegion: "11H10701", landRegion: "11H10000" },
  { nx: 55, ny: 124, lat: 37.4563, lon: 126.7052, temperatureRegion: "11B20201", landRegion: "11B00000" },
  { nx: 58, ny: 74, lat: 35.1595, lon: 126.8526, temperatureRegion: "11F20501", landRegion: "11F20000" },
  { nx: 67, ny: 100, lat: 36.3504, lon: 127.3845, temperatureRegion: "11C20401", landRegion: "11C20000" },
  { nx: 102, ny: 84, lat: 35.5384, lon: 129.3114, temperatureRegion: "11H20101", landRegion: "11H20000" },
  { nx: 66, ny: 103, lat: 36.48, lon: 127.289, temperatureRegion: "11C20404", landRegion: "11C20000" },
  { nx: 60, ny: 121, lat: 37.2636, lon: 127.0286, temperatureRegion: "11B20601", landRegion: "11B00000" },
  { nx: 73, ny: 134, lat: 37.8813, lon: 127.7298, temperatureRegion: "11D10301", landRegion: "11D10000" },
  { nx: 69, ny: 107, lat: 36.6357, lon: 127.4917, temperatureRegion: "11C10301", landRegion: "11C10000" },
  { nx: 55, ny: 106, lat: 36.6588, lon: 126.6728, temperatureRegion: "11C20101", landRegion: "11C20000" },
  { nx: 63, ny: 89, lat: 35.8242, lon: 127.148, temperatureRegion: "11F10201", landRegion: "11F10000" },
  { nx: 51, ny: 67, lat: 34.8161, lon: 126.4629, temperatureRegion: "21F20801", landRegion: "11F20000" },
  { nx: 91, ny: 106, lat: 36.576, lon: 128.5056, temperatureRegion: "11H10501", landRegion: "11H10000" },
  { nx: 90, ny: 77, lat: 35.2383, lon: 128.6924, temperatureRegion: "11H20301", landRegion: "11H20000" },
  { nx: 52, ny: 38, lat: 33.4996, lon: 126.5312, temperatureRegion: "11G00201", landRegion: "11G00000" },
];

const WARNING_REGION_NAMES = [
  ["서울"], ["부산"], ["대구"], ["인천"], ["광주"], ["대전"], ["울산"], ["세종"], ["경기"],
  ["강원"], ["충청북", "충북"], ["충청남", "충남"], ["전북", "전라북"], ["전라남", "전남"],
  ["경상북", "경북"], ["경상남", "경남"], ["제주"],
];

const WARNING_NAMES: Record<string, string> = {
  W: "강풍", R: "호우", C: "한파", D: "건조", O: "폭풍해일", N: "지진해일", V: "풍랑",
  T: "태풍", S: "대설", Y: "황사", H: "폭염", F: "안개", K: "열대야",
};

type TimedRequest = { expiresAt: number; request: Promise<unknown> };
const EXTERNAL_REQUEST_CACHE = new Map<string, TimedRequest>();

function cachedRequest<T>(key: string, ttlMs: number, load: () => Promise<T>) {
  const now = Date.now();
  for (const [cachedKey, entry] of EXTERNAL_REQUEST_CACHE) {
    if (entry.expiresAt <= now) EXTERNAL_REQUEST_CACHE.delete(cachedKey);
  }
  const cached = EXTERNAL_REQUEST_CACHE.get(key);
  if (cached) return cached.request as Promise<T>;

  const request = load();
  EXTERNAL_REQUEST_CACHE.set(key, { expiresAt: now + ttlMs, request });
  void request.catch(() => {
    const current = EXTERNAL_REQUEST_CACHE.get(key);
    if (current?.request === request) EXTERNAL_REQUEST_CACHE.delete(key);
  });
  return request;
}

const pad = (value: number) => String(value).padStart(2, "0");
const compactDate = (date: Date) => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
const isoDate = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

function kstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

function latestShortIssue() {
  const now = kstNow();
  now.setUTCMinutes(now.getUTCMinutes() - 20);
  const cycles = [2, 5, 8, 11, 14, 17, 20, 23];
  const hour = now.getUTCHours();
  const selected = [...cycles].reverse().find((cycle) => cycle <= hour);
  if (selected === undefined) {
    now.setUTCDate(now.getUTCDate() - 1);
    return { date: compactDate(now), time: "2300" };
  }
  return { date: compactDate(now), time: `${pad(selected)}00` };
}

function latestMidIssue() {
  const now = kstNow();
  now.setUTCMinutes(now.getUTCMinutes() - 20);
  const hour = now.getUTCHours();
  if (hour >= 18) return `${compactDate(now)}1800`;
  if (hour >= 6) return `${compactDate(now)}0600`;
  now.setUTCDate(now.getUTCDate() - 1);
  return `${compactDate(now)}1800`;
}

function latestObservationIssue() {
  const now = kstNow();
  now.setUTCMinutes(now.getUTCMinutes() - 45);
  return { date: compactDate(now), time: `${pad(now.getUTCHours())}00` };
}

function addDays(date: Date, offset: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + offset);
  return result;
}

function parseNumber(value: unknown) {
  const parsed = Number.parseFloat(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parsePrecipitation(value: string) {
  if (!value || value.includes("없음")) return 0;
  if (value.includes("미만")) return 0.5;
  const numbers = value.match(/[0-9.]+/g)?.map(Number).filter(Number.isFinite) ?? [];
  if (numbers.length >= 2) return (numbers[0] + numbers[1]) / 2;
  return numbers[0];
}

function weatherCodeFromKma(sky?: string, precipitationType?: string) {
  const type = Number(precipitationType ?? 0);
  if ([1, 4, 5, 6].includes(type)) return 61;
  if ([2, 3, 7].includes(type)) return 71;
  if (sky === "4") return 3;
  if (sky === "3") return 2;
  return 0;
}

function weatherCodeFromText(value: string) {
  if (value.includes("눈")) return 71;
  if (value.includes("비") || value.includes("소나기")) return 61;
  if (value.includes("흐림")) return 3;
  if (value.includes("구름")) return 2;
  return 0;
}

function responseItems(payload: unknown) {
  const body = (payload as { response?: { body?: { items?: { item?: unknown } } } })?.response?.body;
  const items = body?.items?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

async function fetchKma(path: string, params: Record<string, string>, apiKey: string) {
  const search = new URLSearchParams({ ...params, authKey: apiKey });
  const response = await fetch(`https://apihub.kma.go.kr/api/typ02/openApi/${path}?${search}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("KMA request failed");
  const payload = await response.json() as { response?: { header?: { resultCode?: string } } };
  if (payload.response?.header?.resultCode && payload.response.header.resultCode !== "00") {
    throw new Error("KMA response failed");
  }
  return responseItems(payload);
}

function fetchKmaCached(path: string, params: Record<string, string>, apiKey: string) {
  const normalizedParams = new URLSearchParams(Object.entries(params).sort(([a], [b]) => a.localeCompare(b))).toString();
  return cachedRequest(`kma-json:${path}:${normalizedParams}`, 30 * 60_000, () => fetchKma(path, params, apiKey));
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

function dataTokens(line: string) {
  return (line.includes(",") ? splitCsvLine(line) : line.trim().split(/\s+/))
    .map((value) => value.replace(/^['"]|['"]$/g, ""));
}

async function fetchKmaTextFile(path: string, params: Record<string, string>, apiKey: string) {
  const search = new URLSearchParams({ ...params, authKey: apiKey });
  const response = await fetch(`https://apihub.kma.go.kr/api/typ01/url/${path}?${search}`);
  if (!response.ok) throw new Error("KMA text request failed");
  const payload = await response.text();
  if (!payload || /인증|ERROR|Error/.test(payload.slice(0, 300))) throw new Error("KMA text response failed");
  return payload;
}

function compactMinute(date: Date) {
  return `${compactDate(date)}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}`;
}

function distanceSquared(lat1: number, lon1: number, lat2: number, lon2: number) {
  const latitudeScale = Math.cos(((lat1 + lat2) / 2) * Math.PI / 180);
  return (lat1 - lat2) ** 2 + ((lon1 - lon2) * latitudeScale) ** 2;
}

function parseDustStations(payload: string) {
  const stations: { id: string; name?: string; lat: number; lon: number }[] = [];
  for (const line of payload.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const values = dataTokens(trimmed);
    const coordinateIndex = values.findIndex((value, index) => {
      const lon = Number(value);
      const lat = Number(values[index + 1]);
      return lon >= 120 && lon <= 140 && lat >= 30 && lat <= 40;
    });
    if (coordinateIndex < 0) continue;
    const id = values.slice(0, coordinateIndex).find((value) => /^\d{1,4}$/.test(value));
    if (!id) continue;
    stations.push({
      id,
      name: values.slice(0, coordinateIndex).find((value) => /[가-힣]/.test(value)),
      lon: Number(values[coordinateIndex]),
      lat: Number(values[coordinateIndex + 1]),
    });
  }
  return stations;
}

function parsePm10Observations(payload: string) {
  const observations: { time: string; stationId: string; value: number }[] = [];
  for (const line of payload.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const values = dataTokens(trimmed);
    const timeIndex = values.findIndex((value) => /^\d{12}$/.test(value));
    if (timeIndex < 0) continue;
    const stationId = values[timeIndex + 1];
    const value = parseNumber(values[timeIndex + 2]);
    if (!/^\d{1,4}$/.test(stationId ?? "") || value === undefined || value < 0 || value > 2000) continue;
    observations.push({ time: values[timeIndex], stationId, value });
  }
  return observations;
}

async function kmaPm10(region: RegionConfig, apiKey: string) {
  const end = kstNow();
  end.setUTCMinutes(end.getUTCMinutes() - 5);
  const start = new Date(end);
  start.setUTCMinutes(start.getUTCMinutes() - 120);
  const [stations, observations] = await Promise.all([
    cachedRequest("pm10-stations", 24 * 60 * 60_000, async () => parseDustStations(await fetchKmaTextFile("stn_pm10_inf.php", { inf: "kma", tm: compactMinute(end), help: "0" }, apiKey))),
    cachedRequest("pm10-observations", 5 * 60_000, async () => parsePm10Observations(await fetchKmaTextFile("kma_pm10.php", { tm1: compactMinute(start), tm2: compactMinute(end), stn: "0" }, apiKey))),
  ]);
  const latestByStation = new Map<string, { time: string; value: number }>();
  for (const observation of observations) {
    const current = latestByStation.get(observation.stationId);
    if (!current || observation.time > current.time) latestByStation.set(observation.stationId, observation);
  }
  const nearest = stations
    .filter((station) => latestByStation.has(station.id))
    .sort((a, b) => distanceSquared(region.lat, region.lon, a.lat, a.lon) - distanceSquared(region.lat, region.lon, b.lat, b.lon))[0];
  const observation = nearest ? latestByStation.get(nearest.id) : undefined;
  if (!nearest || !observation) throw new Error("KMA PM10 unavailable");
  return { value: observation.value, observedAt: observation.time, station: nearest.name };
}

async function modeledAirQuality(region: RegionConfig) {
  const search = new URLSearchParams({
    latitude: String(region.lat),
    longitude: String(region.lon),
    current: "pm10,pm2_5",
    timezone: "Asia/Seoul",
  });
  const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${search}`);
  if (!response.ok) throw new Error("Air quality request failed");
  const payload = await response.json() as { current?: { time?: string; pm10?: number; pm2_5?: number } };
  const current = payload.current;
  if (!current || (current.pm10 === undefined && current.pm2_5 === undefined)) throw new Error("Air quality unavailable");
  return { pm10: current.pm10, pm25: current.pm2_5, observedAt: current.time };
}

async function currentAirQuality(region: RegionConfig, apiKey: string): Promise<AirQuality> {
  const [kmaResult, modeledResult] = await Promise.allSettled([
    kmaPm10(region, apiKey),
    modeledAirQuality(region),
  ]);
  const kma = kmaResult.status === "fulfilled" ? kmaResult.value : undefined;
  const modeled = modeledResult.status === "fulfilled" ? modeledResult.value : undefined;
  const pm10 = kma?.value ?? modeled?.pm10;
  if (pm10 === undefined && modeled?.pm25 === undefined) throw new Error("Air quality unavailable");
  return {
    pm10,
    pm25: modeled?.pm25,
    observedAt: kma?.observedAt ?? modeled?.observedAt,
    station: kma?.station,
    pm10Source: kma ? "kma" : "open-meteo",
    pm25Source: "open-meteo",
  };
}

async function warningStatus(regionNames: string[], apiKey: string): Promise<WarningStatus[]> {
  const search = new URLSearchParams({ fe: "f", disp: "1", help: "0", authKey: apiKey });
  const response = await fetch(`https://apihub.kma.go.kr/api/typ01/url/wrn_now_data_new.php?${search}`);
  if (!response.ok) throw new Error("KMA warning request failed");
  const payload = await response.text();
  if (!payload.includes("START") && !payload.includes("REG_UP")) throw new Error("KMA warning response failed");

  const warnings = new Map<string, WarningStatus>();
  for (const line of payload.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const values = splitCsvLine(trimmed);
    if (values.length < 9 || !/^\d{12}$/.test(values[4] ?? "")) continue;
    const upperArea = values[1] ?? "";
    const area = values[3] ?? upperArea;
    if (!regionNames.some((name) => upperArea.includes(name) || (!upperArea && area.includes(name)))) continue;
    const warningName = WARNING_NAMES[values[6]] ?? "기상";
    const rawLevel = values[7] ?? "";
    const level = rawLevel.includes("경보") ? "경보" : rawLevel.includes("주의") ? "주의보" : "특보";
    const warning = { title: `${warningName} ${level}`, area, issuedAt: values[4], effectiveAt: values[5] };
    warnings.set(`${warning.title}-${warning.area}`, warning);
  }
  return [...warnings.values()].slice(0, 6);
}

async function currentConditions(region: RegionConfig, apiKey: string): Promise<CurrentConditions> {
  const issue = latestObservationIssue();
  const raw = await fetchKmaCached("VilageFcstInfoService_2.0/getUltraSrtNcst", {
    pageNo: "1",
    numOfRows: "100",
    dataType: "JSON",
    base_date: issue.date,
    base_time: issue.time,
    nx: String(region.nx),
    ny: String(region.ny),
  }, apiKey) as KmaObservationItem[];
  const value = (category: string) => raw.find((item) => item.category === category)?.obsrValue;
  const conditions = {
    temperature: parseNumber(value("T1H")),
    humidity: parseNumber(value("REH")),
    precipitation: parsePrecipitation(value("RN1") ?? ""),
    precipitationType: parseNumber(value("PTY")),
    wind: (() => {
      const speed = parseNumber(value("WSD"));
      return speed === undefined ? undefined : speed * 3.6;
    })(),
    observedAt: `${issue.date}${issue.time}`,
  };
  if (conditions.temperature === undefined && conditions.humidity === undefined) throw new Error("KMA observation unavailable");
  return conditions;
}

async function shortForecast(region: RegionConfig, apiKey: string): Promise<{ days: ForecastDay[]; hourly: HourlyForecast[] }> {
  const issue = latestShortIssue();
  const raw = await fetchKmaCached("VilageFcstInfoService_2.0/getVilageFcst", {
    pageNo: "1",
    numOfRows: "2000",
    dataType: "JSON",
    base_date: issue.date,
    base_time: issue.time,
    nx: String(region.nx),
    ny: String(region.ny),
  }, apiKey) as KmaItem[];

  const grouped = new Map<string, KmaItem[]>();
  const hourlyGrouped = new Map<string, KmaItem[]>();
  for (const item of raw) {
    if (!item.fcstDate) continue;
    const date = `${item.fcstDate.slice(0, 4)}-${item.fcstDate.slice(4, 6)}-${item.fcstDate.slice(6, 8)}`;
    grouped.set(date, [...(grouped.get(date) ?? []), item]);
    if (item.fcstTime) {
      const key = `${date}-${item.fcstTime}`;
      hourlyGrouped.set(key, [...(hourlyGrouped.get(key) ?? []), item]);
    }
  }

  const days = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => {
    const byCategory = (category: string) => items.filter((item) => item.category === category);
    const temperatures = byCategory("TMP").map((item) => parseNumber(item.fcstValue)).filter((value): value is number => value !== undefined);
    const high = parseNumber(byCategory("TMX")[0]?.fcstValue) ?? (temperatures.length ? Math.max(...temperatures) : undefined);
    const low = parseNumber(byCategory("TMN")[0]?.fcstValue) ?? (temperatures.length ? Math.min(...temperatures) : undefined);
    const precipitation = byCategory("PCP").map((item) => parsePrecipitation(item.fcstValue)).filter((value): value is number => value !== undefined).reduce((total, value) => total + value, 0);
    const winds = byCategory("WSD").map((item) => parseNumber(item.fcstValue)).filter((value): value is number => value !== undefined);
    const sky = byCategory("SKY").find((item) => ["1200", "1500"].includes(item.fcstTime)) ?? byCategory("SKY")[0];
    const pty = byCategory("PTY").find((item) => Number(item.fcstValue) > 0) ?? byCategory("PTY")[0];
    return {
      date,
      high,
      low,
      precipitation,
      weatherCode: weatherCodeFromKma(sky?.fcstValue, pty?.fcstValue),
      wind: winds.length ? Math.max(...winds) * 3.6 : undefined,
      provider: "kma-short" as const,
    };
  });

  const hourly = [...hourlyGrouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, items]) => {
    const value = (category: string) => items.find((item) => item.category === category)?.fcstValue;
    const sample = items[0];
    const sky = value("SKY");
    const precipitationType = value("PTY");
    const precipitation = value("PCP");
    return {
      date: `${sample.fcstDate.slice(0, 4)}-${sample.fcstDate.slice(4, 6)}-${sample.fcstDate.slice(6, 8)}`,
      time: `${sample.fcstTime.slice(0, 2)}:${sample.fcstTime.slice(2, 4)}`,
      temperature: parseNumber(value("TMP")),
      precipitationProbability: parseNumber(value("POP")),
      precipitation: precipitation === undefined ? undefined : parsePrecipitation(precipitation),
      weatherCode: sky === undefined && precipitationType === undefined ? undefined : weatherCodeFromKma(sky, precipitationType),
      sky,
      precipitationType,
      provider: "kma-short" as const,
    };
  }).filter((item) => item.temperature !== undefined || item.weatherCode !== undefined);

  return { days, hourly };
}

async function midForecast(region: RegionConfig, apiKey: string): Promise<ForecastDay[]> {
  const issue = latestMidIssue();
  const shared = { pageNo: "1", numOfRows: "10", dataType: "JSON", tmFc: issue };
  const [temperatureItems, landItems] = await Promise.all([
    fetchKmaCached("MidFcstInfoService/getMidTa", { ...shared, regId: region.temperatureRegion }, apiKey),
    fetchKmaCached("MidFcstInfoService/getMidLandFcst", { ...shared, regId: region.landRegion }, apiKey),
  ]);
  const temperature = (temperatureItems[0] ?? {}) as Record<string, unknown>;
  const land = (landItems[0] ?? {}) as Record<string, unknown>;
  const issueDate = new Date(Date.UTC(Number(issue.slice(0, 4)), Number(issue.slice(4, 6)) - 1, Number(issue.slice(6, 8))));

  return Array.from({ length: 8 }, (_, index) => index + 3).map((day) => {
    const morning = String(land[`wf${day}Am`] ?? land[`wf${day}`] ?? "");
    const afternoon = String(land[`wf${day}Pm`] ?? land[`wf${day}`] ?? morning);
    return {
      date: isoDate(addDays(issueDate, day)),
      high: parseNumber(temperature[`taMax${day}`]),
      low: parseNumber(temperature[`taMin${day}`]),
      weatherCode: weatherCodeFromText(`${morning} ${afternoon}`),
      provider: "kma-mid" as const,
    };
  }).filter((day) => day.high !== undefined || day.low !== undefined);
}

export async function handleKmaRequest(request: Request, apiKey?: string) {
  if (!apiKey) return Response.json({ error: "기상청 인증키가 설정되지 않았습니다." }, { status: 503 });

  const requestUrl = new URL(request.url);
  const index = Number(requestUrl.searchParams.get("region"));
  const baseRegion = Number.isInteger(index) ? REGIONS[index] : undefined;
  const warningRegionNames = Number.isInteger(index) ? WARNING_REGION_NAMES[index] : undefined;
  if (!baseRegion || !warningRegionNames) return Response.json({ error: "지원하지 않는 지역입니다." }, { status: 400 });

  const latitudeParam = requestUrl.searchParams.get("lat");
  const longitudeParam = requestUrl.searchParams.get("lon");
  const hasLocation = latitudeParam !== null || longitudeParam !== null;
  const latitude = Number(latitudeParam);
  const longitude = Number(longitudeParam);
  if (hasLocation && (
    latitudeParam === null
    || longitudeParam === null
    || !Number.isFinite(latitude)
    || !Number.isFinite(longitude)
    || latitude < 32
    || latitude > 39.5
    || longitude < 124
    || longitude > 132
  )) {
    return Response.json({ error: "지원하지 않는 현재 위치입니다." }, { status: 400 });
  }

  const locationGrid = hasLocation ? toKmaGrid(latitude, longitude) : undefined;
  const region = locationGrid ? { ...baseRegion, ...locationGrid, lat: latitude, lon: longitude } : baseRegion;
  const cacheLocation = locationGrid
    ? `${locationGrid.nx}:${locationGrid.ny}:${latitude.toFixed(2)}:${longitude.toFixed(2)}`
    : "representative";

  try {
    const payload = await cachedRequest(`kma-region:${index}:${cacheLocation}`, 5 * 60_000, async () => {
      const [shortResult, midResult, warningResult, currentResult, airQualityResult] = await Promise.allSettled([
        shortForecast(region, apiKey),
        midForecast(region, apiKey),
        warningStatus(warningRegionNames, apiKey),
        currentConditions(region, apiKey),
        currentAirQuality(region, apiKey),
      ]);
      const short = shortResult.status === "fulfilled" ? shortResult.value : { days: [], hourly: [] };
      const mid = midResult.status === "fulfilled" ? midResult.value : [];
      const current = currentResult.status === "fulfilled" ? currentResult.value : undefined;
      const warningsConnected = warningResult.status === "fulfilled";
      const airQuality = airQualityResult.status === "fulfilled" ? airQualityResult.value : undefined;
      if (!short.days.length && !short.hourly.length && !mid.length && !current && !airQuality && !warningsConnected) {
        throw new Error("KMA weather unavailable");
      }
      const now = kstNow();
      const currentDate = isoDate(now);
      const currentHour = now.getUTCHours();
      const currentHourForecast = short.hourly
        .filter((hour) => hour.date === currentDate)
        .sort((a, b) => Math.abs(Number(a.time.slice(0, 2)) - currentHour) - Math.abs(Number(b.time.slice(0, 2)) - currentHour))[0];
      const currentWeatherCode = current?.precipitationType !== undefined
        ? current.precipitationType > 0
          ? weatherCodeFromKma(currentHourForecast?.sky, String(current.precipitationType))
          : currentHourForecast?.sky !== undefined
            ? weatherCodeFromKma(currentHourForecast.sky, "0")
            : undefined
        : currentHourForecast?.weatherCode;
      const byDate = new Map<string, ForecastDay>();
      for (const day of mid) byDate.set(day.date, day);
      for (const day of short.days) byDate.set(day.date, day);
      return {
        days: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
        hourly: short.hourly,
        warnings: warningResult.status === "fulfilled" ? warningResult.value : [],
        warningsConnected,
        currentConditions: current ? { ...current, weatherCode: currentWeatherCode } : undefined,
        airQuality,
        issuedAt: new Date().toISOString(),
      };
    });
    return Response.json(payload);
  } catch {
    return Response.json({ error: "기상청 예보를 불러오지 못했습니다. API 활용신청 상태를 확인해 주세요." }, { status: 502 });
  }
}
