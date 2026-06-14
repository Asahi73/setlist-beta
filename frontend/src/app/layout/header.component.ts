import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * アプリ共通ヘッダー（全画面で1つ）。
 * ルート（作成/一覧/ライブラリ/設定…）をまたいで常時表示するため、
 * 特定の画面コンポーネントではなく app 直下のレイアウトとして切り出す。
 */
@Component({
  selector: 'app-header',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {}
