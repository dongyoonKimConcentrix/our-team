'use client';

import { type ReactNode, useEffect, useState } from 'react';

/** 훼릭스 풋살클럽(고양시 덕양구) 기준 */
const DEFAULT_LAT = 37.6474;
const DEFAULT_LNG = 126.8615;

/** 구름 상태(맑음/구름조금/구름많음/흐림)에 맞는 날씨 아이콘 */
function CloudsIcon({ clouds, className = 'size-3.5' }: { clouds: string; className?: string }) {
  const c = clouds.trim();
  const title = `구름 ${clouds}`;
  if (c === '맑음') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <title>{title}</title>
        <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-1.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM3.75 12a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75ZM18 12a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5h-2.25A.75.75 0 0 1 18 12ZM2.25 9a.75.75 0 0 1 .75-.75H5.5a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75ZM21 9a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H21.75A.75.75 0 0 1 21 9ZM2.25 15a.75.75 0 0 1 .75-.75H5.5a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75ZM21 15a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H21.75A.75.75 0 0 1 21 15Z" />
      </svg>
    );
  }
  if (c === '구름조금') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <title>{title}</title>
        <path d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm-4.5 4.5a.75.75 0 0 1 .75.75v.75H9a.75.75 0 0 1 0 1.5H8.25V9a.75.75 0 0 1-.75-.75Zm9 0a.75.75 0 0 1 .75.75v.75h.75a.75.75 0 0 1 0 1.5h-.75V9a.75.75 0 0 1-.75-.75ZM6.75 18v-2.25a.75.75 0 0 1 1.5 0V18H9a.75.75 0 0 1 0 1.5H6.75Zm10.5 0v-2.25a.75.75 0 0 1 1.5 0V18H18a.75.75 0 0 1 0 1.5h-2.25ZM4.5 12.75a.75.75 0 0 1 .75-.75h.75V11a.75.75 0 0 1 1.5 0v1h.75a.75.75 0 0 1 0 1.5h-.75v1a.75.75 0 0 1-1.5 0v-1H5.25a.75.75 0 0 1-.75-.75Zm14.25 0a.75.75 0 0 1 .75-.75H20v-1a.75.75 0 0 1 1.5 0v1h.75a.75.75 0 0 1 0 1.5h-.75v1a.75.75 0 0 1-1.5 0v-1h-.75a.75.75 0 0 1-.75-.75ZM3 15.75a2.25 2.25 0 0 1 2.25-2.25h2.25A2.25 2.25 0 0 1 9.75 15.75v.75h4.5v-.75a2.25 2.25 0 0 1 2.25-2.25h2.25a2.25 2.25 0 0 1 2.25 2.25v.75h.75a2.25 2.25 0 0 1 0 4.5H3.75a2.25 2.25 0 0 1 0-4.5H4.5v-.75A2.25 2.25 0 0 1 3 15.75Z" />
      </svg>
    );
  }
  if (c === '흐림') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <title>{title}</title>
        <path d="M4.5 13.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v.75a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 14.25v-.75Zm9-6a3 3 0 0 1 3 3v.75a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 11.25v-.75a3 3 0 0 1 3-3h8.25Z" />
      </svg>
    );
  }
  // 구름많음 또는 기타
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <title>{title}</title>
      <path d="M3.75 15a2.25 2.25 0 0 1 2.25-2.25h2.25A2.25 2.25 0 0 1 10.5 15v.75h3v-.75a2.25 2.25 0 0 1 2.25-2.25h2.25a2.25 2.25 0 0 1 2.25 2.25v.75h.75a2.25 2.25 0 0 1 0 4.5H3.75a2.25 2.25 0 0 1 0-4.5H4.5v-.75A2.25 2.25 0 0 1 3.75 15Z" />
    </svg>
  );
}

type WeatherData = {
  temp_c: number | null;
  humidity: number | null;
  clouds: string | null;
  error?: string;
};

type MatchWeatherProps = {
  /** YYYY-MM-DD */
  date: string;
  /** 정적/캐시 데이터 없을 때 API 사용, 있으면 fallback으로 표시 */
  fallback?: { temp_c?: number; humidity?: number; clouds?: string };
};

export default function MatchWeather({ date, fallback }: MatchWeatherProps) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({
      date,
      lat: String(DEFAULT_LAT),
      lng: String(DEFAULT_LNG),
    });
    fetch(`/api/weather?${params}`)
      .then((res) => res.json())
      .then((json: WeatherData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData({ temp_c: null, humidity: null, clouds: null, error: '조회 실패' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  if (loading && !fallback) {
    return <span className="text-base-content/60 text-sm">날씨 조회 중…</span>;
  }

  const temp = data?.temp_c ?? fallback?.temp_c;
  const humidity = data?.humidity ?? fallback?.humidity;
  const clouds = data?.clouds ?? fallback?.clouds;

  const hasAny = temp != null || humidity != null || clouds;

  if (!hasAny) {
    return <span className="text-base-content/60 text-xs">날씨 : -</span>;
  }

  const segs: ReactNode[] = [];
  if (temp != null) segs.push(<span key="temp">기온 {temp}°C</span>);
  if (humidity != null) segs.push(<span key="humidity">습도 {humidity}%</span>);
  if (clouds) {
    segs.push(
      <span key="clouds" className="inline-flex items-center gap-1">
        <CloudsIcon clouds={clouds} />
        {clouds}
      </span>
    );
  }

  return (
    <span className="text-base-content/60 text-xs inline-flex flex-wrap items-center gap-x-1 gap-y-0.5">
      {segs.reduce<ReactNode[]>((acc, node, i) => (acc.length ? [...acc, <span key={`s${i}`}> / </span>, node] : [node]), [])}
    </span>
  );
}
