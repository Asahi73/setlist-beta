import { Component, input, output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * 曲リスト（行）の表示専用コンポーネント。PC=テーブル / スマホ=カードの2レイアウトと
 * ドラッグ並び替えを担う。
 *
 * 親フォームには依存せず、各行を `[formGroup]="row"` で直接バインドすることで自己完結する
 * （formArrayName を使わない）。並び替え・展開・削除といった状態の所有は親（SetlistEditor）に
 * 残し、操作はイベントで通知する。
 */
@Component({
  selector: 'app-song-list',
  imports: [ReactiveFormsModule, DragDropModule, MatButtonModule, MatIconModule],
  templateUrl: './song-list.html',
  styleUrl: './song-list.scss',
})
export class SongList {
  readonly songs = input.required<FormArray<FormGroup>>();
  readonly isMobile = input(false);
  // スマホで詳細展開している行（親が所有する状態を参照する）
  readonly expandedRows = input<Set<FormGroup>>(new Set());

  readonly toggleExpand = output<FormGroup>();
  readonly removeRow = output<number>();
  readonly reorder = output<CdkDragDrop<unknown>>();

  private kindOf(index: number): string {
    return this.songs().at(index).get('kind')?.value ?? 'song';
  }

  isMc(index: number): boolean {
    return this.kindOf(index) === 'mc';
  }

  isEncore(index: number): boolean {
    return this.kindOf(index) === 'encore';
  }

  isExpanded(row: FormGroup): boolean {
    return this.expandedRows().has(row);
  }

  // 行ラベル: 曲は連番、MCは「MC」、アンコール見出しは番号なし
  rowLabel(index: number): string {
    if (this.isMc(index)) {
      return 'MC';
    }
    if (this.isEncore(index)) {
      return '';
    }
    let n = 0;
    for (let i = 0; i <= index; i++) {
      if (this.kindOf(i) === 'song') {
        n++;
      }
    }
    return String(n);
  }
}
