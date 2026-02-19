'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  NavermapsProvider,
  Container as MapContainer,
  NaverMap,
  Marker,
  useMap,
  useNavermaps,
} from 'react-naver-maps';
import type { StadiumWithCoords } from '@/lib/types';
import type { Team } from '@/lib/types';
import { getStadiumsWithCoords } from '@/lib/data/stadiums';
import { getTeamsByStadiumId } from '@/lib/data/teams-by-stadium';
import { getMatchHistoryByStadium } from '@/lib/data/match-history-merged';
import { getWeatherEmoji } from '@/lib/weather-icons';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울
const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';

/** Material Design 스타일 마커 SVG (원형 배경 + place 아이콘) → ImageIcon용 data URL */
function getMaterialMarkerDataUrl(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
        </filter>
      </defs>
      <circle cx="22" cy="22" r="19" fill="#2563eb" stroke="#fff" stroke-width="3" filter="url(#shadow)"/>
      <path d="M22 8c-4.2 0-7.5 3.3-7.5 7.5 0 4.4 7.5 12 7.5 12s7.5-7.6 7.5-12C29.5 11.3 26.2 8 22 8zm0 10.2c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" fill="#fff"/>
    </svg>
  `.trim().replace(/\s+/g, ' ');
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type WeatherByDate = Record<string, { temp_c: number | null; humidity: number | null; clouds: string | null }>;

type PopupState = {
  position: { lat: number; lng: number };
  stadiumName: string;
  stadiumId: string;
  teams: Team[];
  teamsLoading: boolean;
} | null;

/** 마커 이미지 URL (정적 SVG 사용 — data URL은 Open API에서 동작 불안정할 수 있음) */
function getMarkerIconUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/images/marker-stadium.svg`;
}

/** Material Design 마커 아이콘 (URL 문자열 또는 ImageIcon. Open API는 문자열을 더 안정적으로 처리) */
function getMaterialMarkerIcon(navermaps: typeof naver.maps): string | naver.maps.ImageIcon | Record<string, unknown> {
  const url = getMarkerIconUrl() || getMaterialMarkerDataUrl();
  if (!url) return '';
  const Size = navermaps.Size;
  const Point = navermaps.Point;
  const sizeObj = typeof Size === 'function' ? new Size(44, 44) : { width: 44, height: 44 };
  const anchorObj = typeof Point === 'function' ? new Point(22, 44) : { x: 22, y: 44 };
  try {
    if (typeof navermaps.ImageIcon === 'function') {
      return new navermaps.ImageIcon({ url, size: sizeObj, anchor: anchorObj });
    }
  } catch (_) {
    // fallback
  }
  return url;
}

/** Material Design 마커로 구장 목록 렌더 (useNavermaps는 NaverMap 내부에서만 사용) */
function StadiumMarkers({
  stadiums,
  onMarkerClick,
}: {
  stadiums: StadiumWithCoords[];
  onMarkerClick: (stadium: StadiumWithCoords) => void;
}) {
  const navermaps = useNavermaps();
  const markerIcon = useMemo(
    () => getMaterialMarkerIcon(navermaps),
    [navermaps]
  );

  return (
    <>
      {stadiums.map((stadium) => (
        <Marker
          key={stadium.id}
          position={{ lat: stadium.lat, lng: stadium.lng }}
          title={stadium.name}
          {...(markerIcon ? { icon: markerIcon } : {})}
          onClick={() => onMarkerClick(stadium)}
        />
      ))}
    </>
  );
}

/** 지도 컨텍스트 안에서 InfoWindow를 open/close (react-naver-maps InfoWindow는 autoMount=false라 직접 open 호출 필요) */
function PopupController({ popup, weatherByDate }: { popup: PopupState; weatherByDate: WeatherByDate }) {
  const map = useMap();
  const navermaps = useNavermaps();
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!map || !navermaps) return;
    if (popup) {
      const content = buildPopupContent(popup, weatherByDate);
      if (!infoWindowRef.current) {
        infoWindowRef.current = new navermaps.InfoWindow({ content, maxWidth: 320 });
      } else {
        infoWindowRef.current.setContent(content);
      }
      const coord = new navermaps.LatLng(popup.position.lat, popup.position.lng);
      infoWindowRef.current.open(map, coord);
    } else {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    }
    return () => {
      if (infoWindowRef.current) infoWindowRef.current.close();
    };
  }, [popup, weatherByDate, map, navermaps]);

  return null;
}

function MapContent() {
  const [stadiums, setStadiums] = useState<StadiumWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState>(null);
  const [weatherByDate, setWeatherByDate] = useState<WeatherByDate>({});

  const loadStadiums = useCallback(async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const data = await getStadiumsWithCoords();
      setStadiums(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Failed to fetch';
      setFetchError(
        message.includes('fetch') || message.includes('QUIC') || message.includes('network')
          ? '구장 목록을 불러오지 못했습니다. 네트워크를 확인하거나 VPN/방화벽 설정 후 다시 시도해주세요.'
          : '구장 목록을 불러오지 못했습니다.'
      );
      setStadiums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStadiums();
  }, [loadStadiums]);

  useEffect(() => {
    if (!popup) {
      setWeatherByDate({});
      return;
    }
    const matchHistory = getMatchHistoryByStadium(popup.stadiumName);
    const dates = [...new Set(matchHistory.map((m) => m.date))];
    const { lat, lng } = popup.position;
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    let cancelled = false;
    Promise.allSettled(
      dates.map(async (date) => {
        const res = await fetch(`${base}/api/weather?lat=${lat}&lng=${lng}&date=${date}`);
        const data = await res.json();
        return { date, ...data };
      })
    ).then((results) => {
      if (cancelled) return;
      const next: WeatherByDate = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value?.date) {
          const { date, temp_c, humidity, clouds } = r.value;
          next[date] = { temp_c: temp_c ?? null, humidity: humidity ?? null, clouds: clouds ?? null };
        }
      });
      setWeatherByDate(next);
    });
    return () => {
      cancelled = true;
    };
  }, [popup?.stadiumName, popup?.position.lat, popup?.position.lng]);

  const handleMarkerClick = useCallback(async (stadium: StadiumWithCoords) => {
    setPopup({
      position: { lat: stadium.lat, lng: stadium.lng },
      stadiumName: stadium.name,
      stadiumId: stadium.id,
      teams: [],
      teamsLoading: true,
    });
    try {
      const teams = await getTeamsByStadiumId(stadium.id);
      setPopup((prev) =>
        prev
          ? { ...prev, teams, teamsLoading: false }
          : null
      );
    } catch (e) {
      console.error(e);
      setPopup((prev) =>
        prev ? { ...prev, teams: [], teamsLoading: false } : null
      );
    }
  }, []);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '70vh', minHeight: 400 }}>
      {fetchError && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'error.main',
            color: 'error.dark',
            px: 2,
            py: 1.5,
            borderRadius: 2,
            boxShadow: 2,
            maxWidth: '90%',
          }}
        >
          <Typography variant="body2" sx={{ flex: 1 }}>{fetchError}</Typography>
          <Button size="small" variant="outlined" onClick={loadStadiums} sx={{ color: 'inherit', borderColor: 'currentColor' }}>
            다시 시도
          </Button>
        </Box>
      )}
      <MapContainer
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
      >
        <NaverMap
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={12}
          minZoom={10}
          zoomControl
          zoomControlOptions={{ position: 1 }}
        >
          {loading ? null : <StadiumMarkers stadiums={stadiums} onMarkerClick={handleMarkerClick} />}
          <PopupController popup={popup} weatherByDate={weatherByDate} />
        </NaverMap>
      </MapContainer>
      {loading && !fetchError && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'background.paper',
            px: 2,
            py: 1,
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2">구장 목록 불러오는 중</Typography>
        </Box>
      )}
    </Box>
  );
}

function buildPopupContent(
  popup: { stadiumName: string; teams: Team[]; teamsLoading: boolean },
  weatherByDate: WeatherByDate = {}
): string {
  const { stadiumName, teams, teamsLoading } = popup;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const teamItems =
    teamsLoading
      ? '<li style="color:#64748b;">불러오는 중...</li>'
      : teams.length === 0
        ? ''
        : teams
            .map(
              (t) =>
                `<li style="margin-bottom:4px;"><a href="${baseUrl}/team/${t.id}" style="color:#2563eb;font-weight:500;text-decoration:none;">${escapeHtml(t.name)}</a></li>`
            )
            .join('');

  const matchHistory = getMatchHistoryByStadium(stadiumName);
  const historyItems = matchHistory.length === 0
    ? '<li style="padding:6px 0;list-style:none;color:#64748b;font-size:12px;">매칭 이력 없음</li>'
    : matchHistory.map(
        (m) => {
          const w = weatherByDate[m.date] ?? m.weather;
          const weatherParts: string[] = [];
          if (w) {
            if (w.temp_c != null) weatherParts.push(`${w.temp_c}°C`);
            if (w.humidity != null) weatherParts.push(`습도 ${w.humidity}%`);
            if (w.clouds) weatherParts.push(`${getWeatherEmoji(w.clouds)} ${escapeHtml(w.clouds)}`);
          }
          const weatherLine = weatherParts.length ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${weatherParts.join(' / ')}</div>` : '';
          const contactLine = [m.contact, m.age, m.skill].filter(Boolean).length
            ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${[m.contact && escapeHtml(m.contact), m.age && escapeHtml(m.age), m.skill && escapeHtml(m.skill)].filter(Boolean).join(' / ')}</div>`
            : '';
          return `
    <li style="padding:6px 0;border-bottom:1px solid #e2e8f0;list-style:none;">
      <div style="font-size:13px;font-weight:500;">${formatDate(m.date)} / ${escapeHtml(m.teamName)}</div>
      ${contactLine}
      ${weatherLine}
    </li>
  `;
        }
      ).join('');

  return `
    <div style="padding:8px 10px;font-family:Pretendard,Noto Sans KR,sans-serif;min-width:240px;max-width:320px;">
      <strong style="font-size:14px;">${escapeHtml(stadiumName)}</strong>
      <p style="margin:10px 0 6px;font-size:12px;color:#64748b;font-weight:600;">매칭 이력 (20시 기준 날씨)</p>
      <ul style="margin:0;padding:0;">${historyItems}</ul>
      ${teamItems ? `<p style="margin:10px 0 4px;font-size:12px;color:#64748b;font-weight:600;">매칭한 팀</p><ul style="margin:0;padding-left:18px;font-size:13px;">${teamItems}</ul>` : ''}
    </div>
  `;
}

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate + 'Z').toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return isoDate;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function StadiumMap() {
  if (!clientId) {
    return (
      <Box
        sx={{
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          borderRadius: 2,
        }}
      >
        <Typography color="text.secondary">
          NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 설정해주세요.
        </Typography>
      </Box>
    );
  }

  return (
    <NavermapsProvider ncpKeyId={clientId}>
      <MapContent />
    </NavermapsProvider>
  );
}
