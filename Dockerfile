# Multi-stage Dockerfile for MIS Report Extractor

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY client/ ./

# Build frontend
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/server

# Copy package files
COPY server/package*.json ./
COPY server/prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy backend source
COPY server/ ./

# Generate Prisma Client
RUN npx prisma generate

# Build backend
RUN npm run build

# Stage 3: Production Image
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY server/package*.json ./
COPY server/prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate

# Copy built backend
COPY --from=backend-builder /app/server/dist ./dist

# Copy built frontend
COPY --from=frontend-builder /app/client/dist ./public

# Create uploads directory
RUN mkdir -p /app/uploads /app/reports

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]
