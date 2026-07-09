# ==============================================================================
# Kapis AI Platform - api-server (NestJS)
# Multi-stage build: install once, compile once, ship only the production
# node_modules + compiled dist into a slim, non-root runtime image.
# ==============================================================================

FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

COPY --from=build /app/dist ./dist

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
USER nestjs

EXPOSE 3000
CMD ["node", "dist/main.js"]
