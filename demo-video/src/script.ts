/**
 * 영상의 모든 문구와 시간표를 여기서 고친다.
 *
 * 문구 규칙
 * - 말투는 ~해요체. 중간점과 em-dash는 쓰지 않는다.
 * - 한 자막에 한 문장. 화면이 이미 보여 주는 것을 다시 설명하지 않는다.
 * - 꾸미는 말("혁신적인", "스마트한", "완벽하게")과 지어낸 숫자는 넣지 않는다.
 * - 대사, 실록 문구, 판정 근거는 데이터셋 PDF와 정답지에 있는 그대로 옮긴다.
 *
 * 시간 단위는 모두 초. 자막과 카메라 시간은 그 장면 안에서 센다.
 */
import type { Decision } from "./theme";

export type Caption = { from: number; to: number; text: string };

/** 녹화 화면을 확대할 지점. x, y는 화면 기준 0~1(왼쪽 위가 0), scale 1이면 전체 화면. */
export type CameraKey = { at: number; x: number; y: number; scale: number };

/** 녹화 원본에서 쓸 구간(원본 기준 초). rate가 1보다 크면 빨리 감기 표시가 붙는다. */
export type Segment = { from: number; to: number; rate?: number };

export type Recording = {
  /** public/recordings/ 아래 파일 이름 */
  file: string;
  /** 녹화 파일을 넣은 뒤 true로 바꾼다. false면 자리 표시 화면이 나온다. */
  ready: boolean;
  segments: Segment[];
  /** 실제로 결과를 기다린 시간(초). 녹화에서 확인한 값만 적는다. 모르면 null. */
  waitedSeconds: number | null;
  camera: CameraKey[];
  /** 브라우저 주소창에 보일 글자 */
  url: string;
};

/** 녹화 설정의 타입을 확인하면서 넓은 타입(Recording)으로 둔다. */
const recording = (r: Recording): Recording => r;

// 1. 도입: 실제 데이터셋 set02(SC-002) 대본 1쪽과 사료 4쪽의 문구
export const hook = {
  durationSec: 14,
  script: {
    label: "대본 1쪽",
    meta: "백성의 글자 제2화",
    speaker: "최만리",
    before: "“나는 다른 신하들과 함께 새 언문의 제작을 ",
    highlight: "적극 찬성하는 상소",
    after: "를 왕께 올렸네.”",
  },
  source: {
    label: "사료 4쪽",
    meta: "세종실록 103권, 세종 26년 2월 20일",
    before: "집현전 부제학 최만리 등이 ",
    highlight: "언문 제작의 부당함",
    after: "을 아뢰다",
  },
  captions: [
    { from: 0.6, to: 5.2, text: "사극 대본의 한 장면이에요." },
    { from: 5.6, to: 9.6, text: "그런데 실록에는 반대 상소를 올렸다고 적혀 있어요." },
    { from: 10, to: 13.6, text: "촬영 전에 이런 차이를 찾아야 해요." },
  ] satisfies Caption[],
};

// 2. 서비스 소개
export const intro = {
  durationSec: 14,
  tagline: "대본과 사료를 PDF 하나로 올리면\n장면이 기록과 맞는지 판정해요.",
  decisions: [
    { decision: "일치", meaning: "사료와 맞아요" },
    { decision: "충돌", meaning: "사료와 달라요" },
    { decision: "검토 필요", meaning: "사람이 확인해야 해요" },
  ] satisfies { decision: Decision; meaning: string }[],
  // 서비스 메인 화면(src/app/page.tsx)의 특징 문구와 같다.
  features: [
    { title: "모르면 검토 필요로 넘겨요", body: "사료가 없거나 읽을 수 없으면 짐작하지 않아요." },
    { title: "근거를 원문 위에서 짚어요", body: "쪽 번호를 누르면 PDF의 그 자리를 보여 줘요." },
    { title: "섞인 문서를 알아서 나눠요", body: "대본, 사료, 검토 요청서를 각각 나눠 읽어요." },
  ],
};

// 3. 시연 1: 충돌 장면 (set02, SC-002)
export const demo1 = {
  durationSec: 66, // 녹화가 없을 때의 길이. 녹화를 넣으면 segments 길이로 바뀐다.
  chapter: "시연 1",
  title: "충돌 장면",
  caseLabel: "SC-002 백성의 글자 제2화",
  decision: "충돌" as Decision,
  recording: recording({
    // 2026-11-10 배포 사이트 녹화(scripts/record.mjs demo1). 시각은 demo1-sc002.events.json 기준.
    file: "demo1-sc002.mp4",
    ready: true,
    url: "sageuk-check.vercel.app/verify",
    // 원본 0.5~12.3초: 샘플 고르기와 판정 시작 / 12.3~16초: 진행 화면 / 16~90초: 기다리기(12배) / 90초~: 결과
    segments: [
      { from: 0.5, to: 12.3 },
      { from: 12.3, to: 16 },
      { from: 16, to: 90, rate: 12 },
      { from: 90, to: 120.4 },
    ],
    // 판정 시작(원본 11.7초)부터 결과 화면(원본 95.9초)까지
    waitedSeconds: 84,
    camera: [
      { at: 0, x: 0.5, y: 0.5, scale: 1 },
      { at: 3.2, x: 0.33, y: 0.55, scale: 1.55 },
      { at: 7.2, x: 0.5, y: 0.5, scale: 1 },
      { at: 9.6, x: 0.72, y: 0.52, scale: 1.45 },
      { at: 12.2, x: 0.5, y: 0.5, scale: 1.12 },
      { at: 21.7, x: 0.5, y: 0.5, scale: 1 },
      { at: 27.4, x: 0.72, y: 0.4, scale: 1.45 },
      { at: 31.4, x: 0.5, y: 0.66, scale: 1.25 },
      { at: 36, x: 0.5, y: 0.58, scale: 1.3 },
      { at: 40, x: 0.27, y: 0.36, scale: 1.5 },
      { at: 47.4, x: 0.7, y: 0.74, scale: 1.45 },
      { at: 50.6, x: 0.5, y: 0.5, scale: 1 },
    ],
  }),
  captions: [
    { from: 0.4, to: 6.8, text: "준비된 샘플에서 최만리 상소 장면을 골라요." },
    { from: 7.1, to: 11.6, text: "판정 시작을 누르면 Upstage Studio 워크플로우가 돌아가요." },
    { from: 12, to: 27.2, text: "기다리는 동안 지금 어느 단계인지 보여 줘요." },
    { from: 27.7, to: 31.4, text: "결과는 충돌이에요. 대본은 찬성, 실록은 반대 상소예요." },
    { from: 31.6, to: 39.8, text: "판정 근거의 쪽 번호를 누르면 원문에서 그 자리를 짚어 줘요." },
    { from: 40, to: 47.4, text: "왼쪽 쪽 번호는 대본과 사료로 나뉘어 있어요. 워크플로우가 나눈 그대로예요." },
    { from: 47.6, to: 51.8, text: "사료 출처는 실록 권수와 기사 번호까지 나와요." },
  ] satisfies Caption[],
  // 녹화가 없을 때 자리 표시 화면에 보일 PDF 쪽
  placeholderPages: ["pages/sc002-p-1.png", "pages/sc002-p-4.png"],
};

// 4. 시연 2: 사료가 훼손된 장면 (set12, SC-012)
export const demo2 = {
  durationSec: 40,
  chapter: "시연 2",
  title: "사료가 훼손된 장면",
  caseLabel: "SC-012 오래된 치수 기록 제4화",
  decision: "검토 필요" as Decision,
  recording: recording({
    // 2026-11-10 배포 사이트 녹화(scripts/record.mjs demo2). 시각은 demo2-sc012.events.json 기준.
    file: "demo2-sc012.mp4",
    ready: true,
    url: "sageuk-check.vercel.app/verify",
    // 원본 0.5~11초: 샘플 고르기(2배) / 11~13초: 판정 시작 / 13~74초: 기다리기(15배) / 74초~: 결과
    segments: [
      { from: 0.5, to: 11, rate: 2 },
      { from: 11, to: 13 },
      { from: 13, to: 74, rate: 15 },
      { from: 74, to: 100.7 },
    ],
    // 판정 시작(원본 11.5초)부터 결과 화면(원본 76.5초)까지
    waitedSeconds: 65,
    camera: [
      { at: 0, x: 0.5, y: 0.5, scale: 1 },
      { at: 1.4, x: 0.33, y: 0.55, scale: 1.45 },
      { at: 4.4, x: 0.72, y: 0.52, scale: 1.35 },
      { at: 6.6, x: 0.5, y: 0.5, scale: 1.1 },
      { at: 11.3, x: 0.5, y: 0.5, scale: 1 },
      { at: 13.8, x: 0.7, y: 0.38, scale: 1.45 },
      { at: 17.8, x: 0.72, y: 0.52, scale: 1.4 },
      { at: 22.4, x: 0.3, y: 0.72, scale: 1.5 },
      { at: 30.8, x: 0.5, y: 0.5, scale: 1 },
      { at: 33.6, x: 0.68, y: 0.8, scale: 1.4 },
      { at: 36.8, x: 0.5, y: 0.5, scale: 1 },
    ],
  }),
  captions: [
    { from: 0.3, to: 5.5, text: "이번에는 사료 일부가 훼손된 장면을 골라요." },
    { from: 5.8, to: 13.4, text: "같은 순서로 판정을 시작해요." },
    { from: 13.9, to: 17.7, text: "결과는 검토 필요예요." },
    { from: 18, to: 22.2, text: "판정 근거에 사람이 확인해야 할 값을 적어 줘요." },
    { from: 22.5, to: 30.6, text: "사료 쪽을 열면 지름이 적힌 부분이 지워져 있어요." },
    { from: 30.9, to: 37.8, text: "읽을 수 없는 값은 짐작하지 않고 사람에게 넘겨요." },
  ] satisfies Caption[],
  placeholderPages: ["pages/sc012-p-2.png"],
};

// 5. 워크플로우 구조 (submission/경크크_최종제출_workflow.json, config 4)
export const workflow = {
  durationSec: 26,
  heading: "판정은 Upstage Studio 워크플로우가 내려요",
  // Studio 화면 녹화가 있으면 도식 대신 녹화를 보여 준다.
  recording: recording({
    file: "workflow-studio.mp4",
    ready: false,
    url: "studio.upstage.ai",
    segments: [{ from: 0, to: 26 }],
    waitedSeconds: null,
    camera: [{ at: 0, x: 0.5, y: 0.5, scale: 1 }],
  }),
  nodes: {
    parse: { type: "Parse", label: "PDF 읽기" },
    classify: { type: "Classify", label: "문서 나누기" },
    extract: {
      type: "Extract",
      label: "항목 뽑기",
      items: ["대본 주장", "사료 본문", "사료 인용과 해설", "사료 판독 상태", "검토 요청 범위"],
    },
    merge: { type: "Merge", label: "모으기" },
    instruct: { type: "Instruct", label: "판정 내리기" },
  },
  captions: [
    { from: 0.5, to: 7.5, text: "PDF를 읽고 대본, 사료, 검토 요청서로 나눠요." },
    { from: 8, to: 15.5, text: "문서 종류마다 정해 둔 항목을 따로 뽑아요." },
    { from: 16, to: 20.5, text: "마지막 노드 하나가 결과를 정해요." },
    { from: 21, to: 25.6, text: "서비스 화면은 그 결과를 그대로 보여 줘요." },
  ] satisfies Caption[],
};

// 6. 마무리. 결과 카드의 판정은 정답지 값이고, config 4 실행 결과와도 같았다.
export const outro = {
  durationSec: 18,
  heading: "장면마다 세 가지 중 하나로 답해요",
  results: [
    { code: "SC-001", title: "백성의 글자 제1화", decision: "일치" },
    { code: "SC-002", title: "백성의 글자 제2화", decision: "충돌" },
    { code: "SC-012", title: "오래된 치수 기록 제4화", decision: "검토 필요" },
  ] satisfies { code: string; title: string; decision: Decision }[],
  // 팀 자체 정답지 대조 결과(docs/HANDOFF.md 3절). 넣을지 정한 뒤 true로 바꾼다.
  showSelfCheck: false,
  selfCheck: "준비한 18개 장면을 두 번씩 돌려 판정이 모두 정답지와 같았어요.",
  team: "팀 경크크",
  builtWith: "Upstage Studio 워크플로우로 만들었어요",
};

/** 장면 사이 전환 길이(초) */
export const TRANSITION_SEC = 0.5;
