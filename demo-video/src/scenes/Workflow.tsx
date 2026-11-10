import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DecisionBadge } from "../components/Brand";
import { Captions } from "../components/Captions";
import { RecordingView, useRiseIn } from "../components/Recording";
import { workflow } from "../script";
import { color, font, sec, shadow } from "../theme";

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 자막 시간에 맞춰 노드가 차례로 켜진다.
const STEP_AT = { parse: 0.8, classify: 2.6, extract: 8.2, merge: 14.5, instruct: 16.2, result: 18 };

const useAppear = (at: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - sec(at), fps, config: { damping: 200 } });
};

const Node: React.FC<{ type: string; label: string; at: number; accent?: boolean; children?: React.ReactNode }> = ({
  type,
  label,
  at,
  accent,
  children,
}) => {
  const s = useAppear(at);
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${(1 - s) * 20}px)`,
        minWidth: 230,
        padding: "24px 26px",
        borderRadius: 18,
        background: accent ? color.pine : color.card,
        border: `1px solid ${accent ? color.pine : color.border}`,
        boxShadow: shadow.soft,
        fontFamily: font.sans,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 500, color: accent ? "rgba(255,255,255,0.7)" : color.inkLight }}>{type}</div>
      <div style={{ marginTop: 6, fontSize: 32, fontWeight: 700, color: accent ? "#FFFFFF" : color.ink }}>{label}</div>
      {children}
    </div>
  );
};

const Arrow: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [sec(at) - 8, sec(at) + 4], [0, 1], clampOpts);
  return (
    <svg width={64} height={24} style={{ flexShrink: 0 }}>
      <line x1={4} y1={12} x2={4 + 50 * p} y2={12} stroke={color.borderStrong} strokeWidth={3} strokeLinecap="round" />
      <path d="M48 5 L58 12 L48 19" fill="none" stroke={color.borderStrong} strokeWidth={3} strokeLinecap="round" opacity={p} />
    </svg>
  );
};

const Diagram: React.FC = () => {
  const { nodes } = workflow;
  const result = useAppear(STEP_AT.result);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 60 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Node type={nodes.parse.type} label={nodes.parse.label} at={STEP_AT.parse} />
        <Arrow at={STEP_AT.classify} />
        <Node type={nodes.classify.type} label={nodes.classify.label} at={STEP_AT.classify} />
        <Arrow at={STEP_AT.extract} />
        <Node type={nodes.extract.type} label={nodes.extract.label} at={STEP_AT.extract}>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {nodes.extract.items.map((item, i) => (
              <ExtractItem key={item} text={item} at={STEP_AT.extract + 0.5 + i * 0.3} />
            ))}
          </div>
        </Node>
        <Arrow at={STEP_AT.merge} />
        <Node type={nodes.merge.type} label={nodes.merge.label} at={STEP_AT.merge} />
        <Arrow at={STEP_AT.instruct} />
        <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
          <Node type={nodes.instruct.type} label={nodes.instruct.label} at={STEP_AT.instruct} accent />
          <div
            style={{
              position: "absolute",
              top: "100%",
              marginTop: 22,
              display: "flex",
              gap: 10,
              opacity: result,
              transform: `translateY(${(1 - result) * 12}px)`,
            }}
          >
            <DecisionBadge decision="일치" size={20} />
            <DecisionBadge decision="충돌" size={20} />
            <DecisionBadge decision="검토 필요" size={20} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ExtractItem: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const s = useAppear(at);
  return (
    <div
      style={{
        opacity: s,
        padding: "8px 14px",
        borderRadius: 10,
        background: color.hanji,
        fontSize: 21,
        color: color.inkMuted,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

export const Workflow: React.FC = () => {
  const rise = useRiseIn(4);
  const headingIn = useAppear(0.1);
  return (
    <AbsoluteFill style={{ background: color.hanji }}>
      <div
        style={{
          position: "absolute",
          top: 64,
          width: "100%",
          textAlign: "center",
          opacity: headingIn,
          fontFamily: font.sans,
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: -0.8,
          color: color.ink,
        }}
      >
        {workflow.heading}
      </div>
      {workflow.recording.ready ? (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
          <div style={{ ...rise, transform: `${rise.transform} scale(0.9)`, transformOrigin: "top center" }}>
            <RecordingView rec={workflow.recording} />
          </div>
        </AbsoluteFill>
      ) : (
        <Diagram />
      )}
      <Captions items={workflow.captions} />
    </AbsoluteFill>
  );
};
