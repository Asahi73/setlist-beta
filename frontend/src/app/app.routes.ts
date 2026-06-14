import { Routes } from '@angular/router';

import { SetlistEditor } from './features/setlist-editor/setlist-editor';

export const routes: Routes = [
  // ベータ版は認証ゲートなし（オープンベータ）。編集画面のみ。
  { path: '', component: SetlistEditor },
  { path: '**', redirectTo: '' },
];
