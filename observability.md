# 📊 Observability Documentation

## Prometheus 지표 엔드포인트: /api/metrics

이 엔드포인트는 API 서버의 성능 및 자원 사용량 지표를 Prometheus 표준 형식의 텍스트로 노출합니다.

* **경로:** `/api/metrics`
* **메서드:** `GET`
* **주요 용도:** Prometheus 서버가 서버 상태를 주기적으로 스크랩(Scraping)하여 모니터링 대시보드를 구축하고 알림 시스템을 운영하는 데 사용됩니다.

---

## 🔑 지표 형식 및 상세 정보

| 항목 | 상세 내용 |
| :--- | :--- |
| **응답 코드** | `200 OK` (정상 작동 시) |
| **Content-Type** | `text/plain; version=0.0.4; charset=utf-8` |
| **지표 유형** | Gauge (순간적인 측정값) |

## 📋 노출되는 핵심 지표

| 지표 이름 | TYPE | 설명 |
| :--- | :--- | :--- |
| `node_uptime_seconds` | Gauge | Node.js 프로세스가 시작된 이후의 총 가동 시간 (초). |
| `node_memory_usage_rss_bytes` | Gauge | 프로세스가 차지하는 실제 메모리 (RAM) 크기 (바이트). |
| `node_memory_usage_heapTotal_bytes` | Gauge | V8 엔진이 할당한 총 힙 메모리 크기 (바이트). |
| `node_memory_usage_heapUsed_bytes` | Gauge | 현재 사용 중인 힙 메모리 크기 (바이트). |