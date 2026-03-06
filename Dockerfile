# Build stage for client
FROM node:20-alpine AS client-builder
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY .npmrc ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build client (Frontend)
RUN pnpm run build:client

# Build stage for server
FROM node:20-alpine AS server-builder
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY .npmrc ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build server (Backend)
RUN pnpm run build:server

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install only production dependencies
COPY package.json pnpm-lock.yaml ./
COPY .npmrc ./
RUN pnpm install --prod --frozen-lockfile

# Copy built client (SPA)
COPY --from=client-builder /app/dist/spa ./dist/spa

# Copy built server
COPY --from=server-builder /app/dist/server ./dist/server

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/ping', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start application
CMD ["node", "dist/server/node-build.mjs"]
