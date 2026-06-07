"""共通パスワードによる簡易認証。

全ユーザーで1つの秘密のパスワードを共有するMVP実装。
ログイン成功で固定トークンを発行し、以降は Bearer トークンで検証する。
機能が固まり次第 Supabase Auth（JWT）に差し替える前提。
"""

import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .models import TokenResponse

# 環境変数（未設定時は開発用のデフォルト）
APP_PASSWORD = os.environ.get("APP_PASSWORD", "setlist")
APP_TOKEN = os.environ.get("APP_TOKEN", "dev-token")

_bearer = HTTPBearer(auto_error=False)


def login(password: str) -> TokenResponse:
    """パスワードが一致すればトークンを返す。不一致なら401。"""
    if password != APP_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="パスワードが違います",
        )
    return TokenResponse(token=APP_TOKEN)


def verify_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> None:
    """Authorization: Bearer <APP_TOKEN> を検証する依存。"""
    if credentials is None or credentials.credentials != APP_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証が必要です",
            headers={"WWW-Authenticate": "Bearer"},
        )
