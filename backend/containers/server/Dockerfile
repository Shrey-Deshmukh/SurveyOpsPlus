# Stage 1: Builder
FROM surveyopsplus-base:0.1.0 AS builder
RUN apk add --no-cache \
  "python3-dev=3.12.13-r0" \
  "py3-pip=25.1.1-r1" \
  "build-base=0.5-r3" \
  "linux-headers=6.16.12-r0" && \
  python3 -m venv /opt/venv
WORKDIR /opt/build
COPY ./requirements.txt ./pyproject.toml ./
RUN pip install --no-cache-dir pip==26.0.1 setuptools==69.2.0 wheel==0.43.0 && \
  pip install --no-cache-dir -r requirements.txt && \
  pip install --no-cache-dir -e .
# Stage 2: Runner
FROM surveyopsplus-base:0.1.0 AS runner
WORKDIR /opt/app
COPY --from=builder /opt/venv /opt/venv
COPY ./src/ ./src/
COPY ./graph/ ./graph/
COPY ./llm/ ./llm/
COPY ./utils/ ./utils/
COPY ./evaluation/ ./evaluation/
COPY ./assets/ ./assets/
RUN chown -R surveyopsplus-user:surveyopsplus /opt/app
USER surveyopsplus-user
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
