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
import { getStadiumsWithCoords } from '@/lib/data/stadiums';

/** 원당역(경기도 고양시 덕양구) 기준 */
/** 훼릭스 풋살클럽(경기도 고양시 덕양구 성사동) 기준 */
const DEFAULT_CENTER = { lat: 37.6474, lng: 126.8615 };
const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';

/** 마커 아이콘 44×64px 기준 (위 20px 여백으로 시각 20px 상승) */
const MARKER_ICON_WIDTH = 44;
const MARKER_ICON_HEIGHT = 64;
const MARKER_ICON_ANCHOR_Y = 64; // 아이콘 하단(뾰족한 끝)이 지도 좌표에 맞음

/** Material Design 스타일 마커 SVG (원형 배경 + place 아이콘) → ImageIcon용 data URL */
function getMaterialMarkerDataUrl(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="64" viewBox="0 0 44 64">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
        </filter>
      </defs>
      <g transform="translate(0, 20)">
        <circle cx="22" cy="22" r="19" fill="#2563eb" stroke="#fff" stroke-width="3" filter="url(#shadow)"/>
        <path d="M22 8c-4.2 0-7.5 3.3-7.5 7.5 0 4.4 7.5 12 7.5 12s7.5-7.6 7.5-12C29.5 11.3 26.2 8 22 8zm0 10.2c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" fill="#fff"/>
      </g>
    </svg>
  `.trim().replace(/\s+/g, ' ');
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type PopupState = {
  position: { lat: number; lng: number };
  stadiumName: string;
} | null;

/** 마커 이미지 URL (정적 SVG 사용 — data URL은 Open API에서 동작 불안정할 수 있음) */
function getMarkerIconUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/images/marker-stadium.svg`;
}

/** Material Design 마커 아이콘 (URL 문자열 또는 ImageIcon. Open API는 문자열을 더 안정적으로 처리) */
function getMaterialMarkerIcon(navermaps: {
  Size: new (w: number, h: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  ImageIcon?: new (o: { url: string; size: unknown; anchor: unknown }) => unknown;
}): string | Record<string, unknown> {
  const url = getMarkerIconUrl() || getMaterialMarkerDataUrl();
  if (!url) return '';
  const Size = navermaps.Size;
  const Point = navermaps.Point;
  const sizeObj = typeof Size === 'function'
    ? new Size(MARKER_ICON_WIDTH, MARKER_ICON_HEIGHT)
    : { width: MARKER_ICON_WIDTH, height: MARKER_ICON_HEIGHT };
  const anchorObj = typeof Point === 'function'
    ? new Point(MARKER_ICON_WIDTH / 2, MARKER_ICON_ANCHOR_Y)
    : { x: MARKER_ICON_WIDTH / 2, y: MARKER_ICON_ANCHOR_Y };
  try {
    if (typeof navermaps.ImageIcon === 'function') {
      return new navermaps.ImageIcon({ url, size: sizeObj, anchor: anchorObj }) as Record<string, unknown>;
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

/** 지도 컨텍스트 안에서 InfoWindow를 open/close (구장명만 표시) */
function PopupController({ popup }: { popup: PopupState }) {
  const map = useMap();
  const navermaps = useNavermaps();
  const infoWindowRef = useRef<{ setContent: (c: string) => void; open: (m: unknown, c: unknown) => void; close: () => void } | null>(null);

  useEffect(() => {
    if (!map || !navermaps) return;
    if (popup) {
      const content = buildPopupContent(popup.stadiumName);
      if (!infoWindowRef.current) {
        const Size = navermaps.Size;
        const anchorSize = typeof Size === 'function' ? new Size(15, 15) : { width: 15, height: 15 };
        infoWindowRef.current = new navermaps.InfoWindow({
          content,
          maxWidth: 280,
          anchorSize, // 하단 화살표(말풍선 꼬리) 크기 — 기본(30,30)의 절반
        });
      } else {
        infoWindowRef.current.setContent(content);
      }
      const coord = new navermaps.LatLng(popup.position.lat, popup.position.lng);
      // 화살표 길이 유지: 앵커만 20px 위 지도 좌표로 열어 팝업 위치만 위로 이동
      let openCoord: unknown = coord;
      try {
        const proj = map.getProjection?.();
        if (proj?.fromCoordToOffset && proj?.fromOffsetToCoord) {
          const offset = proj.fromCoordToOffset(coord);
          if (offset && typeof offset.x === 'number' && typeof offset.y === 'number') {
            const Point = navermaps.Point;
            const upOffset = typeof Point === 'function'
              ? new Point(offset.x, offset.y - 20)
              : { x: offset.x, y: offset.y - 20 };
            openCoord = proj.fromOffsetToCoord(upOffset) ?? coord;
          }
        }
      } catch (_) {
        // 변환 실패 시 원래 좌표 사용
      }
      if (infoWindowRef.current) infoWindowRef.current.open(map, openCoord);
    } else {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    }
    return () => {
      if (infoWindowRef.current) infoWindowRef.current.close();
    };
  }, [popup, map, navermaps]);

  return null;
}

function MapContent({
  onStadiumSelect,
  initialStadiumName,
}: {
  onStadiumSelect?: (stadiumName: string | null) => void;
  initialStadiumName?: string | null;
}) {
  const [stadiums, setStadiums] = useState<StadiumWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState>(null);
  const initialAppliedRef = useRef(false);

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

  /** URL 등으로 전달된 초기 구장명: 구장 로드 후 해당 마커 팝업 열기 + 리스트 선택 */
  useEffect(() => {
    if (loading || !initialStadiumName || initialAppliedRef.current || stadiums.length === 0) return;
    const name = initialStadiumName.trim();
    if (!name) return;
    const stadium = stadiums.find((s) => s.name === name || s.name?.trim() === name);
    if (stadium) {
      initialAppliedRef.current = true;
      setPopup({
        position: { lat: stadium.lat, lng: stadium.lng },
        stadiumName: stadium.name,
      });
      onStadiumSelect?.(stadium.name);
    }
  }, [loading, initialStadiumName, stadiums, onStadiumSelect]);

  const handleMarkerClick = useCallback((stadium: StadiumWithCoords) => {
    setPopup({
      position: { lat: stadium.lat, lng: stadium.lng },
      stadiumName: stadium.name,
    });
    onStadiumSelect?.(stadium.name);
  }, [onStadiumSelect]);

  return (
    <div className="relative w-full h-[70vh] min-h-[400px]">
      {fetchError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-base-100 border border-error text-error px-4 py-3 rounded-xl shadow-lg max-w-[90%]">
          <span className="text-sm flex-1">{fetchError}</span>
          <button type="button" className="btn btn-outline btn-sm border-current text-current" onClick={loadStadiums}>
            다시 시도
          </button>
        </div>
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
          <PopupController popup={popup} />
        </NaverMap>
      </MapContainer>
      {loading && !fetchError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-200/80 rounded-xl">
          <span className="loading loading-ball loading-lg text-primary" />
        </div>
      )}
    </div>
  );
}

function buildPopupContent(stadiumName: string): string {
  return `
    <div style="padding:5px;font-family:Pretendard,Noto Sans KR,sans-serif;font-size:12px;font-weight:700;">
      ${escapeHtml(stadiumName)}
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type StadiumMapProps = {
  onStadiumSelect?: (stadiumName: string | null) => void;
  /** 이 구장명으로 진입 시 해당 마커 팝업 표시 (예: /map?stadium=구장명) */
  initialStadiumName?: string | null;
};

export default function StadiumMap({ onStadiumSelect, initialStadiumName }: StadiumMapProps) {
  if (!clientId) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-base-200 rounded-xl">
        <span className="text-base-content/70">
          NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 설정해주세요.
        </span>
      </div>
    );
  }

  return (
    <NavermapsProvider ncpKeyId={clientId}>
      <MapContent onStadiumSelect={onStadiumSelect} initialStadiumName={initialStadiumName} />
    </NavermapsProvider>
  );
}
