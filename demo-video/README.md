# 데모 영상 (Remotion)

최종 제출물 7번 `경크크_최종제출_데모영상.mp4`를 만드는 프로젝트다. 제출 조건은 [`docs/SUBMISSION.md`](../docs/SUBMISSION.md) 4.7절: 최대 3분, 서비스 화면에서 문서를 넣고 결과를 받기까지가 보여야 한다.

## 구성 (약 160초)

| 순서 | 장면 | 길이 | 내용 |
|---|---|---:|---|
| 1 | Hook | 14초 | set02 대본 대사와 실록 기사 제목을 나란히 보여 준다 |
| 2 | Intro | 14초 | 로고, 판정 세 가지, 특징 세 가지 |
| 3 | Demo1 | 52초 | 녹화: SC-002 충돌. 업로드, 진행, 결과, 근거 쪽 이동, 문서 나눔 |
| 4 | Demo2 | 38초 | 녹화: SC-012 검토 필요. 훼손된 사료 |
| 5 | Workflow | 26초 | Studio 워크플로우 도식 (Studio 녹화가 있으면 녹화로 바뀜) |
| 6 | Outro | 18초 | 결과 세 가지, 로고와 팀 이름 |

문구와 시간표는 모두 [`src/script.ts`](src/script.ts) 한 파일에 있다. 문구 규칙도 그 파일 맨 위에 적었다.

## 실행

```bash
cd demo-video
npm install
npm run studio   # 브라우저에서 미리 보기
npm run render   # out/경크크_최종제출_데모영상.mp4
```

## 녹화하는 법

녹화는 스크립트로 한다. 배포 사이트(`https://sageuk-check.vercel.app`)를 시스템 Chrome으로 열어 실제 API로 실행하고, 페이지 영역만 1920x1080으로 찍는다.

```bash
node scripts/record.mjs demo1   # SC-002 → public/recordings/demo1-sc002.mp4
node scripts/record.mjs demo2   # SC-012 → public/recordings/demo2-sc012.mp4
```

- 클릭과 결과 도착 시각이 같은 이름의 `.events.json`에 남는다. 편집 시각은 이 값으로 맞춘다.
- 헤드리스 녹화라 커서가 안 찍혀서 커서 모양과 클릭 표시를 페이지에 그려 넣는다.
- 녹화 파일(각 3MB 안팎)은 편집 시각과 묶여 있어 함께 커밋한다. `out/`은 커밋하지 않는다. 다시 녹화하면 시각이 달라지므로 `src/script.ts`의 `segments`, `captions`, `camera`도 다시 맞춘다.
- 서비스의 진행 조회 응답이 겹치면 결과 화면으로 넘어가지 못하고 멈추는 버그가 있다(`src/app/verify/page.tsx`의 `setInterval` 조회). 녹화 스크립트는 첫 `completed` 응답 뒤에 늦게 오는 조회 응답만 브라우저에 넘기지 않는다. 응답 내용은 바꾸지 않는다.
- Studio 워크플로우 화면은 로그인이 필요해 스크립트로 찍지 않는다. 직접 찍어 `workflow-studio.mp4`로 넣으면 도식 대신 녹화가 나온다.

## 녹화를 넣은 뒤 `src/script.ts`에서 고칠 것

- `recording.ready`를 `true`로 바꾼다.
- `segments`로 쓸 구간을 고른다. 결과를 기다리는 구간은 `rate: 8`처럼 빨리 감으면 화면에 "8배 빠르게"가 붙는다.
- `waitedSeconds`에 화면의 "지난 시간"에서 확인한 실제 시간을 적는다. 모르면 `null`로 둔다.
- `captions`와 `camera` 시각을 녹화에 맞춘다. 카메라의 `x`, `y`는 화면 기준 0~1, `scale`은 확대 배율이다.
- 전체 길이가 180초를 넘으면 미리 보기 콘솔에 경고가 뜬다.
