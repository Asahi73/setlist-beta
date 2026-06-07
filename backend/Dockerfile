FROM python:3.12-slim

WORKDIR /app

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

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
