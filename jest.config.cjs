// jest.config.js (TS1295 오류 해결 및 최신 설정)

module.exports = {
  // 1. 기본 설정
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],

  // 🚨 2. 모듈 충돌 해결: transform 섹션을 사용하여 ts-jest 설정 주입
  // Jest에게 .ts 파일을 CommonJS 모듈로 변환하도록 명시적으로 지시합니다.
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        // 🚨 tsconfig 설정을 덮어씌워 CommonJS 모듈을 사용하도록 강제
        tsconfig: {
          module: 'commonjs',
          verbatimModuleSyntax: false, // 엄격한 검사 해제
        },
      },
    ],
  },

  // 3. 별칭(Alias) 경로 설정 (tsconfig.json의 paths를 Jest가 이해하도록)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/models/(.*)$': '<rootDir>/src/models/$1',
  },
};