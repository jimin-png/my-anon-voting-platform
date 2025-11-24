// src/lib/services/nonce.service.ts

import { ethers } from 'ethers'; // Ethers.js 라이브러리 사용

// 🚨 환경 변수에서 Private Key를 가져와 Relayer 지갑 주소를 확보합니다.
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
if (!RELAYER_PRIVATE_KEY) {
    throw new Error("RELAYER_PRIVATE_KEY environment variable is not set.");
}
// Private Key를 사용하여 지갑 인스턴스 생성 (주소 확보용)
const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY);
const RELAYER_ADDRESS = relayerWallet.address;

// Redis를 사용하거나, 간단히 메모리 Map을 사용하여 Nonce를 관리합니다.
const nonceCache = new Map<string, number>();
const CHAIN_ID = process.env.CHAIN_ID || '1'; // 환경 변수에서 Chain ID 사용


/**
 * 블록체인에서 현재 Nonce를 조회하고, 캐시와 비교하여 다음에 사용될 Nonce를 반환합니다.
 * 🚨 수정: 함수 이름을 getNextNonce로 통일하고 Named Export를 사용합니다.
 * @param provider Ethers.js Provider 객체
 * @returns 다음에 사용할 트랜잭션 Nonce
 */
export async function getNextNonce(provider: ethers.JsonRpcProvider): Promise<number> {

    // 1. 블록체인 노드에서 현재 Nonce 조회
    const networkNonce = await provider.getTransactionCount(RELAYER_ADDRESS, 'pending');

    // 2. 서버 캐시에서 Nonce 조회
    const cachedNonce = nonceCache.get(RELAYER_ADDRESS) || 0;

    // 3. 핵심 로직: Nonce 충돌 방지 (Max 값 사용)
    const nextNonce = Math.max(networkNonce, cachedNonce);

    // 4. 캐시 업데이트: 다음에 사용할 값(nextNonce + 1)을 저장합니다.
    nonceCache.set(RELAYER_ADDRESS, nextNonce + 1);

    console.log(`[Nonce Service] Using Nonce ${nextNonce}. Cached next nonce: ${nextNonce + 1}`);

    // 5. 현재 트랜잭션에 사용할 Nonce 반환
    return nextNonce;
}