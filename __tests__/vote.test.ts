// vote.test.ts (캡스톤 6주차 최종 E2E 테스트)

import { describe, test, beforeAll, expect } from '@jest/globals'; // Jest 표준 임포트
import assert from 'node:assert';
import request from 'supertest';
import dbConnect from '@/lib/dbConnect'; // 🚨 DB 연결 임포트
import { Db } from 'mongodb'; // MongoDB Driver Db 타입 임포트

// -----------------------------------------------------------
// 🚨 환경 변수 및 상수 정의
// -----------------------------------------------------------

const API_BASE = 'https://my-anon-voting-platform.onrender.com';
const HEALTH_ENDPOINT = '/api/healthz';
const VOTE_ENDPOINT = '/api/vote';
const TALLY_ENDPOINT = '/api/tally'; // 최종 집계 엔드포인트
const TOTAL_RUNS = 20;

// -----------------------------------------------------------
// 1. 🛠️ 데이터베이스 초기화 함수 (Test Cleanup Logic)
// -----------------------------------------------------------

async function cleanDatabase() {
    console.log('\n--- Starting Database Cleanup ---');
    try {
        const connection = await dbConnect();
        // Mongoose 연결 객체에서 Db 인스턴스 추출
        const db: Db = connection.connection.db!;

        // votes 컬렉션의 모든 문서를 삭제합니다.
        await db.collection("votes").deleteMany({});
        console.log('--- Database cleanup successful. All votes deleted. ---');
    } catch (e) {
        console.error('--- WARNING: Database cleanup failed! (Likely connection issue) ---', e);
        // 클린업 실패는 테스트 실패로 이어지지 않도록 예외 처리합니다.
    }
}

// -----------------------------------------------------------

describe('E2E Stability and Functionality Test', () => {

    // 🚨 테스트 스위트 시작 전에 DB를 정리합니다. (최종 403 오류 해결)
    beforeAll(async () => {
        await cleanDatabase();
    });

    // 1. 초기화 및 헬스 체크
    test('Initialization: Health Check and Data Setup', async () => {
        // [1] DB 연결 상태 확인 (cleanDatabase에서 실패하지 않았다면 성공 보장)
        const health = await request(API_BASE).get(HEALTH_ENDPOINT);
        expect(health.statusCode).toBe(200);
        expect(health.body.db).toBe('ok');
    });

    // 2. 트랜잭션 체인 안정성 테스트 (20회 연속 실행)
    test('Transaction Chain Stability: Should allow first vote and block subsequent votes', async () => {
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
    20000 // 20초 타임아웃 설정 (필요에 따라 조정)
    );

    // 3. 최종 결과 확인 (/api/tally 엔드포인트 검증)
    test('Final Check: Tally Endpoint reflects successful vote', async () => {
        const tallyResponse = await request(API_BASE).get(TALLY_ENDPOINT);

        expect(tallyResponse.statusCode).toBe(200);
        expect(tallyResponse.body.success).toBe(true);

        // 투표 수 확인 로직 (최소 1표 이상 등록되었는지 확인)
        const totalVotes = tallyResponse.body.tally.reduce((sum: number, item: any) => sum + item.count, 0);
        expect(totalVotes).toBeGreaterThanOrEqual(1); // 1회 투표가 성공했으므로 1표 이상이어야 함.
    });
});