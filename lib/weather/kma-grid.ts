/**
 * 기상청 단기예보용 격자 좌표 변환 (위·경도 → nx, ny)
 * LCC (Lambert Conformal Conic) 투영
 */
export function latLngToGrid(lat: number, lng: number): { nx: number; ny: number } {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0 * (Math.PI / 180);
  const SLAT2 = 60.0 * (Math.PI / 180);
  const OLON = 126.0 * (Math.PI / 180);
  const OLAT = 38.0 * (Math.PI / 180);
  const XO = 43;
  const YO = 136;

  const re = RE / GRID;
  const sn = Math.tan(Math.PI * 0.25 + SLAT2 * 0.5) / Math.tan(Math.PI * 0.25 + SLAT1 * 0.5);
  const snLog = Math.log(Math.cos(SLAT1) / Math.cos(SLAT2)) / Math.log(sn);
  const sf = Math.tan(Math.PI * 0.25 + SLAT1 * 0.5);
  const sfPow = Math.pow(sf, snLog) * Math.cos(SLAT1) / snLog;
  const ro = Math.tan(Math.PI * 0.25 + OLAT * 0.5);
  const roVal = (re * sfPow) / Math.pow(ro, snLog);

  const v1 = lat * (Math.PI / 180);
  const v2 = lng * (Math.PI / 180);
  let ra = Math.tan(Math.PI * 0.25 + v1 * 0.5);
  ra = (re * sfPow) / Math.pow(ra, snLog);
  let theta = v2 - OLON;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= snLog;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(roVal - ra * Math.cos(theta) + YO + 0.5);
  return { nx, ny };
}
