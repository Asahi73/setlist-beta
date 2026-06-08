import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, setlist

app = FastAPI(title="Setlist API", version="0.1.0")

# 許可オリジンは環境変数 ALLOWED_ORIGINS（カンマ区切り）で指定。
# 本番(Render)では Vercel の公開URLを設定する。
# 例: ALLOWED_ORIGINS=http://localhost:4200,https://setlist-app.vercel.app
_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:4200")
allowed_origins = [o.strip() for o in _origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(setlist.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
