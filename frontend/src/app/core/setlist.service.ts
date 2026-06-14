import { Injectable } from '@angular/core';

import { Setlist } from './models';

const STORAGE_KEY = 'setlist_data';

// localStorageが空のときの初期サンプル（入力例）
function sampleSetlist(): Setlist {
  return {
    title: '6/20 梅雨コン',
    slot_time: '30分',
    songs: [
      { kind: 'song', title: 'オープニングSE', key: 'E', bpm: 140, duration_sec: 180, note: '暗転' },
    ],
  };
}

@Injectable({ providedIn: 'root' })
export class SetlistService {
  // セットリストはクライアント(localStorage)に保持する
  load(): Setlist {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as Setlist;
      } catch {
        // 壊れていたらサンプルにフォールバック
      }
    }
    return sampleSetlist();
  }

  save(setlist: Setlist): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(setlist));
  }

  // 保存データを削除する（localStorageごと消す）。以降の load() はサンプルに戻る。
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
