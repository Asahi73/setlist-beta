import { TestBed } from '@angular/core/testing';
import { FormArray, FormGroup, FormControl } from '@angular/forms';
import { SongList } from './song-list';

// テスト用の行（FormGroup）を組み立てる小さなファクトリ。各テストの Arrange を短くする
function songRow(kind: string, title: string): FormGroup {
  return new FormGroup({
    kind: new FormControl(kind),
    title: new FormControl(title),
    key: new FormControl(''),
    bpm: new FormControl(0),
    duration: new FormControl('0:00'),
    note: new FormControl(''),
  });
}

describe('SongList', () => {
  // Arrange（共通）: 曲リストをテスト用にコンパイルする
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SongList],
    }).compileComponents();
  });

  it('should render a PC table row per control', async () => {
    // Arrange: 曲+MCの2行をPC表示で渡す
    const fixture = TestBed.createComponent(SongList);
    const songs = new FormArray([songRow('song', 'A'), songRow('mc', '挨拶')]);
    fixture.componentRef.setInput('songs', songs);
    fixture.componentRef.setInput('isMobile', false);

    // Act: 描画を安定させ、テーブル行を取得する
    await fixture.whenStable();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');

    // Assert: コントロール数だけ行が描画される
    expect(rows.length).toBe(2);
  });

  it('should number only song rows (MC is labelled "MC")', async () => {
    // Arrange: 曲1行を渡す
    const fixture = TestBed.createComponent(SongList);
    fixture.componentRef.setInput('songs', new FormArray([songRow('song', 'A')]));
    await fixture.whenStable();

    // Act: 行ラベルと種別判定を取得する
    const label = fixture.componentInstance.rowLabel(0);
    const isMc = fixture.componentInstance.isMc(0);

    // Assert: 曲は連番、MCではない
    expect(label).toBe('1');
    expect(isMc).toBe(false);
  });

  it('should emit removeRow with the row index', async () => {
    // Arrange: 曲1行をPC表示で渡し、removeRow の通知を記録する
    const fixture = TestBed.createComponent(SongList);
    fixture.componentRef.setInput('songs', new FormArray([songRow('song', 'A')]));
    fixture.componentRef.setInput('isMobile', false);
    await fixture.whenStable();
    let removed = -1;
    fixture.componentInstance.removeRow.subscribe((i) => (removed = i));

    // Act: 行末の削除ボタンをクリックする
    const delBtn = fixture.nativeElement.querySelector(
      'tbody tr td:last-child button',
    ) as HTMLButtonElement;
    delBtn?.click();

    // Assert: その行のインデックスが通知される
    expect(removed).toBe(0);
  });

  it('should show the empty message when there are no rows', async () => {
    // Arrange: 空の FormArray を渡す
    const fixture = TestBed.createComponent(SongList);
    fixture.componentRef.setInput('songs', new FormArray([] as FormGroup[]));

    // Act: 描画を安定させ、表示テキストを取得する
    await fixture.whenStable();
    const text = fixture.nativeElement.textContent;

    // Assert: 空メッセージが表示される
    expect(text).toContain('行がありません');
  });
});
