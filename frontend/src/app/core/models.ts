export type RowKind = 'song' | 'mc' | 'encore';

export interface SongRow {
  kind: RowKind; // 行の種類（曲 / MC / アンコール見出し）
  title: string; // 曲名 / MCの内容 / 見出し
  key: string; // song以外では未使用
  bpm: number; // テンポ。0は未設定。song以外では未使用
  duration_sec: number; // song以外では未使用
  note: string;
}

export interface Setlist {
  title: string;
  slot_time: string; // 全体の持ち時間（自由入力）
  songs: SongRow[];
}

export type PdfMode = 'color' | 'mono';
