# syntax=docker/dockerfile:1

# ---- Stage 1: build the frontend ----
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# No VITE_API_URL set here on purpose — same-origin deployment,
# api.js falls back to relative URLs (see src/api.js).
RUN npm run build

# ---- Stage 2: backend + serve the built frontend ----
FROM python:3.12-slim
WORKDIR /app

# Install uv for fast, reproducible installs from pyproject.toml/uv.lock
RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Hugging Face Spaces (Docker SDK) expects the app on port 7860, and runs
# the container as a non-root user — give that user a writable HOME so
# Kokoro/Whisper can cache downloaded models without permission errors.
RUN useradd -m -u 1000 appuser
ENV HOME=/home/appuser \
    HF_HOME=/home/appuser/.cache/huggingface
RUN chown -R appuser:appuser /app /home/appuser
USER appuser

EXPOSE 7860

CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
