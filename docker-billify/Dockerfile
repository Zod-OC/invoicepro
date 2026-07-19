# Billify nginx frontend - multi-stage build
# Stage 1: Build the Next.js static export
FROM node:18-alpine AS builder

WORKDIR /build

# Install deps with separate layer caching
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Copy source and build
COPY next.config.mjs tsconfig.json tailwind.config.ts postcss.config.mjs ./
COPY src ./src
COPY api ./api
COPY public ./public

# Umami website ID (public value, not a secret — it's in client-side HTML).
# Passed from docker-compose build args. Empty until the Umami website is created;
# layout.tsx conditionally renders the snippet only when non-empty.
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID=""
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID
# Google Drive Client ID for browser-only cloud sync (optional feature).
# If unset, the Sync button is hidden — no feature, no GCP dependency.
ARG NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=""
ENV NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID

# Build static export (output: 'export' with distDir: 'dist' → /build/dist)
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built static files to nginx html dir
COPY --from=builder /build/dist/ /usr/share/nginx/html/

# Copy nginx config (handles SPA routing + Stripe proxy)
COPY docker-billify/nginx.conf /etc/nginx/conf.d/default.conf
