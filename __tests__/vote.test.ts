import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import { POST } from '@/app/api/vote/route';

describe("E2E Stability and Functionality Test", () => {
    beforeAll(async () => {
        await dbConnect();
        await mongoose.connection.db!.collection('votes').deleteMany({});
    });

    const TOTAL_RUNS = 3;
    const TEST_IP = '192.168.0.10';

    test("Transaction Chain Stability: first vote 200, others 403", async () => {
        for (let i = 1; i <= TOTAL_RUNS; i++) {
            // Next.js Route Handler는 Request 객체 필요
            const mockRequest = {
                json: async () => ({ vote_option_id: 1 }),
                headers: new Map([['x-forwarded-for', TEST_IP]])
            } as unknown as Request;

            const res = await POST(mockRequest);

            const data = await res.json();
            if (i === 1) {
                expect(res.status).toBe(200);
                expect(data.success).toBe(true);
            } else {
                expect(res.status).toBe(403);
                expect(data.success).toBe(false);
            }
        }
    });

    test("Final Check: Tally Endpoint reflects successful vote", async () => {
        const db = mongoose.connection.db!;
        const votes = await db.collection('votes').find().toArray();
        expect(votes.length).toBe(1);
        expect(votes[0].voteOptionId).toBe(1);
    });
});
