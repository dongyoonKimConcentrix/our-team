'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  NavermapsProvider,
  Container as MapContainer,
  NaverMap,
  Marker,
  InfoWindow,
} from 'react-naver-maps';
import type { StadiumWithCoords } from '@/lib/types';
import type { Team } from '@/lib/types';
import { getStadiumsWithCoords } from '@/lib/data/stadiums';
import { getTeamsByStadiumId } from '@/lib/data/teams-by-stadium';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울
const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';

function MapContent() {
  const [stadiums, setStadiums] = useState<StadiumWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<{
    position: { lat: number; lng: number };
    stadiumName: string;
    stadiumId: string;
    teams: Team[];
    teamsLoading: boolean;
  } | null>(null);

  const loadStadiums = useCallback(async () => {
    try {
      const data = await getStadiumsWithCoords();
      setStadiums(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStadiums();
  }, [loadStadiums]);

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
      <MapContainer
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
      >
        <NaverMap
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={12}
          minZoom={10}
        >
          {loading ? null : stadiums.map((stadium) => (
            <Marker
              key={stadium.id}
              position={{ lat: stadium.lat, lng: stadium.lng }}
              title={stadium.name}
              onClick={() => handleMarkerClick(stadium)}
            />
          ))}
          {popup && (
            <InfoWindow
              position={popup.position}
              content={buildPopupContent(popup)}
              maxWidth={320}
            />
          )}
        </NaverMap>
      </MapContainer>
      {loading && (
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

function buildPopupContent(popup: {
  stadiumName: string;
  teams: Team[];
  teamsLoading: boolean;
}): string {
  const { stadiumName, teams, teamsLoading } = popup;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const teamItems =
    teamsLoading
      ? '<li>불러오는 중...</li>'
      : teams.length === 0
        ? '<li>매칭 이력 없음</li>'
        : teams
            .map(
              (t) =>
                `<li><a href="${baseUrl}/team/${t.id}" style="color:#2563eb;font-weight:500;">${escapeHtml(t.name)}</a></li>`
            )
            .join('');
  return `
    <div style="padding:4px;font-family:Pretendard,Noto Sans KR,sans-serif;min-width:200px;">
      <strong style="font-size:14px;">${escapeHtml(stadiumName)}</strong>
      <p style="margin:8px 0 4px;font-size:12px;color:#64748b;">매칭한 팀</p>
      <ul style="margin:0;padding-left:20px;font-size:13px;">${teamItems}</ul>
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
