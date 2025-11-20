// src/app/api/tally/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Db } from 'mongodb'; // MongoDB Driver Db 타입 사용

export async function GET() {
    try {
        const connection = await dbConnect();
        // 🚨 Mongoose 연결 객체에서 Db 인스턴스 추출
        const db: Db = connection.connection.db!;
        const collection = db.collection("votes");

        // 🚨 투표 결과 집계를 위한 Aggregation Pipeline
        const aggregationPipeline = [
            // 1. 투표 상태가 최종 확정된 것만 필터링 (선택 사항: 만약 votes 컬렉션에 status 필드가 있다면)
            // { $match: { status: 'FINALIZED' } },

            // 2. 투표 옵션별 카운트
            { $group: { _id: "$voteOptionId", count: { $sum: 1 } } },

            // 3. 필드 이름 정리
            { $project: { _id: 0, optionId: "$_id", count: 1 } },

            // 4. 카운트 내림차순 정렬
            { $sort: { count: -1 } }
        ];

        const results = await collection.aggregate(aggregationPipeline).toArray();

        return NextResponse.json({
            success: true,
            tally: results,
            timestamp: new Date().toISOString()
        }, { status: 200 });

    } catch (error: unknown) {
        console.error("Tally API Error:", error);
        return NextResponse.json({
            success: false,
            message: "Internal Server Error during vote tally calculation."
        }, { status: 500 });
    }
}