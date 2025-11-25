// src/app/api/relay/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import * as z from 'zod';
import { getNextNonce } from '@/lib/services/nonce.service';
import { trackTransactionConfirmation } from '@/lib/services/confirmation.service';

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!;
const INFURA_URL = process.env.INFURA_URL!;

const relaySchema = z.object({
    to: z.string().startsWith("0x"),
    data: z.string().startsWith("0x"),
    pollId: z.string(),
    chainId: z.number(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = relaySchema.parse(body);

        const provider = new ethers.JsonRpcProvider(INFURA_URL);
        const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

        // nonce 가져오기
        const nonce = await getNextNonce(provider);

        // 🚨 여기에서 relayer가 직접 gas 포함해서 트랜잭션 생성 → 서명
        const tx = await relayer.sendTransaction({
            to: validated.to,
            data: validated.data,
            nonce,
            chainId: validated.chainId,
            maxFeePerGas: ethers.parseUnits("3", "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
        });

        // 트랜잭션 추적
        trackTransactionConfirmation(tx.hash, validated.pollId, nonce);

        return NextResponse.json({
            success: true,
            txHash: tx.hash,
            nonce,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
