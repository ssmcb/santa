# syntax=docker/dockerfile:1.6

# Base image
FROM node:22-alpine AS base
WORKDIR /app

# Optional but nice to keep analytics off
ENV NEXT_TELEMETRY_DISABLED=1

# -----------------------------
# 1. Dependencies stage
# -----------------------------
FROM base AS deps

# Install system deps
RUN apk add --no-cache libc6-compat

# Install JS deps
COPY package*.json ./
RUN npm ci

# -----------------------------
# 2. Build stage
# -----------------------------
FROM base AS builder

# Build-time defaults so Next.js doesn't crash when importing env-dependent modules.
# These are NOT your real secrets; they are only used during `next build`.
ARG SESSION_SECRET="dev_session_secret_0123456789_abcdefghijklmnopqrstuvwxyz"
ARG MONGODB_URI="mongodb://localhost:27017/santa-dev"

ENV SESSION_SECRET=${SESSION_SECRET}
ENV MONGODB_URI=${MONGODB_URI}

# Bring dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js app
RUN npm run build

# -----------------------------
# 3. Runtime stage
# -----------------------------
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# System deps
RUN apk add --no-cache libc6-compat

# Use production deps only in final image
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/messages ./messages

EXPOSE 3000

# Dokploy will inject REAL env vars (SESSION_SECRET, MONGODB_URI, etc.) at runtime.
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]
