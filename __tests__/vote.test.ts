// 파일 이름: (예: __tests__/vote.test.ts)

import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import { POST } from '@/app/api/vote/route'; // 👈 테스트할 API 핸들러 임포트

describe("E2E Stability and Functionality Test", () => {

    // 🚨 1. 테스트 시작 전 DB 초기화 (Cleanup)
    beforeAll(async () => {
        await dbConnect(); // DB 연결을 보장

        // 🚨 수정: votes 컬렉션과 유권자 컬렉션 모두 삭제 (최종 오류 해결)
        // votes 컬렉션 삭제 (IP 중복 방지 기록)
        await mongoose.connection.db!.collection('votes').deleteMany({});

        // voters 컬렉션 삭제 (유권자 등록 기록)
        await mongoose.connection.db!.collection('voters').deleteMany({});

        // 참고: 다른 유권자 관련 컬렉션('users' 등)이 있다면 해당 컬렉션도 삭제해야 합니다.
    });

    const TOTAL_RUNS = 3;
    const TEST_IP = '192.168.0.10';

    // 2. 트랜잭션 안정성 테스트
    test("Transaction Chain Stability: first vote 200, others 403", async () => {
        for (let i = 1; i <= TOTAL_RUNS; i++) {
            // Next.js Route Handler에 전달할 모의 Request 객체 생성
            const mockRequest = {
                json: async () => ({ vote_option_id: 1 }), // 👈 투표 페이로드
                headers: new Map([['x-forwarded-for', TEST_IP]])
            } as unknown as Request;

            const res = await POST(mockRequest);

            const data = await res.json();
            if (i === 1) {
                // 1회차: 투표 성공 (200 OK)을 기대
                expect(res.status).toBe(200);
                expect(data.success).toBe(true);
            } else {
                // 2회차 이후: 중복 투표 차단 (403 Forbidden)을 기대
                expect(res.status).toBe(403);
                expect(data.success).toBe(false);
            }
        }
    });

    // 3. 최종 집계 확인
    test("Final Check: Tally Endpoint reflects successful vote", async () => {
        // DB 연결을 사용하며, Jest 실행 환경에서 Mongoose connection 객체 접근
        const db = mongoose.connection.db!;

        // 'votes' 컬렉션에 1건의 성공적인 투표 기록만 남았는지 확인
        const votes = await db.collection('votes').find().toArray();

        // 3회 시도 중 1회만 성공했으므로, DB에는 1건의 투표 기록만 있어야 합니다.
        expect(votes.length).toBe(1);
        expect(votes[0].voteOptionId).toBe(1);
    });
});