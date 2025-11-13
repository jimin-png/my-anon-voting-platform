# 1️⃣ Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# 빌드 시점 환경변수 받기
ARG NEXTAUTH_SECRET
ARG CONTRACT_ADDRESS_VOTING
ARG DB_URI

# ENV로 설정 (빌드와 런타임 모두 사용 가능)
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV CONTRACT_ADDRESS_VOTING=$CONTRACT_ADDRESS_VOTING
ENV DB_URI=$DB_URI

# 패키지 설치
COPY package*.json ./
RUN npm install

# 앱 복사 및 빌드
COPY . .
RUN npm run build

# 2️⃣ Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 빌드 산출물 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 포트 지정
EXPOSE 3000

# 서버 실행
CMD ["node", "server.js"]
