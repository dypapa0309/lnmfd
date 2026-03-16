# Leaf & Moss 병합 완료 버전

이번 버전에서 추가된 것만 반영했습니다.

## 추가된 기능
1. 현재 펀딩 금액 실시간 표시
   - 메인 페이지 통계 영역
   - 관리자 페이지 통계 영역

2. 얼리버드 잔여 수량 자동 차감
   - paid 주문 기준 자동 계산
   - 100개 → 99개 식으로 반영

## 사용 중인 Supabase 컬럼
- reward_qty
- reward_type
- total_amount
- payment_status

## 환경변수
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- TOSS_SECRET_KEY
- ADMIN_PASSWORD
