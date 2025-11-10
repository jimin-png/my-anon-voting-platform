# -----------------------------------------------------------------------------
# 1단계: 빌드 (Build Stage)
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# 🚨 BUILD TIME ENVIRONMENT INJECTION (빌드 시 환경 변수 임시 주입)
# 빌드 단계에서 Next.js가 DB_URI와 CONTRACT_ADDRESS를 찾지 못하고 오류를 내는 것을 방지합니다.
# 값은 Runner Stage에서 Render의 실제 Secret 값으로 덮어쓰여집니다.

# DB_URI 주입
ARG DB_URI_BUILD_TIME="placeholder_db_uri_for_build"
ENV DB_URI=$DB_URI_BUILD_TIME

# CONTRACT_ADDRESS 주입 (필요하다면 주석 해제하여 사용)
# ARG CONTRACT_ADDRESS_VOTING_BUILD_TIME="0x0000000000000000000000000000000000000000"
# ENV CONTRACT_ADDRESS_VOTING=$CONTRACT_ADDRESS_VOTING_BUILD_TIME
# ARG CONTRACT_ADDRESS_COUNTER_BUILD_TIME="0x0000000000000000000000000000000000000000"
# ENV CONTRACT_ADDRESS_COUNTER=$CONTRACT_ADDRESS_COUNTER_BUILD_TIME


RUN npm run build # Next.js 빌드 실행 (standalone 폴더 생성)


# -----------------------------------------------------------------------------
# 2단계: 실행 (Runner Stage) - 최소한의 파일만 포함
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runner

# 1. 환경 변수 설정 (Render가 등록된 Secret 값으로 덮어씁니다.)
ENV NODE_ENV="production"
ENV PORT="3000"
# NOTE: 다른 모든 환경 변수(DB_URI, CONTRACT_ADDRESS 등)는 Render 대시보드에서 주입됩니다.

WORKDIR /app

# 2. Standalone 모드의 핵심: 실행에 필요한 최소한의 파일만 복사
# .next/static 폴더 (정적 자원) 복사
COPY --from=builder /app/.next/static ./.next/static
# public 폴더 복사
COPY --from=builder /app/public ./public
# standalone 폴더의 내용 (실행 파일 및 종속성)을 루트로 복사
COPY --from=builder /app/.next/standalone ./

# 3. 서버 실행 명령어: standalone 모드의 진입점 (entry point)
CMD ["node", "server.js"]