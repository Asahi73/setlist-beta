import { Injectable, signal } from '@angular/core';

import { API_BASE } from './api.config';

const TOKEN_KEY = 'setlist_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  isLoggedIn(): boolean {
    return this.token() !== null;
  }

  async login(password: string): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      throw new Error('ログインに失敗しました');
    }
    const data = (await res.json()) as { token: string };
    localStorage.setItem(TOKEN_KEY, data.token);
    this.token.set(data.token);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
  }
}
