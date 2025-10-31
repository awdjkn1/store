# Multi-stage Dockerfile for the ecommerce store (frontend + backend)
FROM node:20-bullseye as builder

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /app

# Install system deps needed for building native modules (sharp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    build-essential \
    pkg-config \
    libvips-dev \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy package manifests and install deps for build
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy rest of the repo and build the frontend
COPY . /app
RUN npm run build || true

# Final runtime image
FROM node:20-bullseye-slim
WORKDIR /app

# Runtime system deps (smaller image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy application source (built) from builder
COPY --from=builder /app /app

  # Install only production Node modules for a smaller, safer image
  RUN if [ -f package-lock.json ]; then npm ci --omit=dev --silent; else npm install --production --silent; fi

# Add an entrypoint script that emits diagnostics before starting the app
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh || true

# Install Python requirements for backend scripts if present
RUN if [ -f backend/requirements.txt ]; then pip3 install --no-cache-dir -r backend/requirements.txt; fi

  ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Use non-root user
RUN useradd --uid 1000 --create-home appuser || true
USER appuser

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "backend/server.js"]
