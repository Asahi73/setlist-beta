import { Routes } from '@angular/router';

import { SetlistEditorComponent } from './features/setlist-editor/setlist-editor.component';

export const routes: Routes = [
  // ベータ版は認証ゲートなし（オープンベータ）。編集画面のみ。
  { path: '', component: SetlistEditorComponent },
  { path: '**', redirectTo: '' },
];
