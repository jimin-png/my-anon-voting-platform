# 1. Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# 종속성 설치
COPY package*.json ./
RUN npm install

# 앱 빌드
COPY . .
RUN npm run build

# 2. Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 빌드 산출물 복사 (standalone 실행용)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# 런타임에 필요한 패키지 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 포트 지정
EXPOSE 3000

# Next.js 서버 시작
CMD ["node", "server.js"]
