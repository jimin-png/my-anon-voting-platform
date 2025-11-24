// vote.test.ts (캡스톤 6주차 최종 E2E 테스트)

import { describe, test, beforeAll, expect } from '@jest/globals'; // Jest 표준 임포트
import request from 'supertest';
import dbConnect from '@/lib/dbConnect';
import { Db } from 'mongodb';
import { Mongoose } from 'mongoose';

// 🚨🚨🚨 최종 수정: CommonJS(require)를 사용하여 데이터 파일 임포트 🚨🚨🚨
// (test-data-100.js 파일이 module.exports를 사용한다고 가정)
const { transactionData } = require('./test-data-100');
// -----------------------------------------------------------

// -----------------------------------------------------------
// 🚨 환경 변수 및 상수 정의
// -----------------------------------------------------------

const API_BASE = 'https://my-anon-voting-platform.onrender.com';
const HEALTH_ENDPOINT = '/api/healthz';
const VOTE_ENDPOINT = '/api/vote';
const TALLY_ENDPOINT = '/api/tally';
const TOTAL_RUNS = 20;

// 🚨 고유 IP 주소 정의 (테스트 IP 캐싱 문제 해결용)
const UNIQUE_TEST_IP = '192.168.1.100';

// -----------------------------------------------------------
// 1. 🛠️ 데이터베이스 초기화 함수 (Test Cleanup Logic)
// -----------------------------------------------------------

async function cleanDatabase() {
    console.log('\n--- Starting Database Cleanup ---');
    try {
        // DB 연결
        const connection = await dbConnect() as Mongoose;
        const db: Db = connection.connection.db!;

        // votes 컬렉션의 모든 문서를 삭제합니다.
        await db.collection("votes").deleteMany({});
        console.log('--- Database cleanup successful. All votes deleted. ---');
    } catch (e) {
        console.error('--- WARNING: Database cleanup failed! (Likely connection issue) ---', e);
    }
}

// -----------------------------------------------------------

describe('E2E Stability and Functionality Test', () => {

    // 테스트 시작 전에 DB를 정리합니다.
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
        // 🚨 데이터 배열에서 첫 번째 항목을 투표 페이로드로 사용
        const votePayload = transactionData[0];

        for (let i = 1; i <= TOTAL_RUNS; i++) {
            console.log(`--- Transaction Attempt #${i} ---`);

            // X-Forwarded-For 헤더를 주입하여 고유 IP로 인식시킵니다.
            const voteResponse = await request(API_BASE)
                .post(VOTE_ENDPOINT)
                .set('X-Forwarded-For', UNIQUE_TEST_IP)
                .send(votePayload);

            if (i === 1) {
                // 1회차: 투표 성공 (200 OK)을 기대합니다.
                expect(voteResponse.statusCode).toBe(200);
                expect(voteResponse.body.success).toBe(true);
            } else {
                // 2회차 이후: 중복 투표 방지 (403 Forbidden)을 기대합니다.
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

        // 투표 수 확인 로직 (1표 이상 등록되었는지 확인)
        const totalVotes = tallyResponse.body.tally.reduce((sum: number, item: any) => sum + item.count, 0);
        expect(totalVotes).toBeGreaterThanOrEqual(1);
    });
});