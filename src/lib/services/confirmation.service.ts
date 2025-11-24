// src/lib/services/confirmation.service.ts

import { ethers } from 'ethers';

// 🚨 환경 변수
const INFURA_URL = process.env.INFURA_URL;
const CONFIRMATION_COUNT = 2; // 7주차 목표: 최소 2회 컨펌

// -----------------------------------------------------------
// 지수 백오프를 사용한 지연 함수
// -----------------------------------------------------------
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// -----------------------------------------------------------
// 트랜잭션 추적 및 확인 함수 (6주차 로직 활용)
// -----------------------------------------------------------

/**
 * 트랜잭션을 추적하고 최소 컨펌 횟수(CONFIRMATION_COUNT)를 기다립니다.
 * 실패 시 재시도 로직을 포함합니다.
 * @param txHash 전송된 트랜잭션 해시
 * @param pollId 관련 투표 ID
 * @param nonce 사용된 Nonce 값
 */
export async function trackTransactionConfirmation(
    txHash: string,
    pollId: string,
    nonce: number
) {
    console.log(`[Confirmation Tracker] Tx ${txHash} tracking started. Poll ID: ${pollId}, Nonce: ${nonce}`);

    if (!INFURA_URL) {
        console.error("INFURA_URL is not set. Cannot track transaction.");
        return;
    }

    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const MAX_ATTEMPTS = 5;
    let attempt = 0;

    while (attempt < MAX_ATTEMPTS) {
        attempt++;
        let delay = Math.pow(2, attempt) * 1000; // 2초, 4초, 8초... 지연 (지수 백오프)

        try {
            // 1. 트랜잭션 수신 확인
            const receipt = await provider.getTransactionReceipt(txHash);

            if (receipt && receipt.blockNumber) {
                // 2. 컨펌 횟수 확인
                const currentBlock = await provider.getBlockNumber();
                const confirmations = currentBlock - receipt.blockNumber + 1;

                if (confirmations >= CONFIRMATION_COUNT) {
                    // 🏆 최종 성공
                    console.log(`[Confirmation Success] Tx ${txHash} confirmed with ${confirmations} blocks.`);
                    // 🚨 여기서 데이터베이스에 최종 성공 상태를 기록합니다.
                    // 예: db.updateTxStatus(txHash, 'CONFIRMED');
                    return; // 함수 종료 (성공)
                } else {
                    console.log(`[Confirmation Pending] Tx ${txHash} has ${confirmations}/${CONFIRMATION_COUNT} confirmations. Retrying in ${delay}ms.`);
                }
            } else {
                console.log(`[Confirmation Pending] Tx ${txHash} is still pending. Retrying in ${delay}ms.`);
            }

        } catch (error) {
            console.error(`[Confirmation Error] Tx ${txHash} attempt ${attempt} failed: ${error}`);
            // 트랜잭션이 'Mined' 되었으나 Revert 된 경우, 재시도 없이 실패 처리할 수 있습니다.
        }

        if (attempt < MAX_ATTEMPTS) {
            await sleep(delay); // 백오프 지연
        }
    }

    // 🚨 최대 재시도 횟수 초과 시 최종 실패 처리
    console.error(`[Confirmation Failure] Tx ${txHash} failed after ${MAX_ATTEMPTS} attempts. Requires manual investigation.`);
    // 예: db.updateTxStatus(txHash, 'FAILED');
}