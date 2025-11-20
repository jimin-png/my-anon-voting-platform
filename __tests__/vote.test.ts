// vote.test.ts (캡스톤 6주차 최종 E2E 테스트)

// 🚨 Node.js 테스트 러너 대신 Jest 표준 전역 함수를 임포트
import { describe, test, expect } from '@jest/globals';
import request from 'supertest'; // HTTP 클라이언트

// -----------------------------------------------------------
// 🚨 환경 변수 및 상수 정의
// -----------------------------------------------------------

const API_BASE = 'https://my-anon-voting-platform.onrender.com';
const HEALTH_ENDPOINT = '/api/healthz';
const VOTE_ENDPOINT = '/api/vote';
const TALLY_ENDPOINT = '/api/tally'; // 최종 집계 엔드포인트
const TOTAL_RUNS = 20;

// -----------------------------------------------------------

describe('E2E Stability and Functionality Test', () => {

    // 1. 초기화 및 헬스 체크
    test('Initialization: Health Check and Data Setup', async () => {
        // [1] DB 연결 상태 확인
        const health = await request(API_BASE).get(HEALTH_ENDPOINT);

        // 🚨 Jest expect() 구문 사용
        expect(health.statusCode).toBe(200);
        expect(health.body.status).toBe('ok');
        expect(health.body.db).toBe('ok'); // DB 연결 상태 확인
    });

    // 2. 트랜잭션 체인 안정성 테스트 (20회 연속 실행)
    test('Transaction Chain Stability: Should allow first vote and block subsequent votes (simulating 20 uninterrupted checks)', async () => {
        const votePayload = { vote_option_id: 1 };

        for (let i = 1; i <= TOTAL_RUNS; i++) {
            console.log(`--- Transaction Attempt #${i} ---`);

            const voteResponse = await request(API_BASE).post(VOTE_ENDPOINT).send(votePayload);

            if (i === 1) {
                // 🚨 1회차: 투표 성공 (200 OK)을 기대합니다.
                expect(voteResponse.statusCode).toBe(200);
                expect(voteResponse.body.success).toBe(true);
            } else {
                // 🚨 2회차 이후: 중복 투표 방지 (403 Forbidden)을 기대합니다.
                expect(voteResponse.statusCode).toBe(403);
                expect(voteResponse.body.success).toBe(false);
            }
        }

        console.log(`\n--- SUCCESS: ${TOTAL_RUNS} transactions processed without interruption. ---`);
    },
    // 🚨 테스트 타임아웃 설정 (20번 실행 시 시간이 오래 걸릴 수 있으므로)
    20000 // 20초 타임아웃 설정 (필요에 따라 조정)
    );

    // 3. 최종 결과 확인 (/api/tally 엔드포인트 검증)
    test('Final Check: Tally Endpoint reflects successful vote', async () => {
        const tallyResponse = await request(API_BASE).get(TALLY_ENDPOINT);

        expect(tallyResponse.statusCode).toBe(200);
        expect(tallyResponse.body.success).toBe(true);

        // 투표 수 확인 로직 (최소 1표 이상 등록되었는지 확인)
        const totalVotes = tallyResponse.body.tally.reduce((sum: number, item: any) => sum + item.count, 0);
        expect(totalVotes).toBeGreaterThanOrEqual(1); // 1표 이상 등록되어야 함
    });
});