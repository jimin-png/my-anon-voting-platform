// vote.test.ts (캡스톤 6주차 최종 E2E 테스트)

import test, { describe } from 'node:test'; // Node.js 테스트 러너
import assert from 'node:assert';
import request from 'supertest'; // HTTP 클라이언트

// -----------------------------------------------------------
// 🚨 환경 변수 및 상수 정의
// -----------------------------------------------------------

const API_BASE = 'https://my-anon-voting-platform.onrender.com';
const HEALTH_ENDPOINT = '/api/healthz';
const VOTE_ENDPOINT = '/api/vote';
const TOTAL_RUNS = 20;

// -----------------------------------------------------------

describe('E2E Stability and Functionality Test', () => {

    // 1. 초기화 및 헬스 체크
    test('Initialization: Health Check and Data Setup', async () => {
        // [1] DB 연결 상태 확인
        const health = await request(API_BASE).get(HEALTH_ENDPOINT);
        // assert를 사용하여 200 OK와 DB 연결 상태를 확인합니다.
        assert.strictEqual(health.statusCode, 200, "Health status code must be 200");
        assert.strictEqual(health.body.db, 'ok', "Database must be connected");

        // 참고: 최종 검증을 위해 DB의 투표 기록을 초기화하는 로직이 필요할 수 있습니다.
    });

    // 2. 트랜잭션 체인 안정성 테스트 (20회 연속 실행)
    test('Transaction Chain Stability: Should allow first vote and block subsequent votes (simulating 20 uninterrupted checks)', async () => {
        const votePayload = { vote_option_id: 1 };

        for (let i = 1; i <= TOTAL_RUNS; i++) {
            console.log(`--- Transaction Attempt #${i} ---`);

            const voteResponse = await request(API_BASE).post(VOTE_ENDPOINT).send(votePayload);

            if (i === 1) {
                // 🚨 1회차: 투표 성공 (200 OK)을 기대합니다.
                assert.strictEqual(voteResponse.statusCode, 200, `Attempt #${i}: First vote must succeed (200 OK)`);
                assert.strictEqual(voteResponse.body.success, true, `Attempt #${i}: First vote success flag must be true`);
            } else {
                // 🚨 2회차 이후: 중복 투표 방지 (403 Forbidden)를 기대합니다.
                assert.strictEqual(voteResponse.statusCode, 403, `Attempt #${i}: Duplicate vote must be blocked (403 Forbidden)`);
                assert.strictEqual(voteResponse.body.success, false, `Attempt #${i}: Duplicate vote success flag must be false`);
            }
        }

        console.log(`\n--- SUCCESS: ${TOTAL_RUNS} transactions processed without interruption. ---`);
    });

    // 3. 최종 결과 확인 (예시: /tally 엔드포인트 검증)
    test('Final Check: Tally Endpoint reflects successful vote', async () => {
        const tallyResponse = await request(API_BASE).get('/api/tally');
        assert.strictEqual(tallyResponse.statusCode, 200, "Tally status code must be 200");

        // 투표 수 확인 로직 (최소 1표 이상 등록되었는지 확인)
        const totalVotes = tallyResponse.body.tally.reduce((sum: number, item: any) => sum + item.count, 0);
        assert.ok(totalVotes >= 1, "Total vote count must be 1 or more after successful vote");
    });
});