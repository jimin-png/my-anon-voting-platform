// vote.test.ts (캡스톤 6주차 최종 E2E 테스트)

import { describe, test, beforeAll, expect } from '@jest/globals'; // Jest 표준 임포트
import request from 'supertest';
import dbConnect from '@/lib/dbConnect';
import { Db } from 'mongodb';
import { Mongoose } from 'mongoose';

// 🚨🚨🚨 최종 목표: 모든 코드 충돌 및 데이터 오류 해결 🚨🚨🚨
const { transactionData } = require('./test-data-100'); // 데이터 파일 임포트

// -----------------------------------------------------------
// 🚨 환경 변수 및 상수 정의
// -----------------------------------------------------------

const API_BASE = 'https://my-anon-voting-platform.onrender.com';
const HEALTH_ENDPOINT = '/api/healthz';
const VOTE_ENDPOINT = '/api/vote';
const TALLY_ENDPOINT = '/api/tally';
const TOTAL_RUNS = 20;

// 🚨 고유 ID 정의 (테스트 IP 및 유권자 ID 충돌 방지용)
const UNIQUE_TEST_IP = '192.168.1.100';
const UNIQUE_WALLET_ADDRESS = '0x1234567890123456789999999999999999990000';

// -----------------------------------------------------------
// 1. 🛠️ 데이터베이스 초기화 함수 (최종 수정)
// -----------------------------------------------------------

async function cleanDatabase() {
    console.log('\n--- Starting Database Cleanup ---');
    try {
        const connection = await dbConnect() as Mongoose;
        const db: Db = connection.connection.db!;

        // 🚨 1. votes 컬렉션 삭제 (IP 중복 제거)
        await db.collection("votes").deleteMany({});

        // 🚨 2. 유권자 컬렉션 삭제 (Voter 등록 기록 제거) - 403 오류 최종 해결
        await db.collection("voters").deleteMany({});

        console.log('--- Database cleanup successful. All records deleted. ---');
    } catch (e) {
        console.error('--- WARNING: Database cleanup failed! (May affect test results) ---', e);
    }
}

// -----------------------------------------------------------

describe('E2E Stability and Functionality Test', () => {

    beforeAll(async () => {
        // 1. 테스트 전에 DB 정리
        await cleanDatabase();

        // 2. 🚨 투표를 위해 유효한 유권자를 먼저 등록합니다. (Register Endpoint 사용)
        const registerPayload = {
            name: "Test User E2E",
            walletAddress: UNIQUE_WALLET_ADDRESS,
            studentId: "00000000",
        };
        const registerResponse = await request(API_BASE).post('/api/user/register').send(registerPayload);

        // 등록이 성공(201)하거나 이미 등록되었다(409)면 계속 진행합니다.
        expect([201, 409]).toContain(registerResponse.statusCode);
    }, 15000);

    // 1. 초기화 및 헬스 체크
    test('Initialization: Health Check and Data Setup', async () => {
        const health = await request(API_BASE).get(HEALTH_ENDPOINT);
        expect(health.statusCode).toBe(200);
        expect(health.body.db).toBe('ok');
    }, 10000);

    // 2. 트랜잭션 체인 안정성 테스트 (20회 연속 실행)
    test('Transaction Chain Stability: Should allow first vote and block subsequent votes', async () => {
        // 🚨 400 오류 해결: API가 요구하는 모든 필드를 포함합니다.
        const votePayload = {
            vote_option_id: 1,
            walletAddress: UNIQUE_WALLET_ADDRESS // 등록된 유권자 주소 사용
        };

        for (let i = 1; i <= TOTAL_RUNS; i++) {
            console.log(`--- Transaction Attempt #${i} ---`);

            // X-Forwarded-For 헤더를 주입하여 고유 IP로 인식시킵니다.
            const voteResponse = await request(API_BASE)
                .post(VOTE_ENDPOINT)
                .set('X-Forwarded-For', UNIQUE_TEST_IP)
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
    20000
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