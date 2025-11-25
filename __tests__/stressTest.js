// __tests__/stressTest.js (서버 없이 시뮬레이션용)

import { transactionData } from '../src/data/test-data-101.js'; // 실제 데이터 불러오기

// -----------------------------------------------------------
// 🚨 트랜잭션 전송 시뮬레이션
// -----------------------------------------------------------
async function trySendTxSimulated(data) {
    // 0~1 사이 랜덤 숫자를 만들어서 성공/실패 시뮬
    const isSuccess = Math.random() > 0.3; // 70% 확률로 성공
    await new Promise((res) => setTimeout(res, 50)); // 네트워크 지연 흉내
    if (isSuccess) {
        return [true, `SIMULATED_TX_HASH_${Math.floor(Math.random() * 100000)}`];
    } else {
        return [false, 'Simulated TX failure'];
    }
}

// -----------------------------------------------------------
// 🚨 메인 테스트 루프 (시뮬레이션)
// -----------------------------------------------------------
async function runStressTestSimulated(dataArray) {
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const data = dataArray[i];

        try {
            const [success, info] = await trySendTxSimulated(data);
            if (success) {
                successCount++;
                console.log(`[${i}] SUCCESS: ${info}`);
            } else {
                failureCount++;
                console.log(`[${i}] FAIL: ${info}`);
            }
        } catch (error) {
            failureCount++;
            console.error(`[${i}] FATAL ERROR:`, error);
        }
    }

    const total = dataArray.length;
    const successRate = (successCount / total) * 100;
    console.log(`\n--- 최종 결과 ---`);
    console.log(`총 시도: ${total}건`);
    console.log(`성공: ${successCount}건`);
    console.log(`실패: ${failureCount}건`);
    console.log(`성공률: ${successRate.toFixed(2)}%`);
}

// 실제 테스트 실행
runStressTestSimulated(transactionData);
