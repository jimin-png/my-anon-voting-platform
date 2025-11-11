# ------------------------------
# 1. Builder
# ------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# package.json, package-lock.json 복사
COPY package*.json ./

# devDependencies 포함 설치
RUN npm install

# 소스코드 복사
COPY . .

# Standalone 빌드
RUN npm run build

# ------------------------------
# 2. Runner
# ------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Standalone 빌드 파일 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public

# 환경변수
ENV PORT=$PORT

# 서버 실행
CMD ["node", "server.js"]
