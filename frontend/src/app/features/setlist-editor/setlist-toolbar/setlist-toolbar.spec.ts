import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SetlistToolbar } from './setlist-toolbar';

describe('SetlistToolbar', () => {
  // Arrange（共通）: ツールバーをテスト用にコンパイルする
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetlistToolbar],
    }).compileComponents();
  });

  // テキストでボタンを引く小さなヘルパー（各テストの Act を読みやすくする）
  function buttonByText(
    fixture: ComponentFixture<SetlistToolbar>,
    text: string,
  ): HTMLButtonElement | undefined {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    return buttons.find((b) => b.textContent?.includes(text));
  }

  it('should emit addSong when the PC add-song button is clicked', async () => {
    // Arrange: PC表示（個別ボタン）で生成し、addSong の発火を記録する
    const fixture = TestBed.createComponent(SetlistToolbar);
    fixture.componentRef.setInput('isMobile', false);
    await fixture.whenStable();
    let added = false;
    fixture.componentInstance.addSong.subscribe(() => (added = true));

    // Act: 「曲を追加」ボタンをクリックする
    buttonByText(fixture, '曲を追加')?.click();

    // Assert: addSong が発火している
    expect(added).toBe(true);
  });

  it('should emit exportPdf with the selected mode', async () => {
    // Arrange: 生成し、exportPdf が発火したモードを記録する
    const fixture = TestBed.createComponent(SetlistToolbar);
    await fixture.whenStable();
    const modes: string[] = [];
    fixture.componentInstance.exportPdf.subscribe((m) => modes.push(m));

    // Act: 蛍光色・白黒の順にPDFボタンをクリックする
    buttonByText(fixture, '蛍光色')?.click();
    buttonByText(fixture, '白黒')?.click();

    // Assert: クリック順どおりに 'color' → 'mono' が通知される
    expect(modes).toEqual(['color', 'mono']);
  });
});
