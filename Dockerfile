# -----------------------------------------------------------------------------
# 1️⃣ Build stage
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder
WORKDIR /app

# 🚨 수정: 모든 환경 변수를 ARG로 받습니다. (Relayer Key 포함)
ARG NEXTAUTH_SECRET
ARG CONTRACT_ADDRESS_VOTING
ARG DB_URI
ARG RELAYER_PRIVATE_KEY  # 👈 RELAYER PRIVATE KEY 추가

# ENV로 설정 (빌드와 런타임 모두 사용 가능)
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV CONTRACT_ADDRESS_VOTING=$CONTRACT_ADDRESS_VOTING
ENV DB_URI=$DB_URI
ENV RELAYER_PRIVATE_KEY=$RELAYER_PRIVATE_KEY 

# 패키지 설치
COPY package*.json ./
RUN npm install

# 앱 복사 및 빌드
COPY . .
RUN npm run build

# -----------------------------------------------------------------------------
# 2️⃣ Production stage
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 빌드 산출물 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 🚨 참고: 런타임 ENV는 Render 대시보드에서 주입되므로,
# Build Stage에서 설정한 ENV만 런타임에 다시 설정할 필요는 없습니다.
# 하지만 코드를 안정적으로 유지하기 위해 그대로 둡니다.

# 포트 지정
EXPOSE 3000

# 서버 실행
CMD ["node", "server.js"]