import React from "react";
import { AbsoluteFill } from "remotion";
import { ChapterTag, Captions } from "../components/Captions";
import { RecordingView, useRiseIn } from "../components/Recording";
import type { demo1 } from "../script";
import { color } from "../theme";

type DemoProps = { demo: typeof demo1 };

/** 서비스 화면 녹화 + 장 표시 + 자막 */
export const Demo: React.FC<DemoProps> = ({ demo }) => {
  const rise = useRiseIn(4);
  return (
    <AbsoluteFill style={{ background: color.hanji }}>
      <ChapterTag chapter={demo.chapter} title={demo.title} caseLabel={demo.caseLabel} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 108 }}>
        <div style={rise}>
          <RecordingView rec={demo.recording} placeholderPages={demo.placeholderPages} />
        </div>
      </AbsoluteFill>
      <Captions items={demo.captions} />
    </AbsoluteFill>
  );
};
