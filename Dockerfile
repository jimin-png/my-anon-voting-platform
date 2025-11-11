# ------------------------------
# 1. Builder
# ------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

# 환경 변수 추가 (빌드 시점)
ENV DB_URI="mongodb+srv://kim_db_user:asdf1234@cluster0.2gzovqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
ENV NEXTAUTH_SECRET="a1b2c3d4e5f600112233445566778899aabbccddeeff00112233445566778899aa"
ENV CONTRACT_ADDRESS_VOTING="0xcB6d6d49D4c9eC6635c4D294DbFE0875D7F5fAd8"

RUN npm run build

# ------------------------------
# 2. Runner
# ------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public

# Render가 주는 PORT 환경변수 사용
ENV PORT 3000
EXPOSE 3000

# 서버 시작
CMD ["node", "server.js"]
