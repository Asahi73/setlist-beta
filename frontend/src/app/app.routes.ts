import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';
import { LoginComponent } from './features/login/login.component';
import { SetlistEditorComponent } from './features/setlist-editor/setlist-editor.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: SetlistEditorComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
