import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Caption } from "../script";
import { color, font, sec, shadow } from "../theme";

const FADE = 8;

/** 화면 아래 가운데 자막. 한 번에 한 문장만 보인다. */
export const Captions: React.FC<{ items: Caption[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  const current = items.find((c) => frame >= sec(c.from) && frame < sec(c.to));
  if (!current) return null;

  const start = sec(current.from);
  const end = sec(current.to);
  const opacity = interpolate(frame, [start, start + FADE, end - FADE, end], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [start, start + FADE * 1.5], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 56,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          maxWidth: 1500,
          padding: "18px 34px",
          borderRadius: 16,
          background: "rgba(37, 41, 35, 0.88)",
          color: "#FFFFFF",
          fontFamily: font.sans,
          fontWeight: 500,
          fontSize: 38,
          lineHeight: 1.4,
          letterSpacing: -0.4,
          textAlign: "center",
          wordBreak: "keep-all",
          boxShadow: shadow.soft,
        }}
      >
        {current.text}
      </div>
    </div>
  );
};

/** 시연 장면 왼쪽 위에 붙는 장 표시 */
export const ChapterTag: React.FC<{ chapter: string; title: string; caseLabel?: string }> = ({
  chapter,
  title,
  caseLabel,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [6, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = interpolate(frame, [6, 24], [-16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: 64,
        opacity,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: font.sans,
      }}
    >
      <span
        style={{
          padding: "8px 14px",
          borderRadius: 999,
          background: color.pine,
          color: "#FFFFFF",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        {chapter}
      </span>
      <span style={{ fontSize: 28, fontWeight: 700, color: color.ink }}>{title}</span>
      {caseLabel ? (
        <span style={{ fontSize: 22, fontWeight: 500, color: color.inkMuted }}>{caseLabel}</span>
      ) : null}
    </div>
  );
};
