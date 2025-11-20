// vote.test.ts (캡스톤 6주차 최종 E2E 테스트)

import { describe, test, beforeAll, expect } from '@jest/globals'; // Jest 표준 임포트
// import assert from 'node:assert'; // 🚨 assert 임포트 제거
import request from 'supertest';
import dbConnect from '@/lib/dbConnect';
import { Db } from 'mongodb';
import { Mongoose } from 'mongoose'; // Mongoose 타입 추가 (선택 사항)

// -----------------------------------------------------------
// 🚨 환경 변수 및 상수 정의
// -----------------------------------------------------------

const API_BASE = 'https://my-anon-voting-platform.onrender.com';
const HEALTH_ENDPOINT = '/api/healthz';
const VOTE_ENDPOINT = '/api/vote';
const TALLY_ENDPOINT = '/api/tally'; // 최종 집계 엔드포인트
const TOTAL_RUNS = 20;
// 🚨 고유 IP 주소 정의 (테스트 IP 캐싱 문제 해결용)
const UNIQUE_TEST_IP = '192.168.1.100';

// -----------------------------------------------------------
// 1. 🛠️ 데이터베이스 초기화 함수 (Test Cleanup Logic)
// -----------------------------------------------------------

async function cleanDatabase() {
    console.log('\n--- Starting Database Cleanup ---');
    try {
        const connection = await dbConnect() as Mongoose; // Mongoose 타입 명시
        // Mongoose 연결 객체에서 Db 인스턴스 추출
        const db: Db = connection.connection.db!;

        // votes 컬렉션의 모든 문서를 삭제합니다.
        await db.collection("votes").deleteMany({});
        console.log('--- Database cleanup successful. All votes deleted. ---');
    } catch (e) {
        console.error('--- WARNING: Database cleanup failed! (May affect test results) ---', e);
    }
}

// -----------------------------------------------------------

describe('E2E Stability and Functionality Test', () => {

    beforeAll(async () => {
        await cleanDatabase();
    });

    // 1. 초기화 및 헬스 체크
    test('Initialization: Health Check and Data Setup', async () => {
        const health = await request(API_BASE).get(HEALTH_ENDPOINT);
        expect(health.statusCode).toBe(200);
        expect(health.body.db).toBe('ok');
    });

    // 2. 트랜잭션 체인 안정성 테스트 (20회 연속 실행)
    test('Transaction Chain Stability: Should allow first vote and block subsequent votes', async () => {
        const votePayload = { vote_option_id: 1 };

        for (let i = 1; i <= TOTAL_RUNS; i++) {
            console.log(`--- Transaction Attempt #${i} ---`);

            // 🚨 최종 수정: X-Forwarded-For 헤더를 주입하여 고유 IP로 인식시킵니다.
            const voteResponse = await request(API_BASE)
                .post(VOTE_ENDPOINT)
                .set('X-Forwarded-For', UNIQUE_TEST_IP) // 👈 고유 IP 주입
                .send(votePayload);

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
    20000 // 20초 타임아웃 설정
    );

    // 3. 최종 결과 확인 (/api/tally 엔드포인트 검증)
    test('Final Check: Tally Endpoint reflects successful vote', async () => {
        const tallyResponse = await request(API_BASE).get(TALLY_ENDPOINT);

        expect(tallyResponse.statusCode).toBe(200);
        expect(tallyResponse.body.success).toBe(true);

        const totalVotes = tallyResponse.body.tally.reduce((sum: number, item: any) => sum + item.count, 0);
        expect(totalVotes).toBeGreaterThanOrEqual(1);
    });
});