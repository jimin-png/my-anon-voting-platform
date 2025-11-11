// src/app/api/vote/create/route.ts
import dbConnect from "@/lib/dbConnect";
import Vote from "@/models/Vote";
import Voter from "@/models/Voter";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();

    // 팀 다른 코드/에러 메시지 기준: walletAddress + candidate 필요
    const walletAddress = body?.walletAddress as string | undefined;
    const candidate = body?.candidate as string | undefined;

    if (!walletAddress || !candidate) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'walletAddress, candidate 필수',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1) 유권자 조회
    const voterDoc = await Voter.findOne({ walletAddress }).lean();
    if (!voterDoc?._id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '등록되지 않은 유권자입니다.',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2) 중복 투표 방지 (이미 투표했는지 확인)
    const already = await Vote.exists({ voter: voterDoc._id });
    if (already) {
      return new Response(
        JSON.stringify({ success: false, message: '이미 투표하였습니다.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3) 투표 저장
    const newVote = await Vote.create({
      voter: voterDoc._id,
      candidate,
      // txHash: body?.txHash ?? undefined, // 추후 연결 시
    });

    // (선택) 유권자 상태 플래그 업데이트
    // await Voter.updateOne({ _id: voterDoc._id }, { $set: { hasVoted: true } });

    return new Response(
      JSON.stringify({
        success: true,
        message: '투표 기록 완료',
        data: { _id: newVote._id, voter: voterDoc._id, candidate },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    if (error?.code === 11000) {
      return new Response(
        JSON.stringify({ success: false, message: '이미 투표하였습니다.' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }
    console.error('API Error /api/vote/create:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }
}
