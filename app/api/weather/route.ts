import { NextRequest } from 'next/server';
import { getNearestAsosStationId } from '@/lib/weather/asos-stations';

/** ASOS 전운량(dc10Tca) 0~10 → 하늘 상태 텍스트 */
function cloudsFromTotalCoverage(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) return null;
  const v = Number(value);
  if (v <= 1) return '맑음';
  if (v <= 5) return '구름조금';
  if (v <= 8) return '구름많음';
  return '흐림';
}

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

  const stnId = getNearestAsosStationId(latNum, lngNum);
  const baseDate = dateStr ? dateStr.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const targetHour = dateStr ? '20' : String(new Date().getHours()).padStart(2, '0');

  const url = new URL('http://apis.data.go.kr/1360000/AsosHourlyInfoService/getWthrDataList');
  url.searchParams.set('serviceKey', serviceKey);
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('numOfRows', '1');
  url.searchParams.set('dataType', 'JSON');
  url.searchParams.set('dataCd', 'ASOS');
  url.searchParams.set('dateCd', 'HR');
  url.searchParams.set('startDt', baseDate);
  url.searchParams.set('startHh', targetHour);
  url.searchParams.set('endDt', baseDate);
  url.searchParams.set('endHh', targetHour);
  url.searchParams.set('stnIds', stnId);

  let res: Response;
  try {
    res = await fetch(url.toString(), { next: { revalidate: 300 } });
  } catch (e) {
    return Response.json({ temp_c: null, humidity: null, clouds: null, error: '날씨 API 요청 실패' }, { status: 502 });
  }
  const json = await res.json();
  const items = json?.response?.body?.items?.item;
  const item = Array.isArray(items) ? items[0] : items;

  if (!item) {
    const msg = json?.response?.header?.resultMsg || json?.response?.body?.items?.item || '데이터 없음';
    return Response.json({ temp_c: null, humidity: null, clouds: null, error: String(msg) }, { status: 200 });
  }

  const temp_c = item.ta != null && item.ta !== '' ? parseFloat(item.ta) : null;
  const humidity = item.hm != null && item.hm !== '' ? parseFloat(item.hm) : null;
  const dc10Tca = item.dc10Tca != null && item.dc10Tca !== '' ? parseFloat(item.dc10Tca) : null;
  const clouds = cloudsFromTotalCoverage(dc10Tca);

  return Response.json({ temp_c, humidity, clouds });
}
