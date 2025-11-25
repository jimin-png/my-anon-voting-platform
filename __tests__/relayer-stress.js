// __tests__/relayer-stress.js
import 'dotenv/config'; // .env 파일 로드
import { ethers } from 'ethers';
import { transactionData } from './test-data-100.js';

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;

if (!RPC_URL || !PRIVATE_KEY) {
  throw new Error("환경변수 RPC_URL 또는 RELAYER_PRIVATE_KEY가 없습니다.");
}

// ethers v6 방식
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

async function main() {
  console.log(`총 ${transactionData.length}건의 트랜잭션을 전송합니다...`);

  for (let i = 0; i < transactionData.length; i++) {
    const txInfo = transactionData[i];

    try {
      // broadcastTransaction 사용
      const txResponse = await provider.broadcastTransaction(txInfo.signedTx);
      console.log(`[${i + 1}] 전송 완료! Tx Hash: ${txResponse.hash}`);
      await txResponse.wait();
    } catch (err) {
      console.error(`[${i + 1}] 전송 실패`, err);
    }
  }

  console.log("✅ 모든 트랜잭션 전송 완료!");
}

main().catch(err => {
  console.error("Relayer 실행 중 오류 발생:", err);
  process.exit(1);
});
