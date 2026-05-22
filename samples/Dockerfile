# syntax=docker/dockerfile:1.7
# Multi-stage build sample for Dusk Office Dockerfile highlighting.

ARG NODE_VERSION=20-alpine
ARG PYTHON_VERSION=3.12-slim

FROM node:${NODE_VERSION} AS assets
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY scripts ./scripts
COPY themes ./themes
RUN npm run validate

FROM python:${PYTHON_VERSION} AS python-tools
WORKDIR /src
COPY pyproject.toml ./
COPY python ./python
RUN pip install --no-cache-dir -e ".[dev]" && pytest python/tests

FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    DUSK_OFFICE_SAMPLE=1

RUN addgroup -S dusk && adduser -S dusk -G dusk
USER dusk

COPY --from=assets /src/themes ./themes
COPY --from=python-tools /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "process.exit(0)"

EXPOSE 3000
CMD ["node", "-e", "console.log('Dusk Office sample container ready')"]
