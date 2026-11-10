import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DecisionBadge, Logo } from "../components/Brand";
import { intro } from "../script";
import { color, font, sec, shadow } from "../theme";

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const DECISIONS_AT = 4;
const FEATURES_AT = 8.4;

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 200 } });
  // 판정 표시가 나오면 로고와 소개 문장이 위로 올라간다.
  const lift = interpolate(frame, [sec(DECISIONS_AT) - 10, sec(DECISIONS_AT) + 8], [0, 1], {
    ...clampOpts,
    easing: Easing.inOut(Easing.cubic),
  });
  const taglineIn = interpolate(frame, [sec(1), sec(1.6)], [0, 1], clampOpts);
  const decisionsOut = interpolate(frame, [sec(FEATURES_AT) - 8, sec(FEATURES_AT)], [1, 0], clampOpts);

  return (
    <AbsoluteFill style={{ background: color.hanji, alignItems: "center", fontFamily: font.sans }}>
      <div
        style={{
          position: "absolute",
          top: interpolate(lift, [0, 1], [360, 150]),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 30,
        }}
      >
        <div style={{ opacity: logoIn, transform: `scale(${0.9 + logoIn * 0.1})` }}>
          <Logo size={interpolate(lift, [0, 1], [96, 72])} />
        </div>
        <p
          style={{
            margin: 0,
            opacity: taglineIn,
            fontSize: 42,
            fontWeight: 500,
            lineHeight: 1.5,
            color: color.inkMuted,
            textAlign: "center",
            whiteSpace: "pre-line",
            letterSpacing: -0.5,
          }}
        >
          {intro.tagline}
        </p>
      </div>

      {/* 판정 세 가지 */}
      <div
        style={{
          position: "absolute",
          top: 560,
          display: "flex",
          gap: 40,
          opacity: decisionsOut,
        }}
      >
        {intro.decisions.map((d, i) => {
          const s = spring({ frame: frame - sec(DECISIONS_AT + 0.3 + i * 0.35), fps, config: { damping: 200 } });
          return (
            <div
              key={d.decision}
              style={{
                opacity: s,
                transform: `translateY(${(1 - s) * 24}px)`,
                width: 380,
                padding: "34px 0 30px",
                borderRadius: 20,
                background: color.card,
                border: `1px solid ${color.border}`,
                boxShadow: shadow.soft,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
              }}
            >
              <DecisionBadge decision={d.decision} size={36} />
              <span style={{ fontSize: 28, color: color.inkMuted }}>{d.meaning}</span>
            </div>
          );
        })}
      </div>

      {/* 특징 세 가지 */}
      <div style={{ position: "absolute", top: 520, display: "flex", gap: 32 }}>
        {intro.features.map((f, i) => {
          const s = spring({ frame: frame - sec(FEATURES_AT + i * 0.35), fps, config: { damping: 200 } });
          return (
            <div
              key={f.title}
              style={{
                opacity: s,
                transform: `translateY(${(1 - s) * 24}px)`,
                width: 470,
                padding: "34px 36px",
                borderRadius: 20,
                background: color.card,
                border: `1px solid ${color.border}`,
                boxShadow: shadow.soft,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: color.pineLight,
                  color: color.pine,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </div>
              <div style={{ marginTop: 22, fontSize: 32, fontWeight: 700, color: color.ink, letterSpacing: -0.5 }}>
                {f.title}
              </div>
              <div style={{ marginTop: 12, fontSize: 25, lineHeight: 1.5, color: color.inkMuted, wordBreak: "keep-all" }}>
                {f.body}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
