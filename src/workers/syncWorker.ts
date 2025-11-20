// src/workers/syncWorker.ts

import dbConnect from '@/lib/dbConnect';
import EventModel from '@/models/Event'; // 이벤트 모델 임포트 (경로 확인 필요)
import { getConfirmations } from '@/services/blockchain.service'; // 블록체인 서비스 임포트
import { calcBackoff } from '@/lib/backoff'; // 재시도 백오프 유틸리티 임포트
import { v4 as uuidv4 } from 'uuid';

// 1. 환경 변수 기반 상수 정의
const REQUIRED_CONFIRMATIONS = parseInt(process.env.CONFIRMATIONS_REQUIRED || '2', 10);
const BACKOFF_BASE_MS = parseInt(process.env.BACKOFF_BASE_MS || '1000', 10);
const BACKOFF_MAX_MS = parseInt(process.env.BACKOFF_MAX_MS || '60000', 10);
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '5000', 10);

// -----------------------------------------------------------
// 2. 핵심 워커 로직: 보류 중인 이벤트 처리
// -----------------------------------------------------------
async function processPending() {
  await dbConnect(); // DB 연결 확인

  const now = new Date();

  // 다음 재시도 시간이 되었거나 처음 시도하는 이벤트만 가져옵니다.
  const pending = await EventModel.find({
    status: 'PENDING',
    $or: [
      { nextRetryAt: { $exists: false } }, // nextRetryAt 필드가 없는 경우 (첫 시도)
      { nextRetryAt: { $lte: now } }       // nextRetryAt 시간이 지난 경우
    ]
  }).limit(50).exec(); // 50개 제한

  for (const ev of pending) {
    // ev.requestId가 DB에 이미 저장되어 있으므로 그대로 사용합니다.
    const requestId = ev.requestId;

    try {
      // 1. 블록체인 확인 횟수 조회
      const confirmations = await getConfirmations(ev.txHash);

      // 🚨 1-1. TX가 아직 알려지지 않았을 경우: throw하여 catch 블록으로 로직 통일
      if (confirmations === null) {
        throw new Error("TX_NOT_YET_KNOWN");
      }

      // 2. 확인 횟수 업데이트
      ev.confirmations = confirmations;

      if (confirmations >= REQUIRED_CONFIRMATIONS) {
        // 🚨 2-1. 최종 성공 로직: 2회 확인 완료 시 상태 FINALIZED로 변경
        ev.status = 'FINALIZED';
        ev.nextRetryAt = undefined; // 최종 상태이므로 재시도 시간 초기화
        console.log(`[${requestId}] FINALIZED (conf=${confirmations}) tx=${ev.txHash}`);
      } else {
        // 🚨 2-2. 진행 중 로직: 컨펌 횟수 부족 시 다음 시도를 위한 시간 계산
        ev.attempts += 1;
        const delay = calcBackoff(ev.attempts, BACKOFF_BASE_MS, BACKOFF_MAX_MS);
        ev.nextRetryAt = new Date(Date.now() + delay);
        console.log(`[${requestId}] Only ${confirmations} confirmations — retry in ${delay}ms`);
      }

      await ev.save(); // 변경 사항 (상태, nextRetryAt 등) 저장

    } catch (err) {
      // 🚨 3. 에러/TX 미지정 통합 처리: attempts와 nextRetryAt 업데이트

      ev.attempts = (ev.attempts || 0) + 1; // 재시도 횟수 증가
      const delay = calcBackoff(ev.attempts, BACKOFF_BASE_MS, BACKOFF_MAX_MS);
      ev.nextRetryAt = new Date(Date.now() + delay);

      await ev.save(); // 실패 후 상태(nextRetryAt) 저장

      const errorMessage = (err instanceof Error && err.message === "TX_NOT_YET_KNOWN")
        ? `TX not yet known — retry in ${delay}ms`
        : `Error while processing tx ${ev.txHash}`;

      console.error(`[${requestId}] ${errorMessage}`, err);
    }
  }
}

// -----------------------------------------------------------
// 3. 워커 실행 루프 (Next.js 환경에 맞게 구현)
// -----------------------------------------------------------

export async function runWorkerLoop() {
  console.log(`SyncWorker starting with polling interval: ${POLL_INTERVAL}ms...`);
  await dbConnect(); // 초기 연결 확인

  // 즉시 한 번 실행 후, 주기적으로 반복 실행
  processPending();
  setInterval(processPending, POLL_INTERVAL);
}

// -----------------------------------------------------------
// 4. 이벤트 큐에 추가 (외부 API에서 호출될 함수)
// -----------------------------------------------------------

export async function enqueueEvent(txHash: string, eventName: string, payload: any) {
  await dbConnect(); // DB 연결 확인
  const requestId = uuidv4();
  const ev = await EventModel.create({
    requestId,
    txHash,
    eventName,
    payload,
    status: 'PENDING',
    attempts: 0,
    confirmations: 0
  });
  console.log(`[${requestId}] Enqueued tx ${txHash}`);
  return ev;
}