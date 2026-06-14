import { Directive } from '@angular/core';

/**
 * プライマリアクション（青・filled）ボタン用ディレクティブ。
 *
 * カラールール（.claude/skills/frontend-design）の「青はプライマリ(filled)のみ」を
 * 一箇所に固定するため、`mat-flat-button` に付与して使う。
 *   <button mat-flat-button appPrimaryButton>…</button>
 *
 * 実体のスタイルは styles.scss の `.app-primary-btn`。Material のボタンスタイルが
 * 後勝ちするため、グローバルCSS側で !important により上書きしている。
 */
@Directive({
  selector: 'button[appPrimaryButton]',
  host: { class: 'app-primary-btn' },
})
export class PrimaryButtonDirective {}
