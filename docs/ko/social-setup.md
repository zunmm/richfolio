---
title: 소셜 미디어 게시
layout: default
nav_order: 6
lang: ko
permalink: /social-setup.html
---

# 소셜 미디어 게시

Richfolio는 **선택적으로** 매수 신호를 공개 소셜 페이지에 게시할 수 있습니다 — **X/Twitter**, **Facebook 페이지**, **LinkedIn 페이지** — 이메일 + Telegram 브리핑과 함께 말이죠. 이 기능은 **daily**와 **intraday** 모드에서만 실행됩니다 (weekly나 refresh에서는 절대 실행되지 않습니다).

이 기능은 **완전히 옵트인** 방식입니다. 소셜 자격 증명을 설정하지 않으면 아무것도 게시되지 않으며 나머지 Richfolio 기능은 이전과 정확히 동일하게 작동합니다 — 각 플랫폼은 "credentials not set — skipping" 줄을 로그에 남기고 넘어갑니다.

---

## 게시되는 내용
{: .text-green-200}

게시물은 비공개 정보가 새어나가지 않도록 의도적으로 **일반적인** 형태로 작성됩니다:

- **STRONG BUY**와 **BUY** 신호만 게시됩니다 (HOLD/WAIT은 건너뜁니다).
- 각 신호는 **종목, 액션, 신뢰도, 짧은 사유**, 그리고 선택적으로 가치 등급을 보여줍니다 — 그 외에는 아무것도 없습니다.
- 목표 포트폴리오 종목과 관심 목록 종목은 **모두 "신호"로 동일하게** 병합됩니다 — "포트폴리오 vs 관심 목록" 라벨이 없으므로 보유 종목이 드러나지 않습니다.
- **절대 게시되지 않음:** 배분, 격차, 추천 매수 금액, 보유 주식 수, 총 포트폴리오 가치. `src/socialContent.ts`의 `buildSignalLines()`가 단일 허용 목록 관문이며, 단위 테스트로 검증됩니다.
- 모든 게시물은 면책 문구로 끝납니다: *"투자 조언이 아닙니다. Richfolio가 자동 생성했습니다."*

---

## 활성화 / 비활성화
{: .text-green-200}

`config.json`의 `social` 블록이 마스터 스위치입니다 (기본값 표시):

```json
"social": {
  "enabled": true,
  "includeLinkInX": false
}
```

- `enabled: false` — 자격 증명과 관계없이 모든 소셜 게시를 비활성화합니다.
- `includeLinkInX` — X 게시물에 분석 링크를 포함합니다. 링크가 X의 사용량 기반 비용을 높이기 때문에 기본적으로 꺼져 있습니다.

각 플랫폼은 **추가로** 자체 자격 증명으로 게이트되므로, `enabled`가 `true`여도 키가 없는 플랫폼은 건너뜁니다.

---

## Secret 요약
{: .text-green-200}

다음을 저장소 **Secret**으로 추가하세요 (Settings → Secrets and variables → Actions → **Secrets**). 모두 선택 사항이며 — 원하는 플랫폼만 설정하세요.

| Secret | 플랫폼 | 비고 |
|---|---|---|
| `FACEBOOK_PAGE_ID` | Facebook | 페이지의 숫자 id |
| `FACEBOOK_PAGE_TOKEN` | Facebook | 장기 유효 페이지 액세스 토큰 |
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn | `w_organization_social` 권한이 있는 OAuth 2.0 토큰 |
| `LINKEDIN_ORG_URN` | LinkedIn | 예: `urn:li:organization:123456` |
| `X_API_KEY` / `X_API_SECRET` | X/Twitter | OAuth 1.0a 컨슈머 키 |
| `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` | X/Twitter | OAuth 1.0a 사용자 토큰 |

---

## Facebook 페이지 설정
{: .text-green-200}

런타임에는 단 두 개의 값만 필요합니다: `FACEBOOK_PAGE_ID`와 **장기 유효** `FACEBOOK_PAGE_TOKEN`. **본인의 페이지에 관리자 자격으로** 게시하기 때문에 앱의 **개발 모드(Development mode)**에 머무를 수 있으며 — 앱 심사(App Review)가 필요 없습니다.

**1. Meta 앱 생성**

1. [developers.facebook.com](https://developers.facebook.com) → **My Apps** → **Create App**으로 이동합니다.
2. **Other** → **Business** 앱 유형을 선택하고 이름을 지정합니다 (예: "Richfolio Poster").

**2. 페이지 관리 사용 사례 추가**

1. 앱에서 **Use cases**를 열고 → **Manage everything on your Page**를 선택합니다.
2. 해당 항목의 **Permissions**를 열고 **Add**합니다 (Standard Access로 충분합니다 — "Get Advanced Access"는 무시하세요):
   - `pages_manage_posts` — 피드에 게시 (필수 권한)
   - `pages_read_engagement`
   - `pages_show_list`

   이들은 **"Ready for testing"**으로 표시되어야 합니다 — 이는 관리자인 당신이 지금 바로 사용할 수 있다는 의미입니다.

**3. 사용자 토큰 가져오기**

1. [Graph API Explorer](https://developers.facebook.com/tools/explorer)를 엽니다.
2. 앱을 선택하고 → **Get User Access Token** → 세 개의 `pages_*` 권한을 체크하고 → **Generate Access Token** → 승인합니다.

**4. 장기 유효 페이지 토큰 발급**

Richfolio는 토큰 교환을 대신 처리해 주는 헬퍼를 제공합니다. `.env`에 임시로 추가하세요:

```bash
FACEBOOK_PAGE_ID=your_page_id          # numeric Page id
FACEBOOK_APP_SECRET=...                # App settings → Basic → App secret
FB_USER_TOKEN=...                      # the user token from step 3
```

그런 다음 실행합니다:

```bash
npx tsx smoke/fb-page-token.ts
```

이 헬퍼는 단기 유효 사용자 토큰을 장기 유효 토큰으로 교환하고, 당신의 페이지를 찾아 **만료되지 않는 페이지 토큰**을 출력합니다. 이를 `FACEBOOK_PAGE_TOKEN`에 붙여넣은 다음, `.env`에서 `FACEBOOK_APP_SECRET`과 `FB_USER_TOKEN`을 **삭제**하세요 — 이들은 설정 전용이며 런타임에는 절대 사용되지 않습니다.

**5. 검증**

```bash
npx tsx smoke/smoke-facebook.ts             # checks the token (no posting)
npx tsx smoke/smoke-facebook.ts --post --cleanup   # posts a test, then deletes it
```

`PASS`는 토큰이 유효한 페이지 토큰이며 게시가 처음부터 끝까지 작동함을 확인해 줍니다.

**6. GitHub에 추가**

`FACEBOOK_PAGE_ID`와 `FACEBOOK_PAGE_TOKEN`을 저장소 Secret으로 추가하세요. 앱 시크릿이나 사용자 토큰은 추가하지 **마세요**.

> **토큰 수명:** 페이지 토큰은 사실상 영구적이지만, Facebook 비밀번호를 변경하거나 앱을 취소하거나 페이지 관리자 자격을 잃으면 토큰이 죽습니다. 게시가 멈추면 3단계부터 다시 발급하세요.

---

## LinkedIn 페이지 설정
{: .text-green-200}

LinkedIn은 무료이지만 가장 까다롭게 게이트되어 있습니다. 필요한 것:

1. 회사 페이지(Company Page)에 연결된 LinkedIn **개발자 앱(Developer app)**.
2. **"Share on LinkedIn"** / **"Community Management API"** 제품으로, `w_organization_social` 권한을 부여합니다. 이는 LinkedIn의 승인이 필요하며 시간이 걸릴 수 있습니다.
3. **페이지 관리자**가 생성한 `w_organization_social` 권한을 가진 OAuth 2.0 **액세스 토큰**.

설정:

- `LINKEDIN_ACCESS_TOKEN` — OAuth 2.0 토큰.
- `LINKEDIN_ORG_URN` — 조직 URN, 예: `urn:li:organization:123456`.
- `LINKEDIN_API_VERSION` — 선택적 재정의 (기본값은 최근 `YYYYMM`).

> LinkedIn 액세스 토큰은 약 60일 후에 만료됩니다 (리프레시 토큰은 약 365일 지속). 주기적으로 갱신할 계획을 세우세요.

---

## X / Twitter 설정
{: .text-green-200}

> **X에는 2026년 2월 이후 무료 게시 플랜이 없습니다.** 게시는 사용량 기반 과금입니다 (게시당 약 $0.015, 링크가 포함되면 더 높음). Richfolio는 X 게시 기능을 포함하지만 키를 추가하기 전까지는 비활성 상태로 유지됩니다.

게시에는 **OAuth 1.0a 사용자 컨텍스트**가 사용됩니다. [X Developer Portal](https://developer.x.com)에서 **Read and Write** 권한을 가진 프로젝트/앱을 생성하고 다음을 발급하세요:

- `X_API_KEY` / `X_API_SECRET` — 컨슈머(API) 키 및 시크릿.
- `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` — 당신 계정의 액세스 토큰 및 시크릿.

게시당 비용을 낮게 유지하려면 `config.json`에서 `includeLinkInX`를 꺼 두세요.

---

## 실행 방식
{: .text-green-200}

daily 및 intraday 모드에서 이메일과 Telegram 발송 후, Richfolio는 `sendSocialPosts()` ([src/social.ts](https://github.com/furic/richfolio/blob/main/src/social.ts))를 호출합니다. 각 플랫폼은 자체 try/catch 안에서 게시하므로, 한 플랫폼이 실패해도 다른 플랫폼이나 — 이미 발송된 이메일/Telegram을 절대 막지 않습니다.

Richfolio를 포크하는 경우, **본인의** 계정으로 위 설정을 완료하기 전까지 소셜 게시는 **꺼진** 상태로 유지됩니다 — 각 토큰은 소유자의 페이지에 게시하므로 자격 증명을 공유할 수 없습니다.
