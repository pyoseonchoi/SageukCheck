import React from "react";
import { FastForward } from "lucide-react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { CameraKey, Recording } from "../script";
import { color, font, FPS, sec, shadow } from "../theme";

/** 녹화 화면 안쪽 크기(16:9). 녹화도 16:9로 찍는다. */
export const SCREEN = { width: 1380, height: 776 };
const CHROME_HEIGHT = 44;

/** 녹화를 넣었을 때 장면 길이(초) */
export const recordingSeconds = (rec: Recording) =>
  rec.segments.reduce((sum, s) => sum + (s.to - s.from) / (s.rate ?? 1), 0);

/** 브라우저 창 모양의 틀 */
export const BrowserFrame: React.FC<{ url: string; children: React.ReactNode }> = ({ url, children }) => (
  <div
    style={{
      width: SCREEN.width,
      height: SCREEN.height + CHROME_HEIGHT,
      borderRadius: 18,
      overflow: "hidden",
      background: color.card,
      border: `1px solid ${color.border}`,
      boxShadow: shadow.card,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        height: CHROME_HEIGHT,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 18px",
        background: color.hanjiDark,
        borderBottom: `1px solid ${color.border}`,
      }}
    >
      {["#E0796B", "#E5BE5A", "#7FB77E"].map((c) => (
        <span key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c }} />
      ))}
      <div
        style={{
          marginLeft: 18,
          flex: 1,
          maxWidth: 560,
          height: 28,
          borderRadius: 8,
          background: color.card,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          fontFamily: font.sans,
          fontSize: 16,
          color: color.inkMuted,
        }}
      >
        {url}
      </div>
    </div>
    <div style={{ position: "relative", flex: 1, overflow: "hidden", background: color.hanji }}>{children}</div>
  </div>
);

const MOVE_SEC = 1.1;
const ease = Easing.bezier(0.65, 0, 0.35, 1);

/** 카메라 키를 따라 확대 위치를 계산한다. 키 시각에 움직이기 시작해 MOVE_SEC 뒤 도착한다. */
const cameraAt = (keys: CameraKey[], t: number) => {
  if (keys.length === 0) return { x: 0.5, y: 0.5, scale: 1 };
  let i = 0;
  while (i + 1 < keys.length && keys[i + 1].at <= t) i++;
  const cur = keys[i];
  const prev = i > 0 ? keys[i - 1] : cur;
  const p = ease(Math.min(1, Math.max(0, (t - cur.at) / MOVE_SEC)));
  const mix = (a: number, b: number) => a + (b - a) * p;
  return { x: mix(prev.x, cur.x), y: mix(prev.y, cur.y), scale: mix(prev.scale, cur.scale) };
};

const Camera: React.FC<{ keys: CameraKey[]; children: React.ReactNode }> = ({ keys, children }) => {
  const frame = useCurrentFrame();
  const { x, y, scale } = cameraAt(keys, frame / FPS);
  const { width: W, height: H } = SCREEN;
  const clamp = (v: number, min: number) => Math.min(0, Math.max(min, v));
  const tx = clamp(W / 2 - x * W * scale, W - W * scale);
  const ty = clamp(H / 2 - y * H * scale, H - H * scale);
  return (
    <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};

const formatSeconds = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}분 ${s % 60}초` : `${s}초`);

const FastForwardBadge: React.FC<{ rate: number; waitedSeconds: number | null }> = ({ rate, waitedSeconds }) => (
  <div
    style={{
      position: "absolute",
      top: 18,
      right: 18,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 16px",
      borderRadius: 12,
      background: "rgba(37, 41, 35, 0.86)",
      color: "#FFFFFF",
      fontFamily: font.sans,
      fontSize: 22,
      fontWeight: 500,
    }}
  >
    <FastForward size={22} fill="#FFFFFF" />
    <span>{rate}배 빠르게</span>
    {waitedSeconds !== null ? (
      <span style={{ color: "rgba(255,255,255,0.7)" }}>실제로 {formatSeconds(waitedSeconds)} 걸렸어요</span>
    ) : null}
  </div>
);

/** 녹화 파일이 아직 없을 때 보이는 화면. 카메라 움직임은 그대로 미리 볼 수 있다. */
const Placeholder: React.FC<{ file: string; pages: string[] }> = ({ file, pages }) => (
  <AbsoluteFill
    style={{
      background: color.hanji,
      alignItems: "center",
      justifyContent: "center",
      gap: 28,
      flexDirection: "row",
    }}
  >
    {pages.map((p) => (
      <Img
        key={p}
        src={staticFile(p)}
        style={{
          height: SCREEN.height - 120,
          borderRadius: 6,
          border: `1px solid ${color.border}`,
          boxShadow: shadow.soft,
          opacity: 0.55,
        }}
      />
    ))}
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        padding: "22px 30px",
        borderRadius: 14,
        border: `2px dashed ${color.borderStrong}`,
        background: "rgba(255,255,255,0.92)",
        fontFamily: font.sans,
        textAlign: "center",
        color: color.inkMuted,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, color: color.ink }}>녹화 자리</div>
      <div style={{ marginTop: 8, fontSize: 20 }}>public/recordings/{file}</div>
    </div>
  </AbsoluteFill>
);

export const RecordingView: React.FC<{ rec: Recording; placeholderPages?: string[] }> = ({
  rec,
  placeholderPages = [],
}) => {
  const frame = useCurrentFrame();

  if (!rec.ready) {
    return (
      <BrowserFrame url={rec.url}>
        <Camera keys={rec.camera}>
          <Placeholder file={rec.file} pages={placeholderPages} />
        </Camera>
      </BrowserFrame>
    );
  }

  let cursor = 0;
  let activeRate = 1;
  const clips = rec.segments.map((s, i) => {
    const rate = s.rate ?? 1;
    const from = cursor;
    const length = sec((s.to - s.from) / rate);
    cursor += length;
    if (frame >= from && frame < from + length) activeRate = rate;
    return (
      <Sequence key={i} from={from} durationInFrames={length} layout="none">
        <OffthreadVideo
          src={staticFile(`recordings/${rec.file}`)}
          startFrom={sec(s.from)}
          endAt={sec(s.to)}
          playbackRate={rate}
          muted
          style={{ width: SCREEN.width, height: SCREEN.height, objectFit: "cover" }}
        />
      </Sequence>
    );
  });

  return (
    <BrowserFrame url={rec.url}>
      <Camera keys={rec.camera}>{clips}</Camera>
      {activeRate > 1 ? <FastForwardBadge rate={activeRate} waitedSeconds={rec.waitedSeconds} /> : null}
    </BrowserFrame>
  );
};

/** 시연 장면 공통: 녹화가 등장할 때 살짝 떠오르는 움직임 */
export const useRiseIn = (delay = 0) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + 20], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return { opacity, transform: `translateY(${y}px)` };
};
