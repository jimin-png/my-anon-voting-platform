// vote.test.ts

import test, { describe } from 'node:test'; // 👈 Node.js 테스트 러너용
import assert from 'node:assert';
import request from 'supertest'; // 👈 supertest 임포트

// 🚨 1. 오류 해결: 모든 변수를 명시적으로 선언합니다.

const API_BASE = 'https://my-anon-voting-platform.onrender.com';
const HEALTH_ENDPOINT = '/api/healthz';
const RESULTS_ENDPOINT = '/api/results';
const VOTE_ENDPOINT = '/api/vote';
const TOTAL_RUNS = 20;

// -----------------------------------------------------------

describe('E2E Stability and Functionality Test', () => {

    // 1. 초기화 및 헬스 체크
    test('Initialization: Health Check and Data Setup', async () => {
        // [1] DB 연결 상태 확인
        const health = await request(API_BASE).get(HEALTH_ENDPOINT);
        // 🚨 expect 대신 assert를 사용하거나 jest/vitest 환경을 구성해야 합니다.
        assert.strictEqual(health.statusCode, 200, "Health status code must be 200");
        assert.strictEqual(health.body.db, 'ok', "Database must be connected");

        // ... (나머지 초기 설정 코드는 그대로 유지)
    });

    // ... (나머지 for 루프 로직은 그대로 유지)
});