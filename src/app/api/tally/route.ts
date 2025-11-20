// src/app/api/tally/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Db } from 'mongodb';

export async function GET() {
    try {
        const connection = await dbConnect();
        // Mongoose 연결 객체에서 Db 인스턴스 추출
        const db: Db = connection.connection.db!;
        const collection = db.collection("votes");

        // 🚨 투표 결과 집계를 위한 Aggregation Pipeline
        const aggregationPipeline = [

            // 1. 🚨 수정: voteOptionId 필드가 null이거나 존재하지 않는 문서를 필터링합니다.
            //    (이전 집계에서 null 값 111개를 유발했던 데이터 품질 문제 해결)
            { $match: { voteOptionId: { $ne: null } } },

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

        const errorMessage = error instanceof Error ? error.message : String(error);

        return NextResponse.json({
            success: false,
            message: "Internal Server Error during vote tally calculation.",
            details: errorMessage
        }, { status: 500 });
    }
}