import { NextRequest } from 'next/server';
import { latLngToGrid } from '@/lib/weather/kma-grid';

const SKY_MAP: Record<string, string> = {
  '1': '맑음',
  '2': '구름조금',
  '3': '구름많음',
  '4': '흐림',
};

export type WeatherResult = {
  temp_c: number | null;
  humidity: number | null;
  clouds: string | null;
  error?: string;
};

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat');
  const lng = request.nextUrl.searchParams.get('lng');
  const dateStr = request.nextUrl.searchParams.get('date'); // YYYY-MM-DD
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

  if (!serviceKey) {
    return Response.json({ temp_c: null, humidity: null, clouds: null, error: '날씨 API 키가 설정되지 않았습니다.' }, { status: 500 });
  }
  const latNum = lat ? parseFloat(lat) : NaN;
  const lngNum = lng ? parseFloat(lng) : NaN;
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return Response.json({ temp_c: null, humidity: null, clouds: null, error: 'lat, lng가 필요합니다.' }, { status: 400 });
  }

  const { nx, ny } = latLngToGrid(latNum, lngNum);
  const baseDate = dateStr ? dateStr.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const baseTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
  const targetFcstTime = dateStr ? '2000' : null; // 요청 날짜가 있으면 해당일 20시 기준
  let baseTime: string;
  if (dateStr) {
    baseTime = '1700'; // 당일 20시 예보가 포함된 발표시각(17시 발표분)
  } else {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    baseTime = '0200';
    for (let i = baseTimes.length - 1; i >= 0; i--) {
      const [h] = baseTimes[i].match(/\d{2}/) || ['0'];
      if (parseInt(h, 10) <= currentHour + (currentMin >= 30 ? 1 : 0)) {
        baseTime = baseTimes[i];
        break;
      }
    }
  }

  const url = new URL('http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst');
  url.searchParams.set('serviceKey', serviceKey);
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('numOfRows', '500');
  url.searchParams.set('dataType', 'JSON');
  url.searchParams.set('base_date', baseDate);
  url.searchParams.set('base_time', baseTime);
  url.searchParams.set('nx', String(nx));
  url.searchParams.set('ny', String(ny));

  let res: Response;
  try {
    res = await fetch(url.toString(), { next: { revalidate: 300 } });
  } catch (e) {
    return Response.json({ temp_c: null, humidity: null, clouds: null, error: '날씨 API 요청 실패' }, { status: 502 });
  }
  const json = await res.json();
  const items = json?.response?.body?.items?.item;
  if (!Array.isArray(items)) {
    const msg = json?.response?.header?.resultMsg || json?.response?.body?.items?.item || '데이터 없음';
    return Response.json({ temp_c: null, humidity: null, clouds: null, error: String(msg) }, { status: 200 });
  }

  let temp_c: number | null = null;
  let humidity: number | null = null;
  let clouds: string | null = null;
  const targetDate = baseDate;
  const targetTime = targetFcstTime ?? null;
  for (const it of items) {
    if (it.fcstDate !== targetDate) continue;
    if (targetTime != null && it.fcstTime !== targetTime) continue;
    if (it.category === 'TMP') temp_c = parseFloat(it.fcstValue);
    if (it.category === 'REH') humidity = parseFloat(it.fcstValue);
    if (it.category === 'SKY') clouds = SKY_MAP[it.fcstValue] ?? it.fcstValue;
    if (temp_c != null && humidity != null && clouds != null) break;
  }
  return Response.json({ temp_c, humidity, clouds });
}
