import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DecisionBadge, Logo } from "../components/Brand";
import { outro } from "../script";
import { color, font, sec, shadow } from "../theme";

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const END_CARD_AT = 9;

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const resultsOut = interpolate(frame, [sec(END_CARD_AT) - 10, sec(END_CARD_AT)], [1, 0], clampOpts);
  const end = spring({ frame: frame - sec(END_CARD_AT), fps, config: { damping: 200 } });
  const headingIn = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: color.hanji, fontFamily: font.sans, alignItems: "center", justifyContent: "center" }}>
      {/* 결과 세 가지 */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 56, opacity: resultsOut }}>
        <div style={{ opacity: headingIn, fontSize: 48, fontWeight: 700, letterSpacing: -0.8, color: color.ink }}>
          {outro.heading}
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {outro.results.map((r, i) => {
            const s = spring({ frame: frame - sec(0.6 + i * 0.4), fps, config: { damping: 200 } });
            return (
              <div
                key={r.code}
                style={{
                  opacity: s,
                  transform: `translateY(${(1 - s) * 24}px)`,
                  width: 440,
                  padding: "32px 36px",
                  borderRadius: 20,
                  background: color.card,
                  border: `1px solid ${color.border}`,
                  boxShadow: shadow.card,
                  display: "flex",
                  flexDirection: "column",
                  gap: 22,
                }}
              >
                <div>
                  <div style={{ fontSize: 22, color: color.inkLight, fontWeight: 500 }}>{r.code}</div>
                  <div style={{ marginTop: 6, fontFamily: font.serif, fontSize: 32, fontWeight: 700, color: color.ink }}>
                    {r.title}
                  </div>
                </div>
                <div>
                  <DecisionBadge decision={r.decision} size={30} />
                </div>
              </div>
            );
          })}
        </div>
        {outro.showSelfCheck ? (
          <div
            style={{
              opacity: interpolate(frame, [sec(3), sec(3.6)], [0, 1], clampOpts),
              fontSize: 28,
              color: color.inkMuted,
            }}
          >
            {outro.selfCheck}
          </div>
        ) : null}
      </AbsoluteFill>

      {/* 끝 화면 */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
          opacity: end,
          transform: `scale(${0.96 + end * 0.04})`,
        }}
      >
        <Logo size={120} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: color.ink }}>{outro.team}</div>
          <div style={{ fontSize: 26, color: color.inkMuted }}>{outro.builtWith}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
