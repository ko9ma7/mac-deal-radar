> **V3 실행:** 새 폴더 `mac-deal-radar-free-v3` 안에서 `START-HERE-GITHUB-FREE.cmd`를 실행하세요. `Cloudflare Worker` 배포 질문이 나오면 예전 프로그램입니다.

# 맥딜 레이더 (Mac Deal Radar)

맥북 할인·쿠폰·품절 공지 등 **공개 웹페이지에서 읽을 수 있는 정보**를 모아 보여주는 무료 정적 웹서비스입니다.

**요금이 발생하는 Cloudflare Worker 또는 별도 데이터베이스가 필요하지 않습니다.** 웹 화면은 **GitHub Pages**, 수집·저장은 **본인 PC의 Node.js** 또는 **GitHub Actions(수동 실행)**, 데이터 파일은 Git 저장소의 `assets/deals.json`을 사용합니다.

> GitHub Pages 페이지의 버튼만으로는 크롤러를 직접 실행할 수 없습니다. PC 수집기 또는 GitHub Actions가 JSON을 게시해야 화면이 업데이트됩니다. 사이트의 ‘게시 데이터 새로고침’ 버튼은 서버에서 새 JSON을 **읽기만** 합니다. 수집 대상이 로그인/자동화 방지로 접근을 제한하면 차단을 우회하지 않습니다.

## 주요 기능

- 에이스토어 카카오 공개채널·아이스토어·프리스비 공식 행사 페이지를 읽고 Mac 관련 할인 표현을 추출
- Google News RSS 관련 보도 수집(뉴스는 판매 정보로 분류하지 않음)
- **가격·할인율·원문 링크·쿠폰 조건·명시적 품절 문구**를 가능한 범위에서 구조화
- 판매처별 수집 상태/실패 사유 표시, 필터·검색·정렬, 즐겨찾기, CSV 내보내기
- 스마트폰 화면 대응, 다크 모드, 개인 링크(브라우저에만) 등록
- 본인 PC의 `backups/` 에 이전 데이터 백업. Git Commit History로 공개 데이터 변경 이력 추적
- GitHub Actions에서 수동 실행하여 PC가 꺼져 있어도 원격 수집 가능(기본 자동 정기 수집 없음)

**매장 실시간 POS 재고, 실제 카드 발급 가능 여부, 쿠폰 중복, 결제 가능 여부는 확인하지 않습니다.** 공개 게시물에 '품절'이 명확히 적혀 있지 않다면 무조건 ‘재고 미확인’입니다. 수집 결과에 '할인' 문구가 있더라도 행사 유효기간과 상품을 확인해야 합니다.

## 1. 처음 GitHub Pages 배포 (Windows)

준비물: [Git](https://git-scm.com/download/win), [Node.js LTS](https://nodejs.org), [GitHub CLI](https://cli.github.com)와 본인 GitHub 계정. (모두 무료 설치 가능)

1. ZIP 압축을 풀고 `github-bootstrap.cmd`를 더블클릭합니다.
2. GitHub CLI 로그인을 진행하면 본인 계정에 **공개 저장소 `mac-deal-radar`** 를 생성하거나 기존 저장소에 업로드합니다.
3. Repository → **Settings → Pages → Source: GitHub Actions**를 확인합니다.
4. 배포 완료 후 `https://GITHUB_USERNAME.github.io/mac-deal-radar/`에서 확인합니다.

기존 리포지터리가 있다면 ZIP을 새로 만들어 덮어쓰지 말고, 저장소를 `git clone`한 다음 수정 파일을 병합해 주세요.

> **정적 웹사이트만** 업로드하면 수집 코드는 실행할 수 없습니다. ‘전체 프로젝트 ZIP’을 보관해야 합니다.

## 2. 내 PC에서 새로 수집하고 사이트에 게시

**정상적인 최초 배포 이후에는 `수집하고-게시.cmd`만 더블클릭하면 됩니다.**

1. `git pull --ff-only origin main`으로 최신 코드와 데이터를 확인
2. `node scripts/collect.mjs`로 등록된 공개 출처 수집
3. 성공 시 `assets/deals.json`을 교체, 이전 파일을 로컬 `backups/`에 보관
4. `git add / commit / push`로 GitHub 게시
5. GitHub Actions의 `deploy.yml`이 GitHub Pages 업데이트
6. 사이트에서 **‘게시 데이터 새로고침’** 클릭해 업데이트 시각 확인

* PC에만 저장하려면 `수집만.cmd`를 사용합니다. GitHub 사이트에는 반영되지 않습니다.
* macOS/Linux: `bash scripts/collect-and-publish.sh`
* CLI 실행: `npm test`, `npm run collect`, `npm run build`
* Git 동기화 충돌이 발생하면 파일을 덮어쓰거나 강제 push 하지 않고 로컬 변경사항을 확인하세요.

## 3. PC 없이 GitHub에서 수동 수집

GitHub 저장소 → **Actions → Collect Deals → Run workflow → Run workflow**.

`collect.yml`이 수집 → `assets/deals.json` 커밋 → 같은 Workflow에서 Pages 배포까지 진행합니다. GitHub Actions의 `GITHUB_TOKEN`으로 만든 커밋은 일반적인 `push` Workflow를 자동 트리거하지 않으므로, **수집 Workflow 안에서 직접 Pages 배포**하도록 구현했습니다.

GitHub가 제공하는 무료 Actions/Pages 사용 가능 범위 내에서 동작하며, 공개 저장소 및 계정의 정책·쿼터 적용을 받습니다. 자동으로 24시간 크롤링을 반복하지 않습니다.

## 4. 다른 업체·매장 수집 URL 추가

`data/custom-sources.json`에서 `sources` 배열에 URL을 추가합니다. 예:

```json
{
  "sources": [
    {
      "id": "my-threads-post",
      "name": "Threads 맥북 대란 공개글",
      "store": "기타",
      "location": "Threads",
      "url": "https://www.threads.com/@ddaddatee/post/DeUZ-naj0pZ?hl=ko"
    }
  ],
  "includeNews": true
}
```

현재 수집기는 허용된 공개 출처 도메인만 접근합니다. 지원 예시: 카카오채널, Threads, 아이스토어, 프리스비, 롯데하이마트, 코스트코, SSG, 11번가, G마켓, 쿠팡, 롯데온, 애플, 일부 네이버쇼핑 페이지. **도메인을 허용한다고 실제 페이지 본문을 수집할 수 있다는 뜻은 아닙니다.** 로그인·동적 렌더링·차단 페이지는 오류 또는 정보 없음으로 기록됩니다. 개별 판매점의 POS 재고를 긁는 기능은 없습니다.

사이트에서 ‘개인 링크 저장’으로 추가한 URL은 사용자 브라우저 LocalStorage에만 보관되며 다른 방문자에게 공개되지 않습니다. 공개 수집 대상은 PC 파일 `custom-sources.json`을 수정해 관리합니다.

## 데이터 포맷

```json
{
  "mode": "local",
  "scannedAt": "2026-10-11T00:00:00.000Z",
  "deals": [],
  "sources": [
    {"id":"example", "name":"판매처", "url":"https://example.com", "state":"error", "message":"HTTP 403"}
  ],
  "summary": {"successful": 0, "total": 0}
}
```

첫 설치 시 `assets/deals.json`에는 예전 대화에서 모은 **초기 참고 자료**만 포함됩니다. 새로운 실제 수집이 성공한 경우에만 `mode:local`과 `scannedAt`이 기록됩니다. 모든 출처가 실패하면 수집기는 오류로 종료하고 이전 파일을 보존합니다. 일부 수집만 성공하면 나머지 출처의 오류를 함께 저장합니다.

## 개발·로컬 보기

```bash
npm test
npm run collect     # 인터넷이 필요합니다. 등록 출처에 접속합니다.
python -m http.server 8000
# http://localhost:8000
```

`npm run build` 결과물은 `_site/`에 생성되며 GitHub Pages 하위 경로에서 상대 URL을 사용합니다.

## 디렉터리

```text
assets/                CSS, JS, 이미지, deals.json, 초기 참고 목록
collector/             URL 검증, 공개 페이지 수집, 할인/RSS 파서
scripts/collect.mjs    PC 수집 파일 생성
scripts/prepare-pages.mjs  Pages 배포물 생성
scripts/collect-and-publish.sh  macOS/Linux CLI 게시
수집만.cmd             내 PC JSON 갱신만
수집하고-게시.cmd       수집 + GitHub push + 사이트 배포 트리거
.github/workflows/deploy.yml  git push 시 Pages 배포
.github/workflows/collect.yml GitHub Actions에서 수동 수집 + 같은 Workflow 배포
data/custom-sources.json     추가 수집 URL
backups/               이전 JSON PC 백업 (Git 제외)
```

## 중요 제한사항

- GitHub Pages는 **정적 호스팅**입니다. 방문자가 웹의 버튼을 클릭해 서버에서 즉시 크롤링 작업을 실행할 수 없습니다. 비밀번호나 GitHub 토큰을 사이트 JS에 넣지 마세요.
- GitHub Actions 실행은 GitHub 로그인 및 저장소 실행 권한이 있는 사용자가 GitHub 화면에서 시작해야 합니다.
- 공개 페이지라도 사이트의 약관/robots 정책/접근 제한을 준수하세요. 우회나 무제한 병렬 요청 기능은 넣지 않았습니다.
- 수집한 공개 정보는 실제 판매 확정, 쿠폰 중복, 현재 POS 재고 확인을 의미하지 않습니다. 오류가 발생한 경우 이전 데이터를 최신으로 둔갑시키지 않습니다.
- 검색을 통해 수집한 기사 제목과 기타 텍스트는 공개 판매처 실시간 정보가 아닙니다.
- 웹의 `deals.json`은 공개 데이터입니다. 비밀번호, 비공개 계약, 개인 연락처 등을 넣지 마세요.

## 디자인/배포

반응형 PC·모바일 UI, 다크 모드, SVG favicon, 모바일용 아이콘, OG 이미지, PWA 매니페스트, SEO 관련 파일, 404 페이지 포함. `GITHUB_REPOSITORY=owner/repo` 또는 `SITE_URL` 환경변수로 `scripts/prepare-pages.mjs`가 정적 메타데이터 URL을 생성합니다. GitHub Pages 공개 저장소 정책을 따릅니다.

MIT 라이선스. Apple 및 각 판매처와 무관한 비공식 정보 정리 도구입니다.

## 6. 이전 버전 업로드 오류 해결 (2026-10-11 수정)

`https://.github.io/mac-deal-radar/`, `github.com//mac-deal-radar`, `got "/mac-deal-radar"`, `Deploy Cloudflare Worker API now?`가 보인다면 **이전 Cloudflare 버전**을 실행한 것입니다.

1. 이전 `mac-deal-radar-project` 폴더를 재사용하지 말고, **`mac-deal-radar-FIXED-free-pages.zip`**을 새 폴더에 압축 해제합니다.
2. 새 폴더의 `github-bootstrap.cmd`를 실행합니다. 이 파일은 PowerShell 배포 스크립트를 실행하며 GitHub 로그인 이름이 비어 있으면 즉시 멈춥니다.
3. 자동 로그인 확인이 필요하면 GitHub 브라우저 로그인 창에서 승인합니다. 직접 확인하려면 명령 프롬프트에서 `gh auth login`, `gh api user --jq .login` 순서로 실행합니다.
4. 스크립트가 GitHub 저장소의 `main` 커밋을 확인하고, Actions의 Pages 배포 완료까지 확인한 뒤에만 성공 메시지를 출력합니다.
5. `SOURCE UPLOADED AND VERIFIED`까지만 나왔다면 GitHub **저장소에는 올라간 것**이고, 이후의 Pages 단계만 따로 점검하면 됩니다.

**주의:** 화면이 표시된다고 해서 판매처의 수집이 반드시 성공한 것은 아닙니다. 크롤러는 공개 페이지 접근 제한과 네트워크 오류를 별도로 기록합니다. 이 웹서비스의 `게시 데이터 새로고침` 버튼은 이미 GitHub에 게시된 JSON을 다시 불러오는 기능입니다.
