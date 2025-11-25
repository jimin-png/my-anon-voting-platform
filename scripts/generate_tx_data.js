// scripts/generate_tx_data.js
import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// 환경변수
const PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS_VOTING;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

if (!PRIVATE_KEY || !CONTRACT_ADDRESS || !RPC_URL) {
  throw new Error("환경변수 RELAYER_PRIVATE_KEY, CONTRACT_ADDRESS_VOTING 또는 RPC_URL이 없습니다.");
}

// 테스트용 데이터
const POLL_ID = "60c72b2f9f1b2c001a1c4b4a";
const CHAIN_ID = 11155111; // Sepolia
const DEADLINE = Math.floor(Date.now() / 1000) + 3600; // 1시간 뒤

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const transactionData = [];

async function main() {
  const baseNonce = await provider.getTransactionCount(wallet.address);

  for (let i = 0; i < 100; i++) {
    const tx = {
      to: CONTRACT_ADDRESS,
      value: 0,
      data: "0x",
      nonce: baseNonce + i,
      gasLimit: 21000,
      chainId: CHAIN_ID
    };
    const signedTx = await wallet.signTransaction(tx);
    transactionData.push({
      signedTx,
      pollId: POLL_ID,
      chainId: CHAIN_ID,
      deadline: DEADLINE
    });
  }

  const filePath = path.join(process.cwd(), '__tests__', 'test-data-100.js');
  fs.writeFileSync(
    filePath,
    `export const transactionData = ${JSON.stringify(transactionData, null, 2)};`
  );

  console.log("✅ 100건 Raw Tx Hex 생성 완료! 파일 위치:", filePath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
