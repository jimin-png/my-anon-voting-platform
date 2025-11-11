// src/app/api/vote/results/route.ts

import dbConnect from "@/lib/dbConnect";
import Vote from "@/models/Vote";

export async function GET(req: Request) {
  if (req.method !== 'GET') {
    return new Response(null, { status: 405 });
  }

  try {
    await dbConnect(); // ✅ DB에 접속 시도

    // 1. 실제 DB 조회
    const allVotes = await Vote.find({}).lean(); // 모든 투표 데이터를 가져옴

    // 2. 투표 결과 집계 로직 (여기서는 간단한 예시)
    const results = allVotes.reduce((acc: any, vote: any) => {
      const candidate = vote.candidate;
      acc[candidate] = (acc[candidate] || 0) + 1;
      return acc;
    }, {});

    const finalResponse = {
      success: true,
      totalVotes: allVotes.length,
      results: results,
      message: '투표 결과 조회 성공',
    };

    // 3. 성공 응답 (HTTP 200 OK)
    return new Response(JSON.stringify(finalResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: '서버 오류: DB 조회 실패' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json, charset=utf-8' },
      }
    );
  }
}
