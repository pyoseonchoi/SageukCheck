import React from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { color, decisionTone, font, type Decision } from "../theme";

/** 서비스 헤더와 같은 로고: 史 도장 + 史劇Check */
export const Logo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.35 }}>
    <span
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: size * 0.14,
        border: `${Math.max(1, size / 28)}px solid rgba(167, 71, 61, 0.4)`,
        background: "rgba(167, 71, 61, 0.1)",
        color: color.cinnabar,
        fontFamily: font.serif,
        fontWeight: 700,
        fontSize: size * 0.48,
      }}
    >
      史
    </span>
    <span
      style={{
        fontFamily: font.serif,
        fontWeight: 700,
        fontSize: size * 0.72,
        letterSpacing: -0.5,
        color: color.ink,
      }}
    >
      史劇Check
    </span>
  </div>
);

const ICON = {
  일치: CheckCircle2,
  충돌: ShieldAlert,
  "검토 필요": AlertTriangle,
} as const;

/** 서비스 결과 화면과 같은 판정 표시 */
export const DecisionBadge: React.FC<{ decision: Decision; size?: number }> = ({ decision, size = 28 }) => {
  const tone = decisionTone[decision];
  const Icon = ICON[decision];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.3,
        padding: `${size * 0.3}px ${size * 0.6}px`,
        borderRadius: size * 0.3,
        border: `1.5px solid ${tone.border}`,
        background: tone.bg,
        color: tone.fg,
        fontFamily: font.sans,
        fontWeight: 700,
        fontSize: size,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={size * 0.95} strokeWidth={2.2} />
      {decision}
    </span>
  );
};
