// 演奏時間の変換ユーティリティ（秒 ⇔ "m:ss" 表記）

export function formatDuration(sec: number): string {
  if (!sec || sec <= 0) {
    return '';
  }
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function parseDuration(value: string): number {
  const text = (value ?? '').trim();
  if (!text) {
    return 0;
  }
  // "m:ss" または "mm:ss"
  const parts = text.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(s)) {
      return m * 60 + s;
    }
  }
  // 数字だけなら秒として扱う
  const onlySec = parseInt(text, 10);
  return isNaN(onlySec) ? 0 : onlySec;
}
