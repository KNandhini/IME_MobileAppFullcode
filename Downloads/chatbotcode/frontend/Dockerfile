# Frontend multi-stage Dockerfile: builds Vite client and runs Express server

# Allow overriding the base image (useful for mirrors or preloaded images)
ARG NODE_IMAGE=node:20-bullseye-slim

# Stage 1: Build client with Vite
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

# Install OS deps for node-gyp if any optional deps are present
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# Copy only package manifests first for better caching
COPY package.json package-lock.json* ./

# Install dependencies (including dev for build)
RUN npm ci

# Copy the rest of the source
COPY . .

# Build client and server bundle
RUN npm run build

# Stage 2: Runtime image
FROM ${NODE_IMAGE} AS runner

ENV NODE_ENV=production
WORKDIR /app

# Copy only the minimal runtime artifacts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
#COPY --from=builder /app/vite.config.* ./ 
#COPY --from=builder /app/server ./server

# Expose the port used by the server
EXPOSE 8080

# Default command uses the built server bundle
CMD ["node", "dist/index.js"]
