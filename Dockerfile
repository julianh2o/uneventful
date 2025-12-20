# Multi-stage build for optimized production image

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Copy Prisma schema and config
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client (set dummy DATABASE_URL for build)
ENV DATABASE_URL="file:./data/uneventful.db"
RUN npx prisma generate

# Build the frontend
RUN yarn build

# Stage 2: Production image
FROM node:20-alpine

# Build arguments for version and metadata
ARG VERSION=unknown
ARG BUILD_DATE
ARG VCS_REF

# OCI standard labels
LABEL org.opencontainers.image.title="uneventful"
LABEL org.opencontainers.image.description="Event management application with form-driven workflows and automated SMS reminders"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${VCS_REF}"
LABEL org.opencontainers.image.authors="Dan Castro <https://www.welcomedeveloper.com>"
LABEL org.opencontainers.image.url="https://github.com/danilocastronz/weldev-project-react-mui-ts-bp"
LABEL org.opencontainers.image.source="https://github.com/danilocastronz/weldev-project-react-mui-ts-bp"

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies only
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# Copy Prisma schema, config, and migrations
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client in production (set dummy DATABASE_URL for build)
ENV DATABASE_URL="file:./data/uneventful.db"
RUN npx prisma generate && \
    rm -rf /root/.npm /tmp/*

# Copy built frontend from builder stage
COPY --from=builder /app/build ./build

# Copy server code
COPY server ./server

# Copy config files needed at runtime
COPY src/config ./src/config

# Create data directory for database
RUN mkdir -p data

# Expose the port (defaults to 2999 but can be overridden with PORT env var)
EXPOSE 2999

# Set NODE_ENV to production
ENV NODE_ENV=production

# Store version info
ENV APP_VERSION="${VERSION}"

# Start the server (run migrations first)
CMD ["sh", "-c", "npx prisma migrate deploy && yarn server"]
