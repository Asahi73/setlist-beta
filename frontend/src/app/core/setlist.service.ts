import { Injectable } from '@angular/core';

import { Setlist } from './models';

const STORAGE_KEY = 'setlist_data';

// localStorageが空のときの初期サンプル（入力例）
function sampleSetlist(): Setlist {
  return {
    title: 'サンプルライブ',
    slot_time: '30分',
    songs: [
      { kind: 'song', title: 'オープニングSE', key: 'E', bpm: 140, duration_sec: 180, excitement: 5, note: '暗転' },
      { kind: 'mc', title: '自己紹介＆煽り', key: '', bpm: 0, duration_sec: 0, excitement: 0, note: '1分' },
      { kind: 'song', title: '疾走ナンバー', key: 'Am', bpm: 180, duration_sec: 210, excitement: 4, note: '' },
      { kind: 'encore', title: 'アンコール', key: '', bpm: 0, duration_sec: 0, excitement: 0, note: '' },
      { kind: 'song', title: '大団円', key: 'G', bpm: 128, duration_sec: 300, excitement: 5, note: 'クラップ煽り' },
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
}
