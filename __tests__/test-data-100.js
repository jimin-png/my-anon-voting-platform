// __tests__/test-data-100.js

// 🚨 const 대신 let으로 변경하여 재할당에 대비합니다.
let RAW_TX_HEX_PREFIX = "0xf86c808504e38e684482520894";
let CHAIN_ID = 11155111;
let DEADLINE = Math.floor(Date.now() / 1000) + 3600;

// 100개의 고유 트랜잭션 데이터를 생성하는 루프
const transactionData = [];

for (let i = 0; i < 100; i++) {
    transactionData.push({
        signedTx: `${RAW_TX_HEX_PREFIX}${String(i).padStart(40, '0')}`,
        pollId: "60c72b2f9f1b2c001a1c4b4a",
        chainId: CHAIN_ID,
        deadline: DEADLINE
    });
}

// 🚨 수정: module.exports를 사용하여 데이터 내보내기 (최종 충돌 해결)
module.exports = {
    transactionData: transactionData
};