# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Set npm configuration for better reliability
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000

COPY package*.json ./

# Install dependencies with retry logic
RUN npm ci --prefer-offline --no-audit --progress=false || \
    (sleep 10 && npm ci --prefer-offline --no-audit --progress=false) || \
    (sleep 30 && npm ci --prefer-offline --no-audit --progress=false)

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production --prefer-offline --no-audit --progress=false && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]