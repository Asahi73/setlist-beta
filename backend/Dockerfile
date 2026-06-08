FROM python:3.12-slim

WORKDIR /app

# パッケージは src/backend にあるため import パスを通す（Render等でも有効）
ENV PYTHONPATH=/app/src

# WeasyPrint の実行に必要なネイティブライブラリと日本語フォント
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    libjpeg62-turbo \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

RUN pip install poetry==2.4.1 && \
    poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock ./
RUN poetry install --without dev --no-root --no-interaction --no-ansi

COPY src/ ./src/

# 本番: PORT環境変数（Render等が指定）にバインド。未指定なら8000。
# ローカル開発のホットリロードは docker-compose の command で上書きする。
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
