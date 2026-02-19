/**
 * 하늘 상태(구름) 텍스트 → 이모지/아이콘 매핑
 * 기상청 SKY 코드: 1=맑음, 2=구름조금, 3=구름많음, 4=흐림
 */
const CLOUDS_EMOJI: Record<string, string> = {
  맑음: '☀️',
  구름조금: '🌤️',
  구름많음: '⛅',
  흐림: '☁️',
};

const DEFAULT_EMOJI = '🌡️';

/** HTML/문자열용: 하늘 상태 텍스트 옆에 쓸 이모지 */
export function getWeatherEmoji(clouds: string | null | undefined): string {
  if (!clouds || typeof clouds !== 'string') return DEFAULT_EMOJI;
  return CLOUDS_EMOJI[clouds.trim()] ?? DEFAULT_EMOJI;
}
