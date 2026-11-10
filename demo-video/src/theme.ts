import { loadFont as loadSans } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadSerif } from "@remotion/google-fonts/NotoSerifKR";

// 서비스(tailwind.config.ts)와 같은 색을 쓴다.
export const color = {
  hanji: "#F7F4ED",
  hanjiDark: "#EFEAE0",
  card: "#FFFFFF",
  ink: "#252923",
  inkMuted: "#5A6056",
  inkLight: "#868C81",
  pine: "#29493D",
  pineLight: "#EBF1EE",
  cinnabar: "#A7473D",
  cinnabarLight: "#F9ECEB",
  ochre: "#9E722C",
  ochreLight: "#FBF5E9",
  ochreBorder: "#E2C799",
  border: "#DDD6C9",
  borderStrong: "#C5BBAE",
} as const;

const sans = loadSans("normal", {
  weights: ["400", "500", "700"],
  subsets: ["korean", "latin"],
  ignoreTooManyRequestsWarning: true,
});
const serif = loadSerif("normal", {
  weights: ["600", "700"],
  subsets: ["korean", "latin"],
  ignoreTooManyRequestsWarning: true,
});

export const font = {
  sans: sans.fontFamily,
  serif: serif.fontFamily,
};

export const shadow = {
  card: "0 2px 6px rgba(37, 41, 35, 0.05), 0 18px 40px -12px rgba(37, 41, 35, 0.16)",
  soft: "0 1px 3px rgba(37, 41, 35, 0.06), 0 8px 20px -8px rgba(37, 41, 35, 0.12)",
};

export type Decision = "일치" | "충돌" | "검토 필요";

export const decisionTone: Record<Decision, { fg: string; bg: string; border: string }> = {
  일치: { fg: color.pine, bg: color.pineLight, border: "rgba(41, 73, 61, 0.35)" },
  충돌: { fg: color.cinnabar, bg: color.cinnabarLight, border: "rgba(167, 71, 61, 0.35)" },
  "검토 필요": { fg: color.ochre, bg: color.ochreLight, border: color.ochreBorder },
};

export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);
