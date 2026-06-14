import { TestBed } from '@angular/core/testing';
import { Header } from './header';

describe('Header', () => {
  // Arrange（共通）: ヘッダーをテスト用にコンパイルする
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
    }).compileComponents();
  });

  it('should create and show the brand', async () => {
    // Arrange: 生成して描画を安定させる
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();

    // Act: 描画結果（DOM）を取得する
    const compiled = fixture.nativeElement as HTMLElement;

    // Assert: 生成できており、ブランド表記が表示されている
    expect(fixture.componentInstance).toBeTruthy();
    expect(compiled.textContent).toContain('セットリスト管理');
  });
});
