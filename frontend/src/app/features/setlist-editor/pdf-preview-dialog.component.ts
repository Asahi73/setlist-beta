import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PdfPreviewData {
  html: string; // 印刷用に組み立てたHTML（pdf-html.ts）
  modeLabel: string;
}

@Component({
  selector: 'app-pdf-preview-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>PDFプレビュー（{{ data.modeLabel }}）</h2>
    <mat-dialog-content class="!p-0">
      <iframe
        #frame
        [srcdoc]="data.html"
        class="w-[80vw] max-w-[1000px] h-[70vh] border-0 bg-white"
        title="PDFプレビュー"
      ></iframe>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">閉じる</button>
      <button mat-flat-button color="primary" (click)="print()">
        <mat-icon>picture_as_pdf</mat-icon> PDFとして保存 / 印刷
      </button>
    </mat-dialog-actions>
  `,
})
export class PdfPreviewDialogComponent {
  @ViewChild('frame') frame!: ElementRef<HTMLIFrameElement>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PdfPreviewData,
    private dialogRef: MatDialogRef<PdfPreviewDialogComponent>,
  ) {}

  // プレビューのiframeをそのまま印刷ダイアログへ。
  // ブラウザの「送信先: PDFに保存」を選べばPDFとして保存できる。
  print(): void {
    const win = this.frame?.nativeElement?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  }

  close(): void {
    this.dialogRef.close();
  }
}
