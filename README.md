# 오늘의 날씨

오늘이 속한 달의 날씨를 시·도별로 확인하고 최근 5개년도와 비교하는 웹 애플리케이션입니다.

## 주요 기능

- 전국 17개 시·도 현재 날씨와 오늘·내일 시간대별 예보
- 최근 5개년도 월간 최고·최저기온 및 강수량 비교
- 기상청 관측·단기·중기 예보와 기상특보
- Open-Meteo 기반 보조 예보 및 과거 재분석 자료
- GitHub Pages 정적 프런트엔드와 Cloudflare Worker API 분리

## 개발

Node.js 22 이상이 필요합니다.

```bash
npm ci
npm run dev
```

로컬 환경 파일에는 다음 값을 설정할 수 있습니다.

```text
KMA_API_KEY=기상청_API_키
NEXT_PUBLIC_WEATHER_API_BASE_URL=공개_Worker_주소
```

환경 파일과 실제 키는 저장소에 커밋하지 않습니다.

## 검증

```bash
npm run lint
npm test
npm run build:worker
npx wrangler deploy --dry-run --config wrangler.api.jsonc
```

`npm run build`는 GitHub Pages에 배포할 정적 파일을 `out/`에 생성합니다. `npm run build:worker`는 로컬 통합 개발용 vinext Worker를 검증합니다.

## 배포

- `.github/workflows/deploy-pages.yml`: `main` 브랜치의 정적 빌드를 GitHub Pages에 배포
- `wrangler.api.jsonc`: `/api/kma` 전용 Cloudflare Worker 설정
- `WEATHER_API_BASE_URL`: GitHub Actions 저장소 변수
- `KMA_API_KEY`: Cloudflare Worker 비밀 변수

배경 사진별 출처와 라이선스는 `public/weather-scenes/credits.txt`에서 확인할 수 있습니다.
