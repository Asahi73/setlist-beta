import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CdkDragDrop,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { SetlistService } from '../../core/setlist.service';
import { PdfMode, Setlist, SongRow } from '../../core/models';
import { generateSetlistPdf } from './pdf';
import { formatDuration, parseDuration } from './duration';
import { PdfPreviewDialog } from './pdf-preview-dialog';
import { SetlistToolbar } from './setlist-toolbar';

@Component({
  selector: 'app-setlist-editor',
  imports: [
    ReactiveFormsModule,
    DragDropModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    SetlistToolbar,
  ],
  templateUrl: './setlist-editor.html',
  styleUrl: './setlist-editor.scss',
})
export class SetlistEditor implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(SetlistService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private breakpoint = inject(BreakpointObserver);

  // スマホ幅（Tailwindのmd未満）かどうか。デバイス判定ではなくビューポート幅に応答する。
  readonly isMobile = toSignal(
    this.breakpoint.observe('(max-width: 767.98px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  // スマホ表示で詳細を展開している行（行のFormGroup参照で管理＝並び替え・削除に強い）
  private readonly expandedRows = signal(new Set<FormGroup>());

  // PDF生成中（フォント遅延ロード含む）
  readonly generating = signal(false);
  // 自動保存済みかどうか（保存ボタンは廃止）
  readonly saved = signal(false);

  form = this.fb.group({
    title: [''],
    slot_time: [''],
    songs: this.fb.array<FormGroup>([]),
  });

  get songs(): FormArray<FormGroup> {
    return this.form.get('songs') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    // データはlocalStorageから読み込む（無ければサンプル）
    this.setForm(this.service.load());

    // 項目の追加・削除・編集・並び替えのたびに自動保存する（保存ボタンは廃止）
    this.form.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.autoSave());
  }

  private setForm(setlist: Setlist): void {
    this.form.patchValue({ title: setlist.title, slot_time: setlist.slot_time });
    this.songs.clear();
    for (const song of setlist.songs) {
      this.songs.push(this.createRow(song));
    }
  }

  private createRow(song?: Partial<SongRow>): FormGroup {
    return this.fb.group({
      kind: [song?.kind ?? 'song'],
      title: [song?.title ?? ''],
      key: [song?.key ?? ''],
      bpm: [song?.bpm ?? 0],
      duration: [formatDuration(song?.duration_sec ?? 0)],
      note: [song?.note ?? ''],
    });
  }

  addSong(): void {
    this.addRow(this.createRow({ kind: 'song' }));
  }

  addMc(): void {
    this.addRow(this.createRow({ kind: 'mc' }));
  }

  addEncore(): void {
    this.addRow(this.createRow({ kind: 'encore', title: 'アンコール' }));
  }

  private addRow(row: FormGroup): void {
    this.songs.push(row);
    // 追加直後はスマホでもすぐ編集できるよう展開しておく
    this.setExpanded(row, true);
  }

  // --- スマホ表示の展開/折りたたみ ---
  isExpanded(row: FormGroup): boolean {
    return this.expandedRows().has(row);
  }

  toggleExpand(row: FormGroup): void {
    this.setExpanded(row, !this.expandedRows().has(row));
  }

  private setExpanded(row: FormGroup, open: boolean): void {
    const next = new Set(this.expandedRows());
    if (open) {
      next.add(row);
    } else {
      next.delete(row);
    }
    this.expandedRows.set(next);
  }

  kindOf(index: number): string {
    return this.songs.at(index).get('kind')?.value ?? 'song';
  }

  isMc(index: number): boolean {
    return this.kindOf(index) === 'mc';
  }

  isEncore(index: number): boolean {
    return this.kindOf(index) === 'encore';
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

  songCount(): number {
    return this.songs.controls.filter(
      (r) => r.get('kind')?.value === 'song',
    ).length;
  }

  removeRow(index: number): void {
    const row = this.songs.at(index);
    this.songs.removeAt(index);
    if (row) {
      this.setExpanded(row, false);
    }
  }

  // セットリストをリセットする（localStorageの保存データを削除し、初期状態に戻す）。
  // 取り消せない操作なので確認を取る。
  resetAll(): void {
    const ok = window.confirm(
      '保存中のセットリストは削除され、初期状態に戻ります。よろしいですか？',
    );
    if (!ok) return;
    this.service.clear();
    this.expandedRows.set(new Set());
    this.setForm(this.service.load()); // 保存データが消えたのでサンプルが返る
    this.snackBar.open('リセットしました', undefined, { duration: 2000 });
  }

  drop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const control = this.songs.at(event.previousIndex);
    this.songs.removeAt(event.previousIndex);
    this.songs.insert(event.currentIndex, control);
  }

  totalDuration(): string {
    // 曲のみ合計（MC・アンコール見出しは含めない）
    const total = this.songs.controls.reduce((sum, row) => {
      if (row.get('kind')?.value !== 'song') {
        return sum;
      }
      return sum + parseDuration(row.get('duration')?.value ?? '');
    }, 0);
    return total > 0 ? formatDuration(total) : '-';
  }

  private toSetlist(): Setlist {
    return {
      title: this.form.value.title ?? '',
      slot_time: this.form.value.slot_time ?? '',
      songs: this.songs.controls.map((row) => ({
        kind: row.get('kind')?.value ?? 'song',
        title: row.get('title')?.value ?? '',
        key: row.get('key')?.value ?? '',
        bpm: Number(row.get('bpm')?.value) || 0,
        duration_sec: parseDuration(row.get('duration')?.value ?? ''),
        note: row.get('note')?.value ?? '',
      })),
    };
  }

  private autoSave(): void {
    // localStorageに保存（同期）。追加・削除・編集・並び替えで自動的に呼ばれる
    this.service.save(this.toSetlist());
    this.saved.set(true);
  }

  exportPdf(mode: PdfMode): void {
    // 編集中の内容を保存し、クライアント側で本物のPDF(Blob)を生成してプレビュー表示する。
    // バックエンド不要。jsPDF＋日本語フォントは初回のみ遅延ロードされる。
    const setlist = this.toSetlist();
    this.service.save(setlist);
    this.generating.set(true);
    generateSetlistPdf(setlist, mode)
      .then((blob) => {
        this.dialog.open(PdfPreviewDialog, {
          data: {
            blob,
            filename: this.pdfFilename(setlist.title),
            modeLabel: mode === 'color' ? '蛍光色' : '白黒',
          },
          maxWidth: '95vw',
        });
      })
      .catch(() =>
        this.snackBar.open('PDF出力に失敗しました', undefined, { duration: 3000 }),
      )
      .finally(() => this.generating.set(false));
  }

  // PDFのダウンロード名は「セットリスト名.pdf」。ファイル名に使えない文字は除去する。
  private pdfFilename(title: string): string {
    const safe = title
      .replace(/[\\/:*?"<>|]/g, '') // OSで禁止される文字
      .replace(/\s+/g, ' ')
      .trim();
    return `${safe || 'セットリスト'}.pdf`;
  }
}
