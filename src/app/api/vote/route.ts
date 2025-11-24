import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ObjectId, Db } from 'mongodb';

// 테스트 환경에서 요청 헤더에 X-TEST-IP가 있으면 그 IP를 사용
const getClientIp = (request: Request): string => {
    const xTestIp = request.headers.get('x-test-ip');
    if (xTestIp) return xTestIp;

    const xForwardedFor = request.headers.get('x-forwarded-for');
    if (xForwardedFor) return xForwardedFor.split(',')[0].trim();

    const host = request.headers.get('host');
    if (host && (host.startsWith('localhost') || host.startsWith('127.0.0.1'))) {
        return '127.0.0.1';
    }

    return 'unknown';
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        if (!body.vote_option_id) {
            return NextResponse.json({ success: false, message: "Missing 'vote_option_id'." }, { status: 400 });
        }

        const clientIp = getClientIp(request);

        const connection = await dbConnect();
        const db: Db = connection.connection.db!;
        const collection = db.collection("votes");

        const existingVote = await collection.findOne({ clientIp });
        if (existingVote) {
            console.log('--- Duplicate Vote Blocked --- IP:', clientIp);
            return NextResponse.json({ success: false, message: "Duplicate vote detected." }, { status: 403 });
        }

        const voteData = {
            _id: new ObjectId(),
            voteOptionId: body.vote_option_id,
            timestamp: new Date(),
            clientIp
        };

        const result = await collection.insertOne(voteData);
        console.log('--- New Vote Recorded ---', result.insertedId, 'from IP:', clientIp);

        return NextResponse.json({
            success: true,
            message: "Vote recorded successfully.",
            voteId: result.insertedId.toHexString()
        }, { status: 200 });

    } catch (error: unknown) {
        console.error("Vote API Error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, message: "Internal Server Error", details: errorMessage }, { status: 500 });
    }
}
