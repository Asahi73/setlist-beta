import { TestBed } from '@angular/core/testing';
import { SetlistToolbar } from './setlist-toolbar';

describe('SetlistToolbar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetlistToolbar],
    }).compileComponents();
  });

  it('should emit addSong when the PC add-song button is clicked', async () => {
    const fixture = TestBed.createComponent(SetlistToolbar);
    fixture.componentRef.setInput('isMobile', false);
    await fixture.whenStable();

    let added = false;
    fixture.componentInstance.addSong.subscribe(() => (added = true));

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const addBtn = buttons.find((b) => b.textContent?.includes('曲を追加'));
    addBtn?.click();

    expect(addBtn).toBeTruthy();
    expect(added).toBe(true);
  });

  it('should emit exportPdf with the selected mode', async () => {
    const fixture = TestBed.createComponent(SetlistToolbar);
    await fixture.whenStable();

    const modes: string[] = [];
    fixture.componentInstance.exportPdf.subscribe((m) => modes.push(m));

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    buttons.find((b) => b.textContent?.includes('蛍光色'))?.click();
    buttons.find((b) => b.textContent?.includes('白黒'))?.click();

    expect(modes).toEqual(['color', 'mono']);
  });
});
