import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions } from "../components/Captions";
import { hook } from "../script";
import { color, font, sec, shadow } from "../theme";

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Card: React.FC<{
  appearAt: number;
  label: string;
  meta: string;
  tone: string;
  children: React.ReactNode;
}> = ({ appearAt, label, meta, tone, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - sec(appearAt), fps, config: { damping: 200 } });
  return (
    <div
      style={{
        width: 720,
        opacity: s,
        transform: `translateY(${(1 - s) * 30}px)`,
        background: color.card,
        borderRadius: 20,
        border: `1px solid ${color.border}`,
        boxShadow: shadow.card,
        padding: "34px 40px 40px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: font.sans,
          fontSize: 22,
          color: color.inkMuted,
          paddingBottom: 18,
          marginBottom: 24,
          borderBottom: `1px solid ${color.border}`,
        }}
      >
        <span style={{ fontWeight: 700, color: tone }}>{label}</span>
        <span>{meta}</span>
      </div>
      {children}
    </div>
  );
};

/** 밑줄이 왼쪽에서 오른쪽으로 그어지는 강조 */
const Mark: React.FC<{ at: number; tone: string; children: string }> = ({ at, tone, children }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [sec(at), sec(at) + 18], [0, 1], { ...clampOpts, easing: Easing.out(Easing.cubic) });
  return (
    <span
      style={{
        fontWeight: 700,
        color: p > 0.5 ? tone : color.ink,
        backgroundImage: `linear-gradient(${tone}, ${tone})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0 100%",
        backgroundSize: `${p * 100}% 4px`,
        paddingBottom: 4,
      }}
    >
      {children}
    </span>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { script, source } = hook;
  const neq = interpolate(frame, [sec(8.2), sec(8.8)], [0, 1], clampOpts);
  const lineStyle: React.CSSProperties = {
    fontFamily: font.serif,
    fontSize: 38,
    lineHeight: 1.65,
    color: color.ink,
    wordBreak: "keep-all",
  };

  return (
    <AbsoluteFill style={{ background: color.hanji }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 36 }}>
        <Card appearAt={0.3} label={script.label} meta={script.meta} tone={color.cinnabar}>
          <p style={{ ...lineStyle, margin: 0 }}>
            <span style={{ fontWeight: 700 }}>{script.speaker}: </span>
            {script.before}
            <Mark at={3} tone={color.cinnabar}>
              {script.highlight}
            </Mark>
            {script.after}
          </p>
        </Card>

        <div
          style={{
            opacity: neq,
            transform: `scale(${0.6 + neq * 0.4})`,
            width: 72,
            height: 72,
            borderRadius: 99,
            background: color.cinnabar,
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: font.sans,
            fontSize: 44,
            fontWeight: 700,
            flexShrink: 0,
            alignSelf: "center",
          }}
        >
          ≠
        </div>

        <Card appearAt={5.6} label={source.label} meta={source.meta} tone={color.pine}>
          <p style={{ ...lineStyle, margin: 0 }}>
            {source.before}
            <Mark at={7} tone={color.pine}>
              {source.highlight}
            </Mark>
            {source.after}
          </p>
        </Card>
        </div>
      </AbsoluteFill>
      <Captions items={hook.captions} />
    </AbsoluteFill>
  );
};
