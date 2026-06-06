#3.23.4
FROM alpine@sha256:5b10f432ef3da1b8d4c7eb6c487f2f5a8f096bc91145e68878dd4a5019afde11

RUN apk add --no-cache "python3=3.12.13-r0" && \
  addgroup -S surveyopsplus && \
  adduser -S surveyopsplus-user -G surveyopsplus

ENV PATH="/opt/venv/bin:$PATH" \
  PYTHONPATH="/opt/app" \
  PYTHONDONTWRITEBYTECODE="1" \
  PYTHONUNBUFFERED="1"
