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
COPY public ./public

# Build static export (output: 'export' with distDir: 'dist' → /build/dist)
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built static files to nginx html dir
COPY --from=builder /build/dist/ /usr/share/nginx/html/

# Copy nginx config (handles SPA routing + Stripe proxy)
COPY docker-billify/nginx.conf /etc/nginx/conf.d/default.conf
