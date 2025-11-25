// src/data/test-data-101.js
export const transactionData = [
  {
    signedTx: '0x1234abcd...',   // 테스트용 시뮬레이션 서명
    pollId: 'poll_001',
    chainId: 31337,              // Hardhat 로컬 노드용
    deadline: Date.now() + 100000
  },
  {
    signedTx: '0x5678efgh...',
    pollId: 'poll_002',
    chainId: 31337,
    deadline: Date.now() + 100000
  }
];
