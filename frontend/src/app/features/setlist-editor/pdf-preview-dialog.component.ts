import { Component, Inject, OnDestroy } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface PdfPreviewData {
  blob: Blob; // jsPDFで生成した本物のPDF
  filename: string;
  modeLabel: string;
}

@Component({
  selector: 'app-pdf-preview-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>PDFプレビュー（{{ data.modeLabel }}）</h2>
    <mat-dialog-content class="!p-0">
      <iframe
        [src]="safeUrl"
        class="w-[80vw] max-w-[1000px] h-[70vh] border-0 bg-white"
        title="PDFプレビュー"
      ></iframe>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">閉じる</button>
      <button mat-flat-button color="primary" (click)="download()">
        <mat-icon>download</mat-icon> ダウンロード
      </button>
    </mat-dialog-actions>
  `,
})
export class PdfPreviewDialogComponent implements OnDestroy {
  private url: string;
  readonly safeUrl: SafeResourceUrl;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PdfPreviewData,
    private dialogRef: MatDialogRef<PdfPreviewDialogComponent>,
    sanitizer: DomSanitizer,
  ) {
    this.url = URL.createObjectURL(data.blob);
    this.safeUrl = sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

  download(): void {
    const a = document.createElement('a');
    a.href = this.url;
    a.download = this.data.filename;
    a.click();
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    URL.revokeObjectURL(this.url);
  }
}
