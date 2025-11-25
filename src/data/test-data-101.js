// src/data/test-data-101.js
/**
 * 테스트용 트랜잭션 데이터
 * - stressTest.js에서 import하여 사용
 * - 실제 환경에서는 나중에 다른 트랜잭션 데이터로 쉽게 교체 가능
 */

export const transactionData = [
  {
    signedTx: "0x1234567890abcdef", // 테스트용 TX Hex
    pollId: "poll1",
    chainId: 5,
    deadline: Date.now() + 60 * 60 * 1000, // 1시간 후 만료
  },
  {
    signedTx: "0xabcdef1234567890",
    pollId: "poll2",
    chainId: 5,
    deadline: Date.now() + 60 * 60 * 1000,
  },
  // 필요하면 100개 정도 복제해서 추가 가능
];

// ✅ 나중에 다른 세트 추가 가능
export const transactionDataSet2 = [
  {
    signedTx: "0xdeadbeef",
    pollId: "pollX",
    chainId: 5,
    deadline: Date.now() + 3600 * 1000,
  },
];
