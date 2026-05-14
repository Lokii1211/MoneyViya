# ─── Viya AI — Production Dockerfile ───
# PRD Section 2.2: Python 3.11 + FastAPI

FROM python:3.11-slim AS base

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY app.py config.py extended_api.py moneyview_api.py ./
COPY services/ services/
COPY routes/ routes/
COPY agents/ agents/
COPY database/ database/
COPY utils/ utils/
COPY data/ data/
COPY static/ static/

# Frontend dist (pre-built)
COPY frontend/dist/ frontend/dist/

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Non-root user
RUN useradd -m viya && chown -R viya:viya /app
USER viya

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
