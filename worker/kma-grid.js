const EARTH_RADIUS_KM = 6371.00877;
const GRID_SIZE_KM = 5;
const STANDARD_LATITUDE_1 = 30;
const STANDARD_LATITUDE_2 = 60;
const ORIGIN_LONGITUDE = 126;
const ORIGIN_LATITUDE = 38;
const ORIGIN_X = 43;
const ORIGIN_Y = 136;

/** Convert WGS84 coordinates to the KMA village forecast grid. */
export function toKmaGrid(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new TypeError("Weather coordinates must be finite numbers.");
  }

  const degreeToRadian = Math.PI / 180;
  const radius = EARTH_RADIUS_KM / GRID_SIZE_KM;
  const standardLatitude1 = STANDARD_LATITUDE_1 * degreeToRadian;
  const standardLatitude2 = STANDARD_LATITUDE_2 * degreeToRadian;
  const originLongitude = ORIGIN_LONGITUDE * degreeToRadian;
  const originLatitude = ORIGIN_LATITUDE * degreeToRadian;

  let projection = Math.tan(Math.PI * 0.25 + standardLatitude2 * 0.5)
    / Math.tan(Math.PI * 0.25 + standardLatitude1 * 0.5);
  projection = Math.log(Math.cos(standardLatitude1) / Math.cos(standardLatitude2)) / Math.log(projection);

  let scale = Math.tan(Math.PI * 0.25 + standardLatitude1 * 0.5);
  scale = Math.pow(scale, projection) * Math.cos(standardLatitude1) / projection;

  let originRadius = Math.tan(Math.PI * 0.25 + originLatitude * 0.5);
  originRadius = radius * scale / Math.pow(originRadius, projection);

  let pointRadius = Math.tan(Math.PI * 0.25 + latitude * degreeToRadian * 0.5);
  pointRadius = radius * scale / Math.pow(pointRadius, projection);

  let theta = longitude * degreeToRadian - originLongitude;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= projection;

  return {
    nx: Math.floor(pointRadius * Math.sin(theta) + ORIGIN_X + 0.5),
    ny: Math.floor(originRadius - pointRadius * Math.cos(theta) + ORIGIN_Y + 0.5),
  };
}
