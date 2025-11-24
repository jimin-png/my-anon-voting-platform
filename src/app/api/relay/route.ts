// src/app/api/relay/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import * as z from 'zod';
// 🚨 수정: Named Import로 변경하여 TypeScript 오류 해결
import { getNextNonce } from '@/lib/services/nonce.service';
// 🚨 6주차에 구현한 재시도/확인 로직 임포트
import { trackTransactionConfirmation } from '@/lib/services/confirmation.service';


// -----------------------------------------------------------
// 1. 환경 변수 및 유효성 검증 스키마
// -----------------------------------------------------------

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const INFURA_URL = process.env.INFURA_URL;

// 🚨 요청 본문 유효성 검증 스키마 정의 (Zod)
const relaySchema = z.object({
    signedTx: z.string().startsWith('0x', { message: "유효하지 않은 트랜잭션 데이터 형식입니다." }),
    pollId: z.string().min(1, { message: "pollId는 필수입니다." }),
    deadline: z.number().int().positive({ message: "deadline은 유효한 숫자여야 합니다." }),
    chainId: z.number().int().positive({ message: "chainId는 필수입니다." }),
});

// -----------------------------------------------------------
// 2. 핵심 POST 핸들러
// -----------------------------------------------------------

export async function POST(req: NextRequest) {
    if (!INFURA_URL || !RELAYER_PRIVATE_KEY) {
        console.error("Configuration Error: Relayer secrets missing.");
        return NextResponse.json({ message: "서버 설정 오류: 필수 환경 변수 누락." }, { status: 500 });
    }

    try {
        const body = await req.json();

        // 2. Zod 유효성 검증 실행
        const validatedData = relaySchema.parse(body);

        // 3. Wallet 및 Provider 설정
        const provider = new ethers.JsonRpcProvider(INFURA_URL);
        const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

        // 4. Nonce 확보 (Named Import로 가져온 함수 사용)
        // 🚨 getNextNonce 함수에 provider를 인수로 전달해야 합니다.
        const nonce = await getNextNonce(provider);

        // 5. 트랜잭션 전송 (가스 대납)
        const txHash = await provider.send('eth_sendRawTransaction', [validatedData.signedTx]);

        // 6. 6주차 로직과 통합: 트랜잭션 추적 시작
        trackTransactionConfirmation(txHash, validatedData.pollId, nonce);

        // 7. 응답 반환
        return NextResponse.json({
            success: true,
            message: "Transaction sent successfully. Tracking confirmations.",
            txHash: txHash,
            relayerNonce: nonce, // 사용된 Nonce 값 (디버깅용)
        }, { status: 200 });

    } catch (error) {
        console.error("Relay API Error:", error);

        return NextResponse.json({
            message: "Relay Failed: Invalid input or connection error.",
            error: String(error)
        }, { status: 400 });
    }
}