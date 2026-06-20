---
title: API 키
layout: default
nav_order: 5
lang: ko
permalink: /api-keys.html
---

# API 키

Richfolio는 최대 5개의 외부 서비스를 사용하며, 모두 넉넉한 무료 플랜이 있습니다. Resend와 수신 이메일만 필수이고 — 나머지는 모두 선택 사항입니다.

각 키는 저장소 Secret으로 추가하세요: Settings → Secrets and variables → Actions → **Secrets** 탭. `RECIPIENT_EMAIL`은 **Variable**로 추가하는 것이 좋습니다 (보기/편집이 더 쉽습니다).

![GitHub Actions Secrets](../screenshots/github_actions_secrets.png){: style="max-width: 500px; display: block; margin: 16px auto;" }

---

## Resend (이메일) — 필수
{: .text-green-200}

Resend가 HTML 이메일 리포트를 전달합니다.

1. [resend.com](https://resend.com)으로 이동하여 가입
2. 대시보드에서 **API Keys**로 이동
3. **Create API Key**를 클릭하고 이름을 지정한 뒤 키를 복사
4. GitHub Secret으로 추가 — 이름: `RESEND_API_KEY`, 값: 방금 복사한 키

**무료 플랜:** 월 3,000건 이메일. 기본 발신자는 `onboarding@resend.dev`. 사용자 도메인을 인증하지 않은 경우 **계정 소유자 이메일**로만 발송할 수 있습니다 (Dashboard → Domains → Add Domain → DNS 레코드 추가).

---

## 수신 이메일 — 필수
{: .text-green-200}

GitHub **Variable**로 추가 (Secret이 아님): 이름: `RECIPIENT_EMAIL`, 값: 본인 이메일 주소.

사용자 도메인을 인증하지 않은 경우 Resend 계정 이메일과 일치해야 합니다.

---

## NewsAPI (헤드라인) — 선택
{: .text-yellow-200}

일일 브리핑에 종목별 톱 헤드라인을 제공합니다.

1. [newsapi.org](https://newsapi.org)로 이동하여 가입
2. API 키가 대시보드에 바로 표시됩니다
3. GitHub Secret으로 추가 — 이름: `NEWS_API_KEY`, 값: 대시보드의 키

**무료 플랜:** 1일 100건 요청. Richfolio는 배칭을 통해 실행당 약 4건만 사용합니다. 최근 24시간 헤드라인만 반환됩니다. 설정하지 않으면 브리핑이 뉴스 없이 실행됩니다.

---

## AI 제공사 — AI 추천을 사용하려면 최소 하나 필요

Richfolio는 두 가지 AI 제공사를 지원합니다: **Google Gemini**와 **Anthropic Claude**. AI 기반 추천을 사용하려면 최소 하나를 설정하세요. **둘 다** 설정하면 병렬로 실행되며 — 점수가 평균되고 각 추천 옆에 AI별 분석이 표시됩니다. 둘 다 설정하지 않으면 Richfolio는 격차 기반 추천으로 폴백합니다 (AI 없음).

| 모드 | 설정 | 출력 |
|---|---|---|
| **AI 없음** | 둘 다 설정 안 됨 | 격차 기반 추천만 |
| **단일 AI** | 한 개 키 설정 | 기존과 동일 — 종목당 하나의 액션 + 신뢰도 |
| **멀티 AI** | 두 키 모두 설정 | 종목별 합의 액션 + 평균 신뢰도; 각 추천 아래에 AI별 분석 표시; STRONG BUY는 만장일치 동의 필요 |

---

## Google Gemini — 선택
{: .text-yellow-200}

Gemini 2.5 Flash로 AI 매수 추천을 구동합니다.

1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey)로 이동
2. **Create API Key**를 클릭하고 Google Cloud 프로젝트를 선택(또는 새로 생성)
3. 키를 복사하고 GitHub Secret으로 추가 — 이름: `GEMINI_API_KEY`, 값: 방금 복사한 키

**무료 플랜:** 1일 250건 요청, 분당 10건 요청. Richfolio는 실행당 2건의 요청을 사용합니다 (Stage 1 Observe + Stage 2 Decide). STRONG BUY 종목당 상세 분석을 위해 1건이 추가됩니다. 새 키는 할당량 활성화에 몇 분이 걸릴 수 있습니다 (처음에는 429 오류가 보일 수 있음).

### Gemini 모델 계층에 대한 참고

Google의 가격 페이지는 Gemini 2.5 Pro가 입력 및 출력 토큰 모두에 대해 ["무료"](https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-pro)라고 명시합니다. 하지만 실제로는 무료 플랜의 Pro 요청이 사용량이 적어도 `429 RESOURCE_EXHAUSTED` 오류에 자주 부딪힙니다. Google은 무료 플랜의 실제 RPD(requests per day) 한도를 공개하지 않으며; 제3자 자료에 따르면 Pro는 약 100 RPD로 제한되는 것으로 보이지만 실제 수치는 계정에 따라 다른 듯하며 보장되지 않습니다.

**Richfolio는 기본적으로 Gemini 2.5 Flash를 사용합니다.** Flash가 더 넉넉하고 안정적인 무료 플랜 할당량을 가지고 있기 때문입니다. 금융 분석 텍스트에서의 품질 차이는 무시할 만합니다.

---

## Anthropic Claude — 선택
{: .text-yellow-200}

Claude (기본값 Sonnet 4.6)로 AI 매수 추천을 구동합니다.

1. [console.anthropic.com](https://console.anthropic.com)으로 이동하여 가입
2. **API Keys** → **Create Key**로 이동하여 이름을 지정하고 키를 복사
3. GitHub Secret으로 추가 — 이름: `ANTHROPIC_API_KEY`, 값: 방금 복사한 키

**가격:** Anthropic은 Gemini와 같은 영구 무료 플랜은 없지만 신규 계정에 소액의 스타터 크레딧이 제공되며, Richfolio 워크로드에서 Sonnet 사용 비용은 일반적으로 하루 몇 센트 수준입니다. 비용을 최소화하려면 `CLAUDE_MODEL=claude-haiku-4-5-20251001`을 설정하세요 (Haiku 계층은 훨씬 저렴하면서도 이 워크로드를 충분히 처리합니다).

### Gemini와 결합하기 (멀티 AI 모드)

`GEMINI_API_KEY`와 `ANTHROPIC_API_KEY`가 모두 설정되면 Richfolio는 모든 분석에서 두 제공사를 동시에 실행하고 결과를 집계합니다:

- **합의 액션** 종목별 다수결로 결정 (신뢰도 합계 기반 동점자 결정)
- **평균 신뢰도**가 눈에 띄게 표시되며 그 아래에 AI별 점수 표시
- **STRONG BUY는 만장일치 동의 필요** — 한 제공사라도 반대하면 합의는 BUY로 제한됨
- **동의 라벨** (만장일치 / 다수결 / 분열)이 액션 옆에 배지로 표시

실행 중 한 제공사가 실패하면 (요청 한도, 할당량 소진, 네트워크 오류), 살아남은 제공사가 단독으로 계속 진행하며 해당 실행의 이메일/Telegram은 단일 AI 표시로 폴백합니다.

### STRONG BUY 상세 분석 페이지를 생성할 제공사 선택하기

두 제공사가 모두 활성화된 경우, STRONG BUY별 분석 페이지 ("More Details" 링크)는 단일 제공사로 생성됩니다 — 기본값은 레지스트리 순서상 가장 먼저 사용 가능한 제공사 (Gemini, 그 다음 Claude)입니다. 다음으로 재정의할 수 있습니다:

| 환경 변수 | 값 | 효과 |
|---|---|---|
| `AI_DETAILED_PROVIDER` | `gemini` | 상세 분석에 Gemini 강제 사용 (GEMINI_API_KEY 설정 필요) |
| `AI_DETAILED_PROVIDER` | `claude` | 상세 분석에 Claude 강제 사용 (ANTHROPIC_API_KEY 설정 필요) |
| `CLAUDE_MODEL` | 예: `claude-haiku-4-5-20251001` | Claude 모델 재정의 (기본값: `claude-sonnet-4-6`) |

---

## Telegram 봇 — 선택
{: .text-yellow-200}

Telegram 계정으로 압축된 요약을 전달합니다.

### 봇 생성

1. Telegram에서 **@BotFather**를 검색
2. `/newbot` 전송
3. 이름(예: "Richfolio Brief")과 사용자 이름(`bot`으로 끝나야 함, 예: `richfolio_brief_bot`)을 지정
4. BotFather가 봇 토큰으로 응답합니다 — 복사하세요

### chat ID 가져오기

1. Telegram에서 **@userinfobot**을 검색하여 시작
2. 봇이 당신의 숫자 사용자 ID로 응답합니다 — 이것이 chat ID입니다

**중요:** Richfolio를 실행하기 전에 새 봇에게 아무 메시지(예: "hi")를 보내세요 — 봇이 당신에게 메시지를 보내려면 먼저 이 단계가 필요합니다.

둘 다 GitHub Secret으로 추가하세요:

- 이름: `TELEGRAM_BOT_TOKEN`, 값: BotFather가 준 토큰
- 이름: `TELEGRAM_CHAT_ID`, 값: 본인 숫자 사용자 ID

**참고:** 설정되지 않으면 브리핑이 Telegram을 건너뜁니다. 메시지는 압축된 요약입니다 (전체 HTML이 아님). 메시지당 4,096자 제한 — 필요하면 뉴스가 잘립니다.

---

## 소셜 게시 — 선택
{: .text-yellow-200}

Richfolio는 X, Facebook, LinkedIn의 공개 페이지에 일반적인 매수 신호를 게시할 수 있습니다. 모든 플랫폼은 선택 사항이며 설정하기 전까지는 꺼져 있습니다. 플랫폼별 필수 Secret:

- **Facebook:** `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_TOKEN`
- **LinkedIn:** `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_ORG_URN`
- **X/Twitter:** `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`

**참고:** 게시물은 일반적입니다 — 보유 종목이나 배분은 공개되지 않습니다. 설정되지 않으면 소셜 게시가 건너뛰어집니다. 각 플랫폼의 단계별 설정은 [소셜 게시](social-setup)를 참고하세요.

---

## 요약

| 키 | 필수 | 서비스 |
|-----|------|--------|
| `RESEND_API_KEY` | 예 | 이메일 전달 |
| `RECIPIENT_EMAIL` | 예 | 본인 이메일 주소 |
| `NEWS_API_KEY` | 아니오 | 뉴스 헤드라인 |
| `GEMINI_API_KEY` | 아니오 | AI 제공사 (Google Gemini) |
| `ANTHROPIC_API_KEY` | 아니오 | AI 제공사 (Anthropic Claude) |
| `TELEGRAM_BOT_TOKEN` | 아니오 | Telegram 전달 |
| `TELEGRAM_CHAT_ID` | 아니오 | Telegram 전달 |
| `FACEBOOK_PAGE_ID` / `FACEBOOK_PAGE_TOKEN` | 아니오 | Facebook 페이지 게시 |
| `LINKEDIN_ACCESS_TOKEN` / `LINKEDIN_ORG_URN` | 아니오 | LinkedIn 페이지 게시 |
| `X_API_KEY` / `X_API_SECRET` / `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` | 아니오 | X/Twitter 게시 |
| `CLAUDE_MODEL` | 아니오 | Claude 모델 재정의 (기본값: `claude-sonnet-4-6`) |
| `AI_DETAILED_PROVIDER` | 아니오 | STRONG BUY 분석 페이지에 `gemini` 또는 `claude` 강제 사용 |
