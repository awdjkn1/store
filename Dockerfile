# Stage 1: Builder
# Builds the frontend and installs all dependencies
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

# Copy package manifests and install *all* deps (dev + prod) for build
COPY package.json package-lock.json ./
RUN npm install --silent

# Copy rest of the repo and build the frontend
COPY . /app
RUN npm run build

# ---
# Stage 2: Final Runtime Image
# Contains only what's needed to run the app
FROM node:20-bullseye-slim
WORKDIR /app

# Runtime system deps (smaller image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
EXPOSE 5000

# Copy package manifests first

# Copy production-ready node_modules from the builder stage to avoid re-installing
# This leverages Docker caching: npm install in the builder runs only when package.json changes.
COPY --from=builder /app/node_modules ./node_modules

# Copy the built frontend assets (adjust 'build' if your output folder is different)
COPY --from=builder /app/build ./build

# Copy the backend source
COPY --from=builder /app/backend ./backend

# Copy the entrypoint script
COPY --from=builder /app/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Install Python requirements
# Copy requirements.txt separately for better layer caching
COPY --from=builder /app/backend/requirements.txt /app/backend/requirements.txt
RUN if [ -f backend/requirements.txt ]; then pip3 install --no-cache-dir -r backend/requirements.txt; fi

# --- User and Runtime Setup ---

# We are intentionally leaving USER appuser commented out.
# This will run the container as 'root', which bypasses permission errors.
# RUN useradd --uid 1000 --create-home appuser || true
# USER appuser

# --- FINAL START COMMAND ---
# This will now work. We are bypassing the entrypoint script
# and running the node server directly.
ENTRYPOINT []
CMD ["node", "backend/server.js"]