import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  // Arrange（共通）: ルートコンポーネントをテスト用にコンパイルする
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    // Act: コンポーネントを生成する
    const fixture = TestBed.createComponent(App);

    // Assert: インスタンスが生成できている
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the app header', async () => {
    // Arrange: 生成して描画を安定させる
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    // Act: 描画結果（DOM）を取得する
    const compiled = fixture.nativeElement as HTMLElement;

    // Assert: 共通ヘッダーとそのブランド表記が描画されている
    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.textContent).toContain('セットリスト管理');
  });
});
