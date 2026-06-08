import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs';
import {
  CdkDragDrop,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../../core/auth.service';
import { SetlistService } from '../../core/setlist.service';
import { PdfMode, Setlist, SongRow } from '../../core/models';
import { formatDuration, parseDuration } from './duration.util';
import { PdfPreviewDialogComponent } from './pdf-preview-dialog.component';

@Component({
  selector: 'app-setlist-editor',
  imports: [
    ReactiveFormsModule,
    DragDropModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './setlist-editor.component.html',
  styleUrl: './setlist-editor.component.scss',
})
export class SetlistEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(SetlistService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  readonly excitementLevels = [0, 1, 2, 3, 4, 5];
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
      excitement: [song?.excitement ?? 0],
      note: [song?.note ?? ''],
    });
  }

  addSong(): void {
    this.songs.push(this.createRow({ kind: 'song' }));
  }

  addMc(): void {
    this.songs.push(this.createRow({ kind: 'mc' }));
  }

  addEncore(): void {
    this.songs.push(this.createRow({ kind: 'encore', title: 'アンコール' }));
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
    this.songs.removeAt(index);
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
        excitement: row.get('excitement')?.value ?? 0,
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
    // 編集中の内容を保存しつつ、そのままPDF生成リクエストに送る
    const setlist = this.toSetlist();
    this.service.save(setlist);
    this.generating.set(true);
    this.service
      .downloadPdf(mode, setlist)
      .then((blob) => {
        this.dialog.open(PdfPreviewDialogComponent, {
          data: {
            blob,
            filename: mode === 'color' ? 'setlist-color.pdf' : 'setlist.pdf',
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

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
