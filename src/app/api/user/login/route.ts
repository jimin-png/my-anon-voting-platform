// src/app/api/user/login/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Voter from '@/models/Voter'; // 유권자 모델 임포트

export async function POST(req: Request) {
    await dbConnect();

    // 🚨 등록 시 사용했던 walletAddress와 studentId를 받습니다.
    const { walletAddress, studentId } = await req.json();

    if (!walletAddress) {
        return NextResponse.json({ success: false, message: 'Wallet address is required.' }, { status: 400 });
    }

    try {
        // 1. DB에서 유권자 조회
        const voter = await Voter.findOne({ walletAddress, studentId });

        if (!voter) {
            return NextResponse.json({ success: false, message: 'User not found or credentials invalid.' }, { status: 401 });
        }

        // 2. 인증 성공 (토큰 발급 등은 생략하고 성공만 반환)
        // 🚨 실제로는 여기서 JWT 토큰을 생성하여 반환해야 합니다.
        return NextResponse.json({
            success: true,
            message: 'Login successful',
            // token: 'YOUR_AUTH_TOKEN',
            voterId: voter._id
        }, { status: 200 });

    } catch (err: unknown) {
        console.error("Login API Error:", err);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}