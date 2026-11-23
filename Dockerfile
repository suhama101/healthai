FROM python:3.12.10-slim-bookworm
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1 MEDILENS_VERIFY_RELEASE=1 PORT=8000
WORKDIR /app
COPY backend/requirements-release.txt /tmp/requirements.txt
RUN python -m pip install --no-cache-dir torch==2.14.0+cpu torchvision==0.29.0+cpu \
      --index-url https://download.pytorch.org/whl/cpu --no-deps \
    && python -m pip install --no-cache-dir -r /tmp/requirements.txt \
    && python -m pip check
RUN useradd --create-home --uid 10001 medilens
COPY backend /app/backend
USER medilens
EXPOSE 8000
CMD ["sh", "-c", "exec python -m uvicorn backend.api:app --host 0.0.0.0 --port \"$PORT\" --workers 1 --no-access-log --no-proxy-headers"]
