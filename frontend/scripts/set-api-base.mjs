// ビルド前に src/environments/environment.ts を生成する。
// - ローカル/Docker: 環境変数なし → http://localhost:8000/api
// - 本番(Vercel): ダッシュボードで環境変数 API_BASE を設定 → その値を使う
//   例: API_BASE = https://<your-backend>.onrender.com/api
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const apiBase = process.env.API_BASE || 'http://localhost:8000/api';
const path = 'src/environments/environment.ts';

mkdirSync(dirname(path), { recursive: true });
writeFileSync(
  path,
  `// 自動生成（scripts/set-api-base.mjs）。直接編集しない。\n` +
    `export const environment = {\n  apiBase: '${apiBase}',\n};\n`,
);

console.log('[set-api-base] apiBase =', apiBase);
