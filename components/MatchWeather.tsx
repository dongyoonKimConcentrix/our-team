'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { getWeatherEmoji } from '@/lib/weather-icons';

/** 훼릭스 풋살클럽(고양시 덕양구) 기준 */
const DEFAULT_LAT = 37.6474;
const DEFAULT_LNG = 126.8615;

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
        {getWeatherEmoji(clouds)} {clouds}
      </span>
    );
  }

  return (
    <span className="text-base-content/60 text-xs inline-flex flex-wrap items-center gap-x-1 gap-y-0.5">
      {segs.reduce<ReactNode[]>((acc, node, i) => (acc.length ? [...acc, <span key={`s${i}`}> / </span>, node] : [node]), [])}
    </span>
  );
}
