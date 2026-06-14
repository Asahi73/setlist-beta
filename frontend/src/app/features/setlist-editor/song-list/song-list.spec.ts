import { TestBed } from '@angular/core/testing';
import { FormArray, FormGroup, FormControl } from '@angular/forms';
import { SongList } from './song-list';

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
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SongList],
    }).compileComponents();
  });

  it('should render a PC table row per control', async () => {
    const fixture = TestBed.createComponent(SongList);
    const songs = new FormArray([songRow('song', 'A'), songRow('mc', '挨拶')]);
    fixture.componentRef.setInput('songs', songs);
    fixture.componentRef.setInput('isMobile', false);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should number only song rows (MC is labelled "MC")', async () => {
    const fixture = TestBed.createComponent(SongList);
    fixture.componentRef.setInput('songs', new FormArray([songRow('song', 'A')]));
    await fixture.whenStable();

    expect(fixture.componentInstance.rowLabel(0)).toBe('1');
    expect(fixture.componentInstance.isMc(0)).toBe(false);
  });

  it('should emit removeRow with the row index', async () => {
    const fixture = TestBed.createComponent(SongList);
    fixture.componentRef.setInput('songs', new FormArray([songRow('song', 'A')]));
    fixture.componentRef.setInput('isMobile', false);
    await fixture.whenStable();

    let removed = -1;
    fixture.componentInstance.removeRow.subscribe((i) => (removed = i));

    const delBtn = fixture.nativeElement.querySelector(
      'tbody tr td:last-child button',
    ) as HTMLButtonElement;
    delBtn?.click();

    expect(removed).toBe(0);
  });

  it('should show the empty message when there are no rows', async () => {
    const fixture = TestBed.createComponent(SongList);
    fixture.componentRef.setInput('songs', new FormArray([] as FormGroup[]));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('行がありません');
  });
});
