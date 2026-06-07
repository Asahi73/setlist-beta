from typing import Literal

from pydantic import BaseModel, Field


class SongRow(BaseModel):
    """セットリストの1行。曲・MC（トーク）・アンコール見出しを表す。"""

    kind: Literal["song", "mc", "encore"] = "song"  # 行の種類
    title: str = ""  # 曲名 / MCの内容 / 見出し
    key: str = ""  # 演奏キー（例: C, Am, F#）。song以外では未使用
    bpm: int = 0  # テンポ（0は未設定）。song以外では未使用
    duration_sec: int = 0  # 演奏時間（秒）。0は未設定。song以外では未使用
    excitement: int = Field(default=0, ge=0, le=5)  # 盛り上がり度（1〜5）。song以外では未使用
    note: str = ""  # 備考


class Setlist(BaseModel):
    """単一のセットリスト"""

    title: str = ""
    slot_time: str = ""  # 全体の持ち時間（自由入力。例「30分」「30:00」）
    songs: list[SongRow] = Field(default_factory=list)


class LoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    token: str
