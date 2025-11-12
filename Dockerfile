# 1. Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# 패키지 설치
COPY package*.json ./
RUN npm install

# 앱 빌드
COPY . .
RUN npm run build

# 2. Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Next.js standalone 빌드 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# 포트 지정
EXPOSE 3000

# Next.js 실행
CMD ["node", "server.js"]
