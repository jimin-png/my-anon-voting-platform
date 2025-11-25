// __tests__/stressTest.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수
const RPC_URL = process.env.RPC_URL;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const VOTING_ADDRESS = process.env.CONTRACT_ADDRESS_VOTING;

// Hardhat artifact 읽기
const abiPath = path.join(__dirname, '../artifacts/VotingABI.json');
if (!fs.existsSync(abiPath)) {
  console.error(`ABI 파일이 존재하지 않습니다: ${abiPath}`);
  process.exit(1);
}
const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
const votingABI = artifact.abi; // ✅ 여기서 abi만 추출

// Provider & Wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

// Contract 연결 (ethers v6)
const votingContract = new ethers.Contract(VOTING_ADDRESS, votingABI, wallet);

// Contract 함수 확인
console.log('Contract methods:', Object.keys(votingContract).filter(k => typeof votingContract[k] === 'function'));

if (typeof votingContract.vote !== 'function') {
  console.error('vote 함수가 Contract에 없습니다. ABI 확인 필요');
  process.exit(1);
}

// Stress Test 함수
async function runStressTest(txCount = 10, live = false) {
  console.log(`Stress test 시작 - live 모드: ${live}`);

  for (let i = 0; i < txCount; i++) {
    try {
      const proposalId = 0;     // 테스트용 Proposal ID
      const proof = '0x';       // 테스트용 proof (실제 검증 시 교체)
      const pubSignals = [0];   // 테스트용 public signals

      if (live) {
        const tx = await votingContract.vote(proposalId, proof, pubSignals);
        await tx.wait();
        console.log(`Tx ${i + 1} 전송 완료: ${tx.hash}`);
      } else {
        await votingContract.estimateGas.vote(proposalId, proof, pubSignals);
        console.log(`Tx ${i + 1} 시뮬레이션 완료`);
      }
    } catch (err) {
      console.log(`Tx ${i + 1} ${(live ? '' : '(시뮬레이션)')}실패:`, err.message);
    }
  }

  console.log('Stress test 종료');
}

// 실행
runStressTest(10, false);
