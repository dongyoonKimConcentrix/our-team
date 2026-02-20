/**
 * 기상청 ASOS(종관) 지점 목록 (위·경도 → 지점번호 매핑용)
 * 지상(종관, ASOS) 시간자료 조회서비스 stnIds 용
 */
export type AsosStation = { stnId: string; name: string; lat: number; lng: number };

const ASOS_STATIONS: AsosStation[] = [
  { stnId: '108', name: '서울', lat: 37.5714, lng: 126.9658 },
  { stnId: '112', name: '인천', lat: 37.4777, lng: 126.6249 },
  { stnId: '119', name: '수원', lat: 37.2695, lng: 127.0294 },
  { stnId: '98', name: '의정부', lat: 37.5866, lng: 127.0297 },
  { stnId: '99', name: '이천', lat: 37.2691, lng: 127.4406 },
  { stnId: '101', name: '강화', lat: 37.7075, lng: 126.4858 },
];

/** 위·경도에서 가장 가까운 ASOS 지점 번호 반환 */
export function getNearestAsosStationId(lat: number, lng: number): string {
  let minDist = Infinity;
  let nearest = ASOS_STATIONS[0];
  for (const s of ASOS_STATIONS) {
    const d = (s.lat - lat) ** 2 + (s.lng - lng) ** 2;
    if (d < minDist) {
      minDist = d;
      nearest = s;
    }
  }
  return nearest.stnId;
}
