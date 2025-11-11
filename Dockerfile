# 1. Builder 단계: Next.js 빌드
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 복사 및 설치
COPY package*.json ./
RUN npm install --production

# 앱 소스 복사
COPY . .

# Standalone 빌드
RUN npm run build

# ---------------------------------------

# 2. Runner 단계: Standalone 실행
FROM node:20-alpine AS runner
WORKDIR /app

# Standalone 빌드 파일 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public

# .env 환경변수 복사 (Render에서는 Render Secrets 추천)
# COPY --from=builder /app/.env.production ./.env

# 포트 환경변수
ENV PORT=$PORT

# 서버 실행
CMD ["node", "server.js"]
