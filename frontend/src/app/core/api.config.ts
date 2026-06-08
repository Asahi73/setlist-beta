import { environment } from '../../environments/environment';

// バックエンドのベースURL。
// ローカル/Dockerは http://localhost:8000/api、本番(Vercel)はビルド時の
// 環境変数 API_BASE で差し替わる（frontend/scripts/set-api-base.mjs）。
export const API_BASE = environment.apiBase;
