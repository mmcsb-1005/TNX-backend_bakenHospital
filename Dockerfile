FROM node:20-slim

WORKDIR /app

# Install system dependencies needed by native modules (e.g. html-pdf, openssl for Prisma)
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source and build
# (skip prisma migrate deploy at build time — database not available yet)
COPY . .
RUN npm run swagger && npx tsc

EXPOSE 3001

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
