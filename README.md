# Leaf & Moss Funding

Leaf & Moss 자사 펀딩 랜딩 페이지와 관리자/결제 연동 프로젝트입니다.

## 현재 구성
- 정적 랜딩 페이지: `index.html`
- 관리자 페이지: `admin/index.html`
- Netlify Functions: `netlify/functions`
- 주문 스키마 확장 SQL: `supabase/sql/20260322_orders_payment_safety.sql`

## 필수 환경변수
Netlify Site settings > Environment variables에 아래 값을 넣어야 합니다.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TOSS_SECRET_KEY`
- `ADMIN_PASSWORD`

프론트 결제창은 `window.TOSS_CLIENT_KEY`를 읽도록 바꾸지 않았다면 `assets/js/toss.js`의 키도 실제 라이브 클라이언트 키인지 확인해야 합니다.

예시 파일은 `.env.example`에 정리했습니다.

## 오픈 전 필수 작업
1. Supabase `orders` 테이블에 `supabase/sql/20260322_orders_payment_safety.sql`을 실행합니다.
2. Netlify 환경변수 4개를 모두 등록합니다.
3. 토스페이먼츠 웹훅을 `https://lnmfd.netlify.app/.netlify/functions/toss-webhook` 로 등록합니다.
4. 웹훅 이벤트는 최소 `PAYMENT_STATUS_CHANGED`, `CANCEL_STATUS_CHANGED` 를 활성화합니다.
5. 테스트 결제로 `paid` 전환, 관리자 조회, 환불까지 한 번 확인합니다.

## 추천 오픈 체크리스트
### 1. 결제 준비
- 토스 라이브 계약과 정산 계좌가 실제 사업자 정보로 연결돼 있는지 확인
- 라이브 클라이언트 키와 시크릿 키가 테스트 키가 아닌지 확인
- 성공/실패 URL이 현재 도메인 기준으로 동작하는지 확인

### 2. 데이터 준비
- Supabase `orders` 테이블 insert/update 권한 확인
- `payment_status`, `toss_payment_key`, `paid_at`, `refunded_at` 등이 정상 저장되는지 확인
- 관리자 비밀번호를 실제 운영 비밀번호로 변경

### 3. 운영 확인
- 결제 성공 후 주문이 `paid` 로 바뀌는지 확인
- 결제 실패 후 주문이 비정상적으로 `paid` 처리되지 않는지 확인
- 관리자에서 `paid` 주문 환불 버튼이 정상 동작하는지 확인
- 얼리버드 재고가 `paid` 주문 기준으로 차감되는지 확인

## 로컬 개발
의존성 설치:

```bash
npm install
```

정적 확인:

```bash
python3 -m http.server 4173
```

Netlify 배포:

```bash
npx netlify deploy --prod --dir=. --functions=netlify/functions
```

## 결제 흐름
1. 프론트에서 리워드를 선택하고 주문 생성 요청
2. `netlify/functions/create-order.js` 가 서버 가격표 기준으로 `pending` 주문 생성
3. 토스 결제 성공 후 `success.html` 에서 `netlify/functions/confirm-payment.js` 호출
4. 서버에서 주문 금액과 승인 금액을 검증한 뒤 `paid` 처리
5. 토스 웹훅 `netlify/functions/toss-webhook.js` 이 상태 변경을 보강 동기화
6. 관리자 환불은 `netlify/functions/cancel-payment.js` 에서 처리

## 주의
- 프론트에서 보낸 금액을 신뢰하지 않도록 서버 검증이 이미 들어가 있습니다.
- 웹훅 URL을 등록하지 않으면 성공 페이지를 못 밟은 결제의 상태 동기화가 늦어질 수 있습니다.
- Supabase 스키마 확장 SQL을 적용하지 않으면 결제 상태 보강 컬럼 업데이트가 실패할 수 있습니다.
