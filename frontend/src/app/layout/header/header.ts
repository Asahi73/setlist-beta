import { Component, signal } from '@angular/core';
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
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  // スマホ幅でナビをドロワー表示する際の開閉状態（PCでは常時インラインのため未使用）
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }
}
