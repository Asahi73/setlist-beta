import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PdfMode } from '../../../core/models';
import { PrimaryButtonDirective } from '../../../shared/primary-button/primary-button.directive';

/**
 * セットリスト編集ツールバー。項目追加（曲/MC/アンコール）・リセット・PDF出力の
 * 操作群をまとめた表示専用コンポーネント。フォームには依存せず、操作はすべて
 * イベントとして親（SetlistEditor）に通知する。
 */
@Component({
  selector: 'app-setlist-toolbar',
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    PrimaryButtonDirective,
  ],
  templateUrl: './setlist-toolbar.html',
})
export class SetlistToolbar {
  // スマホ幅か（追加ボタンの出し分け）／PDF生成中か（ボタン無効化・スピナー表示）
  readonly isMobile = input(false);
  readonly generating = input(false);

  readonly addSong = output<void>();
  readonly addMc = output<void>();
  readonly addEncore = output<void>();
  readonly reset = output<void>();
  readonly exportPdf = output<PdfMode>();
}
